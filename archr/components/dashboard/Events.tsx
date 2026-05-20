"use client";

import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar01Icon,
  Clock01Icon,
  Add01Icon,
  PencilEdit01Icon,
  Delete01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";

type EventsProp = {
  isExpanded: boolean;
};

type Recurrence = "none" | "daily" | "weekly" | "monthly" | "custom";
type Priority = "low" | "medium" | "high";

type GoogleEvent = {
  id: string;          // Google Calendar event ID
  supabaseId?: string; // Supabase user_events row ID (if saved)
  title: string;
  start: string;
  end: string;
  colorId?: string;
  description?: string;
  recurrence?: Recurrence;
  travelMins?: number;
  isFixed?: boolean;
  priority?: Priority;
  customRecurrence?: string;
};

const DEFAULT_MAX_RESULTS = 1000;
const DEFAULT_WINDOW_DAYS = 365;
const DEFAULT_PAST_DAYS = 365;

const EVENT_COLOR_OPTIONS = [
  { id: "1", label: "Lavender", hex: "#7986cb" },
  { id: "2", label: "Sage", hex: "#33b679" },
  { id: "3", label: "Grape", hex: "#8e24aa" },
  { id: "4", label: "Flamingo", hex: "#e67c73" },
  { id: "5", label: "Banana", hex: "#f6c026" },
  { id: "6", label: "Tangerine", hex: "#f5511d" },
  { id: "7", label: "Peacock", hex: "#039be5" },
  { id: "8", label: "Graphite", hex: "#616161" },
  { id: "9", label: "Blueberry", hex: "#3f51b5" },
  { id: "10", label: "Basil", hex: "#0b8043" },
  { id: "11", label: "Tomato", hex: "#d60000" },
] as const;

const EVENT_COLOR_BY_ID = Object.fromEntries(
  EVENT_COLOR_OPTIONS.map((item) => [item.id, item.hex]),
);

function toDatetimeLocal(value?: string) {
  if (!value) return "";
  return value.slice(0, 16);
}

function isSameDay(dateA: Date, dateB: Date) {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  // All-day events come as YYYY-MM-DD (no time)
  if (iso.length === 10) return "All day";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(start: string, end: string) {
  if (start.length === 10) return "All day";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function formatDateHeading(date: Date) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, tomorrow)) return "Tomorrow";
  return date.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

