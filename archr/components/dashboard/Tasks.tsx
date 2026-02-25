"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type TasksProp = {
  isExpanded: boolean;
};

type TaskPriority = "low" | "medium" | "high";
type TaskStatus = "todo" | "in_progress" | "done";

type Task = {
  id: string;
  user_id: string;
  title: string;
  deadline: string;
  priority: TaskPriority;
  status: TaskStatus;
  notes: string | null;
  estimated_minutes: number | null;
  created_at: string;
  updated_at?: string;
};

type ScheduleSummary = {
  createdCount: number;
  unscheduledMinutes: number;
  scheduledCount: number;
};

const priorityClasses: Record<TaskPriority, string> = {
  low: "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30",
  medium: "bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/30",
  high: "bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/30",
};

export default function Tasks({ isExpanded }: TasksProp) {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [schedulingTaskId, setSchedulingTaskId] = useState<string | null>(null);
  const [scheduleSummaries, setScheduleSummaries] = useState<
    Record<string, ScheduleSummary>
  >({});

  // Form state
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [notes, setNotes] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState("");

  const sortedTasks = useMemo(() => {
    return [...tasks].sort(
      (a, b) =>
        new Date(a.deadline || "9999-12-31").getTime() -
        new Date(b.deadline || "9999-12-31").getTime(),
    );
  }, [tasks]);

  const resetForm = () => {
    setTitle("");
    setDeadline("");
    setPriority("medium");
    setNotes("");
    setEstimatedMinutes("");
  };

  useEffect(() => {
    const loadTasks = async () => {
      setLoading(true);
      setError("");

      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData.user) {
        setError("You must be logged in to view tasks.");
        setLoading(false);
        return;
      }

      setUserId(userData.user.id);

      const { data, error: tasksError } = await supabase
        .from("tasks")
        .select(
          "id, user_id, title, deadline, priority, status, notes, estimated_minutes, created_at, updated_at",
        )
        .order("deadline", { ascending: true });

      if (tasksError) {
        setError(tasksError.message);
        setLoading(false);
        return;
      }

      const loadedTasks = (data ?? []) as Task[];
      setTasks(loadedTasks);
      setLoading(false);

      const { data: sessions, error: sessionsError } = await supabase
        .from("study_sessions")
        .select("task_id")
        .eq("user_id", userData.user.id)
        .eq("status", "scheduled");

      if (!sessionsError) {
        const counts = (sessions ?? []).reduce<Record<string, number>>(
          (acc, row) => {
            const taskId = (row as { task_id: string }).task_id;
            acc[taskId] = (acc[taskId] ?? 0) + 1;
            return acc;
          },
          {},
        );

        setScheduleSummaries((prev) => {
          const next: Record<string, ScheduleSummary> = { ...prev };
          for (const task of loadedTasks) {
            const previous = prev[task.id];
            next[task.id] = {
              createdCount: previous?.createdCount ?? 0,
              unscheduledMinutes: previous?.unscheduledMinutes ?? 0,
              scheduledCount: counts[task.id] ?? 0,
            };
          }
          return next;
        });
      }
    };

    loadTasks();
  }, []);

  const handleAddTask = async () => {
    if (!title.trim() || !deadline || !userId) return;

    setSaving(true);
    setError("");

    const payload = {
      user_id: userId,
      title: title.trim(),
      deadline: new Date(deadline).toISOString(),
      priority,
      status: "todo" as TaskStatus,
      notes: notes.trim() || null,
      estimated_minutes: estimatedMinutes ? Number(estimatedMinutes) : null,
    };

    const { data, error: insertError } = await supabase
      .from("tasks")
      .insert(payload)
      .select(
        "id, user_id, title, deadline, priority, status, notes, estimated_minutes, created_at, updated_at",
      )
      .single();

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setTasks((prev) => [data as Task, ...prev]);
    setIsModalOpen(false);
    resetForm();

    const createdTask = data as Task;
    setTasks((prev) => [createdTask, ...prev]);

    const scheduleRes = await fetch("api/ai/schedule", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ taskId: createdTask.id, regenerate: false }),
    });

    if (scheduleRes.ok) {
      const result = await scheduleRes.json();
      setScheduleSummaries((prev) => ({
        ...prev,
        [createdTask.id]: {
          createdCount: result.created_count ?? 0,
          unscheduledMinutes: result.unscheduled_minutes ?? 0,
          scheduledCount: result.created_count ?? 0,
        },
      }));
    } else {
      const body = await scheduleRes.json().catch(() => null);
      setError(body?.error ?? "Task created, but schedule generation failed.");
    }

    setIsModalOpen(false);
    resetForm();
  };

  const markDone = async (id: string) => {
    setError("");

    const { error: updateError } = await supabase
      .from("tasks")
      .update({ status: "done", updated_at: new Date().toISOString() })
      .eq("id", id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, status: "done" } : task)),
    );
  };

  const removeTask = async (id: string) => {
    setError("");

    const { error: deleteError } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const handleGenerateSchedule = async (taskId: string, regenerate = false) => {
    if (!userId) return;

    setSchedulingTaskId(taskId);
    setError("");

    const response = await fetch("/api/ai/schedule", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ taskId, regenerate }),
    });

    setSchedulingTaskId(null);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Failed to generate schedule.");
      return;
    }

    const result = (await response.json()) as {
      created_count: number;
      unscheduled_minutes: number;
    };

    const { data: sessions, error: sessionsError } = await supabase
      .from("study_sessions")
      .select("task_id")
      .eq("user_id", userId)
      .eq("task_id", taskId)
      .eq("status", "scheduled");

    const scheduledCount = sessionsError ? 0 : (sessions ?? []).length;

    setScheduleSummaries((prev) => ({
      ...prev,
      [taskId]: {
        createdCount: result.created_count ?? 0,
        unscheduledMinutes: result.unscheduled_minutes ?? 0,
        scheduledCount,
      },
    }));
  };

  return (
    <main
      className="h-screen overflow-hidden px-8 pt-2 pb-3 transition-[margin] duration-300"
      style={{ marginLeft: isExpanded ? 260 : 70 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Tasks</h1>
          <p className="text-sm text-white/60">
            Track deadlines and priority work.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-linear-to-b from-blue-400 via-blue-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 ring-1 ring-inset ring-white/20 transition hover:from-blue-300 hover:via-blue-400 hover:to-blue-500"
        >
          <span className="text-base leading-none">+</span>
          New Task
        </button>
      </div>

      {/* List */}
      <div className="mt-4 h-[calc(100vh-7rem)] overflow-auto rounded-2xl border border-white/10 bg-[#131314] p-4">
        {error ? (
          <div className="mb-3 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-white/60">
            Loading tasks...
          </div>
        ) : sortedTasks.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-white/50">
            No tasks yet. Click{" "}
            <span className="mx-1 font-medium">New Task</span> to add one.
          </div>
        ) : (
          <div className="space-y-3">
            {sortedTasks.map((task) => (
              <div
                key={task.id}
                className="rounded-xl border border-white/10 bg-white/3 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3
                      className={`text-sm font-semibold ${
                        task.status === "done"
                          ? "text-white/40 line-through"
                          : "text-white"
                      }`}
                    >
                      {task.title}
                    </h3>
                    <p className="mt-1 text-xs text-white/60">
                      Due: {new Date(task.deadline).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${priorityClasses[task.priority]}`}
                    >
                      {task.priority}
                    </span>

                    {task.status !== "done" && (
                      <button
                        type="button"
                        onClick={() => markDone(task.id)}
                        className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/80 transition hover:bg-white/10"
                      >
                        Mark done
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleGenerateSchedule(task.id, false)}
                      disabled={schedulingTaskId === task.id}
                      className="rounded-full border border-blue-400/30 px-3 py-1 text-xs text-blue-200 transition hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {schedulingTaskId === task.id
                        ? "Scheduling..."
                        : "Generate"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleGenerateSchedule(task.id, true)}
                      disabled={schedulingTaskId === task.id}
                      className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Regenerate
                    </button>

                    <button
                      type="button"
                      onClick={() => removeTask(task.id)}
                      className="rounded-full border border-red-400/30 px-3 py-1 text-xs text-red-300 transition hover:bg-red-500/10"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {(task.notes || task.estimated_minutes) && (
                  <div className="mt-3 border-t border-white/10 pt-3 text-xs text-white/65">
                    {task.estimated_minutes ? (
                      <p>Estimated: {task.estimated_minutes} min</p>
                    ) : null}
                    {task.notes ? <p className="mt-1">{task.notes}</p> : null}
                  </div>
                )}

                {scheduleSummaries[task.id] ? (
                  <div className="mt-3 rounded-lg border border-blue-400/20 bg-blue-500/10 px-3 py-2 text-xs text-blue-100">
                    <p>
                      Sessions scheduled:{" "}
                      {scheduleSummaries[task.id].scheduledCount}
                    </p>
                    <p>
                      Last run created:{" "}
                      {scheduleSummaries[task.id].createdCount} | Unscheduled:{" "}
                      {scheduleSummaries[task.id].unscheduledMinutes} min
                    </p>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b0d16] p-6 text-white">
            <h2 className="text-lg font-semibold">Add New Task</h2>

            <div className="mt-4 grid gap-3">
              <div className="grid gap-1">
                <label className="text-xs uppercase tracking-[0.25em] text-white/50">
                  Task name
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Finish chapter 5 notes"
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-white/35 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div className="grid gap-1">
                <label className="text-xs uppercase tracking-[0.25em] text-white/50">
                  Deadline
                </label>
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div className="grid gap-1">
                <label className="text-xs uppercase tracking-[0.25em] text-white/50">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="grid gap-1">
                <label className="text-xs uppercase tracking-[0.25em] text-white/50">
                  Estimated minutes (optional)
                </label>
                <input
                  type="number"
                  min={5}
                  step={5}
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(e.target.value)}
                  placeholder="60"
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-white/35 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div className="grid gap-1">
                <label className="text-xs uppercase tracking-[0.25em] text-white/50">
                  Notes (optional)
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add context for this task..."
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-white/35 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleAddTask}
                disabled={!title.trim() || !deadline || saving}
                className="rounded-full bg-linear-to-b from-blue-400 via-blue-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 ring-1 ring-inset ring-white/20 transition hover:from-blue-300 hover:via-blue-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Adding..." : "Add task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
