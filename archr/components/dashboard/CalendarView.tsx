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
import type { DateSelectArg, EventClickArg, EventContentArg, EventDropArg } from "@fullcalendar/core";
import type { EventResizeDoneArg } from "@fullcalendar/interaction";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Delete02Icon,
  SquareLock02Icon,
  SquareUnlock02Icon,
} from "@hugeicons/core-free-icons";
import { EVENT_COLOR_OPTIONS, EVENT_COLOR_BY_ID, withOpacity, getPastelColor } from "@/lib/calendar-colors";
import type { InitialCalendarEvent } from "@/lib/calendar-events-server";

type CalendarEvent = InitialCalendarEvent;

export type CalendarHandle = {
  changeView: (view: "dayGridMonth" | "timeGridWeek" | "timeGridDay") => void;
  prev: () => void;
  next: () => void;
  today: () => void;
  refetchEvents: () => void;
};

type CalendarViewProps = {
  onTitleChange?: (title: string) => void;
  initialEvents?: InitialCalendarEvent[];
  onEventSaved?: () => void;
};

type RepeatValue =
  | "none"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "custom";
type CustomFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

function formatEventTime(date: Date | null): string {
  if (!date) return "";
  return date
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    .toLowerCase();
}

function EventContent({ arg }: { arg: EventContentArg }) {
  const isLocked = arg.event.extendedProps?.locked as boolean | undefined;
  const start = arg.event.start;
  const end = arg.event.end;
  const timeStr =
    start && end
      ? `${formatEventTime(start)} – ${formatEventTime(end)}`
      : start
      ? formatEventTime(start)
      : "";

  return (
    <div className="relative flex h-full flex-col overflow-hidden px-2 py-1.5 gap-0.5">
      {/* Jail-bar overlay for locked events */}
      {isLocked && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,0.055) 5px, rgba(0,0,0,0.055) 6px)",
          }}
        />
      )}

      <div className="relative flex items-start justify-between gap-1 min-w-0">
        <span className="truncate text-[11px] font-semibold leading-snug">
          {arg.event.title}
        </span>
        <span className="shrink-0 text-[12px] leading-none opacity-40">···</span>
      </div>
      <div className="relative text-[10px] leading-none opacity-60 truncate">{timeStr}</div>

      {isLocked && (
        <div className="relative mt-auto inline-flex w-fit items-center gap-1 rounded-full bg-white/80 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">
          <svg className="h-2.5 w-2.5 shrink-0 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          Locked
        </div>
      )}
    </div>
  );
}

