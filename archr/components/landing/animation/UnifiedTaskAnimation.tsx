"use client";

import { useEffect, useRef, useState } from "react";

const CALENDAR_EVENTS = [
  // row 9am
  { id: "w9", label: "Team standup",    color: "blue"   },
  { id: "t9", label: "V2 QA sprint",    color: "purple" },
  { id: "f9", label: "Client call",     color: "blue"   },
  // row 10am — t10 is the drop target, left empty
  { id: "w10", label: "V2 deep work",   color: "purple" },
  { id: "f10", label: "Board update",   color: "coral"  },
  // row 11am
  { id: "w11", label: "Client check-in",color: "coral"  },
  { id: "t11", label: "Lunch",          color: "gray"   },
  { id: "f11", label: "Launch checklist",color:"purple" },
  // row 12pm
  { id: "w12", label: "Lunch",          color: "gray"   },
  { id: "t12", label: "Investor call",  color: "coral"  },
  { id: "f12", label: "Team lunch",     color: "gray"   },
] as const;

type EventColor = "blue" | "purple" | "coral" | "gray";

const colorMap: Record<EventColor, { bg: string; text: string; border: string }> = {
  blue:   { bg: "#E6F1FB", text: "#0C447C", border: "#185FA5" },
  purple: { bg: "#EEEDFE", text: "#3C3489", border: "#534AB7" },
  coral:  { bg: "#FAECE7", text: "#712B13", border: "#993C1D" },
  gray:   { bg: "#F1EFE8", text: "#5F5E5A", border: "#B4B2A9" },
};

const DAYS = ["Wed", "Thu", "Fri"];
const HOURS = ["9am", "10am", "11am", "12pm"];

type CellContent = "empty" | "gap" | "snapped";

