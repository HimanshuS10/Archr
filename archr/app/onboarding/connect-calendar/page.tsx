"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

export default function OnboardingPage() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState("");

  const handleConnectGoogleCalendar = async () => {
    setIsConnecting(true);
    setError("");

    const redirectTo = `${window.location.origin}/auth/callback?next=/dashboard`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        scopes: "https://www.googleapis.com/auth/calendar",
        queryParams: {
          access_type: "offline",
        },
      },
    });

    if (error) {
      setError("Could not connect Google Calendar. Please try again.");
      setIsConnecting(false);
      return;
    }
  };

  return (
    <main className="min-h-screen bg-white text-slate-900 flex items-center justify-center px-6">
      <div className="w-full max-w-xl rounded-3xl bg-white p-8 overflow-hidden">
        <div className="relative w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
          {/* Logo */}
          <div className="flex w-full justify-center mb-8">
            <div className="inline-flex items-center gap-3 rounded-full px-4 py-2">
              <Image src="/Logo.png" alt="Archr logo" width={35} height={35} />
              <span className="text-lg -ml-2 font-semibold text-slate-900">Archr</span>
            </div>
          </div>

          <div className="flex flex-col items-center text-center">
            <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
              Connect Google Calendar
            </h1>
            <p className="mt-3 max-w-md text-sm text-slate-500 sm:text-base">
              Link your calendar to let Archr auto-plan tasks and events around your
              real schedule.
            </p>
          </div>

          <button
            type="button"
            onClick={handleConnectGoogleCalendar}
            disabled={isConnecting}
            className={`mt-8 w-full rounded-full bg-linear-to-b from-blue-500 via-blue-600 to-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 ring-1 ring-inset ring-white/20 transition hover:from-blue-400 hover:via-blue-500 hover:to-blue-600 ${
              isConnecting ? "opacity-60 cursor-not-allowed" : "hover:cursor-pointer"
            }`}
          >
            <span className="inline-flex items-center justify-center gap-2">
              <Image src="/GoogleLogo.png" alt="Google logo" width={18} height={18} />
              {isConnecting ? "Connecting..." : "Connect Google Calendar"}
            </span>
          </button>

          {error ? <p className="mt-4 text-center text-sm text-red-500">{error}</p> : null}
        </div>
      </div>
    </main>
  );
}