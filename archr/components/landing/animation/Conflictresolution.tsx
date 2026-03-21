"use client";

import { useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type BlockState = {
  top: number;
  height: number;
  bg: string;
  border: string;
  timeLabel: string;
};

type Phase =
  | "idle"
  | "dropping"
  | "conflict"
  | "resolving"
  | "resolved";

type BadgeState = {
  bg: string;
  color: string;
  dotColor: string;
  label: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const SLOT = 24; // px per 1-hour slot

// Initial positions (before conflict) — 6 hours: 9am–3pm
const INIT: Record<string, BlockState> = {
  A: { top: 3,   height: 21, bg: "#FAECE7", border: "#993C1D", timeLabel: "9–10am"       },
  B: { top: 27,  height: 45, bg: "#E1F5EE", border: "#1D9E75", timeLabel: "10am–12pm"    },
  C: { top: 99,  height: 21, bg: "#E6F1FB", border: "#185FA5", timeLabel: "1–2pm"        },
  D: { top: 27,  height: 21, bg: "#FCEBEB", border: "#A32D2D", timeLabel: "10–11am · NEW" },
};

// Resolved positions (after Archr fixes the conflict)
const RESOLVED: Record<string, BlockState> = {
  A: { top: 3,   height: 21, bg: "#FAECE7", border: "#993C1D", timeLabel: "9–10am"    },
  B: { top: 51,  height: 45, bg: "#E1F5EE", border: "#1D9E75", timeLabel: "11am–1pm"  },
  C: { top: 123, height: 21, bg: "#E6F1FB", border: "#185FA5", timeLabel: "2–3pm"     },
  D: { top: 27,  height: 21, bg: "#FAECE7", border: "#993C1D", timeLabel: "10–11am"   },
};

const STATUS: Record<Phase, { dotColor: string; text: string }> = {
  idle:      { dotColor: "#B4B2A9", text: "Calendar up to date"                       },
  dropping:  { dotColor: "#EF9F27", text: "New meeting added..."                      },
  conflict:  { dotColor: "#E24B4A", text: "Conflict detected — Archr is resolving..." },
  resolving: { dotColor: "#E24B4A", text: "Conflict detected — Archr is resolving..." },
  resolved:  { dotColor: "#1D9E75", text: "Schedule resolved — 4 events protected"    },
};

const BADGE: Record<Phase, BadgeState> = {
  idle:      { bg: "#F1EFE8", color: "#5F5E5A", dotColor: "#B4B2A9", label: "3 events" },
  dropping:  { bg: "#F1EFE8", color: "#5F5E5A", dotColor: "#B4B2A9", label: "3 events" },
  conflict:  { bg: "#FCEBEB", color: "#791F1F", dotColor: "#E24B4A", label: "Conflict" },
  resolving: { bg: "#FCEBEB", color: "#791F1F", dotColor: "#E24B4A", label: "Conflict" },
  resolved:  { bg: "#E1F5EE", color: "#085041", dotColor: "#1D9E75", label: "Resolved" },
};

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CalBlock({
  state,
  title,
  titleColor,
  subColor,
  showRing,
  visible = true,
}: {
  state: BlockState;
  title: string;
  titleColor: string;
  subColor: string;
  showRing: boolean;
  visible?: boolean;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: 4,
        right: 4,
        top: state.top,
        height: state.height,
        borderRadius: 4,
        padding: "3px 5px",
        background: state.bg,
        borderLeft: `2px solid ${state.border}`,
        overflow: "hidden",
        lineHeight: 1.3,
        opacity: visible ? 1 : 0,
        transition: [
          "top 0.55s cubic-bezier(0.4,0,0.2,1)",
          "height 0.55s cubic-bezier(0.4,0,0.2,1)",
          "opacity 0.3s ease",
          "background 0.3s ease",
          "border-left-color 0.3s ease",
        ].join(", "),
      }}
    >
      <div style={{ fontSize: 8.5, fontWeight: 600, color: titleColor }}>{title}</div>
      <div style={{ fontSize: 7.5, marginTop: 1, opacity: 0.75, color: subColor }}>
        {state.timeLabel}
      </div>

      {/* Pulsing conflict ring */}
      {showRing && (
        <div
          style={{
            position: "absolute",
            inset: -2,
            borderRadius: 8,
            border: "2px solid #E24B4A",
            animation: "conflictPulse 1s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ConflictResolution() {
  const [phase,      setPhase]      = useState<Phase>("idle");
  const [blocks,     setBlocks]     = useState({ ...INIT });
  const [showToast,  setShowToast]  = useState(false);
  const [showD,      setShowD]      = useState(false);

  const runningRef = useRef(false);

  useEffect(() => {
    if (runningRef.current) return;
    runningRef.current = true;

    (async () => {
      while (true) {
        // ── Reset ────────────────────────────────────────────────────────────
        setPhase("idle");
        setBlocks({ ...INIT });
        setShowD(false);
        setShowToast(false);
        await delay(1200);

        // ── Step 1: New meeting drops in ─────────────────────────────────────
        setPhase("dropping");
        setShowD(true);
        await delay(400);

        // ── Step 2: Conflict detected ─────────────────────────────────────────
        setPhase("conflict");
        setShowToast(true);
        await delay(900);
        setShowToast(false);

        // ── Step 3: Resolving ─────────────────────────────────────────────────
        setPhase("resolving");
        await delay(300);

        // Animate blocks to resolved positions
        setBlocks({
          A: { ...RESOLVED.A },
          B: { ...RESOLVED.B },
          C: { ...RESOLVED.C },
          D: { ...RESOLVED.D },
        });
        await delay(700);

        // ── Step 4: Resolved ──────────────────────────────────────────────────
        setPhase("resolved");
        await delay(2800);
      }
    })();

    return () => { runningRef.current = false; };
  }, []);

  const status = STATUS[phase];
  const badge  = BADGE[phase];
  const isConflict = phase === "conflict" || phase === "resolving";

  return (
    <div style={{ fontFamily: "inherit", background: "#F7F7F5", borderRadius: 12, padding: 10, position: "relative" }}>

      {/* Calendar card */}
      <div style={{ background: "#fff", border: "0.5px solid #D3D1C7", borderRadius: 10, overflow: "hidden" }}>

        {/* Header */}
        <div style={{ background: "#F7F7F5", borderBottom: "0.5px solid #D3D1C7", padding: "6px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: "#888780" }}>
            Tuesday
          </span>

          {/* Badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 500, padding: "2px 8px", borderRadius: 100, background: badge.bg, color: badge.color, transition: "all 0.3s ease" }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: badge.dotColor, flexShrink: 0, transition: "background 0.3s" }} />
            {badge.label}
          </div>
        </div>

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "30px 1fr" }}>

          {/* Time labels */}
          <div>
            {["9am","10am","11am","12pm","1pm","2pm"].map((t) => (
              <div key={t} style={{ height: SLOT, background: "#F7F7F5", borderRight: "0.5px solid #D3D1C7", borderBottom: "0.5px solid #D3D1C7", display: "flex", alignItems: "flex-start", justifyContent: "flex-end", padding: "3px 5px 0 0", fontSize: 7.5, color: "#B4B2A9" }}>
                {t}
              </div>
            ))}
          </div>

          {/* Event column */}
          <div style={{ position: "relative" }}>
            {["","","","","",""].map((_, i) => (
              <div key={i} style={{ height: SLOT, borderBottom: i < 5 ? "0.5px solid #F1EFE8" : "none" }} />
            ))}

            {/* Block A — Investor Call (9–10am, never moves) */}
            <CalBlock
              state={blocks.A}
              title="Investor Call"
              titleColor="#712B13"
              subColor="#993C1D"
              showRing={isConflict}
            />

            {/* Block B — Deep Work (shifts down on resolve) */}
            <CalBlock
              state={blocks.B}
              title="Deep Work: V2"
              titleColor="#085041"
              subColor="#1D9E75"
              showRing={isConflict}
            />

            {/* Block C — Client Sync (shifts down on resolve) */}
            <CalBlock
              state={blocks.C}
              title="Client Sync"
              titleColor="#0C447C"
              subColor="#185FA5"
              showRing={false}
            />

            {/* Block D — NEW conflicting meeting (drops in) */}
            <CalBlock
              state={blocks.D}
              title="Board Check-in"
              titleColor={phase === "resolved" ? "#712B13" : "#791F1F"}
              subColor={phase === "resolved" ? "#993C1D" : "#A32D2D"}
              showRing={isConflict}
              visible={showD}
            />

            {/* Toast notification */}
            <div style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              top: 42,
              background: "#1a1a1a",
              color: "#fff",
              fontSize: 10,
              fontWeight: 500,
              padding: "5px 12px",
              borderRadius: 100,
              whiteSpace: "nowrap" as const,
              letterSpacing: "0.01em",
              opacity: showToast ? 1 : 0,
              transition: "opacity 0.25s ease",
              pointerEvents: "none",
              zIndex: 10,
            }}>
              Conflict detected — resolving...
            </div>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 7 }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: status.dotColor, flexShrink: 0, transition: "background 0.3s" }} />
        <span style={{ fontSize: 9, color: "#888780", transition: "color 0.3s" }}>{status.text}</span>
      </div>

      <style>{`
        @keyframes conflictPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}