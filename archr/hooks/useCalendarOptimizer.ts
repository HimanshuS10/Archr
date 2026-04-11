"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════
export interface Conflict {
  eventId: string;
  conflictsWith: string;
  type: "overlap" | "meeting_extended" | "priority_shift" | "new_event";
  severity: "low" | "medium" | "high";
}

export interface RescheduleResult {
  eventId: string;
  title: string;
  originalStart: string;
  originalEnd: string;
  newStart: string;
  newEnd: string;
  reason: string;
  status: "moved" | "unchanged" | "protected";
}

export interface OptimizationState {
  status: "idle" | "checking" | "detecting" | "resolving" | "resolved" | "optimal" | "error";
  conflicts: Conflict[];
  reschedule: RescheduleResult[];
  message: string;
  error?: string;
}

export interface UseCalendarOptimizerOptions {
  autoCheck?: boolean;
  checkInterval?: number; // in milliseconds
  windowDays?: number;
  onConflictsDetected?: (conflicts: Conflict[]) => void;
  onResolved?: (results: RescheduleResult[]) => void;
  onError?: (error: string) => void;
}

// ═══════════════════════════════════════════════════════════════
//  HOOK
// ═══════════════════════════════════════════════════════════════
export function useCalendarOptimizer(options: UseCalendarOptimizerOptions = {}) {
  const {
    autoCheck = false,
    checkInterval = 60000, // 1 minute
    windowDays = 7,
    onConflictsDetected,
    onResolved,
    onError,
  } = options;

  const [state, setState] = useState<OptimizationState>({
    status: "idle",
    conflicts: [],
    reschedule: [],
    message: "",
  });

  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isOptimizingRef = useRef(false);

  // Check for conflicts
  const checkConflicts = useCallback(async () => {
    if (isOptimizingRef.current) return;

    setState((prev) => ({ ...prev, status: "checking" }));

    try {
      const response = await fetch(`/api/ai/reschedule?windowDays=${windowDays}`);

      if (!response.ok) {
        throw new Error("Failed to check conflicts");
      }

      const data = await response.json();

      if (data.hasConflicts && data.conflictCount > 0) {
        setState((prev) => ({
          ...prev,
          status: "detecting",
          conflicts: data.conflicts ?? [],
          message: `${data.conflictCount} conflict(s) detected`,
        }));
        onConflictsDetected?.(data.conflicts ?? []);
      } else {
        setState((prev) => ({
          ...prev,
          status: "optimal",
          conflicts: [],
          message: "No conflicts — schedule is optimal",
        }));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Check failed";
      setState((prev) => ({
        ...prev,
        status: "error",
        error: message,
      }));
      onError?.(message);
    }
  }, [windowDays, onConflictsDetected, onError]);

  // Perform optimization
  const optimize = useCallback(
    async (apply = true) => {
      if (isOptimizingRef.current) return;
      isOptimizingRef.current = true;

      setState((prev) => ({ ...prev, status: "resolving" }));

      try {
        const response = await fetch("/api/ai/reschedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            windowDays,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            apply,
          }),
        });

        if (!response.ok) {
          throw new Error("Optimization failed");
        }

        const data = await response.json();

        setState({
          status: "resolved",
          conflicts: [],
          reschedule: data.reschedule,
          message: data.message,
        });

        onResolved?.(data.reschedule);

        // Transition to optimal after a brief moment
        setTimeout(() => {
          setState((prev) => ({
            ...prev,
            status: "optimal",
          }));
        }, 3000);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Optimization failed";
        setState((prev) => ({
          ...prev,
          status: "error",
          error: message,
        }));
        onError?.(message);
      } finally {
        isOptimizingRef.current = false;
      }
    },
    [windowDays, onResolved, onError]
  );

  // Preview optimization without applying
  const previewOptimization = useCallback(async () => {
    return optimize(false);
  }, [optimize]);

  // Apply pending optimization
  const applyOptimization = useCallback(async () => {
    return optimize(true);
  }, [optimize]);

  // Trigger reschedule for a specific event change
  const triggerReschedule = useCallback(
    async (changedEvent: { id: string; newEnd?: string; isNew?: boolean }) => {
      if (isOptimizingRef.current) return;
      isOptimizingRef.current = true;

      setState((prev) => ({ ...prev, status: "resolving" }));

      try {
        const response = await fetch("/api/ai/reschedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            changedEvent,
            windowDays,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            apply: true,
          }),
        });

        if (!response.ok) {
          throw new Error("Rescheduling failed");
        }

        const data = await response.json();

        if (data.status === "optimal") {
          setState({
            status: "optimal",
            conflicts: [],
            reschedule: [],
            message: data.message,
          });
        } else {
          setState({
            status: "resolved",
            conflicts: [],
            reschedule: data.reschedule,
            message: data.message,
          });

          onResolved?.(data.reschedule);

          setTimeout(() => {
            setState((prev) => ({ ...prev, status: "optimal" }));
          }, 3000);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Rescheduling failed";
        setState((prev) => ({
          ...prev,
          status: "error",
          error: message,
        }));
        onError?.(message);
      } finally {
        isOptimizingRef.current = false;
      }
    },
    [windowDays, onResolved, onError]
  );

  // Reset state
  const reset = useCallback(() => {
    setState({
      status: "idle",
      conflicts: [],
      reschedule: [],
      message: "",
    });
  }, []);

  // Auto-check setup
  useEffect(() => {
    if (autoCheck) {
      // Initial check
      checkConflicts();

      // Set up interval
      checkTimeoutRef.current = setInterval(checkConflicts, checkInterval);

      return () => {
        if (checkTimeoutRef.current) {
          clearInterval(checkTimeoutRef.current);
        }
      };
    }
  }, [autoCheck, checkInterval, checkConflicts]);

  return {
    state,
    checkConflicts,
    optimize,
    previewOptimization,
    applyOptimization,
    triggerReschedule,
    reset,
    isOptimizing: isOptimizingRef.current,
    hasConflicts: (state.conflicts?.length ?? 0) > 0,
    movedEvents: (state.reschedule ?? []).filter((r) => r.status === "moved"),
  };
}

export default useCalendarOptimizer;
