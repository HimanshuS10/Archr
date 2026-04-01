import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGoogleAccessTokenForUser } from "@/lib/google-calendar-server";

// ═══════════════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════════════
const MS_PER_MIN = 60_000;
const MS_PER_HOUR = 60 * MS_PER_MIN;
const MS_PER_DAY = 24 * MS_PER_HOUR;
const GRID_MS = 15 * MS_PER_MIN;
const TRANSITION_BUFFER_MS = 10 * MS_PER_MIN;

const MAX_CONSECUTIVE_SESSIONS = 2;

const DAILY_CAP_MINUTES: Record<string, number> = {
  urgent: 300,
  high: 240,
  medium: 180,
  low: 120,
};

// ═══════════════════════════════════════════════════════════════
//  CONSTRAINT LEVELS — progressive relaxation
//
//  Level 0 (ideal):    8AM–8PM, lunch blocked, weekend ×0.5 cap,
//                      energy-tier scoring, back-to-back limits
//  Level 1 (flexible): Allow lunch hours
//  Level 2 (extended): Expand to 7AM–10PM
//  Level 3 (marathon):  Remove daily caps, full weekend usage
//  Level 4 (compress): Compress subtask durations by 25%
//  Level 5 (survival): 6AM–11PM, remove transition buffers,
//                      compress by 40%
// ═══════════════════════════════════════════════════════════════
interface ConstraintProfile {
  level: number;
  label: string;
  workStart: number;       // minutes-of-day
  workEnd: number;
  lunchBlocked: boolean;
  weekendCapRatio: number;
  dailyCapMultiplier: number;
  backToBackLimit: number;
  durationCompression: number; // 1.0 = full, 0.75 = 25% shorter
  transitionBuffer: number;
}

const CONSTRAINT_LEVELS: ConstraintProfile[] = [
  {
    level: 0, label: "optimal",
    workStart: 480, workEnd: 1200,
    lunchBlocked: true, weekendCapRatio: 0.5,
    dailyCapMultiplier: 1.0, backToBackLimit: MAX_CONSECUTIVE_SESSIONS,
    durationCompression: 1.0, transitionBuffer: TRANSITION_BUFFER_MS,
  },
  {
    level: 1, label: "flexible",
    workStart: 480, workEnd: 1200,
    lunchBlocked: false, weekendCapRatio: 0.5,
    dailyCapMultiplier: 1.0, backToBackLimit: MAX_CONSECUTIVE_SESSIONS,
    durationCompression: 1.0, transitionBuffer: TRANSITION_BUFFER_MS,
  },
  {
    level: 2, label: "extended hours",
    workStart: 420, workEnd: 1320,
    lunchBlocked: false, weekendCapRatio: 0.75,
    dailyCapMultiplier: 1.3, backToBackLimit: 4,
    durationCompression: 1.0, transitionBuffer: TRANSITION_BUFFER_MS,
  },
  {
    level: 3, label: "marathon",
    workStart: 420, workEnd: 1320,
    lunchBlocked: false, weekendCapRatio: 1.0,
    dailyCapMultiplier: 2.0, backToBackLimit: Infinity,
    durationCompression: 1.0, transitionBuffer: 5 * MS_PER_MIN,
  },
  {
    level: 4, label: "compressed",
    workStart: 420, workEnd: 1320,
    lunchBlocked: false, weekendCapRatio: 1.0,
    dailyCapMultiplier: 2.0, backToBackLimit: Infinity,
    durationCompression: 0.75, transitionBuffer: 5 * MS_PER_MIN,
  },
  {
    level: 5, label: "survival",
    workStart: 360, workEnd: 1380,
    lunchBlocked: false, weekendCapRatio: 1.0,
    dailyCapMultiplier: 3.0, backToBackLimit: Infinity,
    durationCompression: 0.6, transitionBuffer: 0,
  },
];

// Energy tiers (local minutes-of-day)
const PEAK_START = 9 * 60;
const PEAK_END = 12 * 60;
const FOCUS_START = 13 * 60;
const FOCUS_END = 16 * 60;
const LUNCH_START = 12 * 60;
const LUNCH_END = 13 * 60;

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════
type Priority = "low" | "medium" | "high" | "urgent";
type EnergyTier = "peak" | "focus" | "winddown";

