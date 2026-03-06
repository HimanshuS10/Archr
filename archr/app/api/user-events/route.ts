import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ──────────────────────────────────────────────────────────────
//  POST /api/user-events  →  create a new row
// ──────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();

    const { data, error } = await supabase
      .from("user_events")
      .insert({
        user_id: user.id,
        google_event_id: body.google_event_id ?? null,
        title: body.title,
        description: body.description ?? null,
        start_at: new Date(body.start).toISOString(),
        end_at: new Date(body.end ?? body.start).toISOString(),
        recurrence: body.recurrence ?? "none",
        custom_recurrence: body.custom_recurrence ?? null,
        travel_mins: body.travel_mins != null ? Number(body.travel_mins) : null,
        is_fixed: body.is_fixed ?? false,
        priority: body.priority ?? "medium",
      })
      .select()
      .single();

    if (error) {
      console.error("[user-events POST]", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save event.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
