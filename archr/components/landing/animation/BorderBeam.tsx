"use client";

/**
 * BorderBeam
 * A glowing line that travels around the border of the parent container.
 *
 * Usage:
 *   <div className="relative overflow-hidden rounded-3xl ...">
 *     <HeroAnimation />
 *     <BorderBeam />
 *   </div>
 *
 * Props:
 *   size      — length of the beam as a fraction of the perimeter (0–1). Default 0.25
 *   duration  — seconds for one full loop. Default 4
 *   color     — beam color. Default Archr teal
 *   thickness — border width in px. Default 2
 *   delay     — animation delay in seconds. Default 0
 */

interface BorderBeamProps {
  size?: number;
  duration?: number;
  color?: string;
  thickness?: number;
  delay?: number;
}

export default function BorderBeam({
  size = 0.25,
  duration = 12,
  color = "#3689ff",
  thickness = 2,
  delay = 0,
}: BorderBeamProps) {
  // We draw an SVG rect that perfectly traces the rounded border.
  // pathLength="1" lets us use 0–1 values for stroke-dasharray.
  // The beam = size of the path lit up, gap = rest unlit.
  // Animating stroke-dashoffset from 0 → -1 moves the beam around the perimeter.

  const beamLength = size;
  const gapLength  = 1 - size;

  return (
    <>
      <svg
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 10,
          borderRadius: "inherit",
          overflow: "visible",
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Faint static border so the beam has a track to run on */}
        <rect
          width="100%"
          height="100%"
          rx="24"
          ry="24"
          fill="none"
          stroke="rgba(0,0,0,0.05)"
          strokeWidth={thickness}
        />

        {/* The moving beam */}
        <rect
          width="100%"
          height="100%"
          rx="24"
          ry="24"
          fill="none"
          pathLength="1"
          stroke={color}
          strokeWidth={thickness + 1}
          strokeLinecap="round"
          strokeDasharray={`${beamLength} ${gapLength}`}
          style={{
            animationName: "borderBeamMove",
            animationDuration: `${duration}s`,
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
            animationDelay: `${delay}s`,
          }}
        />

        {/* Wider soft glow layer behind the beam */}
        <rect
          width="100%"
          height="100%"
          rx="24"
          ry="24"
          fill="none"
          pathLength="1"
          stroke={color}
          strokeWidth={(thickness + 1) * 4}
          strokeLinecap="round"
          strokeOpacity={0.15}
          strokeDasharray={`${beamLength} ${gapLength}`}
          style={{
            animationName: "borderBeamMove",
            animationDuration: `${duration}s`,
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
            animationDelay: `${delay}s`,
          }}
        />
      </svg>

      <style>{`
        @keyframes borderBeamMove {
          0%   { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -1; }
        }
      `}</style>
    </>
  );
}