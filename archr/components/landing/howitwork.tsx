"use client";

import { Plug, Timer, Calendar as CalendarIcon } from "lucide-react";

export default function HowItWorks() {
  return (
    <section className="w-full bg-white px-4 py-14 md:px-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 relative items-start">
        {/* LEFT COLUMN: Sticky Header Content */}
        <div className="md:col-span-5 sticky top-32">
          <div className="flex items-center w-full mb-8">
            <div className="w-fit px-4 py-1.5 bg-white border border-gray-200 rounded-full shadow-sm mr-4">
              <span className="text-gray-600 text-sm font-medium tracking-tight">
                How It Works
              </span>
            </div>
            <hr className="border-gray-300 w-[300px]" />
          </div>

          <h2 className="text-4xl md:text-5xl font-medium tracking-tight leading-[1.15]">
            From setup to
            <br />
            focus—just three
            <br />
            simple steps.
          </h2>
        </div>

        <div className="md:col-span-7 flex flex-col gap-8">
          {/* CARD 1 */}
          <div className="sticky top-32 w-full h-[400px] bg-linear-to-b from-[#FFFFFF] via-[#F4F4F4] to-[#FAFAFA] border border-gray-100 rounded-[2rem] p-8 shadow-sm flex flex-col overflow-hidden">
            <div className="flex items-start gap-4 relative z-10">
              <div className="bg-[#4F84FF] p-2.5 rounded-full text-white shrink-0">
                <Plug size={24} strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-2xl font-medium tracking-tight mb-1">
                  Sync Your World
                </h3>
                <p className="text-gray-500">
                  Securely link your existing calendars and task managers in
                  minutes.
                </p>
              </div>
            </div>

            <div className="mt-8 grow rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500">Connected sources</p>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                  Live sync
                </span>
              </div>
              <div className="relative h-40">
                <div className="absolute left-2 top-5 h-3 w-3 rounded-full bg-blue-500" />
                <div className="absolute left-20 top-14 h-3 w-3 rounded-full bg-indigo-400" />
                <div className="absolute right-10 top-8 h-3 w-3 rounded-full bg-sky-400" />
                <div className="absolute right-3 bottom-6 h-3 w-3 rounded-full bg-blue-600" />
                <svg
                  className="absolute inset-0 h-full w-full"
                  viewBox="0 0 300 160"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M18 22 C70 40, 70 55, 102 70" stroke="#3B82F6" strokeOpacity="0.7" strokeWidth="2" />
                  <path d="M102 70 C150 55, 190 40, 252 34" stroke="#6366F1" strokeOpacity="0.7" strokeWidth="2" />
                  <path d="M102 70 C160 90, 210 100, 284 128" stroke="#0EA5E9" strokeOpacity="0.7" strokeWidth="2" />
                </svg>
              </div>
            </div>
          </div>

          {/* CARD 2 */}
          <div className="sticky top-40 w-full h-[400px] bg-linear-to-b from-[#FFFFFF] via-[#F4F4F4] to-[#FAFAFA] border border-gray-100 rounded-[2rem] p-8 shadow-md flex flex-col overflow-hidden">
            <div className="flex items-start gap-4 relative z-10">
              <div className="bg-[#4F84FF] p-2.5 rounded-full text-white shrink-0">
                <Timer size={24} strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-2xl font-medium tracking-tight mb-1">
                  Auto-Plan Tasks
                </h3>
                <p className="text-gray-500">
                  Watch as tasks are dynamically slotted around your real
                  meetings.
                </p>
              </div>
            </div>

            <div className="flex-1 relative mt-8 bg-white border border-gray-100 rounded-2xl shadow-sm p-4 overflow-hidden">
              <div className="absolute top-4 bg-white border border-gray-100 shadow-sm px-3 py-1 rounded-lg text-sm z-10">
                <span className="text-[#4F84FF] font-medium">Deep Work</span>{" "}
                <span className="text-gray-600">scheduled at 9:00 AM</span>
              </div>
              <div className="mt-8 grid grid-cols-[54px_1fr] gap-3">
                <div className="space-y-3 pt-2 text-[10px] text-gray-400">
                  <p>08:00</p>
                  <p>10:00</p>
                  <p>12:00</p>
                  <p>14:00</p>
                </div>
                <div className="relative space-y-3">
                  <div className="h-8 rounded-lg bg-gray-100" />
                  <div className="h-8 rounded-lg bg-gray-100" />
                  <div className="h-8 rounded-lg bg-gray-100" />
                  <div className="h-8 rounded-lg bg-gray-100" />
                  <div className="absolute left-0 top-11 h-8 w-[72%] rounded-lg bg-blue-500/80 shadow-sm" />
                  <div className="absolute left-[30%] top-32 h-8 w-[55%] rounded-lg bg-indigo-400/70 shadow-sm" />
                </div>
              </div>
            </div>

            <div className="absolute bottom-6 right-6 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-medium">
              02
            </div>
          </div>

          {/* CARD 3 */}
          <div className="sticky top-48 w-full h-[400px] bg-linear-to-b from-[#FFFFFF] via-[#F4F4F4] to-[#FAFAFA] border border-gray-100 rounded-[2rem] p-8 shadow-lg flex flex-col overflow-hidden">
            <div className="flex items-start gap-4 relative z-10">
              <div className="bg-[#4F84FF] p-2.5 rounded-full text-white shrink-0">
                <CalendarIcon size={24} strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-2xl font-medium tracking-tight mb-1">
                  Reclaim Your Time
                </h3>
                <p className="text-gray-500">
                  Adapt on the fly. When deadlines change, your schedule
                  automatically rebalances.
                </p>
              </div>
            </div>
            <div className="mt-8 grow rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-gray-500">Before vs After</p>
              <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-start gap-2">
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Before</p>
                  <div className="rounded-md bg-gray-100 px-2 py-1.5 text-[11px] text-gray-600">Review @ 4:00 PM</div>
                  <div className="rounded-md bg-gray-100 px-2 py-1.5 text-[11px] text-gray-600">Study @ 6:30 PM</div>
                </div>
                <div className="pt-7 text-blue-600">→</div>
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600">After</p>
                  <div className="rounded-md bg-blue-50 px-2 py-1.5 text-[11px] text-blue-700">Review @ 2:30 PM</div>
                  <div className="rounded-md bg-blue-50 px-2 py-1.5 text-[11px] text-blue-700">Study @ 5:00 PM</div>
                </div>
              </div>
              <div className="mt-4 h-2 rounded-full bg-gray-100">
                <div className="h-2 w-4/5 rounded-full bg-blue-500" />
              </div>
            </div>
            <div className="absolute bottom-6 right-6 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-medium">
              03
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
