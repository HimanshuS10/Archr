"use client";

import { useEffect, useMemo, useState } from "react";
import HeroAnimation from "./animation/Heroanimation";
import BorderBeam from "./animation/BorderBeam";

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
    <section className="w-full bg-white pt-24 pb-12 sm:pt-28">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 sm:gap-12 sm:px-6">
        <div className="grid gap-6 sm:gap-10 lg:grid-cols-[1fr_360px] lg:items-start">
          <h1 className="text-[28px] leading-[1.1] font-medium tracking-tight text-black sm:text-3xl md:text-[57px] md:leading-[1.05]">
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

          <div className="lg:pt-3">
            <p className="text-[15px] font-semibold tracking-tighter leading-relaxed text-black/60 sm:text-[17px]">
              Archr is an AI calendar that
              automatically schedules your tasks, projects, and goals around
              your priorities and deadlines, so your week always reflects
              what actually matters.
            </p>
            <div className="mt-5 flex sm:mt-6">
              <a
                href="#waitlist"
                className="inline-flex items-center rounded-full bg-linear-to-b from-blue-400 via-blue-500 to-blue-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 ring-1 ring-inset ring-white/20 transition hover:from-blue-300 hover:via-blue-400 hover:to-blue-500"
              >
                Join the waitlist →
              </a>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-black/5 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)] sm:rounded-3xl">
          <HeroAnimation />
          <BorderBeam />
        </div>
      </div>
    </section>
  );
}
