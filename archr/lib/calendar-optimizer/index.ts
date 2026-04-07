// Calendar Optimizer - Dynamic Rescheduling System
// Exports all calendar optimization functionality

export { useCalendarOptimizer } from "@/hooks/useCalendarOptimizer";
export type {
  Conflict,
  RescheduleResult,
  OptimizationState,
  UseCalendarOptimizerOptions,
} from "@/hooks/useCalendarOptimizer";

// Re-export components
export { default as CalendarOptimizer } from "@/components/dashboard/CalendarOptimizer";
export { default as DynamicReschedulingAnimation } from "@/components/landing/DynamicReschedulingAnimation";
