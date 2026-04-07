"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ═══════════════════════════════════════════════════════════════
//  DEMO DATA
// ═══════════════════════════════════════════════════════════════
interface DemoEvent {
  id: string;
  title: string;
  timeRange: string;
  hour: number;
  duration: number;
  color: {
    bg: string;
    border: string;
    text: string;
  };
  isNew?: boolean;
  status?: "original" | "moved" | "new";
}

const INITIAL_EVENTS: DemoEvent[] = [
  {
    id: "1",
    title: "Investor Call",
    timeRange: "9–10am",
    hour: 9,
    duration: 1,
    color: { bg: "bg-blue-500/20", border: "border-blue-500", text: "text-blue-400" },
  },
  {
    id: "2",
    title: "Deep Work: V2",
    timeRange: "10am–12pm",
    hour: 10,
    duration: 2,
    color: { bg: "bg-purple-500/20", border: "border-purple-500", text: "text-purple-400" },
  },
  {
    id: "3",
    title: "Client Sync",
    timeRange: "1–2pm",
    hour: 13,
    duration: 1,
    color: { bg: "bg-emerald-500/20", border: "border-emerald-500", text: "text-emerald-400" },
  },
];

const NEW_EVENT: DemoEvent = {
  id: "4",
  title: "Board Check-in",
  timeRange: "10–11am",
  hour: 10,
  duration: 1,
  color: { bg: "bg-amber-500/20", border: "border-amber-500", text: "text-amber-400" },
  isNew: true,
  status: "new",
};

const RESOLVED_EVENTS: DemoEvent[] = [
  {
    id: "1",
    title: "Investor Call",
    timeRange: "9–10am",
    hour: 9,
    duration: 1,
    color: { bg: "bg-blue-500/20", border: "border-blue-500", text: "text-blue-400" },
  },
  {
    id: "4",
    title: "Board Check-in",
    timeRange: "10–11am",
    hour: 10,
    duration: 1,
    color: { bg: "bg-amber-500/20", border: "border-amber-500", text: "text-amber-400" },
    isNew: true,
  },
  {
    id: "2",
    title: "Deep Work: V2",
    timeRange: "11am–1pm",
    hour: 11,
    duration: 2,
    color: { bg: "bg-purple-500/20", border: "border-purple-500", text: "text-purple-400" },
    status: "moved",
  },
  {
    id: "3",
    title: "Client Sync",
    timeRange: "2–3pm",
    hour: 14,
    duration: 1,
    color: { bg: "bg-emerald-500/20", border: "border-emerald-500", text: "text-emerald-400" },
    status: "moved",
  },
];

// ═══════════════════════════════════════════════════════════════
//  ANIMATION PHASES
// ═══════════════════════════════════════════════════════════════
type Phase = "initial" | "conflict" | "resolving" | "resolved";

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
    <div className="flex items-start gap-3 h-12 md:h-14">
      <span className="text-[10px] md:text-xs text-white/40 w-10 md:w-12 text-right tabular-nums shrink-0">
        {displayHour}{period}
      </span>
      <div className="flex-1 border-t border-white/5" />
    </div>
  );
}

interface EventCardProps {
  event: DemoEvent;
  phase: Phase;
}

function EventCard({ event, phase }: EventCardProps) {
  // Calculate position (each hour = 48px on mobile, 56px on desktop)
  const top = (event.hour - 9) * 48 + 4;
  const height = Math.max(event.duration * 48 - 4, 40);

  const isShaking = phase === "resolving" || (phase === "conflict" && event.status === "new");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, x: 20 }}
      animate={{
        opacity: 1,
        scale: 1,
        x: isShaking ? [0, -2, 2, -2, 2, 0] : 0,
      }}
      exit={{ opacity: 0, scale: 0.9, x: -20 }}
      transition={{
        layout: { type: "spring", stiffness: 300, damping: 30 },
        x: isShaking ? { repeat: Infinity, duration: 0.4 } : undefined,
      }}
      className={`absolute left-12 md:left-14 right-2 md:right-4 rounded-lg md:rounded-xl border-l-2 md:border-l-4 ${event.color.bg} ${event.color.border} p-2 md:p-3`}
      style={{ top, height }}
    >
      <div className="flex items-start justify-between gap-1 md:gap-2">
        <div className="min-w-0">
          <h4 className={`font-medium text-xs md:text-sm ${event.color.text} truncate`}>
            {event.title}
          </h4>
          <p className="text-[10px] md:text-xs text-white/50 mt-0.5">
            {event.timeRange}
          </p>
        </div>
        {event.isNew && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-[8px] md:text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-1.5 md:px-2 py-0.5 rounded-full whitespace-nowrap shrink-0"
          >
            NEW
          </motion.span>
        )}
      </div>
    </motion.div>
  );
}

