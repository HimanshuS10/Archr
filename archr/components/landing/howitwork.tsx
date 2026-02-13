"use client";

import { useEffect, useRef, useState } from "react";

const steps = [
  {
    title: "Upload Your PDFs",
    body: "Drop in your syllabus or project outline. We automatically extract deadlines and important dates",
  },
  {
    title: "Set Your Priorities",
    body: "Mark what matters most exams, projects, meetings, workouts.",
  },
  {
    title: "Let AI Schedule It",
    body: "Your tasks are intelligently placed into your calendar based on priority, availability, and workload.",
  },
  {
    title: "Plans Change? We Adjust.",
    body: "Lecture canceled? Meeting moved? Delete the event and your schedule automatically re-optimizes in seconds.",
  },
];

export default function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const cards = Array.from(section.querySelectorAll("[data-step]"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute("data-step"));
            if (!Number.isNaN(index)) setActiveIndex(index);
          }
        });
      },
      { threshold: 0.6 },
    );

    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="how"
      ref={sectionRef}
      className="relative bg-[#060b1a] px-6 pb-32 pt-24 text-white scroll-mt-24"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.22),transparent_55%)]" />
        <div className="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-[#060b1a] to-transparent" />
      </div>

      <div className="relative mx-auto w-full max-w-5xl">
        <p className="text-xs uppercase tracking-[0.4em] text-white/50">
          How it works
        </p>
        <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
          Three steps. Always in sync.
        </h2>
        <p className="mt-6 max-w-2xl text-base text-white/70 sm:text-lg">
          A clean flow that turns your syllabus into an adaptive schedule.
        </p>

        <div className="mt-12 flex gap-8">

          <div className="flex-1 space-y-6">
            {steps.map((step, index) => (
              <div
                key={step.title}
                data-step={index}
                className={`rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition ${
                  index <= activeIndex ? "border-blue-400/40" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                      index <= activeIndex
                        ? "bg-blue-500/30 text-blue-200"
                        : "bg-white/10 text-white/50"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <h3 className="text-base font-semibold text-white">
                    {step.title}
                  </h3>
                </div>
                <p className="mt-3 text-sm text-white/70">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
