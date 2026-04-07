import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGoogleAccessTokenForUser } from "@/lib/google-calendar-server";

// ═══════════════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════════════
const MS_PER_MIN = 60_000;
const MS_PER_HOUR = 60 * MS_PER_MIN;
const GRID_MS = 15 * MS_PER_MIN;
const TRANSITION_BUFFER_MS = 10 * MS_PER_MIN;

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════
interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  locked?: boolean;
  priority?: "low" | "medium" | "high" | "urgent";
  isDeadline?: boolean;
}

interface Conflict {
  eventId: string;
  conflictsWith: string;
  type: "overlap" | "meeting_extended" | "priority_shift" | "new_event";
  severity: "low" | "medium" | "high";
}

interface RescheduleResult {
  eventId: string;
  title: string;
  originalStart: string;
  originalEnd: string;
  newStart: string;
  newEnd: string;
  reason: string;
  status: "moved" | "unchanged" | "protected";
}

interface TimeInterval {
  startMs: number;
  endMs: number;
  eventId: string;
  locked: boolean;
  priority: number;
  isDeadline: boolean;
}

// ═══════════════════════════════════════════════════════════════
//  UTILITIES
// ═══════════════════════════════════════════════════════════════
const snapTo15 = (ms: number) => Math.ceil(ms / GRID_MS) * GRID_MS;

function getLocalMinutes(date: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return h * 60 + m;
}

function getLocalDateKey(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function priorityToNumber(priority?: string): number {
  switch (priority) {
    case "urgent":
      return 4;
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
      return 1;
    default:
      return 2;
  }
}

function overlaps(
  s1: number,
  e1: number,
  s2: number,
  e2: number
): boolean {
  return s1 < e2 && e1 > s2;
}

// ═══════════════════════════════════════════════════════════════
//  GOOGLE CALENDAR — fetch events
// ═══════════════════════════════════════════════════════════════
async function fetchCalendarEvents(
  accessToken: string,
  start: Date,
  end: Date
): Promise<CalendarEvent[]> {
  const events: CalendarEvent[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      singleEvents: "true",
      orderBy: "startTime",
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      maxResults: "2500",
      showDeleted: "false",
    });
    if (pageToken) params.set("pageToken", pageToken);

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!res.ok) break;
    const data = await res.json();

    for (const e of data.items ?? []) {
      if (e.status === "cancelled" || e.transparency === "transparent") continue;

      const isLocked = e.extendedProperties?.private?.locked === "true";
      const priority = e.extendedProperties?.private?.priority;
      const isDeadline = e.extendedProperties?.private?.isDeadline === "true";

      events.push({
        id: e.id,
        title: e.summary || "Untitled",
        start: e.start?.dateTime || e.start?.date,
        end: e.end?.dateTime || e.end?.date,
        locked: isLocked,
        priority,
        isDeadline,
      });
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  return events;
}

// ═══════════════════════════════════════════════════════════════
//  CONFLICT DETECTION
// ═══════════════════════════════════════════════════════════════
function detectConflicts(
  events: CalendarEvent[],
  changedEvent?: { id: string; newEnd?: string; isNew?: boolean }
): Conflict[] {
  const conflicts: Conflict[] = [];
  const intervals: TimeInterval[] = events.map((e) => ({
    startMs: new Date(e.start).getTime(),
    endMs: new Date(e.end).getTime(),
    eventId: e.id,
    locked: e.locked ?? false,
    priority: priorityToNumber(e.priority),
    isDeadline: e.isDeadline ?? false,
  }));

  // Sort by start time
  intervals.sort((a, b) => a.startMs - b.startMs);

  // Check for overlaps
  for (let i = 0; i < intervals.length; i++) {
    for (let j = i + 1; j < intervals.length; j++) {
      const a = intervals[i];
      const b = intervals[j];

      if (overlaps(a.startMs, a.endMs, b.startMs, b.endMs)) {
        // Determine conflict type
        let type: Conflict["type"] = "overlap";
        if (changedEvent?.id === a.eventId && changedEvent.newEnd) {
          type = "meeting_extended";
        } else if (changedEvent?.isNew && changedEvent.id === a.eventId) {
          type = "new_event";
        }

        // Determine severity based on priorities
        let severity: Conflict["severity"] = "medium";
        if (a.isDeadline || b.isDeadline) {
          severity = "high";
        } else if (a.priority >= 3 || b.priority >= 3) {
          severity = "high";
        } else if (a.priority <= 1 && b.priority <= 1) {
          severity = "low";
        }

        conflicts.push({
          eventId: a.eventId,
          conflictsWith: b.eventId,
          type,
          severity,
        });
      }
    }
  }

  return conflicts;
}

