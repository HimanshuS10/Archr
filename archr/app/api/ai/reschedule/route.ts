import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGoogleAccessTokenForUser } from "@/lib/google-calendar-server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const MS_PER_MIN = 60_000;
const MS_PER_HOUR = 60 * MS_PER_MIN;
const GRID_MS = 15 * MS_PER_MIN;

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO
  end: string;   // ISO
  locked?: boolean;
  priority?: "low" | "medium" | "high" | "urgent";
}

interface FreeSlot {
  start: string; // ISO
  end: string;
}

interface LLMPayload {
  timezone: string;
  workHours: { start: string; end: string };
  today: string;
  events: CalendarEvent[];
  conflicts: { eventA: string; eventB: string }[];
  freeSlots: FreeSlot[];
}

interface LLMMove {
  eventId: string;
  newStart: string;
  newEnd: string;
  reason: string;
}

interface LLMResponse {
  moves: LLMMove[];
  summary: string;
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

// ─── Utilities ────────────────────────────────────────────────────────────────

function overlaps(s1: number, e1: number, s2: number, e2: number): boolean {
  return s1 < e2 && e1 > s2;
}

function snapTo15(ms: number): number {
  return Math.ceil(ms / GRID_MS) * GRID_MS;
}

// ─── Google Calendar fetch ────────────────────────────────────────────────────

async function fetchCalendarEvents(
  accessToken: string,
  start: Date,
  end: Date
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    singleEvents: "true",
    orderBy: "startTime",
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    maxResults: "2500",
    showDeleted: "false",
  });

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) return [];
  const data = await res.json();

  return (data.items ?? [])
    .filter(
      (e: { status?: string; transparency?: string }) =>
        e.status !== "cancelled" && e.transparency !== "transparent"
    )
    .map(
      (e: {
        id: string;
        summary?: string;
        start?: { dateTime?: string; date?: string };
        end?: { dateTime?: string; date?: string };
        extendedProperties?: { private?: Record<string, string> };
      }) => ({
        id: e.id,
        title: e.summary || "Untitled",
        start: e.start?.dateTime || e.start?.date || "",
        end: e.end?.dateTime || e.end?.date || "",
        locked: e.extendedProperties?.private?.locked === "true",
        priority: e.extendedProperties?.private?.priority as CalendarEvent["priority"],
      })
    )
    .filter((e: CalendarEvent) => e.start && e.end);
}

// ─── Conflict detection ───────────────────────────────────────────────────────

function detectConflicts(events: CalendarEvent[]): { eventA: string; eventB: string }[] {
  const conflicts: { eventA: string; eventB: string }[] = [];

  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const a = events[i];
      const b = events[j];
      const aStart = new Date(a.start).getTime();
      const aEnd = new Date(a.end).getTime();
      const bStart = new Date(b.start).getTime();
      const bEnd = new Date(b.end).getTime();
      if (overlaps(aStart, aEnd, bStart, bEnd)) {
        conflicts.push({ eventA: a.id, eventB: b.id });
      }
    }
  }

  return conflicts;
}

// ─── Free slot computation ────────────────────────────────────────────────────

/**
 * For each day in the window, compute free time blocks within work hours (8am–8pm)
 * that are not occupied by any event. Snapped to 15-min grid.
 */
function buildFreeSlots(
  events: CalendarEvent[],
  windowStartMs: number,
  windowEndMs: number,
  tz: string
): FreeSlot[] {
  const WORK_START_H = 8;
  const WORK_END_H = 20;
  const freeSlots: FreeSlot[] = [];

  // Iterate day by day
  const cursor = new Date(windowStartMs);
  cursor.setHours(0, 0, 0, 0);

  while (cursor.getTime() < windowEndMs) {
    // Get work day bounds for this date in the local timezone
    const dateStr = cursor.toLocaleDateString("en-CA", { timeZone: tz }); // YYYY-MM-DD
    const dayStart = new Date(`${dateStr}T${String(WORK_START_H).padStart(2, "0")}:00:00`);
    const dayEnd = new Date(`${dateStr}T${String(WORK_END_H).padStart(2, "0")}:00:00`);

    // Collect busy intervals for this day (snapped outward to 15-min grid)
    const busy = events
      .filter((e) => {
        const eStart = new Date(e.start).getTime();
        const eEnd = new Date(e.end).getTime();
        return overlaps(eStart, eEnd, dayStart.getTime(), dayEnd.getTime());
      })
      .map((e) => ({
        startMs: Math.max(dayStart.getTime(), new Date(e.start).getTime()),
        endMs: Math.min(dayEnd.getTime(), new Date(e.end).getTime()),
      }))
      .sort((a, b) => a.startMs - b.startMs);

    // Walk the day and collect free windows
    let probe = snapTo15(dayStart.getTime());
    const dayEndMs = dayEnd.getTime();

    for (const b of busy) {
      if (probe < b.startMs) {
        freeSlots.push({
          start: new Date(probe).toISOString(),
          end: new Date(b.startMs).toISOString(),
        });
      }
      probe = snapTo15(b.endMs);
    }

    // Tail of the day
    if (probe < dayEndMs) {
      freeSlots.push({
        start: new Date(probe).toISOString(),
        end: new Date(dayEndMs).toISOString(),
      });
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return freeSlots;
}

// ─── LLM call ─────────────────────────────────────────────────────────────────

async function askLLM(payload: LLMPayload): Promise<LLMResponse | null> {
  if (!process.env.GEMINI_API_KEY) return null;

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

  const systemPrompt = `You are a smart calendar scheduling assistant. You receive a JSON object describing calendar events, conflicts, and free time slots. You must decide which events to move to resolve all conflicts.

STRICT RULES:
- Never move a locked event (locked: true)
- Never place an event outside work hours (${payload.workHours.start}–${payload.workHours.end})
- Only place events in times that fall within the provided freeSlots windows
- The moved event must fit entirely within a single free slot
- Prefer moving the lower-priority event in each conflict
- Prefer minimal displacement — move events as little as possible
- Deep work / focus / coding events work best in the morning
- Meetings, calls, standups work well mid-day
- Personal tasks (gym, walk, etc.) are flexible

OUTPUT: Respond with ONLY valid JSON, no markdown, no explanation:
{
  "moves": [
    {
      "eventId": "<id>",
      "newStart": "<ISO 8601 datetime>",
      "newEnd": "<ISO 8601 datetime>",
      "reason": "<1 sentence why>"
    }
  ],
  "summary": "<one sentence summary of all changes>"
}

If no moves are needed, return: { "moves": [], "summary": "No conflicts to resolve" }`;

  const userMessage = JSON.stringify(payload, null, 2);

  try {
    const result = await model.generateContent([
      { text: systemPrompt },
      { text: userMessage },
    ]);

    const raw = result.response.text().trim();
    const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    const parsed = JSON.parse(cleaned) as LLMResponse;

    if (!Array.isArray(parsed.moves)) return null;
    return parsed;
  } catch (err) {
    console.error("[reschedule] LLM error:", err);
    return null;
  }
}

// ─── Validate LLM moves ───────────────────────────────────────────────────────

/**
 * Verify each LLM-proposed move actually fits in a free slot and doesn't
 * collide with other events. Filters out any bad moves.
 */
function validateMoves(
  moves: LLMMove[],
  events: CalendarEvent[],
  freeSlots: FreeSlot[]
): LLMMove[] {
  const accepted: LLMMove[] = [];
  // Track already-placed intervals so moves don't collide with each other
  const placed: { startMs: number; endMs: number }[] = [];

  for (const move of moves) {
    const event = events.find((e) => e.id === move.eventId);
    if (!event) continue;
    if (event.locked) continue; // safety — LLM should never have proposed this

    const newStart = new Date(move.newStart).getTime();
    const newEnd = new Date(move.newEnd).getTime();

    if (isNaN(newStart) || isNaN(newEnd) || newEnd <= newStart) continue;

    // Must fit within at least one free slot
    const fitsInFreeSlot = freeSlots.some((slot) => {
      const slotStart = new Date(slot.start).getTime();
      const slotEnd = new Date(slot.end).getTime();
      return newStart >= slotStart && newEnd <= slotEnd;
    });
    if (!fitsInFreeSlot) continue;

    // Must not collide with events that are NOT being moved
    const movingIds = new Set(moves.map((m) => m.eventId));
    const collidesWithFixed = events
      .filter((e) => e.id !== move.eventId && !movingIds.has(e.id))
      .some((e) => {
        const eStart = new Date(e.start).getTime();
        const eEnd = new Date(e.end).getTime();
        return overlaps(newStart, newEnd, eStart, eEnd);
      });
    if (collidesWithFixed) continue;

    // Must not collide with already-accepted moves
    const collidesWithPlaced = placed.some((p) =>
      overlaps(newStart, newEnd, p.startMs, p.endMs)
    );
    if (collidesWithPlaced) continue;

    accepted.push(move);
    placed.push({ startMs: newStart, endMs: newEnd });
  }

  return accepted;
}

// ─── Algorithmic fallback ─────────────────────────────────────────────────────

function algorithmicFallback(
  events: CalendarEvent[],
  conflicts: { eventA: string; eventB: string }[]
): RescheduleResult[] {
  const priorityOf = (p?: string) => {
    switch (p) {
      case "urgent": return 4;
      case "high": return 3;
      case "medium": return 2;
      case "low": return 1;
      default: return 2;
    }
  };

  const movedTimes = new Map<string, { startMs: number; endMs: number }>();
  const results: RescheduleResult[] = [];
  const processed = new Set<string>();

  const getEff = (id: string, event: CalendarEvent) => {
    return movedTimes.get(id) ?? {
      startMs: new Date(event.start).getTime(),
      endMs: new Date(event.end).getTime(),
    };
  };

  for (const { eventA, eventB } of conflicts) {
    const a = events.find((e) => e.id === eventA);
    const b = events.find((e) => e.id === eventB);
    if (!a || !b) continue;

    const pairKey = [eventA, eventB].sort().join("|");
    if (processed.has(pairKey)) continue;
    processed.add(pairKey);

    const aEff = getEff(a.id, a);
    const bEff = getEff(b.id, b);
    if (!overlaps(aEff.startMs, aEff.endMs, bEff.startMs, bEff.endMs)) continue;

    let mover: CalendarEvent, anchor: CalendarEvent;
    if (a.locked && b.locked) continue;
    else if (a.locked) { mover = b; anchor = a; }
    else if (b.locked) { mover = a; anchor = b; }
    else if (priorityOf(a.priority) < priorityOf(b.priority)) { mover = a; anchor = b; }
    else { mover = b; anchor = a; }

    const anchorEff = getEff(anchor.id, anchor);
    const moverEff = getEff(mover.id, mover);
    const durationMs = moverEff.endMs - moverEff.startMs;

    const workEnd = new Date(anchorEff.endMs);
    workEnd.setHours(20, 0, 0, 0);

    const busySlots = events
      .filter((e) => e.id !== mover.id)
      .map((e) => getEff(e.id, e));

    let probe = snapTo15(anchorEff.endMs);
    let newStartMs: number | null = null;

    while (probe + durationMs <= workEnd.getTime()) {
      const clash = busySlots.some((s) =>
        overlaps(probe, probe + durationMs, s.startMs, s.endMs)
      );
      if (!clash) { newStartMs = probe; break; }
      probe += GRID_MS;
    }

    if (newStartMs === null) {
      results.push({
        eventId: mover.id, title: mover.title,
        originalStart: mover.start, originalEnd: mover.end,
        newStart: mover.start, newEnd: mover.end,
        reason: `No slot available today after "${anchor.title}"`,
        status: "unchanged",
      });
      continue;
    }

    movedTimes.set(mover.id, { startMs: newStartMs, endMs: newStartMs + durationMs });
    results.push({
      eventId: mover.id, title: mover.title,
      originalStart: mover.start, originalEnd: mover.end,
      newStart: new Date(newStartMs).toISOString(),
      newEnd: new Date(newStartMs + durationMs).toISOString(),
      reason: `Moved after "${anchor.title}" to resolve overlap`,
      status: "moved",
    });
  }

  const movedIds = new Set(results.map((r) => r.eventId));
  for (const e of events) {
    if (!movedIds.has(e.id)) {
      results.push({
        eventId: e.id, title: e.title,
        originalStart: e.start, originalEnd: e.end,
        newStart: e.start, newEnd: e.end,
        reason: "No conflict", status: "unchanged",
      });
    }
  }

  return results;
}

// ─── Apply moves to Google Calendar ──────────────────────────────────────────

async function applyMoves(
  accessToken: string,
  results: RescheduleResult[]
): Promise<{ applied: number; failed: number }> {
  let applied = 0;
  let failed = 0;

  for (const r of results) {
    if (r.status !== "moved") continue;
    try {
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${r.eventId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            start: { dateTime: r.newStart },
            end: { dateTime: r.newEnd },
          }),
        }
      );
      if (res.ok) applied++; else failed++;
    } catch {
      failed++;
    }
  }

  return { applied, failed };
}

// ─── POST — resolve & apply ───────────────────────────────────────────────────

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      windowDays = 7,
      timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
      apply = false,
    } = body as { windowDays?: number; timeZone?: string; apply?: boolean };

    const accessToken = await getGoogleAccessTokenForUser(supabase, user.id);
    const now = new Date();
    const windowEnd = new Date(now.getTime() + windowDays * 24 * MS_PER_HOUR);

    // 1. Fetch events
    const events = await fetchCalendarEvents(accessToken, now, windowEnd);

    // 2. Find conflicts
    const conflicts = detectConflicts(events);

    if (conflicts.length === 0) {
      return NextResponse.json({
        status: "optimal",
        message: "No conflicts — schedule is already optimal",
        reschedule: [],
      });
    }

    // 3. Build free slots for the window
    const freeSlots = buildFreeSlots(events, now.getTime(), windowEnd.getTime(), timeZone);

    // 4. Ask LLM
    const payload: LLMPayload = {
      timezone: timeZone,
      workHours: { start: "08:00", end: "20:00" },
      today: now.toISOString().slice(0, 10),
      events,
      conflicts,
      freeSlots,
    };

    const llmResponse = await askLLM(payload);

    let rescheduleResults: RescheduleResult[];

    if (llmResponse && llmResponse.moves.length > 0) {
      // 5a. Validate LLM moves
      const validMoves = validateMoves(llmResponse.moves, events, freeSlots);
      const movedIds = new Set(validMoves.map((m) => m.eventId));

      rescheduleResults = [
        ...validMoves.map((move) => {
          const event = events.find((e) => e.id === move.eventId)!;
          return {
            eventId: event.id,
            title: event.title,
            originalStart: event.start,
            originalEnd: event.end,
            newStart: move.newStart,
            newEnd: move.newEnd,
            reason: move.reason,
            status: "moved" as const,
          };
        }),
        ...events
          .filter((e) => !movedIds.has(e.id))
          .map((e) => ({
            eventId: e.id, title: e.title,
            originalStart: e.start, originalEnd: e.end,
            newStart: e.start, newEnd: e.end,
            reason: "No move needed", status: "unchanged" as const,
          })),
      ];
    } else {
      // 5b. Fallback to algorithm
      rescheduleResults = algorithmicFallback(events, conflicts);
    }

    // 6. Apply
    const moved = rescheduleResults.filter((r) => r.status === "moved");
    let applyResult = null;
    if (apply && moved.length > 0) {
      applyResult = await applyMoves(accessToken, rescheduleResults);
    }

    return NextResponse.json({
      status: moved.length > 0 ? "resolved" : "optimal",
      message: llmResponse?.summary ?? `${moved.length} event(s) rescheduled`,
      reschedule: rescheduleResults,
      applied: applyResult,
      usedLLM: !!llmResponse,
    });
  } catch (err) {
    console.error("[reschedule]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Rescheduling failed." },
      { status: 500 }
    );
  }
}

// ─── GET — conflict check only ────────────────────────────────────────────────

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
      eventCount: events.length,
    });
  } catch (err) {
    console.error("[reschedule-check]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Conflict check failed." },
      { status: 500 }
    );
  }
}
