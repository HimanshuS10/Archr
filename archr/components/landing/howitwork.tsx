"use client";

import { Plug, Timer, Calendar as CalendarIcon, PlusIcon } from "lucide-react";
import Image from "next/image";

export default function HowItWorks() {
  return (
    <section className="w-full bg-white px-4 py-14 md:px-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 relative items-start">
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
            focus, just three
            <br />
            simple steps.
          </h2>
        </div>

        <div className="md:col-span-7 flex flex-col gap-8">
          <div className="sticky top-32 w-full h-[400px] bg-linear-to-b from-[#FFFFFF] via-[#F4F4F4] to-[#FAFAFA] border border-gray-100 rounded-[2rem] p-8 shadow-sm flex flex-col overflow-hidden">
            <div className="flex items-start gap-4 relative z-10">
              <div className="bg-[#4F84FF] p-2.5 rounded-full text-white shrink-0">
                <span className="text-white text-xl font-medium p-2.5">1</span>
              </div>
              <div>
                <h3 className="text-2xl font-medium tracking-tight mb-1">
                  Connect your calendars
                </h3>
                <p className="text-gray-500">
                  Securely link your calendar. Archr reads
                  your fixed commitments so it knows exactly what space it has
                  to work with.
                </p>
              </div>
            </div>

            <div className="mt-8 grow rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <Image
                src="/Sync.png"
                alt="Sync Your World"
                width={1000}
                height={1000}
                draggable="false"
              />
            </div>
          </div>

          {/* CARD 2 */}
          <div className="sticky top-32 w-full h-[400px] bg-linear-to-b from-[#FFFFFF] via-[#F4F4F4] to-[#FAFAFA] border border-gray-100 rounded-[2rem] p-8 shadow-md flex flex-col overflow-hidden">
            <div className="flex items-start gap-4 relative z-10">
              <div className="bg-[#4F84FF] p-2.5 rounded-full text-white shrink-0">
                <span className="text-white text-xl font-medium p-2">2</span>
              </div>
              <div>
                <h3 className="text-2xl font-medium tracking-tight mb-1">
                  Add your tasks and deadlines
                </h3>
                <p className="text-gray-500">
                  Input what needs to get done, set your priorities, and tell
                  Archr your preferred working hours. It slots everything in
                  around your real schedule, no manual effort.
                </p>
              </div>
            </div>
            <div className="flex-1 relative mt-8 bg-white border border-gray-100 rounded-2xl shadow-sm p-4 overflow-hidden flex flex-col items-center justify-center gap-3">
              {/* Pulse rings */}
              <div className="relative flex items-center justify-center">
                <div className="absolute w-16 h-16 rounded-full bg-blue-500/10 animate-ping" />
                <div className="absolute w-12 h-12 rounded-full bg-blue-500/15 animate-ping [animation-delay:150ms]" />

                {/* Blue circle button */}
                <div className="relative w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shadow-md shadow-blue-500/30 z-10">
                  <PlusIcon
                    size={20}
                    strokeWidth={2.5}
                    className="text-white"
                  />
                </div>
              </div>

              <div className="text-sm font-medium text-gray-400">
                Add your tasks
              </div>
            </div>{" "}
          </div>

          <div className="sticky top-48 w-full h-[400px] bg-linear-to-b from-[#FFFFFF] via-[#F4F4F4] to-[#FAFAFA] border border-gray-100 rounded-[2rem] p-8 shadow-lg flex flex-col overflow-hidden">
            <div className="flex items-start gap-4 relative z-10">
              <div className="bg-[#4F84FF] p-2.5 rounded-full text-white shrink-0">
                <span className="text-white text-xl font-medium p-2">3</span>
              </div>
              <div>
                <h3 className="text-2xl font-medium tracking-tight mb-1">
                  Let Archr own the rest
                </h3>
                <p className="text-gray-500">
                  As your week changes, Archr adjusts.
                  Deadlines shift, meetings move, priorities change, your
                  schedule rebalances automatically so nothing falls through.
                </p>
              </div>
            </div>
            <div className="mt-8 grow rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-gray-500">
                Before vs After
              </p>
              <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-start gap-2">
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                    Before
                  </p>
                  <div className="rounded-md bg-gray-100 px-2 py-1.5 text-[11px] text-gray-600">
                    Review @ 4:00 PM
                  </div>
                  <div className="rounded-md bg-gray-100 px-2 py-1.5 text-[11px] text-gray-600">
                    Study @ 6:30 PM
                  </div>
                </div>
                <div className="pt-7 text-blue-600">→</div>
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600">
                    After
                  </p>
                  <div className="rounded-md bg-blue-50 px-2 py-1.5 text-[11px] text-blue-700">
                    Review @ 2:30 PM
                  </div>
                  <div className="rounded-md bg-blue-50 px-2 py-1.5 text-[11px] text-blue-700">
                    Study @ 5:00 PM
                  </div>
                </div>
              </div>
              <div className="mt-4 h-2 rounded-full bg-gray-100">
                <div className="h-2 w-4/5 rounded-full bg-blue-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
