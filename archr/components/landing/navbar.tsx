"use client";
import Image from "next/image";

export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 w-full z-50 py-4">
      <div className="max-w-4xl mx-auto px-4">
        {/* Glassmorphic navbar container */}
        <div className="bg-white/80 backdrop-blur-md border border-white/20 px-8 py-4 ">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <Image src="/Logo.png" alt="Archr" width={36} height={36} />
              <span className="text-xl font-semibold text-gray-900" style={{ fontFamily: "Inter, sans-serif" }}>
                Archr
              </span>
            </div>

            {/* Links */}
            <nav className="hidden items-center gap-8 md:flex">
              <a 
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors duration-200"
                href="#features"
              >
                Features
              </a>
              <a 
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors duration-200"
                href="#pricing"
              >
                Pricing
              </a>
              <a 
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors duration-200"
                href="#faq"
              >
                FAQ
              </a>
            </nav>

            {/* Join waitlist button */}
            <a
              href="#waitlist"
              className="bg-gray-900 text-white text-sm font-semibold px-6 py-2 rounded-full hover:bg-gray-800 transition-colors duration-200"
            >
              Join waitlist
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
