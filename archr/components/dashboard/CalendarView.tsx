"use client";

import { useCallback, useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { supabase } from "@/lib/supabase";


type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end?: string;
};

export default function CalendarView() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsConnect, setNeedsConnect] = useState(false);

  const handleConnect = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        scopes: "https://www.googleapis.com/auth/calendar.readonly",
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
  }, []);

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
            // ignore parse errors
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

  return (
    <div className="archr-calendar rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-md">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Your Calendar</h2>
          <p className="text-sm text-white/60">Synced from Google Calendar</p>
        </div>
      </div>

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
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={events}
          height="auto"
        />
      )}
    </div>
  );
}
