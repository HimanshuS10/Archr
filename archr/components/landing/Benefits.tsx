"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

// ─── Google Calendar Icon ─────────────────────────────────────────────────────

const GoogleCalendarIcon: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="6" width="32" height="30" rx="5" fill="white" stroke="#E5E7EB" strokeWidth="1" />
    <rect x="4" y="6" width="32" height="9" rx="5" fill="#4285F4" />
    <rect x="4" y="11" width="32" height="4" fill="#4285F4" />
    <line x1="4" y1="18" x2="36" y2="18" stroke="#E5E7EB" strokeWidth="0.8" />
    <line x1="4" y1="24" x2="36" y2="24" stroke="#E5E7EB" strokeWidth="0.8" />
    <line x1="4" y1="30" x2="36" y2="30" stroke="#E5E7EB" strokeWidth="0.8" />
    <line x1="15" y1="15" x2="15" y2="36" stroke="#E5E7EB" strokeWidth="0.8" />
    <line x1="25" y1="15" x2="25" y2="36" stroke="#E5E7EB" strokeWidth="0.8" />
    <text x="20" y="14" textAnchor="middle" fontSize="5" fontWeight="600" fill="white" fontFamily="system-ui">MAR</text>
    <text x="20" y="28" textAnchor="middle" fontSize="11" fontWeight="700" fill="#4285F4" fontFamily="system-ui">31</text>
    <circle cx="10" cy="6" r="2.5" fill="#4285F4" />
    <circle cx="30" cy="6" r="2.5" fill="#4285F4" />
  </svg>
);

// ─── Data ─────────────────────────────────────────────────────────────────────

const EVENT_PILLS = [
  { label: "Team standup · 10am",  bg: "#E6F1FB", text: "#0C447C" },
  { label: "Deep work · 11am",       bg: "#E1F5EE", text: "#085041" },
  { label: "Client call · 2pm",     bg: "#FAEEDA", text: "#633806" },
];

const STATUS_MSGS = [
  "Connected · Syncing in real time",
  "3 new events pulled from Google Calendar",
  "Schedule updated · All events synced",
  "Connected · Syncing in real time",
];

const COMING_SOON = ["Outlook", "Apple Calendar", "Notion", "Linear"];

// ─── Component ────────────────────────────────────────────────────────────────

export default function IntegrationsArc() {
  const [statusIdx, setStatusIdx] = useState(0);
  const [syncCount, setSyncCount] = useState(147);

  useEffect(() => {
    const t = setInterval(() => {
      setStatusIdx((i) => (i + 1) % STATUS_MSGS.length);
      setSyncCount((c) => c + Math.floor(Math.random() * 3) + 1);
    }, 2800);
    return () => clearInterval(t);
  }, []);

  return (
    <section id="integrations" className="w-full bg-white flex flex-col items-center py-16 px-4 md:px-8 overflow-hidden">

      {/* Label pill */}
      <div className="w-fit px-4 py-1.5 bg-white border border-gray-200 rounded-full shadow-sm mb-8">
        <span className="text-gray-600 text-sm font-medium tracking-tight">Integrations</span>
      </div>

      {/* Heading */}
      <h2 className="text-3xl md:text-5xl font-semibold text-center text-black mb-4 leading-tight tracking-tight">
        Plugs straight into
        <br className="hidden md:block" /> Google Calendar
      </h2>
      <p className="text-gray-400 text-center text-base mb-14 max-w-sm leading-relaxed">
        One click to connect. Archr reads your existing events and plans around them automatically.
      </p>

      {/* ── Integration card ── */}
      <div className="w-full max-w-lg">
        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">

          {/* Connection diagram */}
          <div className="flex items-center justify-between gap-4 mb-8">

            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <div
                className="w-16 h-16 rounded-2xl bg-white border border-gray-200 flex items-center justify-center"
                style={{ boxShadow: "0 4px 16px rgba(66,133,244,0.14)" }}
              >
                <Image src="/GoogleCalendarLogo.png" alt="Google Calendar" width={30} height={30} />
              </div>
              <span className="text-[11px] font-medium text-gray-400">Google Calendar</span>
            </div>

            <div className="flex-1 relative h-8 flex items-center">
              <div className="w-full h-px bg-gray-200 absolute" />
              {[0, 0.8, 1.6].map((d, i) => (
                <div
                  key={`ltr${i}`}
                  style={{
                    position: "absolute",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#4285F4",
                    animation: `dotLTR 2.4s ease-in-out infinite`,
                    animationDelay: `${d}s`,
                    opacity: 0,
                  }}
                />
              ))}

              {[0.4, 1.2, 2.0].map((d, i) => (
                <div
                  key={`rtl${i}`}
                  style={{
                    position: "absolute",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#1D9E75",
                    animation: `dotRTL 2.4s ease-in-out infinite`,
                    animationDelay: `${d}s`,
                    opacity: 0,
                  }}
                />
              ))}

              <div
                className="absolute left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-full px-2.5 py-1 flex items-center gap-1.5"
                style={{ zIndex: 2, boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full bg-green-500"
                  style={{ animation: "livePulse 2s ease-in-out infinite" }}
                />
                <span className="text-[10px] font-semibold text-gray-400">live</span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <div
                className="w-16 h-16 rounded-2xl bg-white border border-gray-200 flex items-center justify-center"
                style={{ boxShadow: "0 4px 16px rgba(29,158,117,0.14)" }}
              >
                <Image src="/Logo.png" alt="Archr" width={40} height={40} />
              </div>
              <span className="text-[11px] font-medium text-gray-400">Archr</span>
            </div>
          </div>

          {/* Synced events list */}
          <div className="bg-gray-50 rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Synced events
              </span>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "#E1F5EE", color: "#085041" }}
              >
                {syncCount} synced
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {EVENT_PILLS.map((pill, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium"
                  style={{
                    background: pill.bg,
                    color: pill.text,
                    animation: "pillFadeIn 0.5s ease forwards",
                    animationDelay: `${i * 0.15}s`,
                    opacity: 0,
                  }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: pill.text, opacity: 0.5 }}
                  />
                  {pill.label}
                  <span className="ml-auto text-[10px] opacity-50">just now</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status bar */}
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"
              style={{ animation: "livePulse 2s ease-in-out infinite" }}
            />
            <span className="text-xs text-gray-400 font-medium">
              {STATUS_MSGS[statusIdx]}
            </span>
          </div>
        </div>

        {/* Coming soon */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <span className="text-[10px] text-gray-300 font-semibold uppercase tracking-widest">
            More integrations coming soon
          </span>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {COMING_SOON.map((name) => (
              <div
                key={name}
                className="px-3 py-1.5 rounded-full text-xs font-medium text-gray-300"
                style={{ border: "1px dashed #E5E7EB" }}
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes dotLTR {
          0%   { left: 0%;   opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }
        @keyframes dotRTL {
          0%   { left: 100%; opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { left: 0%;   opacity: 0; }
        }
        @keyframes livePulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        @keyframes pillFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}