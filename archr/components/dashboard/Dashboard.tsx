"use client";

import CalendarView, {
  CalendarHandle,
} from "@/components/dashboard/CalendarView";
import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCalendarOptimizer } from "@/hooks/useCalendarOptimizer";
import ConflictPanel from "@/components/dashboard/ConflictPanel";
import type { InitialCalendarEvent } from "@/lib/calendar-events-server";

type DashboardProps = {
  isExpanded: boolean;
  initialEvents?: InitialCalendarEvent[];
};

function Dashboard({ isExpanded, initialEvents }: DashboardProps) {
  const router = useRouter();
  const calendarRef = useRef<CalendarHandle | null>(null);
  const [title, setTitle] = useState("");
  const [activeView, setActiveView] = useState<
    "dayGridMonth" | "timeGridWeek" | "timeGridDay"
  >("timeGridWeek");

  const handleViewChange = (
    view: "dayGridMonth" | "timeGridWeek" | "timeGridDay",
  ) => {
    setActiveView(view);
    calendarRef.current?.changeView(view);
  };

  const onResolved = useCallback(() => {
    router.refresh();
  }, [router]);

  const { state, optimize, reset, checkConflicts } = useCalendarOptimizer({
    autoCheck: true,
    checkInterval: 300_000, // re-check every 5 minutes
    windowDays: 7,
    onResolved,
  });

  return (
    <>
      <main
        className="h-screen overflow-hidden px-8 pt-2 pb-3 transition-[margin] duration-300"
        style={{ marginLeft: isExpanded ? 260 : 70 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => calendarRef.current?.prev()}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button
              type="button"
              onClick={() => calendarRef.current?.next()}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <p className="px-2 text-sm font-semibold text-gray-800">{title}</p>
            <button
              type="button"
              onClick={() => calendarRef.current?.today()}
              className="ml-1 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            >
              Today
            </button>
          </div>
          <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 text-sm">
            {(
              [
                { label: "Month", view: "dayGridMonth" },
                { label: "Week", view: "timeGridWeek" },
                { label: "Day", view: "timeGridDay" },
              ] as const
            ).map((item) => (
              <button
                key={item.view}
                type="button"
                onClick={() => handleViewChange(item.view)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  activeView === item.view
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-2 h-[calc(100vh-5.75rem)]">
          <CalendarView
            ref={calendarRef}
            onTitleChange={setTitle}
            initialEvents={initialEvents}
            onEventSaved={checkConflicts}
          />
        </div>
      </main>

      <ConflictPanel state={state} onApply={() => optimize(true)} onDismiss={reset} />
    </>
  );
}

  export default Dashboard;
    