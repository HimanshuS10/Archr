import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const authError = url.searchParams.get("error");
  const next = url.searchParams.get("next") ?? "/dashboard";
  const safeNext = next.startsWith("/") ? next : "/dashboard";

  if (authError) {
    return NextResponse.redirect(`${url.origin}/login`);
  }

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.session) {
      return NextResponse.redirect(`${url.origin}/login`);
    }

    const refreshToken = data.session?.provider_refresh_token;
    const userId = data.user?.id;

    if (refreshToken && userId) {
      const { error: upsertError } = await supabase.from("google_tokens").upsert(
        {
          user_id: userId,
          refresh_token: refreshToken,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

      if (upsertError) {
        return NextResponse.redirect(`${url.origin}/login`);
      }
    }
  }

  return NextResponse.redirect(`${url.origin}${safeNext}`);
}