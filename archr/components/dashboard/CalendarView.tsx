"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { supabase } from "@/lib/supabase";
import type { DateSelectArg, EventClickArg } from "@fullcalendar/core";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon } from "@hugeicons/core-free-icons";

type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end?: string;
};

export type CalendarHandle = {
  changeView: (view: "dayGridMonth" | "timeGridWeek" | "timeGridDay") => void;
  prev: () => void;
  next: () => void;
  today: () => void;
};

type CalendarViewProps = {
  onTitleChange?: (title: string) => void;
};

type RepeatValue =
  | "none"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "custom";
type CustomFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

const CalendarView = forwardRef<CalendarHandle, CalendarViewProps>(
  function CalendarView({ onTitleChange }, ref) {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [needsConnect, setNeedsConnect] = useState(false);
    const calendarRef = useRef<FullCalendar | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formTitle, setFormTitle] = useState("");
    const [formStart, setFormStart] = useState("");
    const [formEnd, setFormEnd] = useState("");
    const [saving, setSaving] = useState(false);
    const [formRepeat, setFormRepeat] = useState<RepeatValue>("none");
    const [formRepeatUntil, setFormRepeatUntil] = useState("");

    const [customFrequency, setCustomFrequency] =
      useState<CustomFrequency>("WEEKLY");
    const [customInterval, setCustomInterval] = useState("1");
    const [customByDay, setCustomByDay] = useState<string[]>([]);
    const [customByMonthDay, setCustomByMonthDay] = useState("");
    const [customCount, setCustomCount] = useState("");
    const [customEndMode, setCustomEndMode] = useState<
      "never" | "until" | "count"
    >("never");

    const weekdayOptions = [
      { label: "Mon", value: "MO" },
      { label: "Tue", value: "TU" },
      { label: "Wed", value: "WE" },
      { label: "Thu", value: "TH" },
      { label: "Fri", value: "FR" },
      { label: "Sat", value: "SA" },
      { label: "Sun", value: "SU" },
    ];
    const toggleDay = (day: string) => {
      setCustomByDay((prev) =>
        prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
      );
    };

    const handleConnect = useCallback(async () => {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          scopes: "https://www.googleapis.com/auth/calendar",
          queryParams: {
            access_type: "offline",
          },
        },
      });
    }, []);

    const openCreate = useCallback((info: DateSelectArg) => {
      setEditingId(null);
      setFormTitle("");
      setFormStart(info.startStr);
      setFormEnd(info.endStr ?? info.startStr);
      setIsModalOpen(true);
    }, []);

    const openEdit = useCallback((info: EventClickArg) => {
      const event = info.event;
      setEditingId(event.id);
      setFormTitle(event.title ?? "");
      setFormStart(event.start?.toISOString() ?? "");
      setFormEnd(event.end?.toISOString() ?? event.start?.toISOString() ?? "");
      setIsModalOpen(true);
    }, []);

    const closeModal = useCallback(() => {
      setIsModalOpen(false);
      setEditingId(null);
      setFormTitle("");
      setFormStart("");
      setFormEnd("");
    }, []);

    const loadEvents = useCallback(async () => {
      setLoading(true);
      setError(null);
      setNeedsConnect(false);

      try {
        const response = await fetch(
          "/api/google/events?maxResults=200&windowDays=120&pastDays=120",
        );

        if (!response.ok) {
          if (response.status === 401) {
            setNeedsConnect(true);
          }
          const payload = await response.json().catch(() => null);
          throw new Error(
            payload?.error ?? `Google Calendar API error (${response.status}).`,
          );
        }

        const payload = await response.json();
        const mapped: CalendarEvent[] = (payload.items || []).map(
          (item: any) => ({
            id: item.id,
            title: item.summary || "Untitled event",
            start: item.start?.dateTime || item.start?.date,
            end: item.end?.dateTime || item.end?.date,
          }),
        );

        setEvents(mapped);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Could not load events.";
        setError(message);
        console.error("Calendar load error:", err);
      } finally {
        setLoading(false);
      }
    }, []);

    const handleSave = useCallback(async () => {
      if (!formTitle || !formStart) return;
      setSaving(true);
      setError(null);

      const payload = {
        title: formTitle,
        start: formStart,
        end: formEnd || formStart,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        repeat: formRepeat,
        repeatUntil:
          formRepeat !== "none" && formRepeat !== "custom"
            ? formRepeatUntil || undefined
            : undefined,
        repeatCustom:
          formRepeat === "custom"
            ? {
                frequency: customFrequency,
                interval: Math.max(1, Number(customInterval || "1")),
                byDay: customByDay.length > 0 ? customByDay : undefined,
                byMonthDay: customByMonthDay
                  ? [Math.max(1, Math.min(31, Number(customByMonthDay)))]
                  : undefined,
                count: customCount ? Math.max(1, Number(customCount)) : undefined,
              }
            : undefined,
      };

      try {
        const url = editingId
          ? `/api/google/events/${editingId}`
          : "/api/google/events";
        const method = editingId ? "PATCH" : "POST";

        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          if (response.status === 401) {
            setNeedsConnect(true);
          }
          const body = await response.json().catch(() => null);
          throw new Error(body?.error ?? "Failed to save event.");
        }

        await response.json();
        await loadEvents();

        closeModal();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save event.");
      } finally {
        setSaving(false);
      }
    }, [
      editingId,
      formEnd,
      formStart,
      formTitle,
      formRepeat,
      formRepeatUntil,
      customFrequency,
      customInterval,
      customByDay,
      customByMonthDay,
      customCount,
      loadEvents,
      closeModal,
    ]);

    const handleDelete = useCallback(async () => {
      if (!editingId) {
        return;
      }

      setSaving(true);
      setError(null);

      try {
        const response = await fetch(`/api/google/events/${editingId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          if (response.status === 401) {
            setNeedsConnect(true);
          }

          const body = await response.json().catch(() => null);
          throw new Error(body?.error ?? "Failed to delete event.");
        }

        setEvents((prev) => prev.filter((event) => event.id !== editingId));
        closeModal();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to delete event.",
        );
      } finally {
        setSaving(false);
      }
    }, [editingId, closeModal]);

    useEffect(() => {
      loadEvents();
    }, [loadEvents]);

    useImperativeHandle(ref, () => ({
      changeView: (view) => {
        const api = calendarRef.current?.getApi();
        api?.changeView(view);
        if (api?.view?.title) onTitleChange?.(api.view.title);
      },
      prev: () => {
        const api = calendarRef.current?.getApi();
        api?.prev();
        if (api?.view?.title) onTitleChange?.(api.view.title);
      },
      next: () => {
        const api = calendarRef.current?.getApi();
        api?.next();
        if (api?.view?.title) onTitleChange?.(api.view.title);
      },
      today: () => {
        const api = calendarRef.current?.getApi();
        api?.today();
        if (api?.view?.title) onTitleChange?.(api.view.title);
      },
    }));

    return (
      <div className="archr-calendar h-full rounded-3xl border border-white/10 bg-[#131314] p-4 backdrop-blur-md">
        {/* <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Your Calendar</h2>
          <p className="text-sm text-white/60">Synced from Google Calendar</p>
        </div>
      </div> */}

        {loading ? (
          <div className="text-sm text-white/60">Loading events...</div>
        ) : needsConnect ? (
          <div className="space-y-3">
            <p className="text-sm text-white/70">
              Connect your Google Calendar to sync events. If this is your first
              time after the token migration, one reconnect may be required.
            </p>
            <button
              type="button"
              onClick={handleConnect}
              className="rounded-full bg-linear-to-b from-blue-400 via-blue-500 to-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 ring-1 ring-inset ring-white/20 transition hover:from-blue-300 hover:via-blue-400 hover:to-blue-500"
            >
              Connect Google Calendar
            </button>
          </div>
        ) : error ? (
          <div className="text-sm text-red-300">{error}</div>
        ) : (
          <div className="h-full">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={false}
              datesSet={(info) => onTitleChange?.(info.view.title)}
              events={events}
              selectable
              selectMirror
              select={openCreate}
              eventClick={openEdit}
              height="100%"
            />
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b0d16] p-6 text-white">
              <div className="flex item-center justify-between">
                <h3 className="text-lg font-semibold">
                  {editingId ? "Edit event" : "Add event"}
                </h3>
                <button type="button" onClick={handleDelete} disabled={saving}>
                  <HugeiconsIcon
                    icon={Delete02Icon}
                    className="text-gray-400 cursor-pointer"
                  />
                </button>{" "}
              </div>

              <div className="mt-4 grid gap-3">
                <div className="grid gap-1">
                  <label className="text-xs uppercase tracking-[0.3em] text-white/50">
                    Title
                  </label>
                  <input
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    placeholder="Event title"
                  />
                </div>
                <div className="grid gap-1">
                  <label className="text-xs uppercase tracking-[0.3em] text-white/50">
                    Start
                  </label>
                  <input
                    type="datetime-local"
                    value={formStart ? formStart.slice(0, 16) : ""}
                    onChange={(e) => setFormStart(e.target.value)}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
                <div className="grid gap-1">
                  <label className="text-xs uppercase tracking-[0.3em] text-white/50">
                    End
                  </label>
                  <input
                    type="datetime-local"
                    value={formEnd ? formEnd.slice(0, 16) : ""}
                    onChange={(e) => setFormEnd(e.target.value)}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>

                <div className="grid gap-1">
                  <label className="text-xs uppercase tracking-[0.3em] text-white/50">
                    Repeat
                  </label>
                  <select
                    value={formRepeat}
                    onChange={(e) =>
                      setFormRepeat(e.target.value as RepeatValue)
                    }
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  >
                    <option value="none">Does not repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                {formRepeat !== "none" ? (
                  <div className="grid gap-1">
                    <label className="text-xs uppercase tracking-[0.3em] text-white/50">
                      Repeat until
                    </label>
                    <input
                      type="date"
                      value={formRepeatUntil}
                      onChange={(e) => setFormRepeatUntil(e.target.value)}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                ) : null}
              </div>
              <div className="mt-5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-full bg-linear-to-b from-blue-400 via-blue-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 ring-1 ring-inset ring-white/20 transition hover:from-blue-300 hover:via-blue-400 hover:to-blue-500 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
);

export default CalendarView;
