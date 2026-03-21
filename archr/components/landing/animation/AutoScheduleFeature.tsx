"use client";

import { useEffect, useRef, useState } from "react";

const SCAN_CELLS = [
  "w9","t9","f9",
  "w10","t10","f10",
  "w11","t11","f11",
  "w12","t12","f12",
  "w1","t1","f1",
  "w2","t2","f2",
];

type SlotId = (typeof SCAN_CELLS)[number];
type CellState = { highlighted: boolean; showGap: boolean; snapped: boolean };
type Phase = "idle" | "scanning" | "found" | "snapped" | "resetting";

const DAYS = ["Wed", "Thu", "Fri"];
const HOURS = ["9am", "10am", "11am", "12pm", "1pm", "2pm"];

const EVENTS: Record<SlotId, { label: string; color: "blue" | "purple" | "coral" | "gray" } | null> = {
  w9:  { label: "Team standup",     color: "blue"   },
  t9:  { label: "V2 QA sprint",     color: "blue" },
  f9:  { label: "Client call",      color: "blue"   },
  w10: { label: "V2 deep work",     color: "blue" },
  t10: null,
  f10: { label: "Board update",     color: "blue"  },
  w11: { label: "Client check-in",  color: "blue"  },
  t11: { label: "Lunch",            color: "blue"   },
  f11: { label: "Launch checklist", color: "blue" },
  w12: { label: "Lunch",            color: "blue"   },
  t12: { label: "Investor call",    color: "blue"  },
  f12: { label: "Team lunch",       color: "blue"   },
  w1:  { label: "1:1 with CTO",     color: "blue"   },
  t1:  null,
  f1:  { label: "Press + socials",  color: "blue"   },
  w2:  { label: "Staging deploy",   color: "blue" },
  t2:  { label: "Client demo",      color: "blue"   },
  f2:  { label: "Investor update",  color: "blue"  },
};

const colorMap = {
  blue:   { bg: "#E6F1FB", text: "#0C447C", border: "#185FA5" },
  purple: { bg: "#EEEDFE", text: "#3C3489", border: "#534AB7" },
  coral:  { bg: "#FAECE7", text: "#712B13", border: "#993C1D" },
  gray:   { bg: "#F1EFE8", text: "#5F5E5A", border: "#B4B2A9" },
  teal:   { bg: "#E1F5EE", text: "#085041", border: "#1D9E75" },
};

const statusConfig: Record<Phase, { dot: string; text: string }> = {
  idle:      { dot: "#B4B2A9", text: "Ready to find a slot" },
  scanning:  { dot: "#EF9F27", text: "Scanning your week..." },
  found:     { dot: "#1D9E75", text: "Perfect gap — Thu 10am" },
  snapped:   { dot: "#1D9E75", text: "Scheduled Thu 10–11:30am ✓" },
  resetting: { dot: "#B4B2A9", text: "Ready to find a slot" },
};

