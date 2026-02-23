import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGoogleAccessTokenForUser } from "@/lib/google-calendar-server";

type GoogleBusyItem = {
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
};

type Interval = {
  start: Date;
  end: Date;
};

type Slot = {
  start: Date;
  end: Date;
  durationMinutes: number;
};

const WORKDAY_START_HOUR = 8;
const WORKDAY_END_HOUR = 22;
const CHUNK_MINUTES = 60;
const ALGORITHM_VERSION = "v1_simple_gaps";

function parseEventDate(value?: string) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function mergeIntervals(intervals: Interval[]) {
  if (intervals.length === 0) return [];

  const sorted = [...intervals].sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );
  const merged: Interval[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i += 1) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    if (current.start.getTime() <= last.end.getTime()) {
      if (current.end.getTime() > last.end.getTime()) {
        last.end = current.end;
      }
    } else {
      merged.push(current);
    }
  }

  return merged;
}

function buildDailyFreeIntervals(
  mergedBusy: Interval[],
  startAt: Date,
  endAt: Date,
) {
  const free: Interval[] = [];
  const dayCursor = new Date(Date.UTC(startAt.getUTCFullYear(), startAt.getUTCMonth(), startAt.getUTCDate()));

  while (dayCursor.getTime() <= endAt.getTime()) {
    const windowStart = new Date(dayCursor);
    windowStart.setUTCHours(WORKDAY_START_HOUR, 0, 0, 0);
    const windowEnd = new Date(dayCursor);
    windowEnd.setUTCHours(WORKDAY_END_HOUR, 0, 0, 0);

    const effectiveStart = new Date(
      Math.max(windowStart.getTime(), startAt.getTime()),
    );
    const effectiveEnd = new Date(Math.min(windowEnd.getTime(), endAt.getTime()));

    if (effectiveStart.getTime() < effectiveEnd.getTime()) {
      let pointer = new Date(effectiveStart);
      for (const busy of mergedBusy) {
        if (busy.end.getTime() <= effectiveStart.getTime()) continue;
        if (busy.start.getTime() >= effectiveEnd.getTime()) break;

        const busyStart = new Date(
          Math.max(busy.start.getTime(), effectiveStart.getTime()),
        );
        const busyEnd = new Date(
          Math.min(busy.end.getTime(), effectiveEnd.getTime()),
        );

        if (busyStart.getTime() > pointer.getTime()) {
          free.push({ start: new Date(pointer), end: new Date(busyStart) });
        }

        if (busyEnd.getTime() > pointer.getTime()) {
          pointer = new Date(busyEnd);
        }
      }

      if (pointer.getTime() < effectiveEnd.getTime()) {
        free.push({ start: new Date(pointer), end: new Date(effectiveEnd) });
      }
    }

    dayCursor.setUTCDate(dayCursor.getUTCDate() + 1);
  }

  return free;
}

function allocateSlots(freeIntervals: Interval[], totalMinutes: number) {
  const slots: Slot[] = [];
  let remaining = totalMinutes;

  for (const gap of freeIntervals) {
    if (remaining <= 0) break;

    let cursor = new Date(gap.start);
    let gapMinutes = Math.floor(
      (gap.end.getTime() - gap.start.getTime()) / (1000 * 60),
    );

    while (gapMinutes > 0 && remaining > 0) {
      const chunk = Math.min(CHUNK_MINUTES, remaining, gapMinutes);
      const slotEnd = new Date(cursor.getTime() + chunk * 60 * 1000);
      slots.push({
        start: new Date(cursor),
        end: slotEnd,
        durationMinutes: chunk,
      });
      cursor = slotEnd;
      gapMinutes -= chunk;
      remaining -= chunk;
    }
  }

  return { slots, unscheduledMinutes: remaining };
}

