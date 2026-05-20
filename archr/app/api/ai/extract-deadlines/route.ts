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
      { error: "Gemini API key not configured." },
      { status: 500 }
    );
  }

  try {
    const { url, content } = await request.json();

    let pageContent = content as string | undefined;

    if (url && !pageContent) {
      try {
        const res = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; ArchrBot/1.0)",
            Accept: "text/html,text/plain",
          },
          signal: AbortSignal.timeout(10_000),
        });
        if (!res.ok) {
          return NextResponse.json(
            { error: `Could not fetch the URL (HTTP ${res.status}). Try pasting the course content instead.` },
            { status: 400 }
          );
        }
        const html = await res.text();

        pageContent = html
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s{3,}/g, "\n")
          .trim()
          .slice(0, 20000);
      } catch {
        return NextResponse.json(
          { error: "Failed to fetch the URL. It may require a login or be unavailable. Try pasting the course content instead." },
          { status: 400 }
        );
      }
    }

    if (!pageContent || pageContent.trim().length < 20) {
      return NextResponse.json(
        { error: "No content to analyze. Provide a URL or paste course content." },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().slice(0, 10);

    const prompt = `
You are an academic assistant helping a student extract assignment deadlines from course material.

Today's date is ${today}.

Analyze the following course content and extract every assignment, quiz, exam, project, or deadline you can find.
For each one, determine a realistic deadline if it is clearly stated or strongly implied.

Return ONLY valid JSON — no markdown, no extra text — in this exact format:
{
  "deadlines": [
    {
      "title": "Assignment name",
      "deadline": "YYYY-MM-DDTHH:mm",
      "notes": "brief context or null"
    }
  ]
}

If no deadline date can be determined, use null for the deadline field.
If no assignments are found, return { "deadlines": [] }.

COURSE CONTENT:
${pageContent}
`.trim();

    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();

    const jsonStr = raw
      .replace(/^```json\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let parsed: {
      deadlines: {
        title: string;
        deadline: string | null;
        notes: string | null;
      }[];
    };

    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json(
        { error: "AI returned invalid JSON.", raw },
        { status: 500 }
      );
    }

    if (!Array.isArray(parsed.deadlines)) {
      return NextResponse.json(
        { error: "Unexpected AI response shape.", raw },
        { status: 500 }
      );
    }

    const normalized = parsed.deadlines
      .map((item) => ({
        title: typeof item.title === "string" ? item.title.trim() : "",
        deadline: typeof item.deadline === "string" ? item.deadline : null,
        notes: typeof item.notes === "string" ? item.notes : null,
      }))
      .filter((item) => item.title.length > 0);

    return NextResponse.json({ deadlines: normalized });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to extract deadlines.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
