"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

export default function ConnectCalendarPage() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState("");

  const handleConnect = async () => {
    setIsConnecting(true);
    setError("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        scopes: "https://www.googleapis.com/auth/calendar",
        queryParams: {
          access_type: "offline",
          prompt: "consent",
          include_granted_scopes: "true",
        },
      },
    });

    if (error) {
      setError("Could not connect Google Calendar. Please try again.");
      setIsConnecting(false);
    }
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
              <span className="text-xs font-medium text-slate-500">Step 2 of 2</span>
              <span className="text-xs text-slate-400">100%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100">
              <div className="h-1.5 w-full rounded-full bg-blue-500 transition-all duration-500" />
            </div>
          </div>

          {/* Content */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center ">
              <Image src="/GoogleCalendarLogo.png" alt="Google" width={30} height={30} />
            </div>
            <h1 className="text-xl font-semibold text-slate-900">Connect your calendar</h1>
            <p className="mt-2 text-sm text-slate-500">
              Archr syncs with Google Calendar to automatically schedule and protect your time.
            </p>
          </div>

          <button
            type="button"
            onClick={handleConnect}
            disabled={isConnecting}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Image src="/Google.png" alt="Google" width={17} height={17} />
            {isConnecting ? "Connecting…" : "Connect Google Calendar"}
          </button>

          {error && (
            <p className="mt-3 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-600 text-center">
              {error}
            </p>
          )}

          <a
            href="/dashboard"
            className="mt-4 block text-center text-xs text-slate-400 hover:text-slate-600 transition"
          >
            Skip for now
          </a>
        </div>
      </div>
    </div>
  );
}
