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

    const redirectTo = `${window.location.origin}/dashboard`;

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
    <main className="min-h-screen bg-[#05060f] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b0d16] p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold">Connect your calendar</h1>
          <p className="mt-2 text-sm text-white/60">
            Link Google Calendar so Archr can build your schedule.
          </p>
        </div>

        <button
          type="button"
          onClick={handleConnectGoogleCalendar}
          disabled={isConnecting}
          className={`w-full flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-3 text-sm transition hover:border-white/30 ${
            isConnecting ? "opacity-60 cursor-not-allowed" : "hover:cursor-pointer"
          }`}
        >
          <Image src="/Google.png" alt="Google logo" width={18} height={18} />
          {isConnecting ? "Connecting..." : "Connect Google Calendar"}
        </button>

        {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}

        <p className="mt-6 text-center text-xs text-white/50">
          You can always reconnect later from settings.
        </p>
      </div>
    </main>
  );
}