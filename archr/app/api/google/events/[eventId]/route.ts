import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGoogleAccessTokenForUser } from "@/lib/google-calendar-server";

type RouteContext = {
  params: Promise<{ eventId: string }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  const { eventId } = await params;
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
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: "PATCH",
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
      error instanceof Error ? error.message : "Failed to update event.";
    const status = message.includes("not connected") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_: Request, { params }: RouteContext) {
  const { eventId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const accessToken = await getGoogleAccessTokenForUser(supabase, user.id);
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: "DELETE",
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

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete event.";
    const status = message.includes("not connected") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
