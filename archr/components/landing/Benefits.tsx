"use client";

import React from "react";
import Image from "next/image";
// ─── Icon components ──────────────────────────────────────────────────────────

const GoogleCalendarIcon: React.FC<{ className?: string }> = ({
  className = "",
}) => (
  <svg
    viewBox="0 0 40 40"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="4"
      y="6"
      width="32"
      height="30"
      rx="5"
      fill="white"
      stroke="#E5E7EB"
      strokeWidth="1"
    />
    <rect x="4" y="6" width="32" height="9" rx="5" fill="#4285F4" />
    <rect x="4" y="11" width="32" height="4" fill="#4285F4" />
    {/* Calendar grid lines */}
    <line x1="4" y1="18" x2="36" y2="18" stroke="#E5E7EB" strokeWidth="0.8" />
    <line x1="4" y1="24" x2="36" y2="24" stroke="#E5E7EB" strokeWidth="0.8" />
    <line x1="4" y1="30" x2="36" y2="30" stroke="#E5E7EB" strokeWidth="0.8" />
    <line x1="15" y1="15" x2="15" y2="36" stroke="#E5E7EB" strokeWidth="0.8" />
    <line x1="25" y1="15" x2="25" y2="36" stroke="#E5E7EB" strokeWidth="0.8" />
    {/* Month label */}
    <text
      x="20"
      y="14"
      textAnchor="middle"
      fontSize="5"
      fontWeight="600"
      fill="white"
      fontFamily="system-ui"
    >
      MAR
    </text>
    {/* Day number */}
    <text
      x="20"
      y="28"
      textAnchor="middle"
      fontSize="11"
      fontWeight="700"
      fill="#4285F4"
      fontFamily="system-ui"
    >
      31
    </text>
    {/* Corner circles */}
    <circle cx="10" cy="6" r="2.5" fill="#4285F4" />
    <circle cx="30" cy="6" r="2.5" fill="#4285F4" />
  </svg>
);

const OutlookIcon: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg
    viewBox="0 0 40 40"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Main envelope/calendar shape */}
    <rect x="4" y="8" width="22" height="26" rx="4" fill="#0078D4" />
    <rect x="18" y="6" width="18" height="22" rx="3" fill="#28A8E8" />
    {/* Inner white calendar area */}
    <rect x="21" y="10" width="12" height="14" rx="2" fill="white" />
    {/* Calendar lines inside */}
    <line x1="21" y1="15" x2="33" y2="15" stroke="#E5E7EB" strokeWidth="0.8" />
    <line x1="21" y1="19" x2="33" y2="19" stroke="#E5E7EB" strokeWidth="0.8" />
    <line x1="27" y1="10" x2="27" y2="24" stroke="#E5E7EB" strokeWidth="0.8" />
    {/* O letter on left panel */}
    <circle cx="15" cy="22" r="6" fill="white" fillOpacity="0.15" />
    <text
      x="15"
      y="26"
      textAnchor="middle"
      fontSize="11"
      fontWeight="700"
      fill="white"
      fontFamily="system-ui"
    >
      O
    </text>
  </svg>
);

const AppleCalendarIcon: React.FC<{ className?: string }> = ({
  className = "",
}) => (
  <svg
    viewBox="0 0 40 40"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Base white card */}
    <rect
      x="4"
      y="6"
      width="32"
      height="30"
      rx="6"
      fill="white"
      stroke="#E5E7EB"
      strokeWidth="1"
    />
    {/* Red header */}
    <rect x="4" y="6" width="32" height="10" rx="6" fill="#FF3B30" />
    <rect x="4" y="11" width="32" height="5" fill="#FF3B30" />
    {/* Day of week strip */}
    <rect x="4" y="16" width="32" height="6" fill="#F9FAFB" />
    {/* Grid lines */}
    <line x1="4" y1="22" x2="36" y2="22" stroke="#E5E7EB" strokeWidth="0.7" />
    <line x1="4" y1="28" x2="36" y2="28" stroke="#E5E7EB" strokeWidth="0.7" />
    {/* Month label in header */}
    <text
      x="20"
      y="13"
      textAnchor="middle"
      fontSize="5.5"
      fontWeight="600"
      fill="white"
      fontFamily="system-ui"
      letterSpacing="0.5"
    >
      MARCH
    </text>
    {/* Large day number */}
    <text
      x="20"
      y="28"
      textAnchor="middle"
      fontSize="12"
      fontWeight="700"
      fill="#1C1C1E"
      fontFamily="system-ui"
    >
      17
    </text>
    {/* Small day label */}
    <text
      x="20"
      y="20"
      textAnchor="middle"
      fontSize="4.5"
      fontWeight="500"
      fill="#8E8E93"
      fontFamily="system-ui"
    >
      MON
    </text>
    {/* Red dot for today */}
    <circle cx="20" cy="33" r="2" fill="#FF3B30" />
  </svg>
);

const NotionIcon: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg
    viewBox="0 0 40 40"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="5" y="5" width="30" height="30" rx="6" fill="#191919" />
    <path d="M12 11h10l7 8v10H12V11z" fill="white" />
    <path d="M22 11l7 8h-7V11z" fill="#E5E5E5" />
    <line
      x1="14"
      y1="18"
      x2="24"
      y2="18"
      stroke="#D1D5DB"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
    <line
      x1="14"
      y1="22"
      x2="26"
      y2="22"
      stroke="#D1D5DB"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
    <line
      x1="14"
      y1="26"
      x2="22"
      y2="26"
      stroke="#D1D5DB"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
  </svg>
);

const SlackIcon: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg
    viewBox="0 0 40 40"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Slack hashtag-like logo */}
    {/* Top-left: pink */}
    <rect x="10" y="8" width="6" height="14" rx="3" fill="#E01E5A" />
    <rect x="6" y="14" width="14" height="6" rx="3" fill="#E01E5A" />
    {/* Top-right: green */}
    <rect x="24" y="8" width="6" height="14" rx="3" fill="#2EB67D" />
    <rect x="20" y="14" width="14" height="6" rx="3" fill="#2EB67D" />
    {/* Bottom-left: blue */}
    <rect x="10" y="18" width="6" height="14" rx="3" fill="#36C5F0" />
    <rect x="6" y="20" width="14" height="6" rx="3" fill="#36C5F0" />
    {/* Bottom-right: yellow */}
    <rect x="24" y="18" width="6" height="14" rx="3" fill="#ECB22E" />
    <rect x="20" y="20" width="14" height="6" rx="3" fill="#ECB22E" />
  </svg>
);

// ─── Orbit config ─────────────────────────────────────────────────────────────
// radius matches the ring pixel sizes exactly
// startAngle = where on the ring the icon begins (degrees, 0 = top)

interface OrbitingApp {
  id: string;
  Icon: React.FC<{ className?: string }>;
  radius: number; // px — must match ring diameter / 2
  duration: number; // seconds per full revolution
  startAngle: number;
  ringIndex: number; // 0=inner,1=mid,2=outer — for reference only
}

const ORBIT_APPS: OrbitingApp[] = [
  {
    id: "gcal",
    Icon: GoogleCalendarIcon,
    radius: 110,
    duration: 24,
    startAngle: 60,
    ringIndex: 1,
  },
  {
    id: "outlook",
    Icon: OutlookIcon,
    radius: 150,
    duration: 32,
    startAngle: 200,
    ringIndex: 2,
  },
  {
    id: "apple",
    Icon: AppleCalendarIcon,
    radius: 150,
    duration: 32,
    startAngle: 340,
    ringIndex: 2,
  },
  {
    id: "notion",
    Icon: NotionIcon,
    radius: 75,
    duration: 18,
    startAngle: 255,
    ringIndex: 0,
  },
  {
    id: "slack",
    Icon: SlackIcon,
    radius: 110,
    duration: 24,
    startAngle: 195,
    ringIndex: 1,
  },
];

// ─── Single orbiting badge ────────────────────────────────────────────────────

function OrbitBadge({ Icon, radius, duration, startAngle }: OrbitingApp) {
  return (
    <div
      className="absolute left-1/2 top-1/2"
      style={{
        // The wrapper spins around the center.
        // We offset by -50% so the rotation pivot is exactly the center.
        marginLeft: -20,
        marginTop: -20,
        width: 40,
        height: 40,
        animation: `orbitSpin ${duration}s linear infinite`,
        transformOrigin: "20px 20px",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `rotate(${startAngle}deg) translateY(-${radius}px)`,
        }}
      >
        <div
          className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center"
          style={{
            animation: `orbitCounter ${duration}s linear infinite`,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <Icon className="h-6 w-6 md:h-7 md:w-7" />
        </div>
      </div>
    </div>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────

export default function IntegrationsArc() {
  return (
    <section className="w-full bg-white flex flex-col items-center pt-5 px-4 md:px-8 overflow-hidden">
      {/* Label pill */}
      <div className="w-fit px-4 py-1.5 bg-white border border-gray-200 rounded-full shadow-sm mb-8">
        <span className="text-gray-600 text-sm font-medium tracking-tight">
          Integrations
        </span>
      </div>

      <h2 className="text-3xl md:text-5xl font-semibold text-center text-black mb-12 md:mb-16 leading-tight tracking-tight">
        Powerful Integrations, <br className="hidden md:block" />
        Effortless Setup
      </h2>

      {/*
        Orbit stage.
        Three rings: inner 150px, mid 220px, outer 300px diameter.
        Radii: 75, 110, 150 px — these must match the OrbitingApp.radius values above.
      */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: 340, height: 340 }}
      >
        {/* Ring: inner (r=75 → diameter 150) */}
        <div
          className="absolute rounded-full border border-[#E5E7EB]"
          style={{ width: 150, height: 150 }}
        />

        {/* Ring: mid (r=110 → diameter 220) */}
        <div
          className="absolute rounded-full border border-[#E5E7EB]"
          style={{ width: 220, height: 220 }}
        />

        {/* Ring: outer (r=150 → diameter 300) */}
        <div
          className="absolute rounded-full border border-[#E5E7EB]"
          style={{ width: 300, height: 300 }}
        />

        {/* Orbiting icons */}
        {ORBIT_APPS.map((app) => (
          <OrbitBadge key={app.id} {...app} />
        ))}

        {/* Center pill */}
        <div
          className="relative z-10 px-3 py-3 rounded-full bg-white border border-[#D1D5DB]"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}
        >
          <Image src="/Logo.png" alt="Google" width={32} height={32} />
        </div>
      </div>

      <style>{`
        @keyframes orbitSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes orbitCounter {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
      `}</style>
    </section>
  );
}
