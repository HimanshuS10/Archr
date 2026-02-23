import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGoogleAccessTokenForUser } from "@/lib/google-calendar-server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const accessToken = await getGoogleAccessTokenForUser(supabase, user.id);

    const { searchParams } = new URL(request.url);
    const maxResults = Math.min(
      100,
      Math.max(1, Number(searchParams.get("maxResults") ?? "20")),
    );
    const windowDays = Math.min(
      365,
      Math.max(1, Number(searchParams.get("windowDays") ?? "30")),
    );

    const now = new Date();
    const timeMin = now.toISOString();
    const timeMax = new Date(
      now.getTime() + windowDays * 24 * 60 * 60 * 1000,
    ).toISOString();

    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events" +
        `?singleEvents=true&orderBy=startTime` +
        `&maxResults=${maxResults}` +
        `&timeMin=${encodeURIComponent(timeMin)}` +
        `&timeMax=${encodeURIComponent(timeMax)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: `Google Calendar API error: ${text}` },
        { status: response.status },
      );
    }

    const payload = await response.json();
    return NextResponse.json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch events.";
    const status = message.includes("not connected") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      title?: string;
      start?: string;
      end?: string;
      description?: string;
    };

    if (!body.title || !body.start) {
      return NextResponse.json(
        { error: "Title and start are required." },
        { status: 400 },
      );
    }

    const accessToken = await getGoogleAccessTokenForUser(supabase, user.id);
    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: body.title,
          description: body.description || undefined,
          start: { dateTime: new Date(body.start).toISOString() },
          end: {
            dateTime: new Date(body.end || body.start).toISOString(),
          },
        }),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: `Google Calendar API error: ${text}` },
        { status: response.status },
      );
    }

    const payload = await response.json();
    return NextResponse.json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save event.";
    const status = message.includes("not connected") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
