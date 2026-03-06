"use client";

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

const QUESTIONS = [
  {
    id: "role",
    label: "What best describes you?",
    placeholder: "Student, Founder, Engineer...",
  },
  {
    id: "goal",
    label: "What is your main goal with Archr?",
    placeholder: "Stay organized, reduce stress...",
  },
  {
    id: "workStyle",
    label: "How do you like to plan your day?",
    placeholder: "Time-blocking, to-do lists...",
  },
];


export default function OnboardingPage() {
  const router = useRouter();

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({
    role: "",
    goal: "",
    workStyle: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const current = QUESTIONS[index];
  const value = answers[current.id] ?? "";

  const setAnswer = (val: string) => {
    setAnswers((prev) => ({ ...prev, [current.id]: val }));
  };


  const next = async () => {
    if (!value.trim()) {
      return;
    }

    if (index < QUESTIONS.length - 1) {
      setIndex((p) => p + 1);
      return;
    }

    setSaveError("");
    setIsSaving(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setIsSaving(false);
      setSaveError("Unable to verify your session. Please log in again.");
      console.error("Failed to get authenticated user:", userError?.message);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      data: {
        onboarding_answers: answers,
        onboarding_questions_complete: true,
        onboarding_questions_completed_at: new Date().toISOString(),
        onboarding_complete: true,
      },
    });

    setIsSaving(false);

    if (error) {
      setSaveError("Could not save onboarding answers. Please try again.");
      console.error("Failed to save onboarding answers:", error.message);
      return;
    }

    router.push("/onboarding/connect-calendar");

  };

  return (
    <main className="min-h-screen bg-white text-slate-900 flex items-center justify-center px-6">
      <div className="relative w-full max-w-xl rounded-3xl bg-white p-8 overflow-hidden">

        {/* Card content */}
        <div className="relative w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">

          <div className="flex w-full justify-center">
            <div className="inline-flex items-center gap-3 rounded-full px-4 py-2">
              <Image src="/Logo.png" alt="Archr logo" width={35} height={35} />
              <span className="text-lg -ml-2 font-semibold text-slate-900">Archr</span>
            </div>
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Question {index + 1} of {QUESTIONS.length}
          </p>

          <h1 className="mt-3 text-2xl font-semibold text-slate-900">{current.label}</h1>

          <textarea
            value={value}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={current.placeholder}
            className="mt-4 w-full min-h-28 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
          />

          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIndex((p) => Math.max(0, p - 1))}
              disabled={index === 0}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:cursor-pointer disabled:opacity-40"
            >
              Back
            </button>

            <button
              type="button"
              onClick={next}
              disabled={!value.trim() || isSaving}
              className="rounded-full bg-linear-to-b from-blue-500 via-blue-600 to-blue-700 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 ring-1 ring-inset ring-white/20 transition hover:from-blue-400 hover:via-blue-500 hover:to-blue-600 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {index === QUESTIONS.length - 1 ? (isSaving ? "Saving..." : "Continue") : "Next"}
            </button>
          </div>

          {saveError ? (
            <p className="mt-4 text-sm text-red-500">{saveError}</p>
          ) : null}
        </div>
      </div>
    </main>
  );
}