async function deleteGoogleEvent(accessToken: string, eventId: string) {
  await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
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
      taskId?: string;
      regenerate?: boolean;
    };

    if (!body.taskId) {
      return NextResponse.json({ error: "taskId is required." }, { status: 400 });
    }

    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("id, user_id, title, deadline, estimated_minutes, priority")
      .eq("id", body.taskId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (taskError) {
      return NextResponse.json({ error: taskError.message }, { status: 500 });
    }

    if (!task) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    const deadline = parseEventDate(task.deadline);
    const now = new Date();
    if (!deadline || deadline.getTime() <= now.getTime()) {
      return NextResponse.json(
        { error: "Task deadline must be in the future." },
        { status: 400 },
      );
    }

    const totalMinutes = Math.max(1, Number(task.estimated_minutes ?? 60));
    const accessToken = await getGoogleAccessTokenForUser(supabase, user.id);

    if (body.regenerate) {
      const { data: existingSessions } = await supabase
        .from("study_sessions")
        .select("id, google_event_id")
        .eq("task_id", task.id)
        .eq("user_id", user.id)
        .eq("status", "scheduled");

      for (const session of existingSessions ?? []) {
        await deleteGoogleEvent(accessToken, session.google_event_id);
      }

      await supabase
        .from("study_sessions")
        .update({ status: "deleted", updated_at: new Date().toISOString() })
        .eq("task_id", task.id)
        .eq("user_id", user.id)
        .eq("status", "scheduled");
    }

    const busyResponse = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events" +
        `?singleEvents=true&orderBy=startTime` +
        `&maxResults=2500` +
        `&timeMin=${encodeURIComponent(now.toISOString())}` +
        `&timeMax=${encodeURIComponent(deadline.toISOString())}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!busyResponse.ok) {
      const text = await busyResponse.text();
      return NextResponse.json(
        { error: `Failed to read busy events: ${text}` },
        { status: busyResponse.status },
      );
    }

    const busyPayload = (await busyResponse.json()) as { items?: GoogleBusyItem[] };
    const busyIntervals: Interval[] = [];
    for (const item of busyPayload.items ?? []) {
      const start = parseEventDate(item.start?.dateTime || item.start?.date);
      const end = parseEventDate(item.end?.dateTime || item.end?.date);
      if (start && end && end.getTime() > start.getTime()) {
        busyIntervals.push({ start, end });
      }
    }

    const mergedBusy = mergeIntervals(busyIntervals);
    const freeIntervals = buildDailyFreeIntervals(mergedBusy, now, deadline);
    const { slots, unscheduledMinutes } = allocateSlots(freeIntervals, totalMinutes);

    const createdGoogleEvents: {
      google_event_id: string;
      start_time: string;
      end_time: string;
      duration_minutes: number;
    }[] = [];

    for (const slot of slots) {
      const response = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            summary: `Work on: ${task.title}`,
            description:
              `Generated by Archr AI scheduler (${ALGORITHM_VERSION}).\n` +
              `task_id:${task.id}`,
            start: { dateTime: slot.start.toISOString() },
            end: { dateTime: slot.end.toISOString() },
          }),
        },
      );

      if (!response.ok) {
        for (const created of createdGoogleEvents) {
          await deleteGoogleEvent(accessToken, created.google_event_id);
        }
        const text = await response.text();
        return NextResponse.json(
          { error: `Failed to create Google event: ${text}` },
          { status: response.status },
        );
      }

      const payload = (await response.json()) as { id: string };
      createdGoogleEvents.push({
        google_event_id: payload.id,
        start_time: slot.start.toISOString(),
        end_time: slot.end.toISOString(),
        duration_minutes: slot.durationMinutes,
      });
    }

    if (createdGoogleEvents.length > 0) {
      const { error: insertError } = await supabase.from("study_sessions").insert(
        createdGoogleEvents.map((event) => ({
          user_id: user.id,
          task_id: task.id,
          google_event_id: event.google_event_id,
          start_time: event.start_time,
          end_time: event.end_time,
          duration_minutes: event.duration_minutes,
          status: "scheduled",
          algorithm_version: ALGORITHM_VERSION,
        })),
      );

      if (insertError) {
        for (const created of createdGoogleEvents) {
          await deleteGoogleEvent(accessToken, created.google_event_id);
        }
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      task_id: task.id,
      created_count: createdGoogleEvents.length,
      unscheduled_minutes: unscheduledMinutes,
      algorithm_version: ALGORITHM_VERSION,
      sessions: createdGoogleEvents,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate schedule.";
    const status = message.includes("not connected") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
