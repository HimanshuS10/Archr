"use client";

import { useEffect, useRef, useState } from "react";

const PROJECT_TASK = "Build final presentation";

const SUB_TASKS = [
  "Draft outline",
  "Create slides",
  "Design visuals",
  "Rehearse pitch",
];

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

function Checkbox({ done, blue = false }: { done: boolean; blue?: boolean }) {
  const color = blue ? "#3B82F6" : "#3B82F6";
  return (
    <div
      style={{
        width: 12,
        height: 12,
        borderRadius: "50%",
        flexShrink: 0,
        border: `1.5px solid ${done ? color : "#D3D1C7"}`,
        background: done ? color : "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background 0.22s, border-color 0.22s",
      }}
    >
      {done && (
        <svg width="7" height="5" viewBox="0 0 7 5" fill="none">
          <path
            d="M1 2.5L2.8 4L6 1"
            stroke="#fff"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}

export default function TaskBreakdownAnimation() {
  const runningRef = useRef(false);

  const [thinking, setThinking] = useState(false);
  const [btnPulse, setBtnPulse] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);
  const [checkedCount, setCheckedCount] = useState(0);
  const [parentDone, setParentDone] = useState(false);
  const [dots, setDots] = useState("");

  // Animate the thinking dots
  useEffect(() => {
    if (!thinking) { setDots(""); return; }
    let d = 0;
    const iv = setInterval(() => {
      d = (d + 1) % 4;
      setDots(".".repeat(d));
    }, 300);
    return () => clearInterval(iv);
  }, [thinking]);

  useEffect(() => {
    if (runningRef.current) return;
    runningRef.current = true;

    (async () => {
      while (true) {
        // Reset
        setThinking(false);
        setBtnPulse(false);
        setVisibleCount(0);
        setCheckedCount(0);
        setParentDone(false);

        await delay(700);

        // Pulse the AI button
        setBtnPulse(true);
        await delay(300);
        setBtnPulse(false);
        await delay(200);

        // Thinking
        setThinking(true);
        await delay(1100);
        setThinking(false);

        await delay(200);

        // Reveal sub-tasks one by one
        for (let i = 1; i <= SUB_TASKS.length; i++) {
          setVisibleCount(i);
          await delay(260);
        }

        await delay(400);

        // Check off sub-tasks one by one
        for (let i = 1; i <= SUB_TASKS.length; i++) {
          setCheckedCount(i);
          await delay(320);
        }

        await delay(200);
        setParentDone(true);

        // Hold
        await delay(2000);
      }
    })();

    return () => { runningRef.current = false; };
  }, []);

  return (
    <div
      style={{
        width: "100%",
        fontFamily: "inherit",
        background: "#fff",
        border: "0.5px solid #D3D1C7",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {/* Panel header */}
      <div
        style={{
          background: "#EFF6FF",
          borderBottom: "0.5px solid #BFDBFE",
          padding: "6px 10px",
          fontSize: 9,
          fontWeight: 500,
          letterSpacing: "0.06em",
          textTransform: "uppercase" as const,
          color: "#1E40AF",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>Task</span>
        <span style={{ color: "#3B82F6", fontSize: 8, letterSpacing: 0 }}>
          {parentDone ? "✓ Done" : thinking ? `AI thinking${dots}` : ""}
        </span>
      </div>

      {/* Parent task row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "7px 10px",
          borderBottom: "0.5px solid #DBEAFE",
          background: thinking ? "#EFF6FF" : "#fff",
          transition: "background 0.3s",
        }}
      >
        <Checkbox done={parentDone} />
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            flex: 1,
            color: parentDone ? "#93C5FD" : "#1E3A8A",
            textDecoration: parentDone ? "line-through" : "none",
            transition: "color 0.3s",
          }}
        >
          {PROJECT_TASK}
        </span>

        {/* AI Breakdown button */}
        <button
          style={{
            fontSize: 8,
            fontWeight: 600,
            padding: "2px 6px",
            borderRadius: 4,
            border: "none",
            background: btnPulse ? "#1D4ED8" : "#3B82F6",
            color: "#fff",
            cursor: "default",
            letterSpacing: "0.02em",
            transform: btnPulse ? "scale(0.94)" : "scale(1)",
            transition: "background 0.15s, transform 0.1s",
            flexShrink: 0,
          }}
        >
          ✦ AI
        </button>
      </div>

      {/* Sub-tasks */}
      <div style={{ borderLeft: "2px solid #BFDBFE", marginLeft: 18 }}>
        {SUB_TASKS.map((label, i) => {
          const visible = i < visibleCount;
          const checked = i < checkedCount;
          return (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 10px 5px 8px",
                borderBottom:
                  i < SUB_TASKS.length - 1 ? "0.5px solid #EFF6FF" : "none",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateX(0)" : "translateX(-6px)",
                transition: "opacity 0.22s ease, transform 0.22s ease",
                background: checked ? "#EFF6FF" : "#fff",
              }}
            >
              <Checkbox done={checked} />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  color: checked ? "#93C5FD" : "#2563EB",
                  textDecoration: checked ? "line-through" : "none",
                  transition: "color 0.22s, text-decoration 0.22s",
                }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
