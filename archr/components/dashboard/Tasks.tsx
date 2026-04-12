"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  AttachmentIcon,
  CheckmarkCircle01Icon,
  CircleIcon,
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
  const [subtasksMap, setSubtasksMap] = useState<Record<string, Subtask[]>>({});
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Load ──────────────────────────────────────────────────────
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
    setGeneratingId(todo.id);
    setError("");
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

  return (
    <main
      className="min-h-screen bg-slate-50/50 px-8 pt-6 pb-8 transition-[margin] duration-300"
      style={{ marginLeft: isExpanded ? 200 : 56 }}
    >
      {/* ── Header ── */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Tasks</h1>
        <p className="mt-0.5 text-sm text-slate-400">Your personal to-do list.</p>
      </div>

      {/* ── Input ── */}
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
          placeholder="Add something to work on..."
          className="flex-1 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!input.trim() || adding}
          className="inline-flex items-center gap-2 rounded-full bg-linear-to-b from-blue-500 via-blue-600 to-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 ring-1 ring-inset ring-white/20 transition hover:from-blue-400 hover:via-blue-500 hover:to-blue-600 disabled:cursor-not-allowed disabled:opacity-60 hover:cursor-pointer"
        >
          <HugeiconsIcon
            icon={adding ? Loading03Icon : Add01Icon}
            className={`h-4 w-4 ${adding ? "animate-spin" : ""}`}
          />
          Add
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* ── List ── */}
      <div className="mt-5">
        {loading ? (
          <div className="flex h-48 items-center justify-center gap-2 text-sm text-slate-400">
            <HugeiconsIcon icon={Loading03Icon} className="h-4 w-4 animate-spin" />
            Loading tasks...
          </div>
        ) : todos.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <HugeiconsIcon icon={TaskDaily02Icon} className="h-6 w-6 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Nothing here yet</p>
              <p className="mt-0.5 text-xs text-slate-400">Type something above and press Enter to add it.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Active items */}
            {active.length > 0 && (
              <ul className="divide-y divide-slate-100">
                {active.map((todo) => (
                  <li key={todo.id} className="group px-4 py-3 transition hover:bg-slate-50/70">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleDone(todo)}
                        className="shrink-0 text-slate-300 transition hover:text-blue-500 hover:cursor-pointer"
                        aria-label="Mark complete"
                      >
                        <HugeiconsIcon icon={CircleIcon} className="h-[18px] w-[18px]" />
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-sm text-slate-800">{todo.title}</span>
                          {(todo.assignment_text || todo.file_name) && (
                            todo.file_url ? (
                              <a href={todo.file_url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-slate-300 transition hover:text-slate-500">
                                <HugeiconsIcon icon={AttachmentIcon} className="h-3 w-3" />
                              </a>
                            ) : (
                              <span className="shrink-0 text-slate-300">
                                <HugeiconsIcon icon={AttachmentIcon} className="h-3 w-3" />
                              </span>
                            )
                          )}
                        </div>
                        {(subtasksMap[todo.id] ?? []).length > 0 && (
                          <ul className="mt-1 space-y-0.5 border-l border-slate-200 pl-2">
                            {(subtasksMap[todo.id] ?? []).map((sub) => (
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
                                <span className={`truncate text-xs ${sub.status === "done" ? "text-slate-300 line-through" : "text-slate-500"}`}>
                                  {sub.title}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => generateSubtasks(todo)}
                        disabled={generatingId === todo.id}
                        className="inline-flex h-7 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-[10px] font-medium text-slate-500 transition hover:bg-slate-100 hover:cursor-pointer disabled:opacity-60"
                        title="Generate AI subtasks"
                      >
                        <HugeiconsIcon
                          icon={generatingId === todo.id ? Loading03Icon : SparklesIcon}
                          className={`h-3 w-3 ${generatingId === todo.id ? "animate-spin" : ""}`}
                        />
                        {generatingId === todo.id ? "..." : "AI"}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeTodo(todo.id)}
                        className="invisible shrink-0 text-slate-300 transition hover:text-red-500 hover:cursor-pointer group-hover:visible"
                        aria-label="Delete"
                      >
                        <HugeiconsIcon icon={Delete01Icon} className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* Done items */}
            {done.length > 0 && (
              <>
                {active.length > 0 && <div className="border-t border-slate-100" />}
                <div className="bg-slate-50/60 px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  Completed · {done.length}
                </div>
                <ul className="divide-y divide-slate-100">
                  {done.map((todo) => (
                    <li key={todo.id} className="group px-4 py-3 transition hover:bg-slate-50/70">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleDone(todo)}
                          className="shrink-0 text-blue-400 transition hover:text-slate-300 hover:cursor-pointer"
                          aria-label="Mark incomplete"
                        >
                          <HugeiconsIcon icon={CheckmarkCircle01Icon} className="h-[18px] w-[18px]" />
                        </button>
                        <div className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-slate-300 line-through">{todo.title}</span>
                          {(subtasksMap[todo.id] ?? []).length > 0 && (
                            <ul className="mt-1 space-y-0.5 border-l border-slate-200 pl-2">
                              {(subtasksMap[todo.id] ?? []).map((sub) => (
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
                                  <span className={`truncate text-xs ${sub.status === "done" ? "text-slate-300 line-through" : "text-slate-500"}`}>
                                    {sub.title}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => generateSubtasks(todo)}
                          disabled={generatingId === todo.id}
                          className="inline-flex h-7 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-[10px] font-medium text-slate-500 transition hover:bg-slate-100 hover:cursor-pointer disabled:opacity-60"
                          title="Generate AI subtasks"
                        >
                          <HugeiconsIcon
                            icon={generatingId === todo.id ? Loading03Icon : SparklesIcon}
                            className={`h-3 w-3 ${generatingId === todo.id ? "animate-spin" : ""}`}
                          />
                          {generatingId === todo.id ? "..." : "AI"}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeTodo(todo.id)}
                          className="invisible shrink-0 text-slate-300 transition hover:text-red-500 hover:cursor-pointer group-hover:visible"
                          aria-label="Delete"
                        >
                          <HugeiconsIcon icon={Delete01Icon} className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* Footer */}
            <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-2 text-xs text-slate-400">
              {active.length} remaining · {done.length} completed
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
