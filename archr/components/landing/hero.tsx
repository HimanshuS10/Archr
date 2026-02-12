"use client";

import LightRays from "@/components/LightRays";
import Navbar from "@/components/landing/navbar";

export default function Hero() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-0 hidden sm:block">
          <div className="absolute inset-0">
            <LightRays
              raysOrigin="top-right"
              raysColor="#4d88ff"
              raysSpeed={0}
              lightSpread={0.8}
              rayLength={5}
              pulsating={false}
              fadeDistance={1}
              saturation={1}
              followMouse
              mouseInfluence={0.1}
              noiseAmount={0.5}
              distortion={0.1}
            />
          </div>
        </div>
      <div className="pointer-events-none absolute inset-0 z-0 hidden sm:block">
          <div className="absolute inset-0">
            <LightRays
              raysOrigin="top-left"
              raysColor="#4d88ff"
              raysSpeed={0}
              lightSpread={0.8}
              rayLength={5}
              pulsating={false}
              fadeDistance={1}
              saturation={1}
              followMouse
              mouseInfluence={0.1}
              noiseAmount={0.5}
              distortion={0.1}
            />
          </div>
        </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 text-center">
        <Navbar />
        <div className="flex flex-1 flex-col items-center justify-center py-24">
          <div className="flex max-w-full flex-wrap items-center justify-center gap-3 rounded-full bg-white/5 px-3 py-2 sm:px-4">
            <span className="h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.8)] animate-pulse sm:h-2.5 sm:w-2.5" />
            <p className="text-[10px] font-normal uppercase tracking-[0.2em] text-white/50 sm:text-xs sm:tracking-[0.4em]">
              AI Powered Productivity Assistant
            </p>
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight leading-tight text-white sm:text-5xl md:text-6xl">
            Stop fighting your calendar.
            <span className="block text-blue-300">Own your time.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base text-white/70 sm:text-lg">
            Stop planning your week manually. Upload your deadlines, set your
            priorities, and let AI rebalance your time automatically.
          </p>
          <div className="mt-10 flex flex-row items-center gap-4 max-sm:flex-row">
            <button className="rounded-full bg-linear-to-b from-blue-400 via-blue-500 to-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 ring-1 ring-inset ring-white/20 transition hover:cursor-pointer hover:from-blue-300 hover:via-blue-150 hover:to-blue-500 [box-shadow:inset_0_2px_6px_rgba(255,255,255,0.25),inset_0_-6px_10px_rgba(0,0,0,0.25),0_12px_30px_rgba(59,130,246,0.35)] max-sm:px-4">
              Join the waitlist
            </button>
            
            <button className="rounded-full bg-linear-to-b from-white/20 via-white/10 to-white/5 px-8 py-3 text-sm font-semibold text-white/90 shadow-lg shadow-white/10 ring-1 ring-inset ring-white/20 transition hover:cursor-pointer hover:from-white/30 hover:via-white/15 hover:to-white/10 [box-shadow:inset_0_2px_6px_rgba(255,255,255,0.18),inset_0_-6px_10px_rgba(0,0,0,0.2),0_10px_24px_rgba(15,23,42,0.35)] max-sm:px-4">
              See how it works
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
