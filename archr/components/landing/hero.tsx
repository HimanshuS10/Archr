"use client";

import LightRays from "@/components/LightRays";
import Navbar from "@/components/landing/navbar";

export default function Hero() {
    return (
        <>
            <div className="pointer-events-none absolute inset-0">
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
            <div className="pointer-events-none absolute inset-0">
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
                <div className="flex flex-1 flex-col items-center justify-center py-16">
                    <p className="text-xs uppercase tracking-[0.4em] text-white/50">
                        Intelligent Scheduling for Students
                    </p>
                    <h1 className="mt-6 text-4xl font-semibold leading-tight text-white sm:text-5xl md:text-6xl">
                        Stop fighting your calendar.
                        <span className="block text-blue-300">Own your time.</span>
                    </h1>
                    <p className="mt-6 max-w-xl text-base text-white/70 sm:text-lg">
                        Upload your course outlines, sync your calendar, and let Archr
                        automatically schedule your work when plans change.
                    </p>
                    <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
                        <button className="rounded-full bg-linear-to-b from-blue-400 via-blue-500 to-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 ring-1 ring-inset ring-white/20 transition hover:scale-105 active:scale-95 [box-shadow:inset_0_2px_6px_rgba(255,255,255,0.25),inset_0_-6px_10px_rgba(0,0,0,0.25),0_12px_30px_rgba(59,130,246,0.35)]">
                            Join the waitlist
                        </button>
                        <button className="rounded-full bg-white/5 px-8 py-3 text-sm font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/10 backdrop-blur-sm">
                            See how it works
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}