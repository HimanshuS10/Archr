import React from "react";

const CalendarGraphic = () => (
  <div className="w-full max-w-[220px] rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
    <div className="mb-3 flex items-center justify-between">
      <span className="text-xs font-medium text-gray-500">This week</span>
      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
        Auto
      </span>
    </div>
    <div className="space-y-2">
      <div className="h-2 w-full rounded-full bg-gray-100">
        <div className="h-2 w-2/3 rounded-full bg-blue-500" />
      </div>
      <div className="h-2 w-full rounded-full bg-gray-100">
        <div className="h-2 w-1/2 rounded-full bg-indigo-400" />
      </div>
      <div className="h-2 w-full rounded-full bg-gray-100">
        <div className="h-2 w-4/5 rounded-full bg-sky-400" />
      </div>
    </div>
  </div>
);

const ChecklistFlowGraphic = () => (
  <div className="w-full max-w-[220px] rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
    <div className="space-y-2">
      {["Lecture notes", "Practice set", "Review session"].map((task, i) => (
        <div key={task} className="flex items-center gap-2 rounded-lg bg-gray-50 px-2 py-1.5">
          <span
            className={`h-4 w-4 rounded border text-[10px] leading-4 text-center ${
              i < 2
                ? "border-green-300 bg-green-100 text-green-700"
                : "border-blue-300 bg-blue-100 text-blue-700"
            }`}
          >
            {i < 2 ? "✓" : "·"}
          </span>
          <span className="text-xs text-gray-700">{task}</span>
        </div>
      ))}
    </div>
  </div>
);

const AnalyticsGraphic = () => (
  <div className="flex h-36 w-full max-w-[220px] items-end gap-2 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
    {[30, 55, 42, 75, 60, 90].map((h, idx) => (
      <div key={idx} className="flex-1 rounded-t-md bg-blue-500/80" style={{ height: `${h}%` }} />
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

const TaskSplitGraphic = () => (
  <div className="w-full max-w-[220px] rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
    <div className="space-y-2">
      <div className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-700">
        Build final presentation
      </div>
      <div className="ml-3 border-l-2 border-dashed border-blue-300 pl-3">
        <div className="mb-1 rounded bg-blue-50 px-2 py-1 text-[11px] text-blue-700">
          Draft outline
        </div>
        <div className="mb-1 rounded bg-blue-50 px-2 py-1 text-[11px] text-blue-700">
          Create slides
        </div>
        <div className="rounded bg-blue-50 px-2 py-1 text-[11px] text-blue-700">
          Rehearse
        </div>
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
        <span className="text-sm font-medium tracking-tight text-gray-600">Features</span>
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
            Let AI instantly find the perfect time slots for your tasks and meetings without the back-and-forth.
          </p>
          <div className="relative mt-auto flex w-full grow items-center justify-center">
            <CalendarGraphic />
          </div>
        </div>

        <div className="flex h-[420px] flex-col overflow-hidden rounded-[2rem] border-2 border-gray-100 bg-linear-to-b from-[#FFFFFF] via-[#F4F4F4] to-[#FAFAFA] p-8">
          <h3 className="mb-3 text-2xl font-semibold">Unified Task Management</h3>
          <p className="mb-8 leading-relaxed text-gray-500">
            Stop switching apps. Bring your daily to-do list and your schedule together into one seamless view.
          </p>
          <div className="relative mt-auto flex w-full grow items-center justify-center">
            <ChecklistFlowGraphic />
          </div>
        </div>

        <div className="flex h-[420px] flex-col overflow-hidden rounded-[2rem] border-2 border-gray-100 bg-linear-to-b from-[#FFFFFF] via-[#F4F4F4] to-[#FAFAFA] p-8">
          <h3 className="mb-3 text-2xl font-semibold">Productivity Analytics</h3>
          <p className="mb-8 leading-relaxed text-gray-500">
            Understand exactly where your hours go and optimize your week with visual, actionable insights.
          </p>
          <div className="relative mt-auto flex w-full grow items-center justify-center">
            <AnalyticsGraphic />
          </div>
        </div>
      </div>

      <div className="mt-6 grid w-full max-w-6xl grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex min-h-[220px] flex-col items-center overflow-hidden rounded-[2rem] border-2 border-gray-100 bg-linear-to-b from-[#FFFFFF] via-[#F4F4F4] to-[#FAFAFA] p-8 md:flex-row">
          <div className="mb-6 flex-1 pr-4 text-center md:mb-0 md:text-left">
            <h3 className="mb-3 text-2xl font-semibold">Dynamic Time Blocking</h3>
            <p className="mx-auto max-w-[250px] leading-relaxed text-gray-500 md:mx-0">
              Automatically protect your focus time. If a meeting runs late, your schedule instantly adapts and shifts.
            </p>
          </div>
          <div className="relative flex h-24 w-48 shrink-0 items-center justify-center">
            <TimeBlockGraphic />
          </div>
        </div>

        <div className="flex min-h-[220px] flex-col items-center overflow-hidden rounded-[2rem] border-2 border-gray-100 bg-linear-to-b from-[#FFFFFF] via-[#F4F4F4] to-[#FAFAFA] p-8 md:flex-row">
          <div className="mb-6 flex-1 pr-4 text-center md:mb-0 md:text-left">
            <h3 className="mb-3 text-2xl font-semibold">Intelligent Task Breakdown</h3>
            <p className="mx-auto max-w-[250px] leading-relaxed text-gray-500 md:mx-0">
              Turn daunting projects into bite-sized actions. Let AI automatically split complex events into a clear sequence of manageable sub-tasks.
            </p>
          </div>
          <div className="relative flex h-24 w-48 shrink-0 items-center justify-center">
            <TaskSplitGraphic />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Feature;