const CalendarView = forwardRef<CalendarHandle, CalendarViewProps>(
  function CalendarView({ onTitleChange, initialEvents, onEventSaved }, ref) {
    const [events, setEvents] = useState<CalendarEvent[]>(initialEvents ?? []);
    const [loading, setLoading] = useState(!initialEvents || initialEvents.length === 0);
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
    const [formLocked, setFormLocked] = useState(false);
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
      setFormLocked(false);
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
      setFormLocked(Boolean(event.extendedProps?.locked));
      setIsModalOpen(true);
    }, []);

    const closeModal = useCallback(() => {
      setIsModalOpen(false);
      setEditingId(null);
      setFormTitle("");
      setFormStart("");
      setFormEnd("");
      setFormColorId("");
      setFormLocked(false);
    }, []);

    const loadEvents = useCallback(async (silent = false) => {
      if (!silent) setLoading(true);
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
            extendedProperties?: { private?: Record<string, string> };
          }) => {
            const isLocked = item.extendedProperties?.private?.locked === "true";
            const colorEntry = EVENT_COLOR_BY_ID[String(item.colorId)];
            const pastel = !colorEntry ? getPastelColor(item.id) : null;
            return {
              ...(colorEntry
                ? {
                    backgroundColor: withOpacity(colorEntry.hex, 0.15),
                    borderColor: withOpacity(colorEntry.hex, 0.4),
                    textColor: colorEntry.hex,
                  }
                : pastel
                ? {
                    backgroundColor: pastel.bg,
                    borderColor: pastel.border,
                    textColor: pastel.text,
                  }
                : {}),
              id: item.id,
              title: item.summary || "Untitled event",
              start: item.start?.dateTime || item.start?.date,
              end: item.end?.dateTime || item.end?.date,
              classNames: isLocked ? ["fc-event-locked"] : [],
              extendedProps: {
                colorId: item.colorId ? String(item.colorId) : undefined,
                locked: isLocked,
              },
            };
          },
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
        locked: formLocked,
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
        await loadEvents(true); // silent — no loading flash
        onEventSaved?.();

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
      formLocked,
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

    // Shared helper — PATCHes a moved/resized event and reverts on failure
    const persistEventChange = useCallback(
      async (
        event: EventDropArg["event"] | EventResizeDoneArg["event"],
        revert: () => void,
      ) => {
        if (!event.start) { revert(); return; }

        const start = event.start.toISOString();
        const end   = (event.end ?? event.start).toISOString();

        try {
          const res = await fetch(`/api/google/events/${event.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title:    event.title,
              start,
              end,
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
              locked:   Boolean(event.extendedProps?.locked),
            }),
          });

          if (!res.ok) {
            revert();
            return;
          }

          // Keep React state in sync so background refreshes don't flicker
          setEvents((prev) =>
            prev.map((e) => (e.id === event.id ? { ...e, start, end } : e)),
          );

          // Trigger conflict check in case the move created an overlap
          onEventSaved?.();
        } catch {
          revert();
        }
      },
      [onEventSaved],
    );

    const handleEventDrop = useCallback(
      (info: EventDropArg) => persistEventChange(info.event, info.revert),
      [persistEventChange],
    );

    const handleEventResize = useCallback(
      (info: EventResizeDoneArg) => persistEventChange(info.event, info.revert),
      [persistEventChange],
    );

    useEffect(() => {
      // Skip the initial fetch if the server already provided events
      if (initialEvents && initialEvents.length > 0) return;
      loadEvents();
    }, [loadEvents, initialEvents]);

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
      refetchEvents: () => {
        loadEvents();
      },
    }));

    return (
      <div className="archr-calendar h-full rounded-2xl border border-gray-100 bg-white p-4">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">Loading events...</div>
        ) : needsConnect ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <p className="max-w-xs text-sm text-gray-500">
              Connect your Google Calendar to sync events.
            </p>
            <button
              type="button"
              onClick={handleConnect}
              className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              Connect Google Calendar
            </button>
          </div>
        ) : error ? (
          <div className="text-sm text-red-500">{error}</div>
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
              editable
              eventStartEditable
              eventDurationEditable
              eventAllow={(_, draggedEvent) => {
                return !draggedEvent?.extendedProps?.locked;
              }}
              eventDrop={handleEventDrop}
              eventResize={handleEventResize}
              slotDuration="01:00:00"
              slotLabelInterval="01:00:00"
              scrollTime="00:00:00"
              expandRows
              nowIndicator
              eventContent={(arg) => <EventContent arg={arg} />}
              select={openCreate}
              eventClick={openEdit}
              height="100%"
            />
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl shadow-gray-200/50">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900">
                  {editingId ? "Edit event" : "New event"}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFormLocked((prev) => !prev)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition hover:cursor-pointer ${
                      formLocked
                        ? "bg-amber-50 text-amber-600 ring-1 ring-amber-200"
                        : "bg-gray-50 text-gray-400 ring-1 ring-gray-200 hover:text-gray-600"
                    }`}
                    title={formLocked ? "Unlock event" : "Lock event"}
                  >
                    <HugeiconsIcon
                      icon={formLocked ? SquareLock02Icon : SquareUnlock02Icon}
                      className="h-3.5 w-3.5"
                    />
                    {formLocked ? "Locked" : "Lock"}
                  </button>
                  {editingId && (
                    <button type="button" onClick={handleDelete} disabled={saving}>
                      <HugeiconsIcon
                        icon={Delete02Icon}
                        className="h-4 w-4 text-gray-400 hover:text-red-500 transition cursor-pointer"
                      />
                    </button>
                  )}
                </div>
              </div>

              {formLocked && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2">
                  <HugeiconsIcon icon={SquareLock02Icon} className="h-4 w-4 text-amber-500 shrink-0" />
                  <p className="text-xs text-amber-700">
                    {editingId
                      ? "This event is locked and won\u2019t be moved during rescheduling."
                      : "This event will be locked and protected from automatic rescheduling."}
                  </p>
                </div>
              )}

              <div className="mt-5 grid gap-4">
                <div className="grid gap-1.5">
                  <label className="text-xs font-medium text-gray-500">
                    Title
                  </label>
                  <input
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    disabled={formLocked}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                    placeholder="Event title"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <label className="text-xs font-medium text-gray-500">
                      Start
                    </label>
                    <input
                      type="datetime-local"
                      value={formStart ? formStart.slice(0, 16) : ""}
                      onChange={(e) => setFormStart(e.target.value)}
                      disabled={formLocked}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <label className="text-xs font-medium text-gray-500">
                      End
                    </label>
                    <input
                      type="datetime-local"
                      value={formEnd ? formEnd.slice(0, 16) : ""}
                      onChange={(e) => setFormEnd(e.target.value)}
                      disabled={formLocked}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <label className="text-xs font-medium text-gray-500">
                      Repeat
                    </label>
                    <select
                      value={formRepeat}
                      onChange={(e) =>
                        setFormRepeat(e.target.value as RepeatValue)
                      }
                      disabled={formLocked}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      <option value="none">Does not repeat</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>

                  <div className="grid gap-1.5">
                    <label className="text-xs font-medium text-gray-500">
                      Color
                    </label>
                    <select
                      value={formColorId}
                      onChange={(e) => setFormColorId(e.target.value)}
                      disabled={formLocked}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      <option value="">Default</option>
                      {EVENT_COLOR_OPTIONS.map((color) => (
                        <option key={color.id} value={color.id}>
                          {color.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {formRepeat !== "none" ? (
                  <div className="grid gap-1.5">
                    <label className="text-xs font-medium text-gray-500">
                      Repeat until
                    </label>
                    <input
                      type="date"
                      value={formRepeatUntil}
                      onChange={(e) => setFormRepeatUntil(e.target.value)}
                      disabled={formLocked}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                    />
                  </div>
                ) : null}
              </div>
              <div className="mt-6 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
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
