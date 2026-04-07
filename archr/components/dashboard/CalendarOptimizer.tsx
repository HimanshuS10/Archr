"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════
interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  isNew?: boolean;
  isConflict?: boolean;
  status?: "original" | "moved" | "protected";
}

interface Conflict {
  eventId: string;
  conflictsWith: string;
  type: "overlap" | "meeting_extended" | "priority_shift" | "new_event";
  severity: "low" | "medium" | "high";
}

interface RescheduleResult {
  eventId: string;
  title: string;
  originalStart: string;
  originalEnd: string;
  newStart: string;
  newEnd: string;
  reason: string;
  status: "moved" | "unchanged" | "protected";
}

interface OptimizationState {
  status: "idle" | "detecting" | "resolving" | "resolved" | "optimal";
  conflicts: Conflict[];
  reschedule: RescheduleResult[];
  message: string;
}

// ═══════════════════════════════════════════════════════════════
//  UTILITIES
// ═══════════════════════════════════════════════════════════════
function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).toLowerCase();
}

function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)}–${formatTime(end)}`;
}

function getDayName(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", { weekday: "long" });
}

function getEventHour(isoString: string): number {
  return new Date(isoString).getHours();
}

// ═══════════════════════════════════════════════════════════════
//  EVENT COLORS
// ═══════════════════════════════════════════════════════════════
const EVENT_COLORS = [
  { bg: "bg-blue-500/20", border: "border-blue-500", text: "text-blue-400" },
  { bg: "bg-purple-500/20", border: "border-purple-500", text: "text-purple-400" },
  { bg: "bg-emerald-500/20", border: "border-emerald-500", text: "text-emerald-400" },
  { bg: "bg-amber-500/20", border: "border-amber-500", text: "text-amber-400" },
  { bg: "bg-rose-500/20", border: "border-rose-500", text: "text-rose-400" },
];

function getEventColor(index: number) {
  return EVENT_COLORS[index % EVENT_COLORS.length];
}

// ═══════════════════════════════════════════════════════════════
//  COMPONENTS
// ═══════════════════════════════════════════════════════════════
interface TimeSlotProps {
  hour: number;
}

function TimeSlot({ hour }: TimeSlotProps) {
  const displayHour = hour > 12 ? hour - 12 : hour;
  const period = hour >= 12 ? "pm" : "am";

  return (
    <div className="flex items-start gap-3 h-16">
      <span className="text-xs text-white/40 w-12 text-right tabular-nums">
        {displayHour}{period}
      </span>
      <div className="flex-1 border-t border-white/5" />
    </div>
  );
}

interface EventCardProps {
  event: CalendarEvent;
  colorIndex: number;
  isResolving?: boolean;
}

function EventCard({ event, colorIndex, isResolving }: EventCardProps) {
  const color = getEventColor(colorIndex);
  const startHour = getEventHour(event.start);
  const endHour = getEventHour(event.end);
  const duration = endHour - startHour;

  // Calculate position (each hour = 64px)
  const top = (startHour - 9) * 64 + 8;
  const height = Math.max(duration * 64 - 8, 48);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{
        opacity: isResolving ? 0.5 : 1,
        scale: 1,
        x: isResolving ? [0, -2, 2, -2, 0] : 0,
      }}
      transition={{
        layout: { type: "spring", stiffness: 300, damping: 30 },
        x: isResolving ? { repeat: Infinity, duration: 0.3 } : undefined,
      }}
      className={`absolute left-16 right-4 rounded-xl border-l-4 ${color.bg} ${color.border} p-3`}
      style={{ top, height }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className={`font-medium text-sm ${color.text}`}>{event.title}</h4>
          <p className="text-xs text-white/50 mt-0.5">
            {formatTimeRange(event.start, event.end)}
          </p>
        </div>
        {event.isNew && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
            NEW
          </span>
        )}
        {event.status === "moved" && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full">
            MOVED
          </span>
        )}
        {event.status === "protected" && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded-full">
            LOCKED
          </span>
        )}
      </div>
    </motion.div>
  );
}

interface StatusBannerProps {
  state: OptimizationState;
}

function StatusBanner({ state }: StatusBannerProps) {
  return (
    <AnimatePresence mode="wait">
      {state.status === "detecting" && (
        <motion.div
          key="detecting"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="flex items-center gap-3 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3"
        >
          <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          <p className="text-sm text-amber-300">
            Conflict detected — analyzing schedule...
          </p>
        </motion.div>
      )}

      {state.status === "resolving" && (
        <motion.div
          key="resolving"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="flex items-center gap-3 rounded-xl bg-blue-500/10 border border-blue-500/20 px-4 py-3"
        >
          <motion.div
            className="h-2 w-2 rounded-full bg-blue-400"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 0.6 }}
          />
          <p className="text-sm text-blue-300">
            Conflict detected — resolving...
          </p>
        </motion.div>
      )}

      {state.status === "resolved" && (
        <motion.div
          key="resolved"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="flex items-center gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3"
        >
          <motion.svg
            className="h-4 w-4 text-emerald-400"
            viewBox="0 0 20 20"
            fill="currentColor"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </motion.svg>
          <p className="text-sm text-emerald-300">
            Calendar up to date
          </p>
        </motion.div>
      )}

      {state.status === "optimal" && (
        <motion.div
          key="optimal"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="flex items-center gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3"
        >
          <svg className="h-4 w-4 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm text-emerald-300">
            Schedule optimized — all deadlines protected
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
interface CalendarOptimizerProps {
  onOptimize?: (results: RescheduleResult[]) => void;
  autoOptimize?: boolean;
}

export default function CalendarOptimizer({
  onOptimize,
  autoOptimize = true,
}: CalendarOptimizerProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [state, setState] = useState<OptimizationState>({
    status: "idle",
    conflicts: [],
    reschedule: [],
    message: "",
  });
  const [selectedDay, setSelectedDay] = useState<string>("Tuesday");

  // Fetch events and check for conflicts
  const checkForConflicts = useCallback(async () => {
    try {
      const response = await fetch("/api/ai/reschedule?windowDays=7");
      if (!response.ok) return;

      const data = await response.json();

      if (data.hasConflicts && data.conflictCount > 0) {
        setState(prev => ({
          ...prev,
          status: "detecting",
          conflicts: data.conflicts,
        }));
      }
    } catch (error) {
      console.error("Failed to check conflicts:", error);
    }
  }, []);

  // Perform optimization
  const optimize = useCallback(async () => {
    setState(prev => ({ ...prev, status: "resolving" }));

    try {
      const response = await fetch("/api/ai/reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          windowDays: 7,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          apply: true,
        }),
      });

      if (!response.ok) throw new Error("Optimization failed");

      const data = await response.json();

      // Update events with new positions
      setEvents(prev => {
        const updated = [...prev];
        for (const result of data.reschedule as RescheduleResult[]) {
          const eventIndex = updated.findIndex(e => e.id === result.eventId);
          if (eventIndex !== -1 && result.status === "moved") {
            updated[eventIndex] = {
              ...updated[eventIndex],
              start: result.newStart,
              end: result.newEnd,
              status: "moved",
            };
          }
        }
        return updated;
      });

      setState({
        status: "resolved",
        conflicts: [],
        reschedule: data.reschedule,
        message: data.message,
      });

      onOptimize?.(data.reschedule);

      // Reset to optimal after animation
      setTimeout(() => {
        setState(prev => ({ ...prev, status: "optimal" }));
      }, 2000);
    } catch (error) {
      console.error("Optimization failed:", error);
      setState(prev => ({ ...prev, status: "idle" }));
    }
  }, [onOptimize]);

  // Load initial events
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const response = await fetch("/api/google/events?maxResults=100&windowDays=7");
        if (!response.ok) return;

        const data = await response.json();
        const mapped: CalendarEvent[] = (data.items || [])
          .filter((item: { status?: string }) => item?.status !== "cancelled")
          .map((item: {
            id: string;
            summary?: string;
            start?: { dateTime?: string; date?: string };
            end?: { dateTime?: string; date?: string };
          }) => ({
            id: item.id,
            title: item.summary || "Untitled",
            start: item.start?.dateTime || item.start?.date,
            end: item.end?.dateTime || item.end?.date,
          }));

        setEvents(mapped);

        // Check for conflicts after loading
        if (autoOptimize) {
          await checkForConflicts();
        }
      } catch (error) {
        console.error("Failed to load events:", error);
      }
    };

    loadEvents();
  }, [autoOptimize, checkForConflicts]);

  // Auto-optimize when conflicts are detected
  useEffect(() => {
    if (state.status === "detecting" && autoOptimize) {
      const timer = setTimeout(() => {
        optimize();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [state.status, autoOptimize, optimize]);

  // Filter events for selected day
  const dayEvents = events.filter(event => {
    const eventDay = getDayName(event.start);
    return eventDay === selectedDay;
  });

  const hours = [9, 10, 11, 12, 13, 14];

  return (
    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b0d16] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{selectedDay}</h3>
          <p className="text-sm text-white/50">{dayEvents.length} events</p>
        </div>
        {state.status === "idle" && state.conflicts.length === 0 && (
          <button
            onClick={checkForConflicts}
            className="text-sm text-blue-400 hover:text-blue-300 transition"
          >
            Check conflicts
          </button>
        )}
      </div>

      {/* Status Banner */}
      <div className="mb-4">
        <StatusBanner state={state} />
      </div>

      {/* Calendar Grid */}
      <div className="relative">
        {/* Time slots */}
        <div className="space-y-0">
          {hours.map((hour) => (
            <TimeSlot key={hour} hour={hour} />
          ))}
        </div>

        {/* Events */}
        <AnimatePresence>
          {dayEvents.map((event, index) => (
            <EventCard
              key={event.id}
              event={event}
              colorIndex={index}
              isResolving={state.status === "resolving"}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Day Selector */}
      <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition whitespace-nowrap ${
              selectedDay === day
                ? "bg-blue-500 text-white"
                : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            {day.slice(0, 3)}
          </button>
        ))}
      </div>

      {/* Reschedule Summary */}
      {state.reschedule.length > 0 && state.status === "resolved" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-4 space-y-2"
        >
          <h4 className="text-xs uppercase tracking-wider text-white/40">
            Changes Made
          </h4>
          {state.reschedule
            .filter((r) => r.status === "moved")
            .slice(0, 3)
            .map((result) => (
              <div
                key={result.eventId}
                className="text-xs text-white/60 bg-white/5 rounded-lg px-3 py-2"
              >
                <span className="text-white/80 font-medium">{result.title}</span>
                <span className="text-white/40"> — </span>
                <span>{result.reason}</span>
              </div>
            ))}
        </motion.div>
      )}
    </div>
  );
}