interface Subtask {
  id: string;
  title: string;
  estimated_minutes: number | null;
  order: number;
}

interface ScoredSubtask extends Subtask {
  baseDurationMs: number;
  complexity: number;
  preferredTier: EnergyTier;
}

interface TimeInterval {
  startMs: number;
  endMs: number;
}

interface CandidateSlot {
  startMs: number;
  endMs: number;
  dateKey: string;
  tier: EnergyTier;
  score: number;
  reasons: string[];
}

interface ScheduledResult {
  subtask_id: string;
  title: string;
  start: string;
  end: string;
  reasoning: string;
}

// ═══════════════════════════════════════════════════════════════
//  UTILITIES
// ═══════════════════════════════════════════════════════════════
const roundTo15 = (min: number) => Math.max(15, Math.ceil(min / 15) * 15);
const snapUp = (ms: number) => Math.ceil(ms / GRID_MS) * GRID_MS;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function getLocalDateKey(date: Date, tz: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(date);
}

function getLocalMinutes(date: Date, tz: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hour12: false, hour: "2-digit", minute: "2-digit",
  }).formatToParts(date);
  const h = Number(parts.find(p => p.type === "hour")?.value ?? 0);
  const m = Number(parts.find(p => p.type === "minute")?.value ?? 0);
  return h * 60 + m;
}

function getLocalDayOfWeek(date: Date, tz: string): number {
  const dayStr = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, weekday: "short",
  }).format(date);
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[dayStr] ?? 1;
}

function isWeekend(date: Date, tz: string): boolean {
  const dow = getLocalDayOfWeek(date, tz);
  return dow === 0 || dow === 6;
}

function getEnergyTier(localMin: number): EnergyTier {
  if (localMin >= PEAK_START && localMin < PEAK_END) return "peak";
  if (localMin >= FOCUS_START && localMin < FOCUS_END) return "focus";
  return "winddown";
}

function tierLabel(tier: EnergyTier): string {
  if (tier === "peak") return "peak energy hours (9–12 AM)";
  if (tier === "focus") return "focus hours (1–4 PM)";
  return "wind-down hours (4–8 PM)";
}

function overlaps(start: number, end: number, intervals: TimeInterval[]) {
  return intervals.some(b => start < b.endMs && end > b.startMs);
}

function isInLunch(startMin: number, endMin: number) {
  return startMin < LUNCH_END && endMin > LUNCH_START;
}

// ═══════════════════════════════════════════════════════════════
//  GOOGLE CALENDAR — paginated fetch
// ═══════════════════════════════════════════════════════════════
async function fetchBusyIntervals(
  accessToken: string,
  start: Date,
  end: Date,
): Promise<TimeInterval[]> {
  const intervals: TimeInterval[] = [];
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
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!res.ok) break;
    const data = await res.json();

    for (const e of data.items ?? []) {
      if (e.status === "cancelled" || e.transparency === "transparent") continue;
      const s = new Date(e.start?.dateTime || e.start?.date).getTime();
      const eEnd = new Date(e.end?.dateTime || e.end?.date).getTime();
      intervals.push({ startMs: s, endMs: eEnd });
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  return intervals;
}

// ═══════════════════════════════════════════════════════════════
//  COMPLEXITY SCORING
// ═══════════════════════════════════════════════════════════════
function scoreSubtasks(subtasks: Subtask[]): ScoredSubtask[] {
  const sorted = [...subtasks].sort((a, b) => a.order - b.order);
  const maxDuration = Math.max(...sorted.map(s => s.estimated_minutes ?? 30));
  const count = sorted.length;

  return sorted.map((sub, idx) => {
    const duration = roundTo15(sub.estimated_minutes ?? 30);
    const baseDurationMs = duration * MS_PER_MIN;

    const durationScore = maxDuration > 0 ? (duration / maxDuration) : 0.5;
    const orderScore = count > 1 ? 1 - (idx / (count - 1)) : 0.5;
    const complexity = clamp(durationScore * 0.6 + orderScore * 0.4, 0, 1);

    let preferredTier: EnergyTier;
    if (complexity >= 0.6) preferredTier = "peak";
    else if (complexity >= 0.3) preferredTier = "focus";
    else preferredTier = "winddown";

    return { ...sub, baseDurationMs, complexity, preferredTier };
  });
}

// ═══════════════════════════════════════════════════════════════
//  URGENCY FACTOR
// ═══════════════════════════════════════════════════════════════
function computeUrgency(nowMs: number, deadlineMs: number, totalWorkMs: number): number {
  const available = deadlineMs - nowMs;
  if (available <= 0) return 1;
  return clamp(totalWorkMs / available, 0, 1);
}

// ═══════════════════════════════════════════════════════════════
//  DAY BUDGET MANAGER
// ═══════════════════════════════════════════════════════════════
class DayBudget {
  private used = new Map<string, number>();
  private caps = new Map<string, number>();

  constructor(
    private baseCap: number,
    private tz: string,
    startMs: number,
    endMs: number,
    private weekendRatio: number,
    private capMultiplier: number,
  ) {
    let cursor = startMs;
    while (cursor <= endMs) {
      const d = new Date(cursor);
      const key = getLocalDateKey(d, tz);
      if (!this.caps.has(key)) {
        const ratio = isWeekend(d, tz) ? weekendRatio : 1.0;
        this.caps.set(key, baseCap * ratio * capMultiplier);
      }
      cursor += MS_PER_DAY;
    }
  }

  remaining(dateKey: string): number {
    const cap = this.caps.get(dateKey) ?? this.baseCap * this.capMultiplier;
    return Math.max(0, cap - (this.used.get(dateKey) ?? 0));
  }

  consume(dateKey: string, ms: number) {
    this.used.set(dateKey, (this.used.get(dateKey) ?? 0) + ms);
  }

  clone(): DayBudget {
    const copy = Object.create(DayBudget.prototype) as DayBudget;
    copy.baseCap = this.baseCap;
    copy.tz = this.tz;
    copy.weekendRatio = this.weekendRatio;
    copy.capMultiplier = this.capMultiplier;
    copy.caps = new Map(this.caps);
    copy.used = new Map(this.used);
    return copy;
  }
}

// ═══════════════════════════════════════════════════════════════
//  CANDIDATE SCORING
// ═══════════════════════════════════════════════════════════════
function scoreCandidate(
  c: { startMs: number; endMs: number; dateKey: string; tier: EnergyTier },
  sub: ScoredSubtask,
  idealDateIdx: number,
  dateKeys: string[],
  urgency: number,
  consecutiveSessions: number,
  profile: ConstraintProfile,
  tz: string,
): CandidateSlot {
  let score = 100;
  const reasons: string[] = [];

  // Energy-tier alignment
  if (c.tier === sub.preferredTier) {
    score += 30;
    reasons.push(`Placed during ${tierLabel(c.tier)} — optimal for this task's complexity`);
  } else if (
    (sub.preferredTier === "peak" && c.tier === "focus") ||
    (sub.preferredTier === "focus" && (c.tier === "peak" || c.tier === "winddown"))
  ) {
    score += 10;
    reasons.push(`Placed during ${tierLabel(c.tier)} — close to ideal energy level`);
  } else {
    score -= 10;
  }

  // Day spread
  const actualDateIdx = dateKeys.indexOf(c.dateKey);
  const dayDrift = Math.abs(actualDateIdx - idealDateIdx);
  score -= dayDrift * 8;
  if (dayDrift === 0) reasons.push("Scheduled on the ideal day for balanced workload");
  else if (dayDrift <= 1) reasons.push("Within 1 day of ideal spread");

  // Weekend penalty
  if (isWeekend(new Date(c.startMs), tz)) {
    const penalty = urgency > 0.7 ? 3 : 15;
    score -= penalty;
    if (urgency > 0.7) reasons.push("Weekend slot used — deadline is tight");
  }

  // Back-to-back penalty
  if (consecutiveSessions >= profile.backToBackLimit) {
    score -= 25;
  }

  // Morning preference for deep work
  if (sub.complexity >= 0.6 && c.tier === "peak") {
    score += 15;
  }

  // Urgency: prefer earliest
  if (urgency > 0.6) {
    score += Math.max(0, 20 - dayDrift * 4);
  }

  return { ...c, score, reasons };
}

// ═══════════════════════════════════════════════════════════════
//  SLOT FINDER — attempts placement under a given constraint profile
// ═══════════════════════════════════════════════════════════════
function findCandidates(
  sub: ScoredSubtask,
  durationMs: number,
  profile: ConstraintProfile,
  nowMs: number,
  deadlineMs: number,
  blocked: TimeInterval[],
  budget: DayBudget,
  idealDateIdx: number,
  dayKeys: string[],
  urgency: number,
  lastEndMs: number,
  consecutiveSessions: number,
  tz: string,
): CandidateSlot[] {
  const candidates: CandidateSlot[] = [];
  let probeMs = snapUp(nowMs + 3 * MS_PER_MIN);
  const buf = profile.transitionBuffer;

  while (probeMs + durationMs <= deadlineMs) {
    const localStart = getLocalMinutes(new Date(probeMs), tz);
    const localEnd = getLocalMinutes(new Date(probeMs + durationMs), tz);
    const dateKey = getLocalDateKey(new Date(probeMs), tz);

    const withinWork = localStart >= profile.workStart && localEnd <= profile.workEnd;
    const hitsLunch = profile.lunchBlocked && isInLunch(localStart, localEnd);

    // Check conflicts with buffer
    const conflictStart = probeMs - buf;
    const conflictEnd = probeMs + durationMs + buf;
    const available = !overlaps(conflictStart, conflictEnd, blocked);
    const hasCapacity = budget.remaining(dateKey) >= durationMs;

    if (withinWork && !hitsLunch && available && hasCapacity) {
      const tier = getEnergyTier(localStart);
      const gapFromLast = lastEndMs > 0 ? probeMs - lastEndMs : Infinity;
      const consec = gapFromLast <= buf * 2 ? consecutiveSessions + 1 : 0;

      candidates.push(
        scoreCandidate(
          { startMs: probeMs, endMs: probeMs + durationMs, dateKey, tier },
          sub, idealDateIdx, dayKeys, urgency, consec, profile, tz,
        ),
      );
    }

    // Smart cursor advancement
    if (localStart >= profile.workEnd - 15) {
      probeMs = snapUp(probeMs + MS_PER_DAY - (localStart - profile.workStart) * MS_PER_MIN);
    } else if (profile.lunchBlocked && localStart >= LUNCH_START - 15 && localStart < LUNCH_END) {
      probeMs = snapUp(probeMs + (LUNCH_END - localStart) * MS_PER_MIN);
    } else {
      probeMs += GRID_MS;
    }
  }

  return candidates;
}

// ═══════════════════════════════════════════════════════════════
//  SCHEDULE ALL — multi-pass with progressive relaxation
// ═══════════════════════════════════════════════════════════════
function scheduleAll(
  scored: ScoredSubtask[],
  baseCap: number,
  nowMs: number,
  deadlineMs: number,
  calendarBlocked: TimeInterval[],
  urgency: number,
  tz: string,
): { results: ScheduledResult[]; relaxLevel: number } | { error: string } {

  for (const profile of CONSTRAINT_LEVELS) {
    const blocked = calendarBlocked.map(b => ({ ...b }));
    const budget = new DayBudget(
      baseCap, tz, nowMs, deadlineMs,
      profile.weekendCapRatio, profile.dailyCapMultiplier,
    );
    const dayKeys: string[] = [];
    {
      let cursor = nowMs;
      while (cursor <= deadlineMs) {
        const key = getLocalDateKey(new Date(cursor), tz);
        if (!dayKeys.includes(key)) dayKeys.push(key);
        cursor += MS_PER_DAY;
      }
    }

    const results: ScheduledResult[] = [];
    let consecutiveSessions = 0;
    let lastEndMs = 0;
    let failed = false;

    for (let i = 0; i < scored.length; i++) {
      const sub = scored[i];
      const durationMs = Math.max(
        15 * MS_PER_MIN,
        roundTo15(Math.round(
          (sub.baseDurationMs / MS_PER_MIN) * profile.durationCompression
        )) * MS_PER_MIN,
      );

      const idealDateIdx = Math.min(
        Math.floor((i / scored.length) * dayKeys.length),
        dayKeys.length - 1,
      );

      const candidates = findCandidates(
        sub, durationMs, profile,
        nowMs, deadlineMs, blocked, budget,
        idealDateIdx, dayKeys, urgency,
        lastEndMs, consecutiveSessions, tz,
      );

      if (candidates.length === 0) {
        failed = true;
        break;
      }

      candidates.sort((a, b) => b.score - a.score);
      const best = candidates[0];

      budget.consume(best.dateKey, durationMs);
      blocked.push({
        startMs: best.startMs - profile.transitionBuffer,
        endMs: best.endMs + profile.transitionBuffer,
      });

      const gapFromPrev = lastEndMs > 0 ? best.startMs - lastEndMs : Infinity;
      consecutiveSessions = gapFromPrev <= profile.transitionBuffer * 2
        ? consecutiveSessions + 1
        : 0;
      lastEndMs = best.endMs;

      // Build reasoning
      const reasonParts = [...best.reasons];
      const durationMin = durationMs / MS_PER_MIN;
      const originalMin = sub.baseDurationMs / MS_PER_MIN;

      if (sub.complexity >= 0.6) {
        reasonParts.push(`High-complexity task (${durationMin}min) — prioritized for deep work`);
      }
      if (urgency > 0.6) {
        reasonParts.push("Tight deadline — scheduled as early as possible");
      }
      if (profile.level >= 1 && profile.level <= 2) {
        reasonParts.push("Schedule adjusted to fit within available time");
      }
      if (profile.level >= 3) {
        reasonParts.push("Crunch mode — extended hours to meet the deadline");
      }
      if (profile.durationCompression < 1.0) {
        reasonParts.push(
          `Session compressed from ${originalMin}min to ${durationMin}min to fit deadline`,
        );
      }

      results.push({
        subtask_id: sub.id,
        title: sub.title,
        start: new Date(best.startMs).toISOString(),
        end: new Date(best.endMs).toISOString(),
        reasoning: reasonParts.join(". ") + ".",
      });
    }

    if (!failed) {
      return { results, relaxLevel: profile.level };
    }
  }

  return {
    error:
      "Could not fit all subtasks before the deadline even with maximum flexibility. " +
      "This task may need to be split into smaller pieces or started across multiple milestones.",
  };
}

// ═══════════════════════════════════════════════════════════════
//  MAIN HANDLER
// ═══════════════════════════════════════════════════════════════
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { task, subtasks, timeZone = "UTC" } = await req.json() as {
      task: { id: string; title: string; deadline?: string; priority?: string };
      subtasks: Subtask[];
      timeZone?: string;
    };

    if (!subtasks?.length) {
      return NextResponse.json({ error: "No subtasks provided." }, { status: 400 });
    }

    const priority = (task.priority?.toLowerCase() || "medium") as Priority;
    const baseCap = (DAILY_CAP_MINUTES[priority] ?? 180) * MS_PER_MIN;
    const nowMs = Date.now();
    const deadlineMs = task.deadline
      ? new Date(task.deadline).getTime()
      : nowMs + 7 * MS_PER_DAY;

    if (deadlineMs <= nowMs) {
      return NextResponse.json({ error: "Deadline is in the past." }, { status: 400 });
    }

    const scored = scoreSubtasks(subtasks);
    const totalWorkMs = scored.reduce((s, t) => s + t.baseDurationMs, 0);
    const urgency = computeUrgency(nowMs, deadlineMs, totalWorkMs);

    const accessToken = await getGoogleAccessTokenForUser(supabase, user.id);
    const calendarBlocked = await fetchBusyIntervals(
      accessToken, new Date(nowMs), new Date(deadlineMs),
    );

    const outcome = scheduleAll(
      scored, baseCap, nowMs, deadlineMs, calendarBlocked, urgency, timeZone,
    );

    if ("error" in outcome) {
      return NextResponse.json({ error: outcome.error }, { status: 409 });
    }

    return NextResponse.json({
      scheduled: outcome.results,
      constraintLevel: outcome.relaxLevel,
    });
  } catch (err: unknown) {
    console.error("[schedule-subtasks]", err);
    const message = err instanceof Error ? err.message : "Scheduling failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
  