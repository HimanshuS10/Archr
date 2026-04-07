"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { OptimizationState, RescheduleResult } from "@/hooks/useCalendarOptimizer";

interface ConflictPanelProps {
  state: OptimizationState;
  onApply: () => void;
  onDismiss: () => void;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function MovedEventRow({ result }: { result: RescheduleResult }) {
  return (
    <div className="flex items-start gap-2 text-xs">
      <div className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
      <span className="text-gray-700">
        <span className="font-medium text-gray-900">{result.title}</span>
        {" moved from "}
        <span className="font-medium">{formatTime(result.originalStart)}</span>
        {" → "}
        <span className="font-medium text-emerald-600">{formatTime(result.newStart)}</span>
      </span>
    </div>
  );
}

const visible = ["detecting", "resolving", "resolved"] as const;
type VisibleStatus = (typeof visible)[number];

function isVisible(status: string): status is VisibleStatus {
  return (visible as readonly string[]).includes(status);
}

export default function ConflictPanel({ state, onApply, onDismiss }: ConflictPanelProps) {
  const show = isVisible(state.status);
  const movedEvents = state.reschedule.filter((r) => r.status === "moved").slice(0, 3);
  const extraCount = state.reschedule.filter((r) => r.status === "moved").length - 3;

  // Auto-dismiss 4s after resolved
  useEffect(() => {
    if (state.status === "resolved") {
      const t = setTimeout(onDismiss, 4000);
      return () => clearTimeout(t);
    }
  }, [state.status, onDismiss]);

  const borderColor =
    state.status === "detecting" ? "#f59e0b40"
    : state.status === "resolving" ? "#3b82f640"
    : "#10b98140";

  const headerBg =
    state.status === "detecting" ? "#fffbeb"
    : state.status === "resolving" ? "#eff6ff"
    : "#f0fdf4";

  const textColor =
    state.status === "detecting" ? "#92400e"
    : state.status === "resolving" ? "#1e40af"
    : "#065f46";

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="conflict-panel"
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
          className="fixed bottom-6 right-6 z-50 w-80 rounded-2xl border bg-white shadow-2xl shadow-black/10"
          style={{ borderColor }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 rounded-t-2xl px-4 py-3"
            style={{ background: headerBg }}
          >
            {state.status === "detecting" && (
              <motion.div
                className="h-2.5 w-2.5 shrink-0 rounded-full bg-amber-400"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              />
            )}
            {state.status === "resolving" && (
              <motion.div
                className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-400"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
              />
            )}
            {state.status === "resolved" && (
              <svg className="h-4 w-4 shrink-0 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}

            <p className="flex-1 text-sm font-semibold" style={{ color: textColor }}>
              {state.status === "detecting" &&
                `${state.conflicts.length} scheduling conflict${state.conflicts.length !== 1 ? "s" : ""} found`}
              {state.status === "resolving" && "Rescheduling your day…"}
              {state.status === "resolved" && "Schedule optimized"}
            </p>

            <button
              onClick={onDismiss}
              className="text-gray-400 transition hover:text-gray-600"
              aria-label="Dismiss"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Detecting — description + action buttons */}
          {state.status === "detecting" && (
            <div className="px-4 py-3">
              <p className="text-xs text-gray-500">
                Some events overlap in the next 7 days. Archr can automatically
                move lower-priority events to free up the conflicts.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={onApply}
                  className="flex-1 rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-gray-700"
                >
                  Reschedule
                </button>
                <button
                  onClick={onDismiss}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Resolving — progress bar */}
          {state.status === "resolving" && (
            <div className="px-4 py-3">
              <div className="h-1 w-full overflow-hidden rounded-full bg-blue-100">
                <motion.div
                  className="h-full rounded-full bg-blue-400"
                  initial={{ width: "0%" }}
                  animate={{ width: "90%" }}
                  transition={{ duration: 3, ease: "easeInOut" }}
                />
              </div>
            </div>
          )}

          {/* Resolved — list of moved events */}
          {state.status === "resolved" && movedEvents.length > 0 && (
            <div className="space-y-2 px-4 py-3">
              {movedEvents.map((r) => (
                <MovedEventRow key={r.eventId} result={r} />
              ))}
              {extraCount > 0 && (
                <p className="text-xs text-gray-400">+{extraCount} more</p>
              )}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
