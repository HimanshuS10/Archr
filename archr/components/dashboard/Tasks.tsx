"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  AttachmentIcon,
  Calendar01Icon,
  CheckmarkCircle01Icon,
  CircleIcon,
  Clock01Icon,
  Delete01Icon,
  Loading03Icon,
  SparklesIcon,
  TaskDaily02Icon,
} from "@hugeicons/core-free-icons";

type TasksProp = { isExpanded: boolean };

type Todo = {
  id: string;
  user_id: string;
  title: string;
  deadline: string;
  notes: string | null;
  assignment_text: string | null;
  file_name: string | null;
  file_url: string | null;
  status: "todo" | "done";
  created_at: string;
};

type Subtask = {
  id: string;
  task_id: string;
  title: string;
  estimated_minutes: number | null;
  order: number;
  status: "todo" | "done";
  ai_generated: boolean;
};

function formatSupabaseError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("does not exist") || lower.includes("relation") || lower.includes("column")) {
    return `${message} Run the SQL migrations in /supabase (tasks_add_type.sql, tasks_add_grouping.sql, tasks_add_grouping_color.sql, tasks_add_assignment_columns.sql, tasks_add_file_url.sql, subtasks.sql) and refresh.`;
  }
  return message;
}

export default function Tasks({ isExpanded }: TasksProp) {
  const [userId, setUserId] = useState<string | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [subtaskHint, setSubtaskHint] = useState("");
  const [subtasksMap, setSubtasksMap] = useState<Record<string, Subtask[]>>({});
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [scheduleModal, setScheduleModal] = useState<{ taskId: string; title: string } | null>(null);
  const [scheduleStart, setScheduleStart] = useState("");
  const [scheduling, setScheduling] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function getDefaultScheduleStart() {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 1);
    return d.toISOString().slice(0, 16);
  }

  const openScheduleModal = (todo: Todo) => {
    setScheduleStart(getDefaultScheduleStart());
    setScheduleModal({ taskId: todo.id, title: todo.title });
  };

  const handleScheduleSubtasks = async () => {
    if (!scheduleModal) return;
    const subtasks = [...(subtasksMap[scheduleModal.taskId] ?? [])].sort((a, b) => a.order - b.order);
    if (subtasks.length === 0) return;
    setScheduling(true);
    setError("");
    let cursor = new Date(scheduleStart);
    try {
      for (const sub of subtasks) {
        const durationMs = (sub.estimated_minutes ?? 30) * 60 * 1000;
        const start = cursor.toISOString().slice(0, 16);
        const end = new Date(cursor.getTime() + durationMs).toISOString().slice(0, 16);
        const res = await fetch("/api/google/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: sub.title, start, end }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? "Failed to create calendar event.");
        }
        cursor = new Date(cursor.getTime() + durationMs);
      }
      setScheduleSuccess(`${subtasks.length} subtask${subtasks.length !== 1 ? "s" : ""} added to your calendar.`);
      setScheduleModal(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not schedule subtasks.");
    } finally {
      setScheduling(false);
    }
  };

  useEffect(() => {
    if (!scheduleSuccess) return;
    const t = window.setTimeout(() => setScheduleSuccess(null), 5000);
    return () => window.clearTimeout(t);
  }, [scheduleSuccess]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) { setError("You must be logged in."); setLoading(false); return; }
      setUserId(user.id);

      const { data, error: dbErr } = await supabase
        .from("tasks")
        .select("id,user_id,title,deadline,notes,assignment_text,file_name,file_url,status,created_at")
        .eq("user_id", user.id)
        .eq("type", "todo")
        .order("created_at", { ascending: false });

      if (dbErr) setError(formatSupabaseError(dbErr.message));
      else setTodos((data ?? []) as Todo[]);
      setLoading(false);
    };
    load();
  }, []);

  // ── Add ───────────────────────────────────────────────────────
  const handleAdd = async () => {
    const trimmed = input.trim();
    if (!trimmed || !userId) return;
    setAdding(true);
    setError("");

    const { data, error: err } = await supabase
      .from("tasks")
      .insert({
        user_id: userId,
        title: trimmed,
        status: "todo",
        type: "todo",
        // tasks table requires deadline — use a far-future placeholder
        deadline: new Date("9999-12-31").toISOString(),
        priority: "medium",
      })
      .select("id,user_id,title,deadline,notes,assignment_text,file_name,file_url,status,created_at")
      .single();

    setAdding(false);
    if (err) { setError(formatSupabaseError(err.message)); return; }
    setTodos((prev) => [data as Todo, ...prev]);
    setInput("");
    inputRef.current?.focus();
  };

  // ── Toggle done ───────────────────────────────────────────────
  const toggleDone = async (todo: Todo) => {
    if (!userId) return;
    const newStatus = todo.status === "done" ? "todo" : "done";
    const { error: err } = await supabase
      .from("tasks")
      .update({ status: newStatus })
      .eq("id", todo.id)
      .eq("user_id", userId);
    if (err) { setError(formatSupabaseError(err.message)); return; }
    setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, status: newStatus } : t)));
  };

  // ── Delete ────────────────────────────────────────────────────
  const removeTodo = async (id: string) => {
    if (!userId) return;
    const { error: err } = await supabase.from("tasks").delete().eq("id", id).eq("user_id", userId);
    if (err) { setError(formatSupabaseError(err.message)); return; }
    setTodos((prev) => prev.filter((t) => t.id !== id));
    setSubtasksMap((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const generateSubtasks = async (todo: Todo) => {
    const hasAssignmentDescription = Boolean(todo.assignment_text?.trim());
    const hasAssignmentFile = Boolean(todo.file_name || todo.file_url);
    if (!hasAssignmentDescription && !hasAssignmentFile) {
      setSubtaskHint("To make subtasks, add either an uploaded PDF/file or a pasted assignment description.");
      return;
    }
    setGeneratingId(todo.id);
    setError("");
    setSubtaskHint("");
    try {
      const res = await fetch("/api/ai/subtasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: todo.id,
          title: todo.title,
          notes: todo.notes,
          assignment_text: todo.assignment_text,
          deadline: todo.deadline,
          estimated_minutes: null,
          priority: "medium",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to generate subtasks.");
      setSubtasksMap((prev) => ({ ...prev, [todo.id]: json.subtasks as Subtask[] }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate subtasks.");
    } finally {
      setGeneratingId(null);
    }
  };

  useEffect(() => {
    if (!subtaskHint) return;
    const timeout = window.setTimeout(() => setSubtaskHint(""), 4500);
    return () => window.clearTimeout(timeout);
  }, [subtaskHint]);

  const toggleSubtask = async (taskId: string, subtask: Subtask) => {
    if (!userId) return;
    const newStatus = subtask.status === "done" ? "todo" : "done";
    const { error: err } = await supabase
      .from("subtasks")
      .update({ status: newStatus })
      .eq("id", subtask.id)
      .eq("user_id", userId);
    if (err) {
      setError(formatSupabaseError(err.message));
      return;
    }
    setSubtasksMap((prev) => ({
      ...prev,
      [taskId]: (prev[taskId] ?? []).map((s) =>
        s.id === subtask.id ? { ...s, status: newStatus } : s,
      ),
    }));
  };

  const active = todos.filter((t) => t.status !== "done");
  const done = todos.filter((t) => t.status === "done");
  const sortedTodos = [...active, ...done];

  return (
    <main
      className="min-h-screen bg-slate-50/50 px-5 pt-4 pb-5 transition-[margin] duration-300"
      style={{ marginLeft: isExpanded ? 200 : 56 }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold text-slate-900">Tasks To Do</h1>
          <p className="mt-0.5 text-xs text-slate-400">Break down your work into subtasks and track progress.</p>
        </div>
      </div>

      {/* ── Input ── */}
      <div className="mt-2.5 flex items-center gap-1.5">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
          placeholder="Add something to work on..."
          className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!input.trim() || adding}
          className="inline-flex items-center gap-1.5 rounded-md bg-linear-to-b from-blue-400 via-blue-500 to-blue-600 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-inset ring-white/20 transition hover:from-blue-300 hover:via-blue-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-60 hover:cursor-pointer"
        >
          <HugeiconsIcon
            icon={adding ? Loading03Icon : Add01Icon}
            className={`h-3.5 w-3.5 ${adding ? "animate-spin" : ""}`}
          />
          Add Task
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </div>
      )}
      {subtaskHint && (
        <div className="mt-2 rounded-md border border-blue-100 bg-blue-50/70 px-3 py-2 text-[11px] text-blue-700">
          {subtaskHint}
        </div>
      )}

      {/* ── Schedule success toast ── */}
      {scheduleSuccess && (
        <div className="fixed right-5 bottom-5 z-50 max-w-sm rounded-xl border border-blue-200 bg-white p-3 shadow-lg shadow-blue-100">
          <p className="text-xs font-semibold text-blue-700">Scheduled!</p>
          <p className="mt-1 text-xs text-slate-500">{scheduleSuccess}</p>
        </div>
      )}

      {/* ── Table ── */}
      <div className="mt-3">
        {loading ? (
          <div className="flex h-40 items-center justify-center gap-2 text-xs text-slate-400">
            <HugeiconsIcon icon={Loading03Icon} className="h-3.5 w-3.5 animate-spin" />
            Loading tasks...
          </div>
        ) : todos.length === 0 ? (
          <div className="flex h-56 flex-col items-center justify-center gap-2.5 rounded-lg border border-dashed border-slate-200 bg-white text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
              <HugeiconsIcon icon={TaskDaily02Icon} className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600">No tasks yet</p>
              <p className="mt-0.5 text-[11px] text-slate-400">Add one above to start building subtasks.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            {/* Table header */}
            <div className="grid grid-cols-[1.5rem_1fr_5.5rem_5.5rem] items-center gap-2 border-b border-slate-100 bg-slate-50 px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              <span />
              <span>Item</span>
              <span>State</span>
              <span className="text-right">Actions</span>
            </div>

            {/* Rows */}
            <ul className="divide-y divide-slate-100">
              {sortedTodos.map((todo) => {
                const isDone = todo.status === "done";
                const subtasks = subtasksMap[todo.id] ?? [];
                const hasAssignmentDescription = Boolean(todo.assignment_text?.trim());
                const hasAssignmentFile = Boolean(todo.file_name || todo.file_url);
                const canGenerateSubtasks = hasAssignmentDescription || hasAssignmentFile;
                return (
                  <li key={todo.id} className="group transition-colors hover:bg-slate-50/70">
                    <div className="grid grid-cols-[1.5rem_1fr_5.5rem_5.5rem] items-center gap-2 px-2.5 py-1.5">
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={() => toggleDone(todo)}
                        className="flex shrink-0 items-center justify-center text-slate-300 transition hover:text-slate-600 hover:cursor-pointer"
                        aria-label={isDone ? "Mark incomplete" : "Mark complete"}
                      >
                        <HugeiconsIcon
                          icon={isDone ? CheckmarkCircle01Icon : CircleIcon}
                          className={`h-3.5 w-3.5 ${isDone ? "text-slate-500" : ""}`}
                        />
                      </button>

                      {/* Title + subtasks */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className={`truncate text-xs font-medium ${isDone ? "text-slate-300 line-through" : "text-slate-700"}`}>
                            {todo.title}
                          </p>
                          {(todo.assignment_text || todo.file_name) && (
                            todo.file_url ? (
                              <a href={todo.file_url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-slate-300 transition hover:text-slate-500">
                                <HugeiconsIcon icon={AttachmentIcon} className="h-2.5 w-2.5" />
                              </a>
                            ) : (
                              <span className="shrink-0 text-slate-300">
                                <HugeiconsIcon icon={AttachmentIcon} className="h-2.5 w-2.5" />
                              </span>
                            )
                          )}
                        </div>
                        {subtasks.length > 0 && (
                          <ul className="mt-1 space-y-0.5 border-l border-slate-200 pl-2">
                            {subtasks.map((sub) => (
                              <li key={sub.id} className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => toggleSubtask(todo.id, sub)}
                                  className="shrink-0 text-slate-300 transition hover:text-slate-600 hover:cursor-pointer"
                                  aria-label={sub.status === "done" ? "Mark subtask incomplete" : "Mark subtask complete"}
                                >
                                  <HugeiconsIcon
                                    icon={sub.status === "done" ? CheckmarkCircle01Icon : CircleIcon}
                                    className={`h-3 w-3 ${sub.status === "done" ? "text-slate-500" : ""}`}
                                  />
                                </button>
                                <span className={`truncate text-[10px] ${sub.status === "done" ? "text-slate-300 line-through" : "text-slate-500"}`}>
                                  {sub.title}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* Status pill */}
                      <div>
                        <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[9px] font-medium ${
                          isDone
                            ? "border-slate-200 bg-slate-50 text-slate-500"
                            : "border-blue-200 bg-blue-50 text-blue-600"
                        }`}>
                          {isDone ? "Done" : "Open"}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-0.5">
                        {subtasks.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => openScheduleModal(todo)}
                            className="inline-flex h-5 items-center gap-1 rounded border border-blue-200 bg-blue-50 px-1.5 text-[9px] font-medium text-blue-600 transition hover:bg-blue-100 hover:cursor-pointer"
                            title="Schedule subtasks into your calendar"
                          >
                            <HugeiconsIcon icon={Calendar01Icon} className="h-2.5 w-2.5" />
                            Schedule
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => generateSubtasks(todo)}
                            disabled={generatingId === todo.id}
                            className="inline-flex h-5 items-center gap-1 rounded border border-slate-200 bg-white px-1.5 text-[9px] font-medium text-slate-500 transition hover:bg-slate-100 hover:cursor-pointer disabled:opacity-60"
                            title={
                              canGenerateSubtasks
                                ? "Create subtasks from assignment details"
                                : "Click to see requirements"
                            }
                          >
                            <HugeiconsIcon
                              icon={generatingId === todo.id ? Loading03Icon : SparklesIcon}
                              className={`h-2.5 w-2.5 ${generatingId === todo.id ? "animate-spin" : ""}`}
                            />
                            {generatingId === todo.id ? "Making..." : "Make subtasks"}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeTodo(todo.id)}
                          className="inline-flex h-5 w-5 items-center justify-center rounded text-slate-300 transition hover:bg-red-50 hover:text-red-500 hover:cursor-pointer"
                          aria-label="Delete task"
                        >
                          <HugeiconsIcon icon={Delete01Icon} className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Table footer */}
            <div className="border-t border-slate-100 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-400">
              {active.length} remaining · {done.length} completed
            </div>
          </div>
        )}
      </div>

      {/* ── Schedule modal ── */}
      {scheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/80 overflow-hidden">

            {/* Header */}
            <div className="bg-linear-to-br from-blue-50 to-white px-5 pt-5 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500 shadow-sm shadow-blue-200">
                  <HugeiconsIcon icon={Calendar01Icon} className="h-4.5 w-4.5 text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-slate-900">Schedule to Calendar</h2>
                  <p className="truncate text-[11px] text-slate-400">{scheduleModal.title}</p>
                </div>
              </div>
            </div>

            <div className="px-5 pt-4 pb-5 grid gap-4">
              {/* Start time */}
              <div className="grid gap-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Start time</label>
                <input
                  type="datetime-local"
                  value={scheduleStart}
                  onChange={(e) => setScheduleStart(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                />
              </div>

              {/* Timeline preview */}
              <div className="grid gap-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Schedule preview</p>
                <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 py-2">
                  {(() => {
                    const subs = [...(subtasksMap[scheduleModal.taskId] ?? [])].sort((a, b) => a.order - b.order);
                    let cursor = new Date(scheduleStart || new Date());
                    return subs.map((sub, i) => {
                      const start = new Date(cursor);
                      const durationMs = (sub.estimated_minutes ?? 30) * 60 * 1000;
                      cursor = new Date(cursor.getTime() + durationMs);
                      const isLast = i === subs.length - 1;
                      return (
                        <div key={sub.id} className="flex gap-3 px-3 py-1.5">
                          {/* Timeline spine */}
                          <div className="flex flex-col items-center pt-0.5">
                            <div className="h-2 w-2 shrink-0 rounded-full bg-blue-500 ring-2 ring-blue-100" />
                            {!isLast && <div className="mt-0.5 w-px flex-1 bg-slate-200" />}
                          </div>
                          {/* Content */}
                          <div className={`min-w-0 pb-${isLast ? "0" : "2"}`}>
                            <p className="text-[11px] font-medium leading-tight text-slate-700 line-clamp-2">{sub.title}</p>
                            <p className="mt-0.5 text-[10px] text-slate-400">
                              {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              <span className="mx-1 text-slate-300">·</span>
                              {sub.estimated_minutes ?? 30} min
                            </p>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setScheduleModal(null)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleScheduleSubtasks}
                  disabled={!scheduleStart || scheduling}
                  className="inline-flex items-center gap-1.5 rounded-full bg-linear-to-b from-blue-400 via-blue-500 to-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-300 ring-1 ring-inset ring-white/20 transition hover:from-blue-300 hover:via-blue-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-60 hover:cursor-pointer"
                >
                  <HugeiconsIcon
                    icon={scheduling ? Loading03Icon : Calendar01Icon}
                    className={`h-3.5 w-3.5 ${scheduling ? "animate-spin" : ""}`}
                  />
                  {scheduling ? "Scheduling..." : "Add to Calendar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
