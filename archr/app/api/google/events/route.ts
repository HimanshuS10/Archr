import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGoogleAccessTokenForUser } from "@/lib/google-calendar-server";

type RepeatOption = "none" | "daily" | "weekly" | "monthly" | "yearly";

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
      10000,
      Math.max(1, Number(searchParams.get("maxResults") ?? "1000")),
    );
    const windowDaysParam = Number(searchParams.get("windowDays") ?? "365");
    const windowDays = Number.isFinite(windowDaysParam)
      ? Math.min(3650, Math.max(0, windowDaysParam))
      : 365;
    const pastDays = Math.min(
      3650,
      Math.max(0, Number(searchParams.get("pastDays") ?? "0")),
    );

    const now = new Date();
    const timeMin = new Date(
      now.getTime() - pastDays * 24 * 60 * 60 * 1000,
    ).toISOString();
    const timeMax =
      windowDays > 0
        ? new Date(now.getTime() + windowDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

    const items: unknown[] = [];
    let nextPageToken: string | undefined;

    while (items.length < maxResults) {
      const pageSize = Math.min(2500, maxResults - items.length);
      const params = new URLSearchParams({
        singleEvents: "true",
        orderBy: "startTime",
        showDeleted: "false",
        maxResults: String(pageSize),
        timeMin,
      });

      if (timeMax) {
        params.set("timeMax", timeMax);
      }
      if (nextPageToken) {
        params.set("pageToken", nextPageToken);
      }

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
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

      const payload = (await response.json()) as {
        items?: unknown[];
        nextPageToken?: string;
      };
      if (payload.items?.length) {
        items.push(...payload.items);
      }

      if (!payload.nextPageToken) {
        break;
      }
      nextPageToken = payload.nextPageToken;
    }

    return NextResponse.json({ items });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch events.";
    const requiresReconnect =
      message.includes("not connected") ||
      message.includes("reconnect") ||
      message.includes("expired");
    const status = requiresReconnect ? 401 : 500;
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

    if (body.repeat && body.repeat !== "none") {
      const freq = freqMap[body.repeat as Exclude<RepeatOption, "none">];
      const until = body.repeatUntil
        ? `;UNTIL=${new Date(body.repeatUntil + "T23:59:59Z")
            .toISOString()
            .replace(/[-:]/g, "")
            .split(".")[0]}Z`
        : "";
      recurrence = [`RRULE:FREQ=${freq}${until}`];
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
          start: {
            dateTime: new Date(body.start).toISOString(),
            timeZone: eventTimeZone,
          },
          end: {
            dateTime: new Date(body.end || body.start).toISOString(),
            timeZone: eventTimeZone,
          },
          colorId: body.colorId || undefined,
          ...(recurrence ? { recurrence } : {}),
          extendedProperties: {
            private: { locked: body.locked ? "true" : "false" },
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
    const requiresReconnect =
      message.includes("not connected") ||
      message.includes("reconnect") ||
      message.includes("expired");
    const status = requiresReconnect ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