// ═══════════════════════════════════════════════════════════════
//  DYNAMIC RESCHEDULING ALGORITHM
// ═══════════════════════════════════════════════════════════════
function rescheduleEvents(
  events: CalendarEvent[],
  conflicts: Conflict[],
  tz: string,
  windowEndMs: number
): RescheduleResult[] {
  const results: RescheduleResult[] = [];

  // Build intervals with metadata
  const intervals: (TimeInterval & { event: CalendarEvent })[] = events.map((e) => ({
    startMs: new Date(e.start).getTime(),
    endMs: new Date(e.end).getTime(),
    eventId: e.id,
    locked: e.locked ?? false,
    priority: priorityToNumber(e.priority),
    isDeadline: e.isDeadline ?? false,
    event: e,
  }));

  // Sort by: locked first, then deadlines, then priority (desc), then start time
  intervals.sort((a, b) => {
    if (a.locked !== b.locked) return a.locked ? -1 : 1;
    if (a.isDeadline !== b.isDeadline) return a.isDeadline ? -1 : 1;
    if (a.priority !== b.priority) return b.priority - a.priority;
    return a.startMs - b.startMs;
  });

  // Track blocked time slots (locked events and deadlines stay fixed)
  const blockedSlots: { startMs: number; endMs: number }[] = [];

  // First pass: Mark all locked and deadline events as protected
  for (const interval of intervals) {
    if (interval.locked || interval.isDeadline) {
      blockedSlots.push({
        startMs: interval.startMs - TRANSITION_BUFFER_MS,
        endMs: interval.endMs + TRANSITION_BUFFER_MS,
      });
      results.push({
        eventId: interval.eventId,
        title: interval.event.title,
        originalStart: interval.event.start,
        originalEnd: interval.event.end,
        newStart: interval.event.start,
        newEnd: interval.event.end,
        reason: interval.locked
          ? "Event is locked — protected from rescheduling"
          : "Deadline event — protected to ensure completion",
        status: "protected",
      });
    }
  }

  // Second pass: Reschedule conflicting events
  const conflictingEventIds = new Set(conflicts.map((c) => c.eventId));

  for (const interval of intervals) {
    // Skip already processed (locked/deadline) events
    if (interval.locked || interval.isDeadline) continue;

    const hasConflict = conflictingEventIds.has(interval.eventId);

    if (!hasConflict) {
      // Check if the event actually conflicts with blocked slots
      const conflictsWithBlocked = blockedSlots.some(
        (slot) => overlaps(interval.startMs, interval.endMs, slot.startMs, slot.endMs)
      );

      if (!conflictsWithBlocked) {
        // No conflict, keep as is
        blockedSlots.push({
          startMs: interval.startMs - TRANSITION_BUFFER_MS,
          endMs: interval.endMs + TRANSITION_BUFFER_MS,
        });
        results.push({
          eventId: interval.eventId,
          title: interval.event.title,
          originalStart: interval.event.start,
          originalEnd: interval.event.end,
          newStart: interval.event.start,
          newEnd: interval.event.end,
          reason: "No conflicts detected",
          status: "unchanged",
        });
        continue;
      }
    }

    // Find a new slot for this event
    const duration = interval.endMs - interval.startMs;
    const newSlot = findAvailableSlot(
      interval.startMs,
      duration,
      blockedSlots,
      tz,
      windowEndMs
    );

    if (newSlot) {
      blockedSlots.push({
        startMs: newSlot.startMs - TRANSITION_BUFFER_MS,
        endMs: newSlot.endMs + TRANSITION_BUFFER_MS,
      });

      const newStart = new Date(newSlot.startMs).toISOString();
      const newEnd = new Date(newSlot.endMs).toISOString();

      results.push({
        eventId: interval.eventId,
        title: interval.event.title,
        originalStart: interval.event.start,
        originalEnd: interval.event.end,
        newStart,
        newEnd,
        reason: generateRescheduleReason(interval, newSlot, tz),
        status: "moved",
      });
    } else {
      // Could not find a slot, keep original
      results.push({
        eventId: interval.eventId,
        title: interval.event.title,
        originalStart: interval.event.start,
        originalEnd: interval.event.end,
        newStart: interval.event.start,
        newEnd: interval.event.end,
        reason: "Could not find available time slot — kept at original time",
        status: "unchanged",
      });
    }
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════
//  SLOT FINDER
// ═══════════════════════════════════════════════════════════════
function findAvailableSlot(
  preferredStart: number,
  duration: number,
  blockedSlots: { startMs: number; endMs: number }[],
  tz: string,
  windowEndMs: number
): { startMs: number; endMs: number } | null {
  const WORK_START = 8 * 60; // 8 AM
  const WORK_END = 20 * 60;  // 8 PM
  const LUNCH_START = 12 * 60;
  const LUNCH_END = 13 * 60;

  let probeMs = snapTo15(preferredStart);
  const maxProbe = windowEndMs;

  while (probeMs + duration <= maxProbe) {
    const localStart = getLocalMinutes(new Date(probeMs), tz);
    const localEnd = getLocalMinutes(new Date(probeMs + duration), tz);

    // Check work hours
    const withinWorkHours = localStart >= WORK_START && localEnd <= WORK_END;

    // Avoid lunch
    const hitsLunch = localStart < LUNCH_END && localEnd > LUNCH_START;

    // Check blocked slots
    const conflictsWithBlocked = blockedSlots.some(
      (slot) => overlaps(probeMs, probeMs + duration, slot.startMs, slot.endMs)
    );

    if (withinWorkHours && !hitsLunch && !conflictsWithBlocked) {
      return { startMs: probeMs, endMs: probeMs + duration };
    }

    // Advance cursor intelligently
    if (localStart >= WORK_END - 15) {
      // Jump to next day's work start
      const nextDay = new Date(probeMs);
      nextDay.setHours(0, 0, 0, 0);
      nextDay.setTime(nextDay.getTime() + 24 * MS_PER_HOUR);
      const dateKey = getLocalDateKey(nextDay, tz);
      probeMs = new Date(`${dateKey}T08:00:00`).getTime();
    } else if (localStart >= LUNCH_START - 15 && localStart < LUNCH_END) {
      // Jump past lunch
      probeMs = snapTo15(probeMs + (LUNCH_END - localStart) * MS_PER_MIN);
    } else {
      probeMs += GRID_MS;
    }
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════
//  REASON GENERATOR
// ═══════════════════════════════════════════════════════════════
function generateRescheduleReason(
  original: TimeInterval & { event: CalendarEvent },
  newSlot: { startMs: number; endMs: number },
  tz: string
): string {
  const originalDate = new Date(original.startMs);
  const newDate = new Date(newSlot.startMs);

  const originalDay = getLocalDateKey(originalDate, tz);
  const newDay = getLocalDateKey(newDate, tz);

  const parts: string[] = [];

  if (originalDay !== newDay) {
    parts.push(`Moved to ${newDay} to avoid conflicts`);
  } else {
    const originalLocalMin = getLocalMinutes(originalDate, tz);
    const newLocalMin = getLocalMinutes(newDate, tz);

    if (newLocalMin < originalLocalMin) {
      parts.push("Moved earlier to accommodate other events");
    } else {
      parts.push("Moved later to resolve scheduling conflict");
    }
  }

  // Add energy tier context
  const newLocalMin = getLocalMinutes(newDate, tz);
  if (newLocalMin >= 9 * 60 && newLocalMin < 12 * 60) {
    parts.push("Placed in peak energy hours (9AM-12PM)");
  } else if (newLocalMin >= 13 * 60 && newLocalMin < 16 * 60) {
    parts.push("Placed in focus hours (1PM-4PM)");
  } else if (newLocalMin >= 16 * 60) {
    parts.push("Placed in wind-down hours (4PM-8PM)");
  }

  return parts.join(". ") + ".";
}

// ═══════════════════════════════════════════════════════════════
//  UPDATE GOOGLE CALENDAR
// ═══════════════════════════════════════════════════════════════
async function applyReschedule(
  accessToken: string,
  results: RescheduleResult[]
): Promise<{ success: boolean; applied: number; failed: number }> {
  let applied = 0;
  let failed = 0;

  for (const result of results) {
    if (result.status !== "moved") continue;

    try {
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${result.eventId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            start: { dateTime: result.newStart },
            end: { dateTime: result.newEnd },
          }),
        }
      );

      if (res.ok) {
        applied++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return { success: failed === 0, applied, failed };
}

// ═══════════════════════════════════════════════════════════════
//  MAIN HANDLER
// ═══════════════════════════════════════════════════════════════
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      changedEvent,
      windowDays = 7,
      timeZone = "UTC",
      apply = false,
    } = body as {
      changedEvent?: { id: string; newEnd?: string; isNew?: boolean };
      windowDays?: number;
      timeZone?: string;
      apply?: boolean;
    };

    const accessToken = await getGoogleAccessTokenForUser(supabase, user.id);

    const now = new Date();
    const windowEnd = new Date(now.getTime() + windowDays * 24 * MS_PER_HOUR);

    // Fetch current calendar events
    const events = await fetchCalendarEvents(accessToken, now, windowEnd);

    // Detect conflicts
    const conflicts = detectConflicts(events, changedEvent);

    // If no conflicts, return early
    if (conflicts.length === 0) {
      return NextResponse.json({
        status: "optimal",
        message: "No conflicts detected — schedule is already optimal",
        conflicts: [],
        reschedule: [],
      });
    }

    // Calculate rescheduling plan
    const rescheduleResults = rescheduleEvents(
      events,
      conflicts,
      timeZone,
      windowEnd.getTime()
    );

    // Optionally apply changes
    let applyResult = null;
    if (apply) {
      applyResult = await applyReschedule(accessToken, rescheduleResults);
    }

    return NextResponse.json({
      status: "resolved",
      message: `Found ${conflicts.length} conflict(s) — ${rescheduleResults.filter(r => r.status === "moved").length} event(s) rescheduled`,
      conflicts,
      reschedule: rescheduleResults,
      applied: applyResult,
    });
  } catch (err) {
    console.error("[reschedule]", err);
    const message = err instanceof Error ? err.message : "Rescheduling failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET handler to check for conflicts without rescheduling
export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const windowDays = parseInt(searchParams.get("windowDays") ?? "7", 10);

    const accessToken = await getGoogleAccessTokenForUser(supabase, user.id);

    const now = new Date();
    const windowEnd = new Date(now.getTime() + windowDays * 24 * MS_PER_HOUR);

    const events = await fetchCalendarEvents(accessToken, now, windowEnd);
    const conflicts = detectConflicts(events);

    return NextResponse.json({
      hasConflicts: conflicts.length > 0,
      conflictCount: conflicts.length,
      conflicts,
      eventCount: events.length,
    });
  } catch (err) {
    console.error("[reschedule-check]", err);
    const message = err instanceof Error ? err.message : "Conflict check failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
