"use client";

import LightRays from "@/components/LightRays";
import Navbar from "@/components/landing/navbar";

export default function Hero() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      
      {/* Background Rays */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0">
          <LightRays
            raysOrigin="top-left"
            raysColor="#5683e9"
            raysSpeed={0.1}
            lightSpread={1.0}
            rayLength={4}
            pulsating={false}
            fadeDistance={5}
            saturation={0}
            followMouse
            mouseInfluence={0}
            noiseAmount={0.5}
            distortion={0.05}
          />
        </div>

        <div className="absolute inset-0">
          <LightRays
            raysOrigin="top-right"
            raysColor="#5683e9"
            raysSpeed={0.1}
            lightSpread={1.0}
            rayLength={4  }
            pulsating={false}
            fadeDistance={5}
            saturation={0}
            followMouse
            mouseInfluence={0}
            noiseAmount={0.5}
            distortion={0.05}
          />
        </div>
      </div>

      {/* Foreground Content */}
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 text-center">
        <Navbar />

        <div className="flex flex-1 flex-col items-center justify-center py-24">
          <div className="flex max-w-full flex-wrap items-center justify-center gap-3 rounded-full bg-white/5 px-3 py-2 sm:px-4">
            <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
            <p className="text-xs uppercase tracking-[0.4em] text-white/50 max-sm:text-[10px]">
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

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button className="rounded-full bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600 px-8 py-3 text-sm font-semibold text-white transition hover:scale-105 hover:cursor-pointer">
              Join the waitlist
            </button>

            <button className="rounded-full bg-white/10 px-8 py-3 text-sm font-semibold text-white transition hover:bg-white/20 hover:cursor-pointer">
              See how it works
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
