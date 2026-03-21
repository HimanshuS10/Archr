import React from "react";
import AutoScheduleFeature from "./animation/AutoScheduleFeature";
import UnifiedTaskAnimation from "./animation/UnifiedTaskAnimation";
import TaskBreakdownAnimation from "./animation/TaskBreakdownAnimation";
import ConflictResolution from "./animation/Conflictresolution";

const CalendarGraphic = () => (
  <div className="">
    <AutoScheduleFeature />
  </div>
);

const ChecklistFlowGraphic = () => (
  <div className="">
    <UnifiedTaskAnimation />
  </div>
);

const AnalyticsGraphic = () => (
  <div className="flex h-36 w-full max-w-[220px] items-end gap-2 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
    {[90, 75, 52, 45, 20, 10].map((h, idx) => (
      <div
        key={idx}
        className="flex-1 rounded-t-md bg-blue-500/80"
        style={{ height: `${h}%` }}
      />
    ))}
  </div>
);

const TimeBlockGraphic = () => (
  <div className="w-full max-w-[220px] rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
    <div className="space-y-2">
      <div className="rounded-lg bg-blue-100 px-3 py-2 text-xs text-blue-800">
        9:00 - 10:30 Focus block
      </div>
      <div className="rounded-lg bg-indigo-100 px-3 py-2 text-xs text-indigo-800">
        11:00 - 11:30 Team sync
      </div>
      <div className="rounded-lg bg-sky-100 px-3 py-2 text-xs text-sky-800">
        2:00 - 3:00 Assignment work
      </div>
    </div>
  </div>
);

const Feature = () => {
  return (
    <section
      id="features"
      className="flex w-full flex-col items-center bg-white px-4 pt-10 pb-20 md:px-8"
    >
      <div className="mb-8 w-fit rounded-full border border-gray-100 bg-white px-4 py-1.5 shadow-sm">
        <span className="text-sm font-medium tracking-tight text-gray-600">
          Features
        </span>
      </div>

      <h2 className="mb-10 text-center text-4xl leading-tight font-semibold tracking-tight text-black md:text-5xl">
        Master Your Time
        <br className="hidden md:block" />
        with Smart Features
      </h2>

      <div className="grid w-full max-w-6xl grid-cols-1 gap-6 md:grid-cols-3">
        <div className="flex h-[420px] flex-col overflow-hidden rounded-[2rem] border-2 border-gray-100 bg-linear-to-b from-[#FFFFFF] via-[#F4F4F4] to-[#FAFAFA] p-8">
          <h3 className="mb-3 text-2xl font-semibold">Smart Auto-Scheduling</h3>
          <p className="mb-8 leading-relaxed text-gray-500">
            Tell Archr what needs doing and by when. It finds the right slots,
            respects your existing commitments, and builds a realistic plan
            automatically.
          </p>
          <div className="relative mt-auto flex w-full grow items-center justify-center h-full">
            <CalendarGraphic />
          </div>
        </div>

        <div className="flex h-[420px] flex-col overflow-hidden rounded-[2rem] border-2 border-gray-100 bg-linear-to-b from-[#FFFFFF] via-[#F4F4F4] to-[#FAFAFA] p-8">
          <h3 className="mb-3 text-2xl font-semibold">Habit Scheduling</h3>
          <p className="mb-8 leading-relaxed text-gray-500">
            Gym, reading, language practice. Add the habits you want to keep and
            Archr protects time for them every week.
          </p>
          <div className="relative mt-auto flex w-full grow items-center justify-center h-full">
            <ChecklistFlowGraphic />
          </div>
        </div>

        <div className="flex h-[420px] flex-col overflow-hidden rounded-[2rem] border-2 border-gray-100 bg-linear-to-b from-[#FFFFFF] via-[#F4F4F4] to-[#FAFAFA] p-8">
          <h3 className="mb-3 text-2xl font-semibold">Energy-Aware Planning</h3>
          <p className="mb-8 leading-relaxed text-gray-500">
            Archr knows your peak hours. Deep work gets scheduled when you're
            sharpest. Admin tasks fill the low-energy gaps. Your calendar
            finally matches your energy.
          </p>
          <div className="relative mt-auto flex w-full grow items-center justify-center h-full">
            <AnalyticsGraphic />
          </div>
        </div>
      </div>

      <div className="mt-6 grid w-full max-w-6xl grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex min-h-[220px] flex-col items-center overflow-hidden rounded-[2rem] border-2 border-gray-100 bg-linear-to-b from-[#FFFFFF] via-[#F4F4F4] to-[#FAFAFA] p-8 md:flex-row">
          <div className="mb-6 flex-1 pr-4 text-center md:mb-0 md:text-left">
            <h3 className="mb-3 text-2xl font-semibold">
              Dynamic Rescheduling
            </h3>
            <p className="mx-auto max-w-[250px] leading-relaxed text-gray-500 md:mx-0">
              When a meeting runs long or priorities shift, Archr doesn't leave
              you with a broken schedule. It recalculates your entire week in
              real time, protecting every deadline.
            </p>
          </div>
          <div className="relative w-56 shrink-0 self-center">
            <ConflictResolution />
          </div>
        </div>

        <div className="flex min-h-[220px] flex-col items-center overflow-hidden rounded-[2rem] border-2 border-gray-100 bg-linear-to-b from-[#FFFFFF] via-[#F4F4F4] to-[#FAFAFA] p-8 md:flex-row">
          <div className="mb-6 flex-1 pr-4 text-center md:mb-0 md:text-left">
            <h3 className="mb-3 text-2xl font-semibold">
              Intelligent Task Breakdown
            </h3>
            <p className="mx-auto max-w-[250px] leading-relaxed text-gray-500 md:mx-0">
              Drop in a project and Archr splits it into actionable sub-tasks,
              like Research, Draft, Review, each with its own time block.
            </p>
          </div>
          <div className="relative w-52 shrink-0">
            <TaskBreakdownAnimation />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Feature;
