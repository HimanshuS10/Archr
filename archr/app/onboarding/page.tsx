"use client";

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
    setAnswers((prev) => ({...prev, [current.id]: val}));
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
    <main className="min-h-screen bg-[#05060f] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#0b0d16] p-8">
        <p className="text-sm text-white/60">
          Question {index + 1} of {QUESTIONS.length}
        </p>

        <h1 className="mt-3 text-2xl font-semibold">{current.label}</h1>

        <textarea
          value={value}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder={current.placeholder}
          className="mt-4 w-full min-h-28 rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIndex((p) => Math.max(0, p - 1))}
            disabled={index === 0}
            className="rounded-full border border-white/15 px-4 py-2 text-sm disabled:opacity-40"
          >
            Back
          </button>

          <button
            type="button"
            onClick={next}
            disabled={!value.trim() || isSaving}
            className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold disabled:opacity-50"
          >
            {index === QUESTIONS.length - 1 ? (isSaving ? "Saving..." : "Continue") : "Next"}
          </button>
        </div>
        {saveError ? (
          <p className="mt-4 text-sm text-red-400">{saveError}</p>
        ) : null}
      </div>
    </main>
  );
}