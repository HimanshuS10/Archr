"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  CheckmarkCircle01Icon,
  CircleIcon,
  Delete01Icon,
  PencilEdit01Icon,
  TaskDaily02Icon,
  Calendar01Icon,
  Clock01Icon,
  AttachmentIcon,
  FileEditIcon,
  ArrowUp01Icon,
  SparklesIcon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";

type TasksProp = { isExpanded: boolean };
type TaskPriority = "low" | "medium" | "high";
type TaskStatus = "todo" | "in_progress" | "done";
type ContentTab = "paste" | "file";

type Subtask = {
  id: string;
  task_id: string;
  title: string;
  estimated_minutes: number | null;
  order: number;
  status: "todo" | "done";
  ai_generated: boolean;
};

type Task = {
  id: string;
  user_id: string;
  title: string;
  deadline: string;
  priority: TaskPriority;
  status: TaskStatus;
  notes: string | null;
  estimated_minutes: number | null;
  assignment_text: string | null;
  file_name: string | null;
  file_url: string | null;   // Supabase Storage signed URL
  created_at: string;
};

const PRIORITY_STYLES: Record<TaskPriority, { badge: string; dot: string }> = {
  low: { badge: "border-emerald-200 bg-emerald-50 text-emerald-600", dot: "bg-emerald-400" },
  medium: { badge: "border-amber-200  bg-amber-50  text-amber-600", dot: "bg-amber-400" },
  high: { badge: "border-red-200    bg-red-50    text-red-600", dot: "bg-red-400" },
};

function deadlineLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / 86400000);
  if (diffDays < 0) return { text: "Overdue", cls: "text-red-500" };
  if (diffDays === 0) return { text: "Due today", cls: "text-amber-500" };
  if (diffDays === 1) return { text: "Due tomorrow", cls: "text-amber-400" };
  return { text: `Due in ${diffDays} days`, cls: "text-slate-400" };
}

