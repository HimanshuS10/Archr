"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const TASKS = [
  { label: "Investor deck slides",   priority: "High", pillBg: "#FAECE7", pillColor: "#712B13" },
  { label: "V2 launch checklist",    priority: "High", pillBg: "#FAECE7", pillColor: "#712B13" },
  { label: "Investor call prep",     priority: "High", pillBg: "#FAECE7", pillColor: "#712B13" },
  { label: "Client proposal draft",  priority: "Med",  pillBg: "#FAEEDA", pillColor: "#633806" },
  { label: "API integration review", priority: "Med",  pillBg: "#FAEEDA", pillColor: "#633806" },
  { label: "Team standup",           priority: "Med",  pillBg: "#FAEEDA", pillColor: "#633806" },
  { label: "Product roadmap review", priority: "Med",  pillBg: "#FAEEDA", pillColor: "#633806" },
  { label: "1:1 with CTO",           priority: "Med",  pillBg: "#FAEEDA", pillColor: "#633806" },
  { label: "Board update email",     priority: "Low",  pillBg: "#F1EFE8", pillColor: "#5F5E5A" },
  { label: "User research notes",    priority: "Low",  pillBg: "#F1EFE8", pillColor: "#5F5E5A" },
  { label: "Gym session",            priority: "Low",  pillBg: "#F1EFE8", pillColor: "#5F5E5A" },
  { label: "Weekly review",          priority: "Low",  pillBg: "#F1EFE8", pillColor: "#5F5E5A" },
];

// day(0-4), startHour offset from 7am(0=7am), spanHours, label, time, bg, border, textColor, timeColor
const EVENTS = [
  [0, 0, 1,   "Gym",               "7-8 am",     "#DBEAFE", "#3B82F6", "#1E3A8A", "#1D4ED8"],
  [0, 2, 1.5, "Investor deck",     "9–10:30am",  "#BFDBFE", "#2563EB", "#1E3A8A", "#1E40AF"],
  [0, 4, 1,   "Client proposal",   "11am–12pm",  "#E0E7FF", "#4F46E5", "#312E81", "#3730A3"],
  [0, 6, 1,   "Lunch break",       "1–2pm",      "#EFF6FF", "#60A5FA", "#1E3A8A", "#2563EB"],
  [1, 1, 1,   "Investor call prep","8–9am",      "#DBEAFE", "#3B82F6", "#1E3A8A", "#1D4ED8"],
  [1, 2, 1.5, "API review",        "9–10:30am",  "#BFDBFE", "#2563EB", "#1E3A8A", "#1E40AF"],
  [1, 4, 0.5, "Team standup",      "11–11:30am", "#E0E7FF", "#4F46E5", "#312E81", "#3730A3"],
  [1, 7, 1.5, "V2 checklist",      "2–3:30pm",   "#DBEAFE", "#3B82F6", "#1E3A8A", "#1D4ED8"],
  [2, 2, 2,   "Product roadmap",   "9–11am",     "#BFDBFE", "#2563EB", "#1E3A8A", "#1E40AF"],
  [2, 6, 1,   "1:1 with CTO",      "1–2pm",      "#E0E7FF", "#4F46E5", "#312E81", "#3730A3"],
  [3, 1, 1,   "Investor call",     "8–9am",      "#DBEAFE", "#3B82F6", "#1E3A8A", "#1D4ED8"],
  [3, 3, 0.5, "Board update",      "10–10:30am", "#EFF6FF", "#60A5FA", "#1E3A8A", "#2563EB"],
  [3, 5, 1,   "User research",     "12–1pm",     "#BFDBFE", "#2563EB", "#1E3A8A", "#1E40AF"],
  [3, 8, 1,   "Deep work block",   "3–4pm",      "#DBEAFE", "#3B82F6", "#1E3A8A", "#1D4ED8"],
  [4, 0, 1,   "Gym",               "7-8 am",     "#DBEAFE", "#3B82F6", "#1E3A8A", "#1D4ED8"],
  [4, 2, 1,   "Weekly review",     "9–10am",     "#E0E7FF", "#4F46E5", "#312E81", "#3730A3"],
  [4, 4, 1.5, "V2 launch prep",    "11am–12:30", "#BFDBFE", "#2563EB", "#1E3A8A", "#1E40AF"],
  [4, 7, 1,   "Team retro",        "2–3pm",      "#DBEAFE", "#3B82F6", "#1E3A8A", "#1D4ED8"],
] as const;

