"use client";

import { useEffect, useMemo, useState } from "react";

const TYPING_WORDS = ["Week", "Focus", "Calendar", "Deadlines"];

const SCHEDULE_SCENARIOS = [
  {
    label: "Auto-rebalanced",
    beforeTasks: [
      "09:00 - Deep work: Math assignment",
      "10:30 - Team sync",
      "15:00 - Project review",
    ],
    afterTasks: [
      "09:00 - Deep work: Math assignment",
      "12:00 - Team sync",
      "15:30 - Project review",
    ],
    insight: "Moved team sync to noon to preserve deep work.",
  },
  {
    label: "Auto-rebalanced",
    beforeTasks: [
      "09:00 - Deep work: Math assignment",
      "11:30 - Team sync",
      "15:00 - Project review",
    ],
    afterTasks: [
      "08:30 - Deep work: Math assignment",
      "11:30 - Team sync",
      "16:00 - Project review",
    ],
    insight: "Pulled deep work earlier after adding 2 PM meeting.",
  },
  {
    label: "Auto-rebalanced",
    beforeTasks: [
      "09:30 - Deep work: Math assignment",
      "11:30 - Team sync",
      "16:00 - Project review",
    ],
    afterTasks: [
      "09:30 - Deep work: Math assignment",
      "11:30 - Team sync",
      "14:30 - Project review",
    ],
    insight: "Shifted review earlier for tomorrow deadline.",
  },
];

export default function Hero() {
  const [wordIndex, setWordIndex] = useState(0);
  const [typedWord, setTypedWord] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [scenarioIndex, setScenarioIndex] = useState(0);

  const currentWord = TYPING_WORDS[wordIndex];
  const activeScenario = SCHEDULE_SCENARIOS[scenarioIndex];

  useEffect(() => {
    if (!isDeleting && typedWord === currentWord) {
      const pause = setTimeout(() => setIsDeleting(true), 850);
      return () => clearTimeout(pause);
    }

    if (isDeleting && typedWord === "") {
      setIsDeleting(false);
      setWordIndex((prev) => (prev + 1) % TYPING_WORDS.length);
      return;
    }

    const timeout = setTimeout(
      () => {
        const nextLength = typedWord.length + (isDeleting ? -1 : 1);
        setTypedWord(currentWord.slice(0, nextLength));
      },
      isDeleting ? 45 : 85,
    );

    return () => clearTimeout(timeout);
  }, [currentWord, isDeleting, typedWord]);

  useEffect(() => {
    const interval = setInterval(() => {
      setScenarioIndex((prev) => (prev + 1) % SCHEDULE_SCENARIOS.length);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="w-full bg-white pt-28 pb-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6">
        <div className="grid gap-10 lg:grid-cols-[1fr_360px] lg:items-start">
          <h1 className="text-3xl leading-[1.05] font-medium tracking-tight text-black md:text-[57px]">
            Plan Smarter,
            <br />
            Own Your{" "}
            <span className="text-blue-600">
              {typedWord}
              <span className="ml-0.5 inline-block w-[2px] animate-pulse bg-blue-600 align-middle">
                &nbsp;
              </span>
            </span>
          </h1>

          <div className="lg:pt-3 ">
            <div className="text-left">
              <p className="text-[17px] text-left font-semibold tracking-tighter leading-relaxed text-black/60">
                Archr helps you auto-plan tasks around your real schedule, so
                you always know what to do next.
              </p>
            </div>
            <div className="mt-6 flex justify-start">
              <a
                href="#waitlist"
                className="inline-flex items-center rounded-full bg-linear-to-b from-blue-400 via-blue-500 to-blue-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 ring-1 ring-inset ring-white/20 transition hover:from-blue-300 hover:via-blue-400 hover:to-blue-500"
              >
                Join Waitlist
              </a>
            </div>
          </div>
        </div>

        {/* Calendar UI Comparison Container */}
        <div className="relative overflow-hidden rounded-3xl border border-black/5 bg-linear-to-b from-white to-[#ececec] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.08)] md:p-10">
          
          <div className="flex flex-col gap-6 md:flex-row md:items-stretch md:gap-8">
            {/* Before Column */}
            <div className="flex-1 rounded-2xl border border-black/5 bg-black/[0.03] p-5 transition-all">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-black/40">
                Messy Schedule
              </h3>
              <div className="flex flex-col gap-3">
                {activeScenario.beforeTasks.map((task, idx) => {
                  const [time, name] = task.split(" - ");
                  return (
                    <div
                      key={`before-${scenarioIndex}-${idx}`}
                      className="flex items-start rounded-xl border border-black/5 bg-white/50 p-3 shadow-sm transition-all animate-in fade-in slide-in-from-bottom-2 duration-500"
                    >
                      <span className="w-14 text-xs font-semibold text-black/40">
                        {time}
                      </span>
                      <span className="text-sm font-medium text-black/60">
                        {name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Middle Arrow */}
            <div className="flex items-center justify-center md:flex-col">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 shadow-sm ring-4 ring-white">
                <svg
                  className="h-5 w-5 rotate-90 md:rotate-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </div>
            </div>

            {/* After Column */}
            <div className="flex-1 rounded-2xl border border-blue-600/10 bg-white p-5 shadow-[0_8px_30px_rgb(37,99,235,0.08)] transition-all">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  With Archr
                </h3>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-600 animate-pulse">
                  {activeScenario.label}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {activeScenario.afterTasks.map((task, idx) => {
                  const [time, name] = task.split(" - ");
                  return (
                    <div
                      key={`after-${scenarioIndex}-${idx}`}
                      className="flex items-start rounded-xl border border-blue-100 bg-blue-50/50 p-3 shadow-sm transition-all animate-in fade-in slide-in-from-bottom-2 duration-500"
                    >
                      <span className="w-14 text-xs font-bold text-blue-600">
                        {time}
                      </span>
                      <span className="text-sm font-semibold text-slate-800">
                        {name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Insight Banner */}
          <div className="mt-8 flex justify-center">
            <div
              key={scenarioIndex}
              className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-medium text-white shadow-xl animate-in zoom-in-95 fade-in duration-500"
            >
              <span className="text-blue-400">✨</span>
              {activeScenario.insight}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}