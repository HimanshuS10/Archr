"use client";

import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useMemo, useState } from "react";

type EventsProp = {
  isExpanded: boolean;
};

type GoogleEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
};

const DEFAULT_MAX_RESULTS = 20;
const DEFAULT_WINDOW_DAYS = 30;

function toDatetimeLocal(value?: string) {
  if (!value) return "";
  return value.slice(0, 16);
}

const Events = ({ isExpanded }: EventsProp) => {
  const [events, setEvents] = useState<GoogleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConnect, setNeedsConnect] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formStart, setFormStart] = useState("");
  const [formEnd, setFormEnd] = useState("");
  const [formDescription, setFormDescription] = useState("");

  const sortedEvents = useMemo(
    () =>
      [...events].sort(
        (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
      ),
    [events],
  );

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

  const resetForm = () => {
    setFormTitle("");
    setFormStart("");
    setFormEnd("");
    setFormDescription("");
    setEditingId(null);
  };

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNeedsConnect(false);

    try {
      const response = await fetch(
        `/api/google/events?maxResults=${DEFAULT_MAX_RESULTS}&windowDays=${DEFAULT_WINDOW_DAYS}`,
      );

      if (!response.ok) {
        if (response.status === 401) {
          setNeedsConnect(true);
        }
        const payload = await response.json().catch(() => null);
        throw new Error(
          payload?.error ?? `Failed to fetch events (${response.status}).`,
        );
      }

      const payload = await response.json();
      const mapped: GoogleEvent[] = (payload.items || [])
        .filter((item: { start?: { dateTime?: string; date?: string } }) => {
          return !!(item.start?.dateTime || item.start?.date);
        })
        .map(
          (item: {
            id: string;
            summary?: string;
            description?: string;
            start: { dateTime?: string; date?: string };
            end: { dateTime?: string; date?: string };
          }) => ({
            id: item.id,
            title: item.summary || "Untitled event",
            start: item.start.dateTime || item.start.date || "",
            end:
              item.end?.dateTime ||
              item.end?.date ||
              item.start.dateTime ||
              item.start.date ||
              "",
            description: item.description || "",
          }),
        );

      setEvents(mapped);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not load events.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const openCreate = () => {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    setFormStart(now.toISOString().slice(0, 16));
    setFormEnd(oneHourLater.toISOString().slice(0, 16));
    setIsModalOpen(true);
  };

  const openEdit = (event: GoogleEvent) => {
    setEditingId(event.id);
    setFormTitle(event.title);
    setFormStart(toDatetimeLocal(event.start));
    setFormEnd(toDatetimeLocal(event.end));
    setFormDescription(event.description ?? "");
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
      const payload = {
        title: formTitle,
        start: formStart,
        end: formEnd || formStart,
        description: formDescription || undefined,
      };

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

      const saved = await response.json();
      const mapped: GoogleEvent = {
        id: saved.id,
        title: saved.summary || "Untitled event",
        start: saved.start?.dateTime || saved.start?.date,
        end: saved.end?.dateTime || saved.end?.date,
        description: saved.description || "",
      };

      setEvents((prev) => {
        if (editingId) {
          return prev.map((item) => (item.id === editingId ? mapped : item));
        }
        return [mapped, ...prev];
      });

      closeModal();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save event.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);

    try {
      const response = await fetch(`/api/google/events/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        if (response.status === 401) {
          setNeedsConnect(true);
        }
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to delete event.");
      }

      setEvents((prev) => prev.filter((event) => event.id !== id));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete event.";
      setError(message);
    }
  };

  return (
    <main
      className="h-screen overflow-hidden px-8 pt-2 pb-3 transition-[margin] duration-300"
      style={{ marginLeft: isExpanded ? 260 : 70 }}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Events</h1>
          <p className="text-sm text-white/60">
            Showing next {DEFAULT_MAX_RESULTS} events in {DEFAULT_WINDOW_DAYS} days.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-full bg-linear-to-b from-blue-400 via-blue-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 ring-1 ring-inset ring-white/20 transition hover:from-blue-300 hover:via-blue-400 hover:to-blue-500"
        >
          <span className="text-base leading-none">+</span>
          New Event
        </button>
      </div>

      <div className="mt-4 h-[calc(100vh-7rem)] overflow-auto rounded-2xl border border-white/10 bg-[#131314] p-4">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-white/60">
            Loading events...
          </div>
        ) : needsConnect ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <p className="max-w-md text-sm text-white/70">
              Connect your Google Calendar to load and manage your events. If
              this is your first time after the token migration, one reconnect
              may be required.
            </p>
            <button
              type="button"
              onClick={handleConnect}
              className="rounded-full bg-linear-to-b from-blue-400 via-blue-500 to-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 ring-1 ring-inset ring-white/20 transition hover:from-blue-300 hover:via-blue-400 hover:to-blue-500"
            >
              Connect Google Calendar
            </button>
          </div>
        ) : (
          <>
            {error ? (
              <div className="mb-3 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </div>
            ) : null}

            {sortedEvents.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-white/50">
                No upcoming events found.
              </div>
            ) : (
              <div className="space-y-3">
                {sortedEvents.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-xl border border-white/10 bg-white/3 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-semibold text-white">
                          {event.title}
                        </h3>
                        <p className="mt-1 text-xs text-white/60">
                          {new Date(event.start).toLocaleString()} -{" "}
                          {new Date(event.end).toLocaleString()}
                        </p>
                        {event.description ? (
                          <p className="mt-2 line-clamp-2 text-xs text-white/65">
                            {event.description}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(event)}
                          className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/80 transition hover:bg-white/10"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(event.id)}
                          className="rounded-full border border-red-400/30 px-3 py-1 text-xs text-red-300 transition hover:bg-red-500/10"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b0d16] p-6 text-white">
            <h2 className="text-lg font-semibold">
              {editingId ? "Edit Event" : "Add New Event"}
            </h2>

            <div className="mt-4 grid gap-3">
              <div className="grid gap-1">
                <label className="text-xs uppercase tracking-[0.25em] text-white/50">
                  Event name
                </label>
                <input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Team standup"
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-white/35 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div className="grid gap-1">
                <label className="text-xs uppercase tracking-[0.25em] text-white/50">
                  Start
                </label>
                <input
                  type="datetime-local"
                  value={formStart}
                  onChange={(e) => setFormStart(e.target.value)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div className="grid gap-1">
                <label className="text-xs uppercase tracking-[0.25em] text-white/50">
                  End
                </label>
                <input
                  type="datetime-local"
                  value={formEnd}
                  onChange={(e) => setFormEnd(e.target.value)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div className="grid gap-1">
                <label className="text-xs uppercase tracking-[0.25em] text-white/50">
                  Description (optional)
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Add details..."
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-white/35 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={!formTitle.trim() || !formStart || saving}
                className="rounded-full bg-linear-to-b from-blue-400 via-blue-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 ring-1 ring-inset ring-white/20 transition hover:from-blue-300 hover:via-blue-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
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