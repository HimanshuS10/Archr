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

  const handleConnect = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        scopes: "https://www.googleapis.com/auth/calendar",
        queryParams: {
          access_type: "offline",
          prompt: "consent",
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

  const handleSave = useCallback(async () => {
    if (!formTitle || !formStart) return;
    setSaving(true);
    setError(null);

    const { data, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !data.session?.provider_token) {
      setSaving(false);
      setNeedsConnect(true);
      setError("Google Calendar not connected.");
      return;
    }

    const token = data.session.provider_token;
    const payload = {
      summary: formTitle,
      start: { dateTime: new Date(formStart).toISOString() },
      end: { dateTime: new Date(formEnd || formStart).toISOString() },
    };

    try {
      const url = editingId
        ? `https://www.googleapis.com/calendar/v3/calendars/primary/events/${editingId}`
        : "https://www.googleapis.com/calendar/v3/calendars/primary/events";
      const method = editingId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save event.");
      }

      const saved = await response.json();
      const mapped: CalendarEvent = {
        id: saved.id,
        title: saved.summary || "Untitled event",
        start: saved.start?.dateTime || saved.start?.date,
        end: saved.end?.dateTime || saved.end?.date,
      };

      setEvents((prev) => {
        if (editingId) {
          return prev.map((item) => (item.id === editingId ? mapped : item));
        }
        return [...prev, mapped];
      });

      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save event.");
    } finally {
      setSaving(false);
    }
  }, [editingId, formEnd, formStart, formTitle, closeModal]);

  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      setError(null);
      setNeedsConnect(false);

      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        setError("Unable to read session.");
        setLoading(false);
        return;
      }

      const token = data.session?.provider_token;
      if (!token) {
        setNeedsConnect(true);
        setError("Google Calendar not connected.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          "https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&timeMin=" +
            encodeURIComponent(new Date().toISOString()),
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          let message = `Google Calendar API error (${response.status}).`;
          try {
            const errorPayload = await response.json();
            const apiMessage = errorPayload?.error?.message;
            if (apiMessage) {
              message = apiMessage;
            }
          } catch {
          }

          if (response.status === 401 || response.status === 403) {
            setNeedsConnect(true);
          }
          throw new Error(message);
        }

        const payload = await response.json();
        const mapped: CalendarEvent[] = (payload.items || []).map(
          (item: any) => ({
            id: item.id,
            title: item.summary || "Untitled event",
            start: item.start?.dateTime || item.start?.date,
            end: item.end?.dateTime || item.end?.date,
          })
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
    };

    loadEvents();
  }, []);

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
    <div className="archr-calendar rounded-3xl border border-white/10 bg-[#131314] p-6 backdrop-blur-md">
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
            Connect your Google Calendar to sync events. If you already
            connected, make sure the Google provider includes Calendar scope and
            re-consent.
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
        <div className="h-[350px] overflow-auto">
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
            height="600px"
          />
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b0d16] p-6 text-white">
            <h3 className="text-lg font-semibold">
              {editingId ? "Edit event" : "Add event"}
            </h3>
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
  }
);

export default CalendarView;