function ease(t: number) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export default function UnifiedTaskAnimation() {
  const wrapRef       = useRef<HTMLDivElement>(null);
  const sourceRowRef  = useRef<HTMLDivElement>(null);
  const targetCellRef = useRef<HTMLDivElement>(null);
  const flyingRef     = useRef<HTMLDivElement>(null);

  const [taskDone,     setTaskDone]     = useState(false);
  const [targetCell,   setTargetCell]   = useState<CellContent>("empty");
  const [flyStyle,     setFlyStyle]     = useState<React.CSSProperties>({ opacity: 0, left: 0, top: 0 });

  const rafRef     = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runningRef = useRef(false);

  function clear() {
    if (rafRef.current)     cancelAnimationFrame(rafRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }

  function getCenter(el: HTMLElement) {
    const wrap = wrapRef.current!;
    const wr   = wrap.getBoundingClientRect();
    const r    = el.getBoundingClientRect();
    return { x: r.left - wr.left + r.width / 2, y: r.top - wr.top + r.height / 2 };
  }

  function delay(ms: number) {
    return new Promise<void>((res) => { timeoutRef.current = setTimeout(res, ms); });
  }

  async function runLoop() {
    if (runningRef.current) return;
    runningRef.current = true;

    const CARD_W = 130, CARD_H = 30;

    while (true) {
      // Reset state
      setTaskDone(false);
      setTargetCell("empty");
      setFlyStyle({ opacity: 0, left: 0, top: 0, transform: "scale(0.9)", transition: "none" });

      await delay(700);

      const src = getCenter(sourceRowRef.current!);
      const dst = getCenter(targetCellRef.current!);

      // Place flying card at source
      setFlyStyle({
        opacity: 0, transform: "scale(0.9)", transition: "none",
        left: src.x - CARD_W / 2,
        top:  src.y - CARD_H / 2,
      });

      await delay(50);

      // Lift card
      setFlyStyle((prev) => ({ ...prev, opacity: 1, transform: "scale(1.05)", transition: "opacity 0.2s ease, transform 0.2s ease" }));

      await delay(350);

      // Show gap on target
      setTargetCell("gap");

      await delay(300);

      // Animate flight via rAF
      await new Promise<void>((res) => {
        const duration = 520;
        let startTime: number | null = null;

        function fly(ts: number) {
          if (!startTime) startTime = ts;
          const t  = Math.min((ts - startTime) / duration, 1);
          const te = ease(t);
          const arc = Math.sin(Math.PI * t) * -18;

          setFlyStyle({
            opacity:   1,
            transition: "none",
            transform: `scale(${1 + 0.04 * Math.sin(Math.PI * t)})`,
            left: src.x - CARD_W / 2 + (dst.x - src.x) * te,
            top:  src.y - CARD_H / 2 + (dst.y - src.y) * te + arc,
          });

          if (t < 1) {
            rafRef.current = requestAnimationFrame(fly);
          } else {
            res();
          }
        }
        rafRef.current = requestAnimationFrame(fly);
      });

      // Snap — hide card, show block in cell
      setFlyStyle((prev) => ({ ...prev, opacity: 0, transition: "opacity 0.15s ease" }));
      setTargetCell("snapped");

      await delay(200);

      // Tick off task
      setTaskDone(true);

      // Hold
      await delay(1800);

      // Fade out snapped block + untick
      setTargetCell("empty");
      setTaskDone(false);

      await delay(500);
    }
  }

  useEffect(() => {
    timeoutRef.current = setTimeout(() => runLoop(), 900);
    return () => { clear(); runningRef.current = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getEvent = (id: string) =>
    CALENDAR_EVENTS.find((e) => e.id === id) ?? null;

  return (
    <div
      ref={wrapRef}
      className="relative flex w-full gap-2"
      style={{ fontFamily: "inherit" }}
    >
      <div
        style={{
          width: 148,
          flexShrink: 0,
          background: "#fff",
          border: "0.5px solid #D3D1C7",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div style={styles.panelHead}>Habits</div>

        {/* Done rows */}
        {[
          { label: "Running",  done: true  },
          { label: "Language practice", done: true  },
        ].map((t) => (
          <TaskRow key={t.label} label={t.label} done={t.done} />
        ))}

        <div ref={sourceRowRef} style={styles.taskRow}>
          <Checkbox done={taskDone} />
          <span style={{ ...styles.taskText, ...(taskDone ? styles.doneText : {}) }}>
            Gym
          </span>
          <span style={{ ...styles.tag, background: "#FAEEDA", color: "#633806" }}>90m</span>
        </div>

        {/* Static rows */}
        {[
          { label: "Meditation"  },
          { label: "Reading"},
        ].map((t) => (
          <TaskRow key={t.label} label={t.label} done={false} />
        ))}
      </div>

      {/* ── Calendar ── */}
      <div
        style={{
          flex: 1,
          background: "#fff",
          border: "0.5px solid #D3D1C7",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div style={styles.panelHead}>This week</div>

        <div style={{ display: "grid", gridTemplateColumns: "28px repeat(3, 1fr)" }}>
          {/* Header */}
          <div style={styles.ch} />
          {DAYS.map((d) => <div key={d} style={styles.ch}>{d}</div>)}

          {/* Rows */}
          {HOURS.map((hr, hi) => [
            <div key={`tl-${hr}`} style={styles.tl}>{hr}</div>,
            ...DAYS.map((_, di) => {
              const id    = `${["w","t","f"][di]}${[9,10,11,12][hi]}`;
              const isTarget = id === "t10";
              const event = isTarget ? null : getEvent(id);
              const c     = event ? colorMap[event.color as EventColor] : null;

              return (
                <div
                  key={id}
                  ref={isTarget ? targetCellRef : undefined}
                  style={{
                    ...styles.dc,
                    background: targetCell === "snapped" && isTarget ? "#E1F5EE" : "#fff",
                    transition: "background 0.3s ease",
                  }}
                >
                  {/* Normal event */}
                  {!isTarget && c && (
                    <div style={{ ...styles.blk, top: 2, height: 24, background: c.bg, borderLeftColor: c.border }}>
                      <span style={{ fontSize: 8, fontWeight: 500, color: c.text }}>{event!.label}</span>
                    </div>
                  )}

                  {/* Gap indicator */}
                  {isTarget && targetCell === "gap" && (
                    <div style={styles.gap}>
                      <span style={{ fontSize: 8, color: "#1D9E75", fontWeight: 500 }}>drop here</span>
                    </div>
                  )}

                  {/* Snapped block */}
                  {isTarget && targetCell === "snapped" && (
                    <div
                      style={{
                        ...styles.blk,
                        top: 2, height: 52,
                        background: "#E1F5EE",
                        borderLeftColor: "#1D9E75",
                        animation: "snapIn 0.25s ease forwards",
                      }}
                    >
                      <span style={{ fontSize: 8, fontWeight: 500, color: "#085041", lineHeight: 1.3 }}>
                        Gym<br />
                        <span style={{ color: "#1D9E75" }}>10–11:30am</span>
                      </span>
                    </div>
                  )}
                </div>
              );
            }),
          ])}
        </div>
      </div>

      {/* ── Flying card ── */}
      <div
        ref={flyingRef}
        style={{
          position: "absolute",
          pointerEvents: "none",
          zIndex: 10,
          whiteSpace: "nowrap",
          background: "#fff",
          border: "0.5px solid #D3D1C7",
          borderRadius: 8,
          padding: "5px 9px",
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 10,
          fontWeight: 500,
          color: "#2C2C2A",
          ...flyStyle,
        }}
      >
        <Checkbox done={false} />
        Investor prep
        <span style={{ ...styles.tag, background: "#FAEEDA", color: "#633806" }}>90m</span>
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

function Checkbox({ done }: { done: boolean }) {
  return (
    <div
      style={{
        width: 12, height: 12, borderRadius: "50%", flexShrink: 0,
        border: `1.5px solid ${done ? "#1D9E75" : "#D3D1C7"}`,
        background: done ? "#1D9E75" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "background 0.2s, border-color 0.2s",
      }}
    >
      {done && (
        <svg width="7" height="5" viewBox="0 0 7 5" fill="none">
          <path d="M1 2.5L2.8 4L6 1" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

function TaskRow({ label, done }: { label: string; done: boolean }) {
  return (
    <div style={styles.taskRow}>
      <Checkbox done={done} />
      <span style={{ ...styles.taskText, ...(done ? styles.doneText : {}) }}>{label}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panelHead: {
    background: "#F7F7F5",
    borderBottom: "0.5px solid #D3D1C7",
    padding: "6px 10px",
    fontSize: 9,
    fontWeight: 500,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#888780",
  },
  taskRow: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    padding: "6px 10px",
    borderBottom: "0.5px solid #F1EFE8",
  },
  taskText: {
    fontSize: 10,
    color: "#2C2C2A",
    fontWeight: 500,
    flex: 1,
  },
  doneText: {
    textDecoration: "line-through",
    color: "#B4B2A9",
  },
  tag: {
    fontSize: 9,
    borderRadius: 3,
    padding: "1px 5px",
    fontWeight: 500,
  },
  ch: {
    background: "#F7F7F5",
    borderBottom: "0.5px solid #D3D1C7",
    borderLeft: "0.5px solid #D3D1C7",
    padding: "4px 3px",
    textAlign: "center",
    fontSize: 8,
    fontWeight: 500,
    letterSpacing: "0.05em",
    color: "#888780",
    textTransform: "uppercase",
  },
  tl: {
    background: "#F7F7F5",
    borderBottom: "0.5px solid #D3D1C7",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingRight: 4,
    height: 28,
    fontSize: 8,
    color: "#888780",
  },
  dc: {
    borderLeft: "0.5px solid #D3D1C7",
    borderBottom: "0.5px solid #D3D1C7",
    height: 28,
    position: "relative",
  },
  blk: {
    position: "absolute",
    left: 2,
    right: 2,
    borderRadius: 3,
    padding: "2px 3px",
    borderLeft: "2px solid transparent",
    overflow: "hidden",
    lineHeight: 1.2,
  },
  gap: {
    position: "absolute",
    inset: 1,
    border: "1.5px dashed #5DCAA5",
    borderRadius: 3,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};