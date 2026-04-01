import type { SupabaseClient } from "@supabase/supabase-js";

type GoogleTokenRow = {
  refresh_token: string;
};

type GoogleRefreshResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

async function refreshGoogleAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string,
) {
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const payload = (await tokenResponse.json().catch(() => ({}))) as GoogleRefreshResponse;
  return { ok: tokenResponse.ok, payload };
}

export async function getGoogleAccessTokenForUser(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data: tokenRow, error: tokenError } = await supabase
    .from("google_tokens")
    .select("refresh_token")
    .eq("user_id", userId)
    .maybeSingle();

  if (tokenError) {
    throw new Error(tokenError.message);
  }

  if (!tokenRow?.refresh_token) {
    // Fallback for existing users who connected before refresh-token storage.
    const { data: sessionData } = await supabase.auth.getSession();
    const sessionAccessToken = sessionData.session?.provider_token;
    const sessionRefreshToken = sessionData.session?.provider_refresh_token;

    if (sessionRefreshToken) {
      await supabase.from("google_tokens").upsert(
        {
          user_id: userId,
          refresh_token: sessionRefreshToken,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
    }

    if (sessionAccessToken) {
      return sessionAccessToken;
    }

    throw new Error("Google Calendar not connected.");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth environment variables are missing.");
  }

  const savedRefreshToken = (tokenRow as GoogleTokenRow).refresh_token;
  const firstAttempt = await refreshGoogleAccessToken(
    savedRefreshToken,
    clientId,
    clientSecret,
  );

  if (firstAttempt.ok && firstAttempt.payload.access_token) {
    return firstAttempt.payload.access_token;
  }

  // If saved token failed, try the session's provider_refresh_token as a recovery path.
  const { data: sessionData } = await supabase.auth.getSession();
  const sessionRefreshToken = sessionData.session?.provider_refresh_token;
  if (sessionRefreshToken && sessionRefreshToken !== savedRefreshToken) {
    const secondAttempt = await refreshGoogleAccessToken(
      sessionRefreshToken,
      clientId,
      clientSecret,
    );
    if (secondAttempt.ok && secondAttempt.payload.access_token) {
      await supabase.from("google_tokens").upsert(
        {
          user_id: userId,
          refresh_token: sessionRefreshToken,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
      return secondAttempt.payload.access_token;
    }
  }

  if (firstAttempt.payload.error === "invalid_grant") {
    throw new Error(
      "Google Calendar connection expired. Please reconnect your Google Calendar.",
    );
  }

  throw new Error(
    firstAttempt.payload.error_description || "Failed to refresh Google access token.",
  );
}