// which event index each task triggers (in order of tasks 0-11)
const TASK_EVENT_MAP = [1, 7, 4, 2, 5, 6, 8, 9, 11, 12, 0, 15];
// background events that pop in after all tasks are scheduled
const BG_EVENTS = [3, 13, 14, 16, 17];

const DAYS  = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const HOURS = ["7am","8am","9am","10am","11am","12pm","1pm","2pm","3pm","4pm","5pm","6pm","7pm"];
const ROW_H = 28;
const HEADER_H = 25;
const TIME_COL_W = 30;
const CAL_TITLE_H = 25;

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

export default function HeroAnimation() {
  const rootRef    = useRef<HTMLDivElement>(null);
  const calRef     = useRef<HTMLDivElement>(null);
  const gridRef    = useRef<HTMLDivElement>(null);
  const btnRef     = useRef<HTMLButtonElement>(null);
  const runningRef = useRef(false);

  const [taskStates,  setTaskStates]  = useState(TASKS.map(() => ({ hl: false, checked: false, struck: false })));
  const [visEvents,   setVisEvents]   = useState<boolean[]>(EVENTS.map(() => false));
  const [btnPressed,  setBtnPressed]  = useState(false);
  const [remaining,   setRemaining]   = useState<number | "done">(TASKS.length);
  const [cursor,      setCursor]      = useState({ x: 0, y: 0, visible: false });

  // Compute event positions relative to cal panel
  const getEventStyle = useCallback((evIdx: number): React.CSSProperties => {
    const ev = EVENTS[evIdx];
    const day = ev[0] as number;
    const startHr = ev[1] as number;
    const span = ev[2] as number;

    if (!gridRef.current) return { display: "none" };
    const gr = gridRef.current.getBoundingClientRect();
    const totalW  = gr.width - TIME_COL_W;
    const colW    = totalW / 5;

    return {
      position: "absolute",
      left:   TIME_COL_W + day * colW + 2,
      top:    HEADER_H + startHr * ROW_H + 2,
      width:  colW - 4,
      height: Math.max(span * ROW_H - 4, ROW_H - 4),
      borderRadius: 4,
      padding: "3px 4px",
      borderLeft: `2px solid ${ev[5]}`,
      background: ev[4] as string,
      boxShadow: "inset 0 0 0 1px rgba(59, 130, 246, 0.18)",
      overflow: "hidden",
      lineHeight: 1.25,
      opacity: 0,
      transform: "scaleY(0.6)",
      transformOrigin: "top",
      transition: "opacity 0.28s ease, transform 0.28s ease",
    };
  }, []);

  const getBtnPos = useCallback(() => {
    const root = rootRef.current;
    const btn  = btnRef.current;
    if (!root || !btn) return { x: 0, y: 0 };
    const rr = root.getBoundingClientRect();
    const er = btn.getBoundingClientRect();
    return { x: er.left - rr.left + er.width / 2, y: er.top - rr.top + er.height / 2 };
  }, []);

  const reset = useCallback(() => {
    setTaskStates(TASKS.map(() => ({ hl: false, checked: false, struck: false })));
    setVisEvents(EVENTS.map(() => false));
    setBtnPressed(false);
    setRemaining(TASKS.length);
    setCursor((c) => ({ ...c, visible: false }));
  }, []);

  useEffect(() => {
    if (runningRef.current) return;
    runningRef.current = true;

    (async () => {
      while (true) {
        reset();
        await delay(700);

        // Move cursor to button and show
        const pos = getBtnPos();
        setCursor({ x: pos.x - 5, y: pos.y - 5, visible: true });
        await delay(750);

        // Click
        setBtnPressed(true);
        await delay(160);
        setBtnPressed(false);
        await delay(180);
        setCursor((c) => ({ ...c, visible: false }));

        // Schedule each task
        for (let i = 0; i < TASKS.length; i++) {
          setTaskStates((prev) => prev.map((t, idx) => idx === i ? { ...t, hl: true } : t));
          await delay(100);

          const evIdx = TASK_EVENT_MAP[i];
          setVisEvents((prev) => prev.map((v, idx) => idx === evIdx ? true : v));
          await delay(160);

          setTaskStates((prev) => prev.map((t, idx) => idx === i ? { hl: false, checked: true, struck: true } : t));
          setRemaining(i < TASKS.length - 1 ? TASKS.length - i - 1 : "done");
          await delay(190);
        }

        // Pop remaining background events
        for (const bgIdx of BG_EVENTS) {
          setVisEvents((prev) => prev.map((v, idx) => idx === bgIdx ? true : v));
          await delay(110);
        }

        await delay(2600);
        reset();
        await delay(600);
      }
    })();

    return () => { runningRef.current = false; };
  }, [reset, getBtnPos]);

  return (
    <div
      ref={rootRef}
      style={{
        position: "relative",
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        borderRadius: 20,
        padding: 14,
        width: "100%",
        fontFamily: "inherit",
        overflow: "hidden",
      }}
    >
      {/* ── Task list ── */}
      <div style={{ width: 198, flexShrink: 0, background: "#fff", border: "0.5px solid #D3D1C7", borderRadius: 12, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ background: "#EFF6FF", borderBottom: "0.5px solid #BFDBFE", padding: "7px 11px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: "#888780" }}>Tasks</span>
          <span style={{ fontSize: 10, color: "#2563EB", fontWeight: 500 }}>
            {remaining === "done" ? "All scheduled!" : `${remaining} remaining`}
          </span>
        </div>

        {/* Task rows */}
        {TASKS.map((task, i) => {
          const ts = taskStates[i];
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 11px", borderBottom: i < TASKS.length - 1 ? "0.5px solid #F1EFE8" : "none", background: ts.hl ? "#EFF6FF" : "#fff", transition: "background 0.2s" }}>
              <div style={{ width: 13, height: 13, borderRadius: "50%", flexShrink: 0, border: `1.5px solid ${ts.checked ? "#3B82F6" : "#D3D1C7"}`, background: ts.checked ? "#3B82F6" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.22s" }}>
                {ts.checked && (
                  <svg width="7" height="5" viewBox="0 0 7 5" fill="none">
                    <path d="M1 2.5L2.8 4L6 1" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span style={{ fontSize: 10.5, fontWeight: 500, flex: 1, color: ts.struck ? "#B4B2A9" : "#2C2C2A", textDecoration: ts.struck ? "line-through" : "none", transition: "color 0.22s", whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>
                {task.label}
              </span>
              <span style={{ fontSize: 9, borderRadius: 3, padding: "1px 5px", fontWeight: 500, background: task.pillBg, color: task.pillColor, whiteSpace: "nowrap" as const, flexShrink: 0 }}>
                {task.priority}
              </span>
            </div>
          );
        })}

        {/* Button */}
        <div style={{ padding: "8px 11px" }}>
          <button
            ref={btnRef}
            style={{ width: "100%", padding: 8, borderRadius: 8, border: "none", background: btnPressed ? "#1D4ED8" : "#3B82F6", color: "#fff", fontSize: 12, fontWeight: 600,   letterSpacing: "0.02em", transform: btnPressed ? "scale(0.97)" : "scale(1)", transition: "background 0.15s, transform 0.1s", fontFamily: "inherit" }}
          >
            Make Schedule
          </button>
        </div>
      </div>

      {/* ── Calendar ── */}
      <div ref={calRef} style={{ flex: 1, background: "#fff", border: "0.5px solid #BFDBFE", borderRadius: 12, overflow: "hidden", minWidth: 0, position: "relative" }}>
        <div style={{ background: "#EFF6FF", borderBottom: "0.5px solid #BFDBFE", padding: "6px 10px", height: CAL_TITLE_H, boxSizing: "border-box", fontSize: 10, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: "#1E40AF" }}>
          Week of Mar 17
        </div>

        {/* Grid */}
        <div ref={gridRef} style={{ display: "grid", gridTemplateColumns: `${TIME_COL_W}px repeat(5, minmax(0,1fr))` }}>
          {/* Day headers */}
          <div style={s.ch} />
          {DAYS.map((d) => <div key={d} style={s.ch}>{d}</div>)}

          {/* Hour rows */}
          {HOURS.map((hr) => [
            <div key={`tl-${hr}`} style={{ ...s.tl, height: ROW_H }}>{hr}</div>,
            ...DAYS.map((_, di) => (
              <div key={`${hr}-${di}`} style={{ ...s.dc, height: ROW_H }} />
            )),
          ])}
        </div>

        {/* Event overlay — absolutely positioned over the grid */}
        <div style={{ position: "absolute", top: CAL_TITLE_H + HEADER_H, left: 0, right: 0, bottom: 0, pointerEvents: "none" }}>
          {EVENTS.map((ev, i) => {
            const visible = visEvents[i];
            return (
              <div
                key={i}
                style={{
                  ...getEventStyle(i),
                  // Override the static top since we're inside the overlay (already offset by header)
                  top: (ev[1] as number) * ROW_H + 2,
                  opacity: visible ? 1 : 0,
                  transform: visible ? "scaleY(1)" : "scaleY(0.6)",
                }}
              >
                <span style={{ fontSize: 8, fontWeight: 500, color: ev[7] as string, display: "block" }}>{ev[3] as string}</span>
                <span style={{ fontSize: 7, color: ev[8] as string, display: "block" }}>{ev[4] as string}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Cursor ── */}
      <div
        style={{
          position: "absolute",
          left: cursor.x,
          top: cursor.y,
          opacity: cursor.visible ? 1 : 0,
          transition: "left 0.65s cubic-bezier(0.4,0,0.2,1), top 0.65s cubic-bezier(0.4,0,0.2,1), opacity 0.2s",
          pointerEvents: "none",
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#3B82F6", border: "2px solid #fff", boxShadow: "0 0 0 1.5px #3B82F6", flexShrink: 0 }} />
        <div style={{ background: "#1a1a1a", color: "#fff", fontSize: 9, fontWeight: 500, padding: "2px 7px", borderRadius: 100, whiteSpace: "nowrap" as const, letterSpacing: "0.02em" }}>
          click
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  ch: {
    background: "#EFF6FF",
    borderBottom: "0.5px solid #BFDBFE",
    borderLeft: "0.5px solid #BFDBFE",
    padding: "4px 2px",
    textAlign: "center",
    fontSize: 8,
    fontWeight: 500,
    letterSpacing: "0.04em",
    color: "#2563EB",
    textTransform: "uppercase",
    height: HEADER_H,
  },
  tl: {
    background: "#EFF6FF",
    borderBottom: "0.5px solid #BFDBFE",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "flex-end",
    paddingRight: 4,
    paddingTop: 3,
    fontSize: 7.5,
    color: "#60A5FA",
  },
  dc: {
    borderLeft: "0.5px solid #DBEAFE",
    borderBottom: "0.5px solid #DBEAFE",
    position: "relative",
  },
};