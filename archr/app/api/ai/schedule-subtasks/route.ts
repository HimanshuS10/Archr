import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGoogleAccessTokenForUser } from "@/lib/google-calendar-server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Gemini API key not configured." },
      { status: 500 },
    );
  }

  try {
    const { task, subtasks } = (await request.json()) as {
      task: {
        title: string;
        deadline: string;
        priority: string;
        notes?: string;
        estimated_minutes?: number;
      };
      subtasks: {
        id: string;
        title: string;
        estimated_minutes: number | null;
        order: number;
      }[];
    };

    if (!task?.title || !subtasks?.length) {
      return NextResponse.json(
        { error: "task and subtasks are required." },
        { status: 400 },
      );
    }

    // ── Fetch existing Google Calendar events ─────────────────
    let existingEvents: {
      summary: string;
      start: string;
      end: string;
    }[] = [];

    try {
      const accessToken = await getGoogleAccessTokenForUser(supabase, user.id);

      const now = new Date();
      const deadlineDate = task.deadline
        ? new Date(task.deadline)
        : new Date(now.getTime() + 14 * 86400000);

      const lookAhead = new Date(
        Math.max(deadlineDate.getTime(), now.getTime() + 7 * 86400000),
      );

      const response = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events" +
          `?singleEvents=true&orderBy=startTime` +
          `&maxResults=100` +
          `&timeMin=${encodeURIComponent(now.toISOString())}` +
          `&timeMax=${encodeURIComponent(lookAhead.toISOString())}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      if (response.ok) {
        const payload = await response.json();
        existingEvents = (payload.items || []).map((item: any) => ({
          summary: item.summary || "Untitled",
          start: item.start?.dateTime || item.start?.date || "",
          end: item.end?.dateTime || item.end?.date || "",
        }));
      }
    } catch {
      // If calendar fetch fails, continue without events -- LLM will schedule around nothing
    }

    // ── Build the Gemini prompt ──────────────────────────────
    const tz =
      Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";
    const nowISO = new Date().toISOString();

    const calendarBlock =
      existingEvents.length > 0
        ? existingEvents
            .map(
              (e) =>
                `- "${e.summary}" from ${e.start} to ${e.end}`,
            )
            .join("\n")
        : "No existing events found.";

    const subtasksBlock = subtasks
      .map(
        (s) =>
          `- order:${s.order} | id:"${s.id}" | "${s.title}" | ${s.estimated_minutes ?? 30} minutes`,
      )
      .join("\n");

    const prompt = `
You are an intelligent calendar scheduling assistant. Your job is to find the BEST time slots for study/work subtasks based on the user's existing calendar.

CURRENT TIME: ${nowISO}
TIMEZONE: ${tz}

PARENT TASK: "${task.title}"
PRIORITY: ${task.priority}
DEADLINE: ${task.deadline || "No hard deadline (schedule within the next 7 days)"}
${task.notes ? `NOTES: ${task.notes}` : ""}

EXISTING CALENDAR EVENTS (do NOT overlap with these):
${calendarBlock}

SUBTASKS TO SCHEDULE (in order):
${subtasksBlock}

SCHEDULING RULES:
1. NEVER overlap with existing calendar events. Leave at least 15 minutes buffer around existing events.
2. Schedule subtasks in their logical order (lower order numbers first, earlier in time).
3. Prefer scheduling during productive hours (8 AM - 9 PM in the user's timezone) unless the deadline is very tight.
4. Don't schedule more than 3 hours of consecutive work -- add at least a 30-minute break between long sessions.
5. Spread subtasks across multiple days when possible; avoid cramming everything into one day.
6. If the deadline is very close, it's okay to schedule later in the evening or squeeze gaps.
7. Each event duration must match the subtask's estimated_minutes exactly.
8. All scheduled times must be AFTER the current time.
9. Learn from the user's existing event patterns (when they typically have events, what times seem free).
10. IMPORTANT: All start and end times MUST be on clean 15-minute boundaries. Minutes must be exactly :00, :15, :30, or :45. Seconds must always be :00. For example 09:00, 09:15, 09:30, 09:45, 10:00 are valid. 09:07, 09:22, 10:03 are NOT valid. Round estimated_minutes up to the nearest 15-minute increment for the end time (e.g. 20 min task starting at 09:00 ends at 09:30, 45 min task starting at 10:00 ends at 10:45).

Respond ONLY with valid JSON in this exact format, no markdown fences, no extra text:
{
  "scheduled": [
    {
      "subtask_id": "the-subtask-id",
      "title": "subtask title",
      "start": "ISO 8601 datetime with minutes at :00/:15/:30/:45 and seconds :00",
      "end": "ISO 8601 datetime with minutes at :00/:15/:30/:45 and seconds :00",
      "reasoning": "brief reason for this time slot"
    }
  ]
}
`.trim();

    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();

    const jsonStr = raw
      .replace(/^```json\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let parsed: {
      scheduled: {
        subtask_id: string;
        title: string;
        start: string;
        end: string;
        reasoning: string;
      }[];
    };

    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json(
        { error: "Gemini returned invalid JSON.", raw },
        { status: 500 },
      );
    }

    if (!Array.isArray(parsed.scheduled)) {
      return NextResponse.json(
        { error: "Unexpected Gemini response shape.", raw },
        { status: 500 },
      );
    }

    // Snap every time to the nearest 15-minute boundary as a safeguard
    const snapTo15 = (iso: string) => {
      const d = new Date(iso);
      const mins = d.getMinutes();
      const snapped = Math.round(mins / 15) * 15;
      d.setMinutes(snapped, 0, 0);
      return d.toISOString();
    };

    const snapped = parsed.scheduled.map((s) => ({
      ...s,
      start: snapTo15(s.start),
      end: snapTo15(s.end),
    }));

    return NextResponse.json({ scheduled: snapped });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to schedule subtasks.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
