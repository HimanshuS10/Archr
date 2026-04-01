import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGoogleAccessTokenForUser } from "@/lib/google-calendar-server";

type RouteContext = {
  params: Promise<{ eventId: string }>;
};

type RepeatOption = "none" | "daily" | "weekly" | "monthly" | "yearly";

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
      timeZone?: string;
      colorId?: string;
      locked?: boolean;
      repeat?: RepeatOption;
      repeatUntil?: string;
      repeatCustom?: {
        frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
        interval?: number;
        byDay?: string[];
        byMonthDay?: number[];
        count?: number;
      };
    };

    if (!body.title || !body.start) {
      return NextResponse.json(
        { error: "Title and start are required." },
        { status: 400 },
      );
    }

    const eventTimeZone = body.timeZone || "UTC";

    const freqMap = {
      daily: "DAILY",
      weekly: "WEEKLY",
      monthly: "MONTHLY",
      yearly: "YEARLY",
    } as const;

    let recurrence: string[] | undefined;

    if (body.repeat === "none") {
      recurrence = [];
    } else if (body.repeat) {
      const freq = freqMap[body.repeat as Exclude<RepeatOption, "none">];
      const until = body.repeatUntil
        ? `;UNTIL=${
            new Date(body.repeatUntil + "T23:59:59Z")
              .toISOString()
              .replace(/[-:]/g, "")
              .split(".")[0]
          }Z`
        : "";
      recurrence = [`RRULE:FREQ=${freq}${until}`];
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
          start: {
            dateTime: new Date(body.start).toISOString(),
            timeZone: eventTimeZone,
          },
          end: {
            dateTime: new Date(body.end || body.start).toISOString(),
            timeZone: eventTimeZone,
          },
          colorId: body.colorId || undefined,
          ...(recurrence !== undefined ? { recurrence } : {}),
          extendedProperties: {
            private: {
              locked: body.locked ? "true" : "false",
            },
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
    const requiresReconnect =
      message.includes("not connected") ||
      message.includes("reconnect") ||
      message.includes("expired");
    const status = requiresReconnect ? 401 : 500;
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
    const requiresReconnect =
      message.includes("not connected") ||
      message.includes("reconnect") ||
      message.includes("expired");
    const status = requiresReconnect ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
