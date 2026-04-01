import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { captureServerEvent } from "@/lib/posthog-server";

// In-memory rate limiter: IP -> { count, resetAt }
const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_SUBMISSIONS = 3;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > MAX_SUBMISSIONS;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_SUBMIT_MS = 2000;

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  const body = await req.json();
  const { email, _t } = body as { email?: string; _t?: number };

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  // Time-based bot check: reject if form was submitted faster than a human could
  if (typeof _t === "number" && _t < MIN_SUBMIT_MS) {
    return NextResponse.json(
      { error: "Please slow down and try again." },
      { status: 400 },
    );
  }

  const normalizedEmail = email.toLowerCase().trim();
  const { error } = await supabase.from("waitlist").insert({ email: normalizedEmail });

  if (error) {
    if (error.code === "23505") {
      await captureServerEvent({
        distinctId: normalizedEmail,
        event: "waitlist_duplicate_submission",
        properties: { source: "api_waitlist" },
      });
      return NextResponse.json(
        { error: "This email is already on the waitlist!" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await captureServerEvent({
    distinctId: normalizedEmail,
    event: "waitlist_signup_success",
    properties: { source: "api_waitlist" },
  });

  return NextResponse.json(
    { message: "Email added to waitlist" },
    { status: 200 },
  );
}
