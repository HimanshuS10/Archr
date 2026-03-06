"use client";

import Image from "next/image";

export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 z-50 w-full bg-white border-b border-gray-100">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">

        {/* Logo + Name */}
        <div className="flex items-center gap-2">
          <Image
            src="/Logo.png"
            alt="Archr Logo"
            width={32}
            height={32}
          />
          <a
            href="/"
            className="text-xl font-semibold tracking-tight text-black"
          >
            Archr
          </a>
        </div>

        <nav className="hidden items-center gap-8 md:flex">
          <a className="text-sm font-semibold text-black/70 transition hover:text-black" href="#features">
            Features
          </a>
          <a className="text-sm font-semibold text-black/70 transition hover:text-black" href="#pricing">
            Pricing
          </a>
          <a className="text-sm font-semibold text-black/70 transition hover:text-black" href="#faq">
            FAQ
          </a>
          <a className="text-sm font-semibold text-white transition hover:text-white bg-linear-to-b from-blue-400 via-blue-500 to-blue-600 px-3 py-2 rounded-4xl hover:from-blue-300 hover:via-blue-400 hover:to-blue-500" href="#waitlist">
            Join Waitlist
          </a>
        </nav>

        <a
          href="#waitlist"
          className="text-sm text-black/70 transition hover:text-black md:hidden"
        >
          Join Waitlist
        </a>
      </div>
    </header>
  );
}