interface StatusBannerProps {
  phase: Phase;
}

function StatusBanner({ phase }: StatusBannerProps) {
  return (
    <AnimatePresence mode="wait">
      {phase === "conflict" && (
        <motion.div
          key="conflict"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="flex items-center gap-2 md:gap-3 rounded-lg md:rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 md:px-4 py-2 md:py-3"
        >
          <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
          <p className="text-xs md:text-sm text-amber-300">
            Conflict detected — resolving...
          </p>
        </motion.div>
      )}

      {phase === "resolving" && (
        <motion.div
          key="resolving"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="flex items-center gap-2 md:gap-3 rounded-lg md:rounded-xl bg-blue-500/10 border border-blue-500/20 px-3 md:px-4 py-2 md:py-3"
        >
          <motion.div
            className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-blue-400 shrink-0"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 0.6 }}
          />
          <p className="text-xs md:text-sm text-blue-300">
            Rescheduling events...
          </p>
        </motion.div>
      )}

      {phase === "resolved" && (
        <motion.div
          key="resolved"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="flex items-center gap-2 md:gap-3 rounded-lg md:rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 md:px-4 py-2 md:py-3"
        >
          <motion.svg
            className="h-3 w-3 md:h-4 md:w-4 text-emerald-400 shrink-0"
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
          <p className="text-xs md:text-sm text-emerald-300">
            Calendar up to date
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function DynamicReschedulingAnimation() {
  const [phase, setPhase] = useState<Phase>("initial");
  const [events, setEvents] = useState<DemoEvent[]>(INITIAL_EVENTS);

  // Animation sequence
  useEffect(() => {
    const sequence = async () => {
      // Wait before starting
      await new Promise((r) => setTimeout(r, 2000));

      // Phase 1: Add new conflicting event
      setPhase("conflict");
      setEvents([...INITIAL_EVENTS, NEW_EVENT]);

      // Phase 2: Start resolving
      await new Promise((r) => setTimeout(r, 2000));
      setPhase("resolving");

      // Phase 3: Show resolved state
      await new Promise((r) => setTimeout(r, 1500));
      setEvents(RESOLVED_EVENTS);
      setPhase("resolved");

      // Reset after a pause
      await new Promise((r) => setTimeout(r, 4000));
      setPhase("initial");
      setEvents(INITIAL_EVENTS);
    };

    sequence();

    // Loop the animation
    const interval = setInterval(sequence, 12000);
    return () => clearInterval(interval);
  }, []);

  const hours = [9, 10, 11, 12, 13, 14, 15];

  return (
    <div className="w-full max-w-sm md:max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl md:rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent backdrop-blur-xl p-4 md:p-6 shadow-2xl shadow-black/20"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <div>
            <h3 className="text-base md:text-lg font-semibold text-white">Tuesday</h3>
            <p className="text-xs md:text-sm text-white/50">{events.length} events</p>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2">
            <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-emerald-400" />
            <span className="text-[10px] md:text-xs text-white/50">Live</span>
          </div>
        </div>

        {/* Status Banner */}
        <div className="mb-3 md:mb-4 min-h-[40px] md:min-h-[48px]">
          <StatusBanner phase={phase} />
        </div>

        {/* Calendar Grid */}
        <div className="relative" style={{ height: hours.length * 48 }}>
          {/* Time slots */}
          <div className="space-y-0">
            {hours.map((hour) => (
              <TimeSlot key={hour} hour={hour} />
            ))}
          </div>

          {/* Events */}
          <AnimatePresence mode="popLayout">
            {events.map((event) => (
              <EventCard key={event.id} event={event} phase={phase} />
            ))}
          </AnimatePresence>
        </div>

        {/* Footer hint */}
        <motion.p
          className="mt-4 md:mt-6 text-center text-[10px] md:text-xs text-white/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Deadlines protected automatically
        </motion.p>
      </motion.div>
    </div>
  );
}