export default function Tasks({ isExpanded }: TasksProp) {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // subtasks keyed by task id
  const [subtasksMap, setSubtasksMap] = useState<Record<string, Subtask[]>>({});
  const [generatingId, setGeneratingId] = useState<string | null>(null); // which task is generating

  // ── Form state ──────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [notes, setNotes] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState("");
  const [contentTab, setContentTab] = useState<ContentTab>("paste");
  const [assignmentText, setAssignmentText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Sorted: incomplete first (by deadline), then completed ──
  const sortedTasks = useMemo(() => {
    const active = tasks
      .filter((t) => t.status !== "done")
      .sort((a, b) => new Date(a.deadline || "9999").getTime() - new Date(b.deadline || "9999").getTime());
    const done = tasks
      .filter((t) => t.status === "done")
      .sort((a, b) => new Date(a.deadline || "9999").getTime() - new Date(b.deadline || "9999").getTime());
    return [...active, ...done];
  }, [tasks]);

  const resetForm = () => {
    setTitle("");
    setDeadline("");
    setPriority("medium");
    setNotes("");
    setEstimatedMinutes("");
    setAssignmentText("");
    setSelectedFile(null);
    setContentTab("paste");
    setEditingId(null);
  };

  const openEdit = (task: Task) => {
    setEditingId(task.id);
    setTitle(task.title);
    // datetime-local expects "YYYY-MM-DDTHH:mm"
    setDeadline(task.deadline ? task.deadline.slice(0, 16) : "");
    setPriority(task.priority);
    setNotes(task.notes ?? "");
    setEstimatedMinutes(task.estimated_minutes != null ? String(task.estimated_minutes) : "");
    setAssignmentText(task.assignment_text ?? "");
    setSelectedFile(null);
    setContentTab(task.assignment_text ? "paste" : "file");
    setIsModalOpen(true);
  };

  // ── Load ─────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) { setError("You must be logged in."); setLoading(false); return; }
      setUserId(user.id);

      const { data, error: tasksErr } = await supabase
        .from("tasks")
        .select("id,user_id,title,deadline,priority,status,notes,estimated_minutes,assignment_text,file_name,file_url,created_at")
        .order("deadline", { ascending: true });

      if (tasksErr) setError(tasksErr.message);
      else setTasks((data ?? []) as Task[]);
      setLoading(false);
    };
    load();
  }, []);

  // ── Add task ─────────────────────────────────────────────────
  const handleSave = async () => {
    if (!title.trim() || !deadline || !userId) return;
    setSaving(true);
    setError("");

    let fileName: string | null = null;
    let fileUrl: string | null = null;
    let fileText: string | null = null;

    // ── Upload file to Supabase Storage ──────────────────────────
    if (contentTab === "file" && selectedFile) {
      fileName = selectedFile.name;

      // Read plain-text content so AI can also use it
      if (selectedFile.type === "text/plain" || selectedFile.name.endsWith(".txt")) {
        fileText = await selectedFile.text().catch(() => null);
      }

      // Unique path:  {userId}/{timestamp}_{originalName}
      const storagePath = `${userId}/${Date.now()}_${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from("task-files")
        .upload(storagePath, selectedFile, { upsert: false });

      if (uploadErr) {
        setError(`File upload failed: ${uploadErr.message}`);
        setSaving(false);
        return;
      }

      // Create a signed URL valid for 10 years (AI/user reference)
      const { data: signedData, error: signErr } = await supabase.storage
        .from("task-files")
        .createSignedUrl(storagePath, 60 * 60 * 24 * 365 * 10);

      if (signErr) {
        setError(`Could not generate file link: ${signErr.message}`);
        setSaving(false);
        return;
      }

      fileUrl = signedData.signedUrl;
    }

    const SELECT_COLS = "id,user_id,title,deadline,priority,status,notes,estimated_minutes,assignment_text,file_name,file_url,created_at";

    if (editingId) {
      // ── Update existing task ──────────────────────────────────
      const { data, error: err } = await supabase
        .from("tasks")
        .update({
          title: title.trim(),
          deadline: new Date(deadline).toISOString(),
          priority,
          notes: notes.trim() || null,
          estimated_minutes: estimatedMinutes ? Number(estimatedMinutes) : null,
          assignment_text: contentTab === "paste" ? assignmentText.trim() || null : fileText,
          file_name: contentTab === "file" ? fileName : null,
          file_url: contentTab === "file" ? fileUrl : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingId)
        .select(SELECT_COLS)
        .single();

      setSaving(false);
      if (err) { setError(err.message); return; }
      setTasks((prev) => prev.map((t) => (t.id === editingId ? (data as Task) : t)));
    } else {
      // ── Insert new task ───────────────────────────────────────
      const { data, error: err } = await supabase
        .from("tasks")
        .insert({
          user_id: userId,
          title: title.trim(),
          deadline: new Date(deadline).toISOString(),
          priority,
          status: "todo" as TaskStatus,
          notes: notes.trim() || null,
          estimated_minutes: estimatedMinutes ? Number(estimatedMinutes) : null,
          assignment_text: contentTab === "paste" ? assignmentText.trim() || null : fileText,
          file_name: fileName,
          file_url: fileUrl,
        })
        .select(SELECT_COLS)
        .single();

      setSaving(false);
      if (err) { setError(err.message); return; }
      setTasks((prev) => [data as Task, ...prev]);
    }

    setIsModalOpen(false);
    resetForm();
  };

  // ── Toggle complete ───────────────────────────────────────────
  const toggleDone = async (task: Task) => {
    const newStatus: TaskStatus = task.status === "done" ? "todo" : "done";
    const { error: err } = await supabase.from("tasks").update({ status: newStatus }).eq("id", task.id);
    if (err) { setError(err.message); return; }
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));
  };

  // ── Delete ────────────────────────────────────────────────────
  const removeTask = async (id: string) => {
    const { error: err } = await supabase.from("tasks").delete().eq("id", id);
    if (err) { setError(err.message); return; }
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setSubtasksMap((prev) => { const next = { ...prev }; delete next[id]; return next; });
  };

  // ── Generate subtasks via Gemini ──────────────────────────────
  const generateSubtasks = async (task: Task) => {
    setGeneratingId(task.id);
    setError("");
    try {
      const res = await fetch("/api/ai/subtasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: task.id,
          title: task.title,
          notes: task.notes,
          assignment_text: task.assignment_text,
          deadline: task.deadline,
          estimated_minutes: task.estimated_minutes,
          priority: task.priority,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to generate subtasks.");
      setSubtasksMap((prev) => ({ ...prev, [task.id]: json.subtasks as Subtask[] }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate subtasks.");
    } finally {
      setGeneratingId(null);
    }
  };

  // ── Toggle subtask done ───────────────────────────────────────
  const toggleSubtask = async (taskId: string, subtask: Subtask) => {
    const newStatus = subtask.status === "done" ? "todo" : "done";
    const { error: err } = await supabase.from("subtasks").update({ status: newStatus }).eq("id", subtask.id);
    if (err) { setError(err.message); return; }
    setSubtasksMap((prev) => ({
      ...prev,
      [taskId]: (prev[taskId] ?? []).map((s) => s.id === subtask.id ? { ...s, status: newStatus } : s),
    }));
  };

  // ── Drag-and-drop helpers ─────────────────────────────────────
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) { setSelectedFile(file); setContentTab("file"); }
  };

  return (
    <main
      className="min-h-screen bg-white px-8 pt-6 pb-8 transition-[margin] duration-300"
      style={{ marginLeft: isExpanded ? 260 : 70 }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Tasks</h1>
          <p className="mt-0.5 text-sm text-slate-400">Track deadlines and priority work.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-linear-to-b from-blue-500 via-blue-600 to-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 ring-1 ring-inset ring-white/20 transition hover:from-blue-400 hover:via-blue-500 hover:to-blue-600 hover:cursor-pointer"
        >
          <HugeiconsIcon icon={Add01Icon} className="h-4 w-4" />
          New Task
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</div>
      )}

      {/* ── List ── */}
      <div className="mt-4">
        {loading ? (
          <div className="flex h-48 items-center justify-center text-sm text-slate-400">Loading tasks...</div>
        ) : sortedTasks.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-center">
            <HugeiconsIcon icon={TaskDaily02Icon} className="h-8 w-8 text-slate-200" />
            <p className="text-sm text-slate-400">No tasks yet. Click <span className="font-medium text-slate-600">New Task</span> to add one.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {sortedTasks.map((task) => {
              const due = deadlineLabel(task.deadline);
              const isDone = task.status === "done";
              return (
                <li key={task.id} className="group flex items-start gap-4 py-4">
                  {/* Checkbox */}
                  <button
                    type="button"
                    onClick={() => toggleDone(task)}
                    className="mt-0.5 shrink-0 text-slate-300 transition hover:text-blue-500 hover:cursor-pointer"
                    aria-label={isDone ? "Mark incomplete" : "Mark complete"}
                  >
                    <HugeiconsIcon
                      icon={isDone ? CheckmarkCircle01Icon : CircleIcon}
                      className={`h-5 w-5 ${isDone ? "text-blue-500" : ""}`}
                    />
                  </button>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium ${isDone ? "text-slate-300 line-through" : "text-slate-900"}`}>
                      {task.title}
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs">
                      {/* Deadline */}
                      <span className={`flex items-center gap-1 ${due.cls}`}>
                        <HugeiconsIcon icon={Calendar01Icon} className="h-3 w-3" />
                        {due.text}
                        <span className="text-slate-400">·</span>
                        {new Date(task.deadline).toLocaleDateString([], { month: "short", day: "numeric" })}
                      </span>

                      {/* Estimated time */}
                      {task.estimated_minutes && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <HugeiconsIcon icon={Clock01Icon} className="h-3 w-3" />
                          {task.estimated_minutes}m
                        </span>
                      )}

                      {/* Priority badge */}
                      <span className={`rounded-full border px-2 py-0.5 font-medium capitalize ${PRIORITY_STYLES[task.priority].badge}`}>
                        {task.priority}
                      </span>

                      {/* Attachment indicator — clickable if there's a URL */}
                      {(task.assignment_text || task.file_name) && (
                        task.file_url ? (
                          <a
                            href={task.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-500 underline-offset-2 hover:underline"
                          >
                            <HugeiconsIcon icon={AttachmentIcon} className="h-3 w-3" />
                            {task.file_name ?? "Attachment"}
                          </a>
                        ) : (
                          <span className="flex items-center gap-1 text-slate-400">
                            <HugeiconsIcon icon={AttachmentIcon} className="h-3 w-3" />
                            {task.file_name ?? "Pasted content"}
                          </span>
                        )
                      )}
                    </div>

                    {/* Notes */}
                    {task.notes && (
                      <p className="mt-1.5 line-clamp-2 text-xs text-slate-400">{task.notes}</p>
                    )}

                    {/* Subtasks */}
                    {(subtasksMap[task.id] ?? []).length > 0 && (
                      <ul className="mt-3 space-y-1.5 border-l-2 border-slate-100 pl-3">
                        {(subtasksMap[task.id] ?? []).map((sub) => (
                          <li key={sub.id} className="flex items-start gap-2">
                            <button
                              type="button"
                              onClick={() => toggleSubtask(task.id, sub)}
                              className="mt-0.5 shrink-0 text-slate-300 transition hover:text-blue-500 hover:cursor-pointer"
                            >
                              <HugeiconsIcon
                                icon={sub.status === "done" ? CheckmarkCircle01Icon : CircleIcon}
                                className={`h-3.5 w-3.5 ${sub.status === "done" ? "text-blue-400" : ""}`}
                              />
                            </button>
                            <span className={`text-xs leading-relaxed ${sub.status === "done" ? "text-slate-300 line-through" : "text-slate-600"}`}>
                              {sub.title}
                              {sub.estimated_minutes && (
                                <span className="ml-1.5 text-slate-400">{sub.estimated_minutes}m</span>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Actions — AI + edit + delete, hover only */}
                  <div className="mt-0.5 flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
                    {/* Gemini subtask button */}
                    <button
                      type="button"
                      onClick={() => generateSubtasks(task)}
                      disabled={generatingId === task.id}
                      className="inline-flex h-7 items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 text-[10px] font-semibold text-violet-600 transition hover:bg-violet-100 hover:cursor-pointer disabled:opacity-60"
                      aria-label="Generate AI subtasks"
                      title="Generate subtasks with Gemini AI"
                    >
                      <HugeiconsIcon
                        icon={generatingId === task.id ? Loading03Icon : SparklesIcon}
                        className={`h-3 w-3 ${generatingId === task.id ? "animate-spin" : ""}`}
                      />
                      {generatingId === task.id ? "Generating…" : "AI subtasks"}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(task)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-300 transition hover:bg-slate-100 hover:text-slate-600 hover:cursor-pointer"
                      aria-label="Edit task"
                    >
                      <HugeiconsIcon icon={PencilEdit01Icon} className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeTask(task.id)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-300 transition hover:bg-red-50 hover:text-red-500 hover:cursor-pointer"
                      aria-label="Delete task"
                    >
                      <HugeiconsIcon icon={Delete01Icon} className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ── Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl max-h-[92vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-slate-900">{editingId ? "Edit Task" : "New Task"}</h2>
            <p className="mt-0.5 text-xs text-slate-400">Add context so the AI can schedule and help smarter.</p>

            <div className="mt-4 grid gap-3">

              {/* Title */}
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Task name</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Finish chapter 5 notes"
                  className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Deadline + Estimated time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Deadline</label>
                  <input
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Est. time</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={5}
                      step={5}
                      value={estimatedMinutes}
                      onChange={(e) => setEstimatedMinutes(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-full border border-slate-200 bg-white px-4 py-2.5 pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">min</span>
                  </div>
                </div>
              </div>

              {/* Priority */}
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Priority</label>
                <div className="flex gap-2">
                  {(["low", "medium", "high"] as TaskPriority[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 rounded-full border py-2 text-xs font-medium capitalize transition hover:cursor-pointer ${priority === p
                        ? PRIORITY_STYLES[p].badge
                        : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50"
                        }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Notes <span className="normal-case tracking-normal text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any context for this task..."
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                />
              </div>

              {/* Assignment content divider */}
              <div className="flex items-center gap-3 pt-1">
                <span className="h-px flex-1 bg-slate-100" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Assignment Content</span>
                <span className="h-px flex-1 bg-slate-100" />
              </div>

              {/* Tab toggle */}
              <div className="flex rounded-xl border border-slate-200 p-1">
                <button
                  type="button"
                  onClick={() => setContentTab("paste")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium transition hover:cursor-pointer ${contentTab === "paste"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-50"
                    }`}
                >
                  <HugeiconsIcon icon={FileEditIcon} className="h-3.5 w-3.5" />
                  Paste text
                </button>
                <button
                  type="button"
                  onClick={() => setContentTab("file")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium transition hover:cursor-pointer ${contentTab === "file"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-50"
                    }`}
                >
                  <HugeiconsIcon icon={AttachmentIcon} className="h-3.5 w-3.5" />
                  Upload file
                </button>
              </div>

              {/* Paste text panel */}
              {contentTab === "paste" && (
                <textarea
                  rows={5}
                  value={assignmentText}
                  onChange={(e) => setAssignmentText(e.target.value)}
                  placeholder="Paste your assignment description, rubric, or instructions here..."
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                />
              )}

              {/* File upload panel */}
              {contentTab === "file" && (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 text-center transition ${isDragging
                    ? "border-blue-400 bg-blue-50"
                    : selectedFile
                      ? "border-blue-200 bg-blue-50"
                      : "border-slate-200 bg-slate-50 hover:border-slate-300"
                    }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.pdf,.doc,.docx,.md"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setSelectedFile(file);
                    }}
                  />
                  {selectedFile ? (
                    <>
                      <HugeiconsIcon icon={AttachmentIcon} className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{selectedFile.name}</p>
                        <p className="text-xs text-slate-400">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <>
                      <HugeiconsIcon icon={ArrowUp01Icon} className="h-8 w-8 text-slate-300" />
                      <div>
                        <p className="text-sm font-medium text-slate-600">Drop a file or click to browse</p>
                        <p className="mt-1 text-xs text-slate-400">.txt, .pdf, .doc, .docx, .md</p>
                      </div>
                    </>
                  )}
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => { setIsModalOpen(false); resetForm(); }}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!title.trim() || !deadline || saving}
                className="rounded-full bg-linear-to-b from-blue-500 via-blue-600 to-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 ring-1 ring-inset ring-white/20 transition hover:from-blue-400 hover:via-blue-500 hover:to-blue-600 disabled:cursor-not-allowed disabled:opacity-60 hover:cursor-pointer"
              >
                {saving ? (editingId ? "Saving..." : "Adding...") : editingId ? "Save changes" : "Add task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