const Events = ({ isExpanded }: EventsProp) => {
  const [events, setEvents] = useState<GoogleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConnect, setNeedsConnect] = useState(false);

  // Selected date (default today)
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formStart, setFormStart] = useState("");
  const [formEnd, setFormEnd] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formColorId, setFormColorId] = useState("");
  // AI metadata fields
  const [formRecurrence, setFormRecurrence] = useState<Recurrence>("none");
  const [formCustomRecurrence, setFormCustomRecurrence] = useState("");
  const [formTravelMins, setFormTravelMins] = useState("");
  const [formIsFixed, setFormIsFixed] = useState(false);
  const [formPriority, setFormPriority] = useState<Priority>("medium");

  // Events filtered to selected date, sorted by start time
  const dayEvents = useMemo(() => {
    return [...events]
      .filter((e) => isSameDay(new Date(e.start), selectedDate))
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }, [events, selectedDate]);

  const handleConnect = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        scopes: "https://www.googleapis.com/auth/calendar",
        queryParams: {
          access_type: "offline",
          prompt: "consent",
          include_granted_scopes: "true",
        },
      },
    });
  }, []);

  const resetForm = () => {
    setFormTitle("");
    setFormStart("");
    setFormEnd("");
    setFormDescription("");
    setFormColorId("");
    setFormRecurrence("none");
    setFormCustomRecurrence("");
    setFormTravelMins("");
    setFormIsFixed(false);
    setFormPriority("medium");
    setEditingId(null);
  };

  // Parse AI metadata stored in description JSON block
  const parseMetaFromDescription = (raw: string) => {
    const match = raw.match(/<!--archr:([\s\S]*?):archr-->/);
    if (!match) return { userDesc: raw, meta: {} };
    try {
      return { userDesc: raw.replace(/\s*<!--archr:[\s\S]*?:archr-->/, "").trim(), meta: JSON.parse(match[1]) };
    } catch {
      return { userDesc: raw, meta: {} };
    }
  };

  const buildDescription = (userDesc: string, meta: Record<string, unknown>) => {
    const metaStr = JSON.stringify(meta);
    return userDesc ? `${userDesc}\n<!--archr:${metaStr}:archr-->` : `<!--archr:${metaStr}:archr-->`;
  };

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNeedsConnect(false);

    try {
      const response = await fetch(
        `/api/google/events?maxResults=${DEFAULT_MAX_RESULTS}&windowDays=${DEFAULT_WINDOW_DAYS}&pastDays=${DEFAULT_PAST_DAYS}`,
      );

      if (!response.ok) {
        if (response.status === 401) setNeedsConnect(true);
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? `Failed to fetch events (${response.status}).`);
      }

      const payload = await response.json();
      const mapped: GoogleEvent[] = (payload.items || [])
        .filter((item: { start?: { dateTime?: string; date?: string } }) =>
          !!(item.start?.dateTime || item.start?.date)
        )
        .map(
          (item: {
            id: string;
            summary?: string;
            description?: string;
            colorId?: string;
            start: { dateTime?: string; date?: string };
            end: { dateTime?: string; date?: string };
          }) => ({
            id: item.id,
            title: item.summary || "Untitled event",
            start: item.start.dateTime || item.start.date || "",
            end: item.end?.dateTime || item.end?.date || item.start.dateTime || item.start.date || "",
            colorId: item.colorId ? String(item.colorId) : undefined,
            description: item.description || "",
          })
        );

      setEvents(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load events.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const shiftDay = (delta: number) => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + delta);
      return next;
    });
  };

  const openCreate = () => {
    const base = new Date(selectedDate);
    base.setHours(new Date().getHours(), 0, 0, 0);
    const end = new Date(base.getTime() + 60 * 60 * 1000);
    setFormStart(base.toISOString().slice(0, 16));
    setFormEnd(end.toISOString().slice(0, 16));
    setIsModalOpen(true);
  };

  const openEdit = (event: GoogleEvent) => {
    setEditingId(event.id);
    setFormTitle(event.title);
    setFormStart(toDatetimeLocal(event.start));
    setFormEnd(toDatetimeLocal(event.end));
    setFormColorId(event.colorId ?? "");
    const { userDesc, meta } = parseMetaFromDescription(event.description ?? "");
    setFormDescription(userDesc);
    setFormRecurrence((meta.recurrence as Recurrence) ?? "none");
    setFormCustomRecurrence((meta.customRecurrence as string) ?? "");
    setFormTravelMins(meta.travelMins != null ? String(meta.travelMins) : "");
    setFormIsFixed((meta.isFixed as boolean) ?? false);
    setFormPriority((meta.priority as Priority) ?? "medium");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSave = async () => {
    if (!formTitle || !formStart) return;
    setSaving(true);
    setError(null);

    try {
      const meta: Record<string, unknown> = {
        recurrence: formRecurrence,
        isFixed: formIsFixed,
        priority: formPriority,
      };
      if (formRecurrence === "custom" && formCustomRecurrence.trim())
        meta.customRecurrence = formCustomRecurrence.trim();
      if (formTravelMins && Number(formTravelMins) > 0)
        meta.travelMins = Number(formTravelMins);

      const fullDescription = buildDescription(formDescription, meta);

      const gcalPayload = {
        title: formTitle,
        start: formStart,
        end: formEnd || formStart,
        description: fullDescription || undefined,
        colorId: formColorId || undefined,
      };

      const supabasePayload = {
        google_event_id: editingId ?? null,
        title: formTitle,
        description: formDescription || null,
        start: formStart,
        end: formEnd || formStart,
        recurrence: formRecurrence,
        custom_recurrence: formRecurrence === "custom" ? formCustomRecurrence.trim() || null : null,
        travel_mins: formTravelMins && Number(formTravelMins) > 0 ? Number(formTravelMins) : null,
        is_fixed: formIsFixed,
        priority: formPriority,
      };

      // Find existing supabase row id (if editing)
      const editingEvent = editingId ? events.find((e) => e.id === editingId) : null;
      const existingSupabaseId = editingEvent?.supabaseId;

      // Fire both APIs in parallel
      const gcalUrl = editingId ? `/api/google/events/${editingId}` : "/api/google/events";
      const gcalMethod = editingId ? "PATCH" : "POST";

      const supabaseUrl = existingSupabaseId
        ? `/api/user-events/${existingSupabaseId}`
        : "/api/user-events";
      const supabaseMethod = existingSupabaseId ? "PATCH" : "POST";

      const [gcalRes, supabaseRes] = await Promise.all([
        fetch(gcalUrl, {
          method: gcalMethod,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(gcalPayload),
        }),
        fetch(supabaseUrl, {
          method: supabaseMethod,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(supabasePayload),
        }),
      ]);

      if (!gcalRes.ok) {
        if (gcalRes.status === 401) setNeedsConnect(true);
        const body = await gcalRes.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to save event to Google Calendar.");
      }

      const saved = await gcalRes.json();
      const supabaseRow = supabaseRes.ok ? await supabaseRes.json().catch(() => null) : null;

      const mapped: GoogleEvent = {
        id: saved.id,
        supabaseId: supabaseRow?.id ?? existingSupabaseId,
        title: saved.summary || "Untitled event",
        start: saved.start?.dateTime || saved.start?.date,
        end: saved.end?.dateTime || saved.end?.date,
        description: saved.description || "",
        colorId: saved.colorId ? String(saved.colorId) : undefined,
      };

      setEvents((prev) =>
        editingId ? prev.map((e) => (e.id === editingId ? mapped : e)) : [mapped, ...prev]
      );
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save event.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    const eventToDelete = events.find((e) => e.id === id);
    try {
      const calls: Promise<Response>[] = [
        fetch(`/api/google/events/${id}`, { method: "DELETE" }),
      ];
      // Also delete from Supabase if we have a row ID
      if (eventToDelete?.supabaseId) {
        calls.push(fetch(`/api/user-events/${eventToDelete.supabaseId}`, { method: "DELETE" }));
      }

      const [gcalRes] = await Promise.all(calls);

      if (!gcalRes.ok) {
        if (gcalRes.status === 401) setNeedsConnect(true);
        const body = await gcalRes.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to delete event.");
      }
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete event.");
    }
  };

  return (
    <main
      className="min-h-screen bg-slate-50/50 px-5 pt-4 pb-5 transition-[margin] duration-300"
      style={{ marginLeft: isExpanded ? 200 : 56 }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold text-slate-900">Events</h1>
          <p className="mt-0.5 text-xs text-slate-400">Your schedule, day by day.</p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-md bg-linear-to-b from-blue-400 via-blue-500 to-blue-600 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-inset ring-white/20 transition hover:from-blue-300 hover:via-blue-400 hover:to-blue-500 hover:cursor-pointer"
        >
          <HugeiconsIcon icon={Add01Icon} className="h-3.5 w-3.5" />
          New Event
        </button>
      </div>

      <div className="mt-2.5 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => shiftDay(-1)}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:cursor-pointer"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="h-3.5 w-3.5" />
        </button>

        <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1.5">
          <HugeiconsIcon icon={Calendar01Icon} className="h-3.5 w-3.5 text-blue-500" />
          <span className="text-xs font-semibold text-slate-900">
            {formatDateHeading(selectedDate)}
          </span>
          <span className="text-[11px] text-slate-400">
            {selectedDate.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>

        <button
          type="button"
          onClick={() => shiftDay(1)}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:cursor-pointer"
        >
          <HugeiconsIcon icon={ArrowRight01Icon} className="h-3.5 w-3.5" />
        </button>

        {/* Jump to today */}
        <button
          type="button"
          onClick={() => {
            const t = new Date();
            t.setHours(0, 0, 0, 0);
            setSelectedDate(t);
          }}
          disabled={isSameDay(selectedDate, new Date())}
          className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-slate-100 hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          Today
        </button>
      </div>

      {/* ── Event list ── */}
      <div className="mt-3">
        {loading ? (
          <div className="flex h-40 items-center justify-center gap-2 text-xs text-slate-400">
            <HugeiconsIcon icon={Clock01Icon} className="h-3.5 w-3.5" />
            Loading events...
          </div>
        ) : needsConnect ? (
          <div className="flex h-56 flex-col items-center justify-center gap-2.5 rounded-lg border border-dashed border-slate-200 bg-white text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
              <HugeiconsIcon icon={Calendar01Icon} className="h-5 w-5 text-slate-400" />
            </div>
            <p className="max-w-sm text-xs text-slate-500">
              Connect your Google Calendar to view and manage your events.
            </p>
            <button
              type="button"
              onClick={handleConnect}
              className="rounded-md bg-linear-to-b from-blue-400 via-blue-500 to-blue-600 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-inset ring-white/20 transition hover:from-blue-300 hover:via-blue-400 hover:to-blue-500"
            >
              Connect Google Calendar
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {error}
              </div>
            )}

            {dayEvents.length === 0 ? (
              <div className="flex h-56 flex-col items-center justify-center gap-2.5 rounded-lg border border-dashed border-slate-200 bg-white text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                  <HugeiconsIcon icon={Calendar01Icon} className="h-5 w-5 text-slate-400" />
                </div>
                <p className="text-xs text-slate-500">No events for this day.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <div className="grid grid-cols-[5rem_1fr_4rem] items-center gap-2 border-b border-slate-100 bg-slate-50 px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  <span>Time</span>
                  <span>Event</span>
                  <span className="text-right">Actions</span>
                </div>
                <ul className="divide-y divide-slate-100">
                  {dayEvents.map((event) => (
                    <li key={event.id} className="group transition-colors hover:bg-slate-50/70">
                      <div className="grid grid-cols-[5rem_1fr_4rem] items-center gap-2 px-2.5 py-1.5">
                        <div className="min-w-0">
                          <p className="truncate text-[10px] font-medium text-slate-500">{formatTime(event.start)}</p>
                          <p className="mt-0.5 text-[10px] text-slate-400">{formatDuration(event.start, event.end)}</p>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="h-1.5 w-1.5 shrink-0 rounded-full"
                              style={{ backgroundColor: EVENT_COLOR_BY_ID[event.colorId ?? ""] ?? "#bfdbfe" }}
                            />
                            <p className="truncate text-xs font-medium text-slate-700">{event.title}</p>
                          </div>
                          {event.description ? (
                            <p className="mt-0.5 line-clamp-1 text-[10px] text-slate-400">{event.description}</p>
                          ) : null}
                        </div>

                        <div className="flex items-center justify-end gap-0.5">
                          <button
                            type="button"
                            onClick={() => openEdit(event)}
                            className="inline-flex h-5 w-5 items-center justify-center rounded text-slate-300 transition hover:bg-slate-100 hover:text-slate-600 hover:cursor-pointer"
                            aria-label="Edit event"
                          >
                            <HugeiconsIcon icon={PencilEdit01Icon} className="h-2.5 w-2.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(event.id)}
                            className="inline-flex h-5 w-5 items-center justify-center rounded text-slate-300 transition hover:bg-red-50 hover:text-red-500 hover:cursor-pointer"
                            aria-label="Delete event"
                          >
                            <HugeiconsIcon icon={Delete01Icon} className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-slate-900">
              {editingId ? "Edit Event" : "New Event"}
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">Extra details help the AI schedule smarter.</p>

            <div className="mt-4 grid gap-3">

              {/* Title */}
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Event name</label>
                <input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Team standup"
                  className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Start / End row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Start</label>
                  <input
                    type="datetime-local"
                    value={formStart}
                    onChange={(e) => setFormStart(e.target.value)}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">End</label>
                  <input
                    type="datetime-local"
                    value={formEnd}
                    onChange={(e) => setFormEnd(e.target.value)}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Description <span className="normal-case tracking-normal text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Add details..."
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                />
              </div>

              <div className="grid gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Event color
                </label>
                <select
                  value={formColorId}
                  onChange={(e) => setFormColorId(e.target.value)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">Default</option>
                  {EVENT_COLOR_OPTIONS.map((color) => (
                    <option key={color.id} value={color.id}>
                      {color.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 pt-1">
                <span className="h-px flex-1 bg-slate-100" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">AI Context</span>
                <span className="h-px flex-1 bg-slate-100" />
              </div>

              {/* Recurrence */}
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Repeats</label>
                <div className="flex flex-wrap gap-2">
                  {(["none", "daily", "weekly", "monthly", "custom"] as Recurrence[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setFormRecurrence(r)}
                      className={`rounded-full border px-3.5 py-1.5 text-xs font-medium capitalize transition hover:cursor-pointer ${formRecurrence === r
                        ? "border-blue-500 bg-blue-50 text-blue-600"
                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                        }`}
                    >
                      {r === "none" ? "One-time" : r}
                    </button>
                  ))}
                </div>
                {formRecurrence === "custom" && (
                  <input
                    value={formCustomRecurrence}
                    onChange={(e) => setFormCustomRecurrence(e.target.value)}
                    placeholder="e.g. Every other Tuesday, first Monday of month..."
                    className="mt-1.5 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                )}
              </div>

              {/* Travel time + Fixed event row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Travel / commute
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="300"
                      value={formTravelMins}
                      onChange={(e) => setFormTravelMins(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-full border border-slate-200 bg-white px-4 py-2.5 pr-14 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">min</span>
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Priority</label>
                  <div className="flex gap-2">
                    {(["low", "medium", "high"] as Priority[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setFormPriority(p)}
                        className={`flex-1 rounded-full border px-2 py-1.5 text-xs font-medium capitalize transition hover:cursor-pointer ${formPriority === p
                          ? p === "high"
                            ? "border-red-400 bg-red-50 text-red-600"
                            : p === "medium"
                              ? "border-amber-400 bg-amber-50 text-amber-600"
                              : "border-emerald-400 bg-emerald-50 text-emerald-600"
                          : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50"
                          }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Fixed event toggle */}
              <button
                type="button"
                onClick={() => setFormIsFixed((v) => !v)}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition hover:cursor-pointer ${formIsFixed
                  ? "border-blue-200 bg-blue-50"
                  : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
              >
                {/* Toggle pill */}
                <span
                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${formIsFixed ? "bg-blue-500" : "bg-slate-200"
                    }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${formIsFixed ? "translate-x-[18px]" : "translate-x-[3px]"
                      }`}
                  />
                </span>
                <span className="text-sm">
                  <span className={`font-medium ${formIsFixed ? "text-blue-700" : "text-slate-700"}`}>
                    Fixed event
                  </span>
                  <span className="ml-1.5 text-xs text-slate-400">
                    {formIsFixed ? "Cannot be moved by the AI" : "AI can reschedule if needed"}
                  </span>
                </span>
              </button>

            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!formTitle.trim() || !formStart || saving}
                className="rounded-full bg-linear-to-b from-blue-500 via-blue-600 to-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 ring-1 ring-inset ring-white/20 transition hover:from-blue-400 hover:via-blue-500 hover:to-blue-600 disabled:cursor-not-allowed disabled:opacity-60 hover:cursor-pointer"
              >
                {saving ? "Saving..." : editingId ? "Save changes" : "Add event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Events;