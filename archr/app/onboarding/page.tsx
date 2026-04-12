"use client";

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

export default function OnboardingPage() {
  const router = useRouter();
  const [school, setSchool] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleContinue = async () => {
    if (!school.trim()) return;
    setIsSaving(true);
    setError("");

    const { error } = await supabase.auth.updateUser({
      data: { school: school.trim() },
    });

    setIsSaving(false);

    if (error) {
      setError("Could not save. Please try again.");
      return;
    }

    router.push("/onboarding/connect-calendar");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.06),transparent_50%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(59,130,246,0.06),transparent_50%)]" />

      <div className="relative w-full max-w-sm">
        <div className="rounded-2xl border border-slate-200/80 bg-white px-8 py-10 shadow-xl shadow-slate-200/60">

          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Image src="/Logo.png" alt="Archr" width={38} height={38} />
          </div>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500">Step 1 of 2</span>
              <span className="text-xs text-slate-400">50%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100">
              <div className="h-1.5 w-1/2 rounded-full bg-blue-500 transition-all duration-500" />
            </div>
          </div>

          {/* Question */}
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-slate-900">What school are you from?</h1>
            <p className="mt-1 text-sm text-slate-500">Help us personalise your Archr experience.</p>
          </div>

          <div className="relative mb-2">
            <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="e.g. University of Guelph"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleContinue()}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition"
              autoFocus
            />
          </div>

          {error && (
            <p className="mb-3 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-600">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleContinue}
            disabled={!school.trim() || isSaving}
            className="mt-4 w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving…" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
