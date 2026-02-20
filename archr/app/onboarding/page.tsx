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
          prompt: "consent",
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#05060f] px-6 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(59,130,246,0.2),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_85%,rgba(59,130,246,0.18),transparent_48%)]" />
      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/35 via-transparent to-transparent" />

      <div className="relative w-full max-w-xl rounded-3xl border border-white/10 bg-[#0b0d16]/95 p-8 backdrop-blur-md sm:p-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-3 rounded-full px-4 py-2">
            <Image src="/Logo.png" alt="Archr logo" width={38} height={38} />
            <span className="text-xl font-semibold tracking-wide">Archr</span>
          </div>

          <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
            Connect Google Calendar
          </h1>
          <p className="mt-3 max-w-md text-sm text-white/65 sm:text-base">
            Link your calendar to let Archr auto-plan tasks and events around your
            real schedule.
          </p>
        </div>

        <button
          type="button"
          onClick={handleConnectGoogleCalendar}
          disabled={isConnecting}
          className={`w-full rounded-full bg-linear-to-b from-blue-400 via-blue-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 ring-1 ring-inset ring-white/20 transition ${
            isConnecting ? "opacity-60 cursor-not-allowed" : "hover:cursor-pointer"
          }`}
        >
          <span className="inline-flex items-center justify-center gap-2">
            <Image src="/GoogleLogo.png" alt="Google logo" width={18} height={18} />
            {isConnecting ? "Connecting..." : "Connect Google Calendar"}
          </span>
        </button>

        {error ? <p className="mt-4 text-center text-sm text-red-400">{error}</p> : null}

      </div>
    </main>
  );
}