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
  colorId?: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
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
  EVENT_COLOR_OPTIONS.map((item) => [item.id, item]),
);

const withOpacity = (hex: string, opacity: number) => {
  const clean = hex.replace("#", "");
  const value = Number.parseInt(clean, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

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
    const [formColorId, setFormColorId] = useState<string>("");
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
            prompt: "consent",
            include_granted_scopes: "true",
          },
        },
      });
    }, []);

    const openCreate = useCallback((info: DateSelectArg) => {
      setEditingId(null);
      setFormTitle("");
      setFormStart(info.startStr);
      setFormEnd(info.endStr ?? info.startStr);
      setFormColorId("");
      setIsModalOpen(true);
    }, []);

    const openEdit = useCallback((info: EventClickArg) => {
      const event = info.event;
      setEditingId(event.id);
      setFormTitle(event.title ?? "");
      setFormStart(event.start?.toISOString() ?? "");
      setFormEnd(event.end?.toISOString() ?? event.start?.toISOString() ?? "");
      setFormColorId(
        String((event.extendedProps?.colorId as string | undefined) ?? ""),
      );
      setIsModalOpen(true);
    }, []);

    const closeModal = useCallback(() => {
      setIsModalOpen(false);
      setEditingId(null);
      setFormTitle("");
      setFormStart("");
      setFormEnd("");
      setFormColorId("");
    }, []);

    const loadEvents = useCallback(async () => {
      setLoading(true);
      setError(null);
      setNeedsConnect(false);

      try {
        const response = await fetch(
          "/api/google/events?maxResults=10000&windowDays=0&pastDays=365",
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
        const mapped: CalendarEvent[] = (payload.items || [])
          .filter(
            (item: {
              status?: string;
              start?: { dateTime?: string; date?: string };
            }) =>
              item?.status !== "cancelled" &&
              Boolean(item?.start?.dateTime || item?.start?.date),
          )
          .map(
          (item: {
            id: string;
            summary?: string;
            colorId?: string;
            start?: { dateTime?: string; date?: string };
            end?: { dateTime?: string; date?: string };
          }) => ({
            ...(EVENT_COLOR_BY_ID[String(item.colorId)]
              ? {
                  backgroundColor: withOpacity(
                    EVENT_COLOR_BY_ID[String(item.colorId)].hex,
                    0.15,
                  ),
                  borderColor: withOpacity(
                    EVENT_COLOR_BY_ID[String(item.colorId)].hex,
                    0.55,
                  ),
                  textColor: "#1e293b",
                }
              : {}),
            id: item.id,
            title: item.summary || "Untitled event",
            start: item.start?.dateTime || item.start?.date,
            end: item.end?.dateTime || item.end?.date,
            colorId: item.colorId ? String(item.colorId) : undefined,
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
        colorId: formColorId || undefined,
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
      formColorId,
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
      <div className="archr-calendar h-full">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Loading calendar…
          </div>
        ) : needsConnect ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <p className="max-w-xs text-sm text-slate-500">
              Connect your Google Calendar to sync events.
            </p>
            <button
              type="button"
              onClick={handleConnect}
              className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Connect Google Calendar
            </button>
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center text-sm text-red-400">{error}</div>
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
              slotDuration="01:00:00"
              slotLabelInterval="01:00:00"
              scrollTime="08:00:00"
              nowIndicator
              height="100%"
            />
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/60">

              {/* Modal header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  {editingId ? "Edit event" : "New event"}
                </h3>
                <div className="flex items-center gap-1">
                  {editingId && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={saving}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                      title="Delete event"
                    >
                      <HugeiconsIcon icon={Delete02Icon} className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal body */}
              <div className="px-5 py-4 grid gap-3">
                <div className="grid gap-1.5">
                  <label className="text-xs font-medium text-slate-500">Title</label>
                  <input
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition"
                    placeholder="Event title"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-1.5">
                    <label className="text-xs font-medium text-slate-500">Start</label>
                    <input
                      type="datetime-local"
                      value={formStart ? formStart.slice(0, 16) : ""}
                      onChange={(e) => setFormStart(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <label className="text-xs font-medium text-slate-500">End</label>
                    <input
                      type="datetime-local"
                      value={formEnd ? formEnd.slice(0, 16) : ""}
                      onChange={(e) => setFormEnd(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-1.5">
                    <label className="text-xs font-medium text-slate-500">Repeat</label>
                    <select
                      value={formRepeat}
                      onChange={(e) => setFormRepeat(e.target.value as RepeatValue)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition"
                    >
                      <option value="none">No repeat</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div className="grid gap-1.5">
                    <label className="text-xs font-medium text-slate-500">Color</label>
                    <select
                      value={formColorId}
                      onChange={(e) => setFormColorId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition"
                    >
                      <option value="">Default</option>
                      {EVENT_COLOR_OPTIONS.map((color) => (
                        <option key={color.id} value={color.id}>{color.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {formRepeat !== "none" && (
                  <div className="grid gap-1.5">
                    <label className="text-xs font-medium text-slate-500">Repeat until</label>
                    <input
                      type="date"
                      value={formRepeatUntil}
                      onChange={(e) => setFormRepeatUntil(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition"
                    />
                  </div>
                )}
              </div>

              {/* Modal footer */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {saving ? "Saving…" : editingId ? "Save changes" : "Add event"}
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
