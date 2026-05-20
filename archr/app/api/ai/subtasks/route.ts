import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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
      { error: "Gemini API key not configured. Add GEMINI_API_KEY to your .env.local." },
      { status: 500 }
    );
  }

  try {
    const {
      taskId,
      title,
      notes,
      assignment_text,
      deadline,
      estimated_minutes,
      priority,
    } = await request.json();

    if (!taskId || !title) {
      return NextResponse.json({ error: "taskId and title are required." }, { status: 400 });
    }

    const { data: taskRecord, error: taskErr } = await supabase
      .from("tasks")
      .select("assignment_text,file_name,file_url")
      .eq("id", taskId)
      .eq("user_id", user.id)
      .single();

    if (taskErr || !taskRecord) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    const hasAssignmentDescription = Boolean(taskRecord.assignment_text?.trim());
    const hasAssignmentFile = Boolean(taskRecord.file_name || taskRecord.file_url);
    if (!hasAssignmentDescription && !hasAssignmentFile) {
      return NextResponse.json(
        { error: "Subtasks can only be generated for tasks with an uploaded PDF/file or pasted assignment description." },
        { status: 400 }
      );
    }

    // ── Build the Gemini prompt ────────────────────────────────
    const deadlineStr = deadline
      ? `Deadline: ${new Date(deadline).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })}`
      : "";

    const estimatedStr = estimated_minutes
      ? `Estimated total time: ${estimated_minutes} minutes`
      : "";

    const prompt = `
You are an expert academic planner helping a student break down an assignment into clear, actionable subtasks.

TASK: ${title}
PRIORITY: ${priority ?? "medium"}
${deadlineStr}
${estimatedStr}
${notes ? `NOTES: ${notes}` : ""}
${assignment_text ? `ASSIGNMENT DETAILS:\n${assignment_text}` : ""}

Generate a list of 4–8 specific, actionable subtasks that will help complete this assignment.
Each subtask should:
- Be a concrete action (start with a verb like "Read", "Write", "Research", "Outline", "Review")
- Be completable in one focused work session
- Be ordered logically (earlier subtasks enable later ones)
- Include a realistic time estimate in minutes

Respond ONLY with valid JSON in this exact format, no markdown fences, no extra text:
{
  "subtasks": [
    { "title": "subtask title", "estimated_minutes": 30, "order": 1 },
    { "title": "subtask title", "estimated_minutes": 45, "order": 2 }
  ]
}
`.trim();

    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();

    // Strip any markdown fences Gemini might include despite instructions
    const jsonStr = raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();

    let parsed: { subtasks: { title: string; estimated_minutes: number; order: number }[] };
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json(
        { error: "Gemini returned invalid JSON.", raw },
        { status: 500 }
      );
    }

    if (!Array.isArray(parsed.subtasks)) {
      return NextResponse.json({ error: "Unexpected Gemini response shape.", raw }, { status: 500 });
    }

    // ── Save subtasks to Supabase ──────────────────────────────
    // Delete old AI-generated subtasks first (so re-generating replaces them)
    await supabase
      .from("subtasks")
      .delete()
      .eq("task_id", taskId)
      .eq("user_id", user.id)
      .eq("ai_generated", true);

    const rows = parsed.subtasks.map((s) => ({
      task_id: taskId,
      user_id: user.id,
      title: s.title,
      estimated_minutes: s.estimated_minutes ?? null,
      order: s.order ?? 0,
      status: "todo" as const,
      ai_generated: true,
    }));

    const { data, error } = await supabase
      .from("subtasks")
      .insert(rows)
      .select("id,task_id,user_id,title,estimated_minutes,order,status,ai_generated,created_at");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ subtasks: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate subtasks.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