export default function AutoScheduleFeature() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [cellStates, setCellStates] = useState<Record<string, CellState>>({});
  const [taskOpacity, setTaskOpacity] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clear() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }

  // Kick off loop on mount
  useEffect(() => {
    // small initial delay before first run
    timeoutRef.current = setTimeout(() => setPhase("scanning"), 800);
    return clear;
  }, []);

  // SCANNING phase
  useEffect(() => {
    if (phase !== "scanning") return;
    setTaskOpacity(1);
    let idx = 0;
    intervalRef.current = setInterval(() => {
      if (idx >= SCAN_CELLS.length) {
        clearInterval(intervalRef.current!);
        setCellStates({});
        setPhase("found");
        return;
      }
      const prev = idx - 1;
      const id = SCAN_CELLS[idx];
      setCellStates((s) => ({
        ...s,
        ...(prev >= 0 ? { [SCAN_CELLS[prev]]: { ...s[SCAN_CELLS[prev]], highlighted: false } } : {}),
        [id]: { highlighted: true, showGap: false, snapped: false },
      }));
      idx++;
    }, 75);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase]);

  // FOUND phase — show gap, then snap
  useEffect(() => {
    if (phase !== "found") return;
    setCellStates((s) => ({
      ...s,
      t10: { highlighted: false, showGap: true, snapped: false },
      t1:  { highlighted: false, showGap: true, snapped: false },
    }));
    timeoutRef.current = setTimeout(() => setPhase("snapped"), 900);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [phase]);

  // SNAPPED phase — hold, then fade task out and reset
  useEffect(() => {
    if (phase !== "snapped") return;
    setCellStates((s) => ({
      ...s,
      t10: { highlighted: false, showGap: false, snapped: true },
      t1:  { highlighted: false, showGap: false, snapped: false },
    }));
    // hold for 1.8s, then fade task pill out
    timeoutRef.current = setTimeout(() => {
      setTaskOpacity(0);
      // after fade, reset everything
      timeoutRef.current = setTimeout(() => {
        setCellStates({});
        setTaskOpacity(1);
        setPhase("resetting");
      }, 500);
    }, 1800);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [phase]);

  // RESETTING — brief pause before next loop
  useEffect(() => {
    if (phase !== "resetting") return;
    timeoutRef.current = setTimeout(() => setPhase("scanning"), 600);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [phase]);

  return (
    <div className="flex w-full flex-col gap-2">

      {/* Task pill row */}
      <div className="flex items-center gap-2 flex-wrap">
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <div style={{
            width: 5, height: 5, borderRadius: "50%",
            background: statusConfig[phase].dot,
            flexShrink: 0, transition: "background 0.3s ease",
          }} />
          <span style={{ fontSize: "10px", color: "#888780" }}>
            {statusConfig[phase].text}
          </span>
        </div>
        <div style={{
          background: "#fff",
          border: "0.5px solid #D3D1C7",
          borderRadius: "8px",
          padding: "4px 10px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          opacity: taskOpacity,
          transition: "opacity 0.5s ease",
        }}>
          <span style={{ fontSize: "11px", fontWeight: 500, color: "#2C2C2A" }}>
            Investor Call Prep
          </span>
          <span style={{ fontSize: "10px", background: "#FAEEDA", color: "#633806", borderRadius: "4px", padding: "1px 5px", fontWeight: 500 }}>
            90 min
          </span>
          <span style={{ fontSize: "10px", background: "#FAECE7", color: "#712B13", borderRadius: "4px", padding: "1px 5px", fontWeight: 500 }}>
            High
          </span>
        </div>
      </div>

      {/* Calendar grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "30px repeat(3, 1fr)",
        border: "0.5px solid #D3D1C7",
        borderRadius: "10px",
        overflow: "hidden",
        background: "#fff",
        width: "100%",
      }}>
        <div style={s.ch} />
        {DAYS.map((d) => <div key={d} style={s.ch}>{d}</div>)}

        {HOURS.map((hr, hi) => [
          <div key={`tl-${hr}`} style={s.tl}>
            <span style={{ fontSize: "8px", color: "#888780" }}>{hr}</span>
          </div>,
          ...DAYS.map((_, di) => {
            const id = `${["w","t","f"][di]}${[9,10,11,12,1,2][hi]}`;
            const event = EVENTS[id];
            const cs = cellStates[id] || {};
            return (
              <div key={id} style={{
                ...s.dc,
                outline: cs.highlighted ? "1.5px solid #EF9F27" : "none",
                background: cs.snapped ? "#E1F5EE" : "#fff",
                transition: "background 0.3s ease",
              }}>
                {cs.showGap && (
                  <div style={s.gap}>
                    <span style={{ fontSize: "8px", color: "#1D9E75", fontWeight: 500 }}>
                      {id === "t10" ? "best fit" : "buffer"}
                    </span>
                  </div>
                )}
                {cs.snapped && id === "t10" && (
                  <div style={{ ...s.blk, top: 2, height: 52, background: colorMap.teal.bg, borderLeftColor: colorMap.teal.border, animation: "snapIn 0.3s ease forwards" }}>
                    <span style={{ fontSize: "8px", fontWeight: 500, color: colorMap.teal.text, lineHeight: 1.3 }}>
                      Investor Call Prep<br />
                      <span style={{ color: "#1D9E75", fontSize: "8px" }}>10–11:30am</span>
                    </span>
                  </div>
                )}
                {!cs.showGap && !cs.snapped && event && (
                  <div style={{ ...s.blk, top: 2, height: 22, background: colorMap[event.color].bg, borderLeftColor: colorMap[event.color].border }}>
                    <span style={{ fontSize: "8px", fontWeight: 500, color: colorMap[event.color].text }}>
                      {event.label}
                    </span>
                  </div>
                )}
              </div>
            );
          }),
        ])}
      </div>

      <style>{`
        @keyframes snapIn {
          from { opacity: 0; transform: scale(0.88); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  ch: {
    background: "#F7F7F5",
    borderBottom: "0.5px solid #D3D1C7",
    borderLeft: "0.5px solid #D3D1C7",
    padding: "4px 3px",
    textAlign: "center",
    fontSize: "8px",
    fontWeight: 500,
    letterSpacing: "0.05em",
    color: "#888780",
    textTransform: "uppercase" as const,
  },
  tl: {
    background: "#F7F7F5",
    borderBottom: "0.5px solid #D3D1C7",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingRight: "4px",
    height: "26px",
  },
  dc: {
    borderLeft: "0.5px solid #D3D1C7",
    borderBottom: "0.5px solid #D3D1C7",
    height: "26px",
    position: "relative" as const,
  },
  blk: {
    position: "absolute" as const,
    left: 2,
    right: 2,
    borderRadius: "3px",
    padding: "2px 3px",
    borderLeft: "2px solid transparent",
    overflow: "hidden",
    lineHeight: 1.2,
  },
  gap: {
    position: "absolute" as const,
    inset: 1,
    border: "1.5px dashed #5DCAA5",
    borderRadius: "3px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};