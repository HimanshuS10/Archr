import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGoogleAccessTokenForUser } from "@/lib/google-calendar-server";

// --- CONFIGURATION & CONSTANTS ---
const MS_PER_MIN = 60_000;
const MS_PER_DAY = 86_400_000;
const STEP_MS = 15 * MS_PER_MIN; // 15-minute grid
const BUFFER_MS = 10 * MS_PER_MIN; // 10-min travel/switch time

const DAILY_CAPS: Record<string, number> = {
  urgent: 240, // 4 hours
  high: 180,   // 3 hours
  medium: 120, // 2 hours
  low: 90,     // 1.5 hours
};

// --- TYPES ---
type Priority = "low" | "medium" | "high" | "urgent";

interface Subtask {
  id: string;
  title: string;
  estimated_minutes: number | null;
  order: number;
}

interface TimeInterval {
  startMs: number;
  endMs: number;
}

// --- UTILITIES ---
const roundTo15 = (min: number) => Math.max(15, Math.ceil(min / 15) * 15);

const snapToGrid = (ms: number) => Math.ceil(ms / STEP_MS) * STEP_MS;

/** Returns YYYY-MM-DD in the user's specific timezone */
const getLocalDateKey = (date: Date, timeZone: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);

/** Gets the numeric minute-of-day (e.g., 08:30 -> 510) */
const getLocalMinutes = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, hour12: false, hour: "2-digit", minute: "2-digit" }).formatToParts(date);
  const h = Number(parts.find(p => p.type === "hour")?.value || 0);
  const m = Number(parts.find(p => p.type === "minute")?.value || 0);
  return h * 60 + m;
};

// --- GOOGLE CALENDAR API ---
async function fetchBusyIntervals(accessToken: string, start: Date, end: Date): Promise<TimeInterval[]> {
  const params = new URLSearchParams({
    singleEvents: "true",
    orderBy: "startTime",
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
  });

  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) return [];
  const data = await res.json();

  return (data.items || [])
    .filter((e: any) => e.status !== "cancelled" && e.transparency !== "transparent")
    .map((e: any) => ({
      startMs: new Date(e.start.dateTime || e.start.date).getTime() - BUFFER_MS,
      endMs: new Date(e.end.dateTime || e.end.date).getTime() + BUFFER_MS,
    }));
}

function overlaps(start: number, end: number, blocked: TimeInterval[]) {
  return blocked.some(b => start < b.endMs && end > b.startMs);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { task, subtasks, timeZone = "UTC" } = await req.json();
    const priority = (task.priority?.toLowerCase() || "medium") as Priority;
    const dailyCapMs = (DAILY_CAPS[priority] || 120) * MS_PER_MIN;

    // 1. Setup Time Windows
    const now = new Date();
    const deadlineMs = task.deadline ? new Date(task.deadline).getTime() : now.getTime() + (7 * MS_PER_DAY);
    const accessToken = await getGoogleAccessTokenForUser(supabase, user.id);
    
    // 2. Fetch & Prepare Blocked Slots
    const blocked = await fetchBusyIntervals(accessToken, now, new Date(deadlineMs));
    const dailyUsedMs = new Map<string, number>();
    const scheduledResults = [];

    // 3. Process Subtasks
    const sortedSubtasks = [...subtasks].sort((a, b) => a.order - b.order);
    let currentSearchCursor = now.getTime() + (5 * MS_PER_MIN); // Start 5 mins from now

    for (let i = 0; i < sortedSubtasks.length; i++) {
      const sub = sortedSubtasks[i];
      const durationMs = roundTo15(sub.estimated_minutes || 30) * MS_PER_MIN;
      
      const spreadBuffer = priority === "urgent" ? 0.1 : 0.2; // Keep 20% of time as safety margin
      const totalAvailableTime = (deadlineMs - now.getTime()) * (1 - spreadBuffer);
      const idealStartMs = now.getTime() + (i / sortedSubtasks.length) * totalAvailableTime;
      
      let probeMs = snapToGrid(Math.max(currentSearchCursor, idealStartMs));
      let found = false;

      while (probeMs + durationMs <= deadlineMs) {
        const dateKey = getLocalDateKey(new Date(probeMs), timeZone);
        const usedToday = dailyUsedMs.get(dateKey) || 0;
        const localMinStart = getLocalMinutes(new Date(probeMs), timeZone);
        const localMinEnd = getLocalMinutes(new Date(probeMs + durationMs), timeZone);

        const isWithinWorkHours = localMinStart >= 480 && localMinEnd <= 1320;
        const isAvailable = !overlaps(probeMs, probeMs + durationMs, blocked);

        if (isWithinWorkHours && isAvailable && (usedToday + durationMs <= dailyCapMs)) {
          // Success! Place the task
          scheduledResults.push({
            subtask_id: sub.id,
            title: sub.title,
            start: new Date(probeMs).toISOString(),
            end: new Date(probeMs + durationMs).toISOString(),
            reasoning: `Scheduled in available slot on ${dateKey}.`
          });

          dailyUsedMs.set(dateKey, usedToday + durationMs);
          blocked.push({ startMs: probeMs - BUFFER_MS, endMs: probeMs + durationMs + BUFFER_MS });
          currentSearchCursor = probeMs + durationMs;
          found = true;
          break;
        }

        if (localMinStart >= 1320) {
           const nextDay = new Date(probeMs + MS_PER_DAY);
           nextDay.setUTCHours(8, 0, 0, 0);
           probeMs = nextDay.getTime();
        } else {
           probeMs += STEP_MS;
        }
      }

      if (!found) {
        return NextResponse.json({ error: `Could not fit "${sub.title}" before deadline.` }, { status: 409 });
      }
    }

    return NextResponse.json({ scheduled: scheduledResults });

  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 