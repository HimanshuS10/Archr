"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
export default function Navbar() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed left-1/2 top-5 z-50 w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2 transition-all duration-500">
      <div
        className={`flex items-center justify-between gap-6 rounded-full px-6 py-3 text-sm transition-all duration-300 ${
          show
            ? "border border-white/10 bg-white/5 backdrop-blur-md py-3 shadow-xl shadow-black/20"
            : "border-transparent bg-transparent py-5"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 font-semibold text-white">
          <Image src="/Logo.png" alt="Archr" width={40} height={40} />
          <span className="text-2xl font-bold">Archr</span>
        </div>

        {/* Links - Always visible, but color shifts slightly for readability */}
        <nav
          className={`hidden items-center gap-6 md:flex transition-colors ${show ? "text-white/80" : "text-white"}`}
        >
          <a className="transition hover:text-blue-300" href="#about">
            About
          </a>
          <a className="transition hover:text-blue-300" href="#features">
            Features
          </a>
          <a className="transition hover:text-blue-300" href="#pricing">
            Pricing
          </a>
        </nav>

        {/* Button */}
        <button className="rounded-full bg-linear-to-b from-blue-400 via-blue-500 to-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/30 ring-1 ring-inset ring-white/20 transition hover:scale-105 [box-shadow:inset_0_2px_6px_rgba(255,255,255,0.25),inset_0_-6px_10px_rgba(0,0,0,0.25),0_12px_30px_rgba(59,130,246,0.35)] sm:text-sm">
          Join waitlist
        </button>
      </div>
    </header>
  );
}
