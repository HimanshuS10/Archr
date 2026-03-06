import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();

    const updates: Record<string, unknown> = {};


    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description ?? null;
    if (body.start !== undefined) updates.start_at = new Date(body.start).toISOString();
    if (body.end !== undefined) updates.end_at = new Date(body.end).toISOString();
    if (body.recurrence !== undefined) updates.recurrence = body.recurrence;
    if (body.custom_recurrence !== undefined) updates.custom_recurrence = body.custom_recurrence ?? null;
    if (body.travel_mins !== undefined) updates.travel_mins = body.travel_mins != null ? Number(body.travel_mins) : null;
    if (body.is_fixed !== undefined) updates.is_fixed = body.is_fixed;
    if (body.priority !== undefined) updates.priority = body.priority;
    if (body.google_event_id !== undefined) updates.google_event_id = body.google_event_id ?? null;

    const { data, error } = await supabase
      .from("user_events")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("[user-events PATCH]", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update event.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

  const { error } = await supabase
    .from("user_events")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("[user-events DELETE]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
