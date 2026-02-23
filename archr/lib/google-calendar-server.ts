import type { SupabaseClient } from "@supabase/supabase-js";

type GoogleTokenRow = {
  refresh_token: string;
};

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

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: (tokenRow as GoogleTokenRow).refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error("Failed to refresh Google access token.");
  }

  const tokenPayload = (await tokenResponse.json()) as { access_token?: string };

  if (!tokenPayload.access_token) {
    throw new Error("Google access token is missing.");
  }

  return tokenPayload.access_token;
}
