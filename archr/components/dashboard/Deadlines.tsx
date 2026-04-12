"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  CheckmarkCircle01Icon,
  CircleIcon,
  Delete01Icon,
  PencilEdit01Icon,
  TaskDaily02Icon,
  Calendar01Icon,
  AttachmentIcon,
  FileEditIcon,
  ArrowUp01Icon,
  SparklesIcon,
  Loading03Icon,
  Link01Icon,
  Download01Icon,
} from "@hugeicons/core-free-icons";

type DeadlinesProp = { isExpanded: boolean };
type TaskStatus = "todo" | "in_progress" | "done";
type ContentTab = "paste" | "file";
type ImportTab = "url" | "paste";

type ExtractedDeadline = {
  title: string;
  deadline: string | null;
  notes: string | null;
};

type Task = {
  id: string;
  user_id: string;
  title: string;
  deadline: string;
  grouping: string | null;
  grouping_color: string | null;
  status: TaskStatus;
  notes: string | null;
  assignment_text: string | null;
  file_name: string | null;
  file_url: string | null;   // Supabase Storage signed URL
  created_at: string;
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

function formatSupabaseError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("does not exist") || lower.includes("relation") || lower.includes("column")) {
    return `${message} Run the SQL migrations in /supabase (tasks_add_type.sql, tasks_add_grouping.sql, tasks_add_grouping_color.sql, tasks_add_assignment_columns.sql, tasks_add_file_url.sql, subtasks.sql) and refresh.`;
  }
  return message;
}

const GROUP_COLOR_OPTIONS = [
  "#64748b",
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#dc2626",
  "#ea580c",
  "#ca8a04",
  "#16a34a",
  "#0891b2",
];

function normalizeHexColor(color: string | null | undefined) {
  if (!color) return null;
  const trimmed = color.trim();
  return /^#([0-9a-fA-F]{6})$/.test(trimmed) ? trimmed.toLowerCase() : null;
}

function toSoftBackground(hex: string) {
  return `${hex}1a`;
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTimeInput(date: Date) {
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${hours}:${minutes}`;
}

function getDefaultDeadlineParts() {
  const base = new Date();
  base.setDate(base.getDate() + 1);
  base.setHours(17, 0, 0, 0);
  return {
    date: formatDateInput(base),
    time: formatTimeInput(base),
  };
}

function combineDateTime(date: string, time: string) {
  if (!date) return "";
  const safeTime = time || "23:59";
  return `${date}T${safeTime}`;
}

export default function Deadlines({ isExpanded }: DeadlinesProp) {
  const defaultDeadlineParts = getDefaultDeadlineParts();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [movingTaskId, setMovingTaskId] = useState<string | null>(null);
  const [movedTaskIds, setMovedTaskIds] = useState<Set<string>>(new Set());

  // ── Form state ──────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState(combineDateTime(defaultDeadlineParts.date, defaultDeadlineParts.time));
  const [deadlineDate, setDeadlineDate] = useState(defaultDeadlineParts.date);
  const [deadlineTime, setDeadlineTime] = useState(defaultDeadlineParts.time);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [grouping, setGrouping] = useState("");
  const [groupingColor, setGroupingColor] = useState<string>(GROUP_COLOR_OPTIONS[0]);
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");
  const [contentTab, setContentTab] = useState<ContentTab>("paste");
  const [assignmentText, setAssignmentText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [groupFilter, setGroupFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState<"all" | "open" | "done">("all");

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
    const defaults = getDefaultDeadlineParts();
    setTitle("");
    setDeadline(combineDateTime(defaults.date, defaults.time));
    setDeadlineDate(defaults.date);
    setDeadlineTime(defaults.time);
    setCalendarMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    setGrouping("");
    setGroupingColor(GROUP_COLOR_OPTIONS[0]);
    setNotes("");
    setFormError("");
    setAssignmentText("");
    setSelectedFile(null);
    setContentTab("paste");
    setEditingId(null);
  };

  const openEdit = (task: Task) => {
    setEditingId(task.id);
    setTitle(task.title);
    if (task.deadline) {
      const parsed = new Date(task.deadline);
      const datePart = formatDateInput(parsed);
      const timePart = formatTimeInput(parsed);
      setDeadlineDate(datePart);
      setDeadlineTime(timePart);
      setDeadline(combineDateTime(datePart, timePart));
      setCalendarMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
    } else {
      const defaults = getDefaultDeadlineParts();
      setDeadlineDate(defaults.date);
      setDeadlineTime(defaults.time);
      setDeadline(combineDateTime(defaults.date, defaults.time));
      setCalendarMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    }
    setGrouping(task.grouping ?? "");
    setGroupingColor(normalizeHexColor(task.grouping_color) ?? GROUP_COLOR_OPTIONS[0]);
    setNotes(task.notes ?? "");
    setFormError("");
    setAssignmentText(task.assignment_text ?? "");
    setSelectedFile(null);
    setContentTab(task.assignment_text ? "paste" : "file");
    setIsModalOpen(true);
  };

  useEffect(() => {
    setDeadline(combineDateTime(deadlineDate, deadlineTime));
  }, [deadlineDate, deadlineTime]);

  // ── Load ─────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) { setError("You must be logged in."); setLoading(false); return; }
      setUserId(user.id);

      const { data, error: tasksErr } = await supabase
        .from("tasks")
        .select("id,user_id,title,deadline,grouping,grouping_color,status,notes,assignment_text,file_name,file_url,created_at")
        .eq("user_id", user.id)
        .eq("type", "deadline")
        .order("deadline", { ascending: true });

      if (tasksErr) setError(formatSupabaseError(tasksErr.message));
      else setTasks((data ?? []) as Task[]);
      setLoading(false);
    };
    load();
  }, []);

  // ── Add task ─────────────────────────────────────────────────
  const handleSave = async () => {
    if (!title.trim() || !deadline || !userId) return;
    const existingTask = editingId ? tasks.find((t) => t.id === editingId) ?? null : null;
    const hasAssignmentDescription = Boolean(assignmentText.trim()) || Boolean(existingTask?.assignment_text?.trim());
    const hasAssignmentFile = Boolean(selectedFile) || Boolean(existingTask?.file_name) || Boolean(existingTask?.file_url);
    if (!hasAssignmentDescription && !hasAssignmentFile) {
      setFormError("Please add assignment details: paste a description or upload a file/PDF.");
      return;
    }

    setSaving(true);
    setError("");
    setFormError("");
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

    const SELECT_COLS = "id,user_id,title,deadline,grouping,grouping_color,status,notes,assignment_text,file_name,file_url,created_at";

    if (editingId) {
      // ── Update existing task ──────────────────────────────────
      const { data, error: err } = await supabase
        .from("tasks")
        .update({
          title: title.trim(),
          deadline: new Date(deadline).toISOString(),
          grouping: grouping.trim() || null,
          grouping_color: grouping.trim() ? normalizeHexColor(groupingColor) ?? GROUP_COLOR_OPTIONS[0] : null,
          priority: "medium",
          notes: notes.trim() || null,
          estimated_minutes: null,
          assignment_text: contentTab === "paste"
            ? assignmentText.trim() || null
            : fileText ?? existingTask?.assignment_text ?? null,
          file_name: contentTab === "file" ? (fileName ?? existingTask?.file_name ?? null) : null,
          file_url: contentTab === "file" ? (fileUrl ?? existingTask?.file_url ?? null) : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingId)
        .eq("user_id", userId)
        .select(SELECT_COLS)
        .single();

      setSaving(false);
      if (err) { setError(formatSupabaseError(err.message)); return; }
      setTasks((prev) => prev.map((t) => (t.id === editingId ? (data as Task) : t)));
    } else {
      // ── Insert new task ───────────────────────────────────────
      const { data, error: err } = await supabase
        .from("tasks")
        .insert({
          user_id: userId,
          title: title.trim(),
          deadline: new Date(deadline).toISOString(),
          grouping: grouping.trim() || null,
          grouping_color: grouping.trim() ? normalizeHexColor(groupingColor) ?? GROUP_COLOR_OPTIONS[0] : null,
          priority: "medium",
          status: "todo" as TaskStatus,
          type: "deadline",
          notes: notes.trim() || null,
          estimated_minutes: null,
          assignment_text: contentTab === "paste" ? assignmentText.trim() || null : fileText,
          file_name: fileName,
          file_url: fileUrl,
        })
        .select(SELECT_COLS)
        .single();

      setSaving(false);
      if (err) { setError(formatSupabaseError(err.message)); return; }
      setTasks((prev) => [data as Task, ...prev]);
    }

    setIsModalOpen(false);
    resetForm();
  };

  // ── Toggle complete ───────────────────────────────────────────
  const toggleDone = async (task: Task) => {
    if (!userId) return;
    const newStatus: TaskStatus = task.status === "done" ? "todo" : "done";
    const { error: err } = await supabase.from("tasks").update({ status: newStatus }).eq("id", task.id).eq("user_id", userId);
    if (err) { setError(formatSupabaseError(err.message)); return; }
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));
  };

  // ── Delete ────────────────────────────────────────────────────
  const removeTask = async (id: string) => {
    if (!userId) return;
    const { error: err } = await supabase.from("tasks").delete().eq("id", id).eq("user_id", userId);
    if (err) { setError(formatSupabaseError(err.message)); return; }
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setMovedTaskIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const moveDeadlineToTasks = async (task: Task) => {
    if (!userId || movingTaskId) return;
    setMovingTaskId(task.id);
    setError("");
    try {
      const { error: err } = await supabase
        .from("tasks")
        .insert({
          user_id: userId,
          title: task.title,
          deadline: task.deadline,
          status: "todo",
          type: "todo",
          priority: "medium",
          notes: task.notes,
          assignment_text: task.assignment_text,
          file_name: task.file_name,
          file_url: task.file_url,
        });
      if (err) throw new Error(formatSupabaseError(err.message));
      setMovedTaskIds((prev) => new Set(prev).add(task.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add this assignment to Tasks.");
    } finally {
      setMovingTaskId(null);
    }
  };

  // ── Import modal state ────────────────────────────────────────
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importTab, setImportTab] = useState<ImportTab>("url");
  const [importUrl, setImportUrl] = useState("");
  const [importContent, setImportContent] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState("");
  const [importGrouping, setImportGrouping] = useState("");
  const [importGroupingColor, setImportGroupingColor] = useState<string>(GROUP_COLOR_OPTIONS[0]);
  const [extractedDeadlines, setExtractedDeadlines] = useState<ExtractedDeadline[]>([]);
  const [selectedImports, setSelectedImports] = useState<Set<number>>(new Set());
  const [importSaving, setImportSaving] = useState(false);

  const resetImportModal = () => {
    setImportTab("url");
    setImportUrl("");
    setImportContent("");
    setImportGrouping("");
    setImportGroupingColor(GROUP_COLOR_OPTIONS[0]);
    setImportError("");
    setExtractedDeadlines([]);
    setSelectedImports(new Set());
  };

  const handleExtract = async () => {
    setImportLoading(true);
    setImportError("");
    setExtractedDeadlines([]);
    setSelectedImports(new Set());
    try {
      const body = importTab === "url"
        ? { url: importUrl.trim() }
        : { content: importContent.trim() };
      const res = await fetch("/api/ai/extract-deadlines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to extract deadlines.");
      const deadlines: ExtractedDeadline[] = json.deadlines ?? [];
      setExtractedDeadlines(deadlines);
      // Pre-select all items that have a deadline
      setSelectedImports(new Set(deadlines.map((_, i) => i)));
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Could not extract deadlines.");
    } finally {
      setImportLoading(false);
    }
  };

  const handleImportSave = async () => {
    if (!userId) return;
    setImportSaving(true);
    setImportError("");
    const toInsert = extractedDeadlines.filter((_, i) => selectedImports.has(i));
    const selectedGrouping = importGrouping.trim() || null;
    const SELECT_COLS = "id,user_id,title,deadline,grouping,grouping_color,status,notes,assignment_text,file_name,file_url,created_at";
    try {
      for (const item of toInsert) {
        const { data, error: err } = await supabase
          .from("tasks")
          .insert({
            user_id: userId,
            title: item.title,
            deadline: item.deadline ? new Date(item.deadline).toISOString() : new Date(Date.now() + 7 * 86400000).toISOString(),
            grouping: selectedGrouping,
            grouping_color: selectedGrouping ? normalizeHexColor(importGroupingColor) ?? GROUP_COLOR_OPTIONS[0] : null,
            priority: "medium",
            status: "todo" as TaskStatus,
            type: "deadline",
            notes: item.notes ?? null,
            estimated_minutes: null,
          })
          .select(SELECT_COLS)
          .single();
        if (err) throw new Error(formatSupabaseError(err.message));
        setTasks((prev) => [data as Task, ...prev]);
      }
      setIsImportModalOpen(false);
      resetImportModal();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Failed to save tasks.");
    } finally {
      setImportSaving(false);
    }
  };

  // ── Drag-and-drop helpers ─────────────────────────────────────
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) { setSelectedFile(file); setContentTab("file"); }
  };

  // ── Derived stats ────────────────────────────────────────────
  const stats = useMemo(() => {
    const now = new Date();
    const overdue = tasks.filter((t) => t.status !== "done" && new Date(t.deadline) < now).length;
    const dueToday = tasks.filter((t) => {
      if (t.status === "done") return false;
      const d = new Date(t.deadline);
      return d.toDateString() === now.toDateString();
    }).length;
    const upcoming = tasks.filter((t) => {
      if (t.status === "done") return false;
      const d = new Date(t.deadline);
      const diff = Math.ceil((d.getTime() - now.getTime()) / 86400000);
      return diff > 0 && diff <= 7;
    }).length;
    const done = tasks.filter((t) => t.status === "done").length;
    return { overdue, dueToday, upcoming, done, total: tasks.length };
  }, [tasks]);

  const availableGroups = useMemo(() => {
    const groups = tasks
      .map((t) => t.grouping?.trim())
      .filter((g): g is string => Boolean(g));
    return Array.from(new Set(groups)).sort((a, b) => a.localeCompare(b));
  }, [tasks]);

  const groupColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const task of tasks) {
      const group = task.grouping?.trim();
      const color = normalizeHexColor(task.grouping_color);
      if (group && color && !map[group]) {
        map[group] = color;
      }
    }
    return map;
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return sortedTasks.filter((task) => {
      const groupMatch =
        groupFilter === "all" ||
        (groupFilter === "__ungrouped__"
          ? !(task.grouping ?? "").trim()
          : (task.grouping ?? "") === groupFilter);
      const stateMatch =
        stateFilter === "all" ||
        (stateFilter === "done" ? task.status === "done" : task.status !== "done");
      return groupMatch && stateMatch;
    });
  }, [sortedTasks, groupFilter, stateFilter]);

  useEffect(() => {
    const key = grouping.trim();
    if (!key) return;
    const knownColor = groupColorMap[key];
    if (knownColor) setGroupingColor(knownColor);
  }, [grouping, groupColorMap]);

  useEffect(() => {
    const key = importGrouping.trim();
    if (!key) return;
    const knownColor = groupColorMap[key];
    if (knownColor) setImportGroupingColor(knownColor);
  }, [importGrouping, groupColorMap]);

  const selectedDeadlineDate = useMemo(() => {
    if (!deadlineDate) return null;
    const parsed = new Date(`${deadlineDate}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [deadlineDate]);

  const calendarDays = useMemo(() => {
    const firstOfMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const monthStartDay = (firstOfMonth.getDay() + 6) % 7;
    const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
    const daysInPrevMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 0).getDate();
    const cells: { key: string; date: Date; isCurrentMonth: boolean }[] = [];

    for (let i = monthStartDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, day);
      cells.push({ key: `prev-${day}`, date, isCurrentMonth: false });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
      cells.push({ key: `curr-${day}`, date, isCurrentMonth: true });
    }

    while (cells.length % 7 !== 0) {
      const day = cells.length - (monthStartDay + daysInMonth) + 1;
      const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, day);
      cells.push({ key: `next-${day}`, date, isCurrentMonth: false });
    }

    return cells;
  }, [calendarMonth]);

  return (
    <main
      className="min-h-screen bg-slate-50/50 px-5 pt-4 pb-5 transition-[margin] duration-300"
      style={{ marginLeft: isExpanded ? 200 : 56 }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold text-slate-900">Deadlines</h1>
          <p className="mt-0.5 text-xs text-slate-400">Track assignment due dates from your syllabus or manual entries.</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => { resetImportModal(); setIsImportModalOpen(true); }}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:cursor-pointer"
          >
            <HugeiconsIcon icon={Link01Icon} className="h-3.5 w-3.5" />
            Import from Course Outline
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-linear-to-b from-blue-400 via-blue-500 to-blue-600 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-inset ring-white/20 transition hover:from-blue-300 hover:via-blue-400 hover:to-blue-500 hover:cursor-pointer"
          >
            <HugeiconsIcon icon={Add01Icon} className="h-3.5 w-3.5" />
            New Deadline
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="all">All groups</option>
          <option value="__ungrouped__">Ungrouped</option>
          {availableGroups.map((group) => (
            <option key={group} value={group}>{group}</option>
          ))}
        </select>
        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value as "all" | "open" | "done")}
          className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="all">All states</option>
          <option value="open">Open</option>
          <option value="done">Completed</option>
        </select>
        {availableGroups.map((group) => {
          const color = groupColorMap[group] ?? "#64748b";
          const isActive = groupFilter === group;
          return (
            <button
              key={group}
              type="button"
              onClick={() => setGroupFilter(isActive ? "all" : group)}
              className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition hover:cursor-pointer"
              style={{
                color,
                borderColor: isActive ? color : toSoftBackground(color),
                backgroundColor: isActive ? toSoftBackground(color) : "white",
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
              {group}
            </button>
          );
        })}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>
      )}

      {/* ── Table ── */}
      <div className="mt-3">
        {loading ? (
          <div className="flex h-40 items-center justify-center gap-2 text-xs text-slate-400">
            <HugeiconsIcon icon={Loading03Icon} className="h-3.5 w-3.5 animate-spin" />
            Loading deadlines...
          </div>
        ) : sortedTasks.length === 0 ? (
          <div className="flex h-56 flex-col items-center justify-center gap-2.5 rounded-lg border border-dashed border-slate-200 bg-white text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
              <HugeiconsIcon icon={TaskDaily02Icon} className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600">No deadlines yet</p>
              <p className="mt-0.5 text-[11px] text-slate-400">Add deadlines manually or import from your course page.</p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => { resetImportModal(); setIsImportModalOpen(true); }}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50 hover:cursor-pointer"
              >
                <HugeiconsIcon icon={Link01Icon} className="h-3 w-3" />
                Import from Course
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-1 rounded-md bg-linear-to-b from-blue-400 via-blue-500 to-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-lg shadow-blue-500/30 ring-1 ring-inset ring-white/20 transition hover:from-blue-300 hover:via-blue-400 hover:to-blue-500 hover:cursor-pointer"
              >
                <HugeiconsIcon icon={Add01Icon} className="h-3 w-3" />
                New Deadline
              </button>
            </div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-200 bg-white text-center">
            <p className="text-xs font-medium text-slate-600">No deadlines match these filters</p>
            <p className="text-[11px] text-slate-400">Try selecting a different group or state.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            {/* Table header */}
            <div className="grid grid-cols-[1.5rem_1fr_7.5rem_5.75rem_5rem] items-center gap-2 border-b border-slate-100 bg-slate-50 px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              <span />
              <span>Item</span>
              <span>Due</span>
              <span>State</span>
              <span className="text-right">Actions</span>
            </div>

            {/* Rows */}
            <ul className="divide-y divide-slate-100">
              {filteredTasks.map((task) => {
                const due = deadlineLabel(task.deadline);
                const isDone = task.status === "done";
                const isOverdue = due.text === "Overdue" && !isDone;
                const isToday = due.text === "Due today" && !isDone;

                return (
                  <li key={task.id} className="group transition-colors hover:bg-slate-50/70">
                    <div className="grid grid-cols-[1.5rem_1fr_7.5rem_5.75rem_5rem] items-center gap-2 px-2.5 py-1.5">

                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={() => toggleDone(task)}
                        className="flex shrink-0 items-center justify-center text-slate-300 transition hover:text-slate-600 hover:cursor-pointer"
                        aria-label={isDone ? "Mark incomplete" : "Mark complete"}
                      >
                        <HugeiconsIcon
                          icon={isDone ? CheckmarkCircle01Icon : CircleIcon}
                          className={`h-3.5 w-3.5 ${isDone ? "text-slate-500" : ""}`}
                        />
                      </button>

                      {/* Title + meta */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className={`truncate text-xs font-medium ${isDone ? "text-slate-300 line-through" : "text-slate-700"}`}>
                            {task.title}
                          </p>
                          {task.grouping && (
                            <span
                              className="rounded border px-1 py-0.5 text-[9px] font-medium"
                              style={{
                                color: normalizeHexColor(task.grouping_color) ?? "#64748b",
                                borderColor: toSoftBackground(normalizeHexColor(task.grouping_color) ?? "#64748b"),
                                backgroundColor: toSoftBackground(normalizeHexColor(task.grouping_color) ?? "#64748b"),
                              }}
                            >
                              {task.grouping}
                            </span>
                          )}
                          {(task.assignment_text || task.file_name) && (
                            task.file_url ? (
                              <a href={task.file_url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-slate-300 transition hover:text-slate-500">
                                <HugeiconsIcon icon={AttachmentIcon} className="h-2.5 w-2.5" />
                              </a>
                            ) : (
                              <span className="shrink-0 text-slate-300">
                                <HugeiconsIcon icon={AttachmentIcon} className="h-2.5 w-2.5" />
                              </span>
                            )
                          )}
                        </div>
                        {task.notes && (
                          <p className="mt-0.5 truncate text-[10px] text-slate-400">{task.notes}</p>
                        )}
                      </div>

                      {/* Deadline */}
                      <div className="min-w-0">
                        <p className={`text-[10px] font-medium ${isDone ? "text-slate-300" : isOverdue ? "text-red-500" : isToday ? "text-amber-500" : "text-slate-500"}`}>{due.text}</p>
                        <p className="mt-0.5 text-[10px] text-slate-400">
                          {new Date(task.deadline).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>

                      {/* Status pill */}
                      <div>
                        <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[9px] font-medium ${
                          isDone
                            ? "border-slate-200 bg-slate-50 text-slate-500"
                            : isOverdue
                              ? "border-red-200 bg-red-50 text-red-500"
                              : isToday
                                ? "border-amber-200 bg-amber-50 text-amber-600"
                                : "border-slate-200 bg-slate-50 text-slate-500"
                        }`}>
                          {isDone ? "Done" : isOverdue ? "Overdue" : isToday ? "Due today" : "Upcoming"}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          type="button"
                          onClick={() => moveDeadlineToTasks(task)}
                          disabled={movingTaskId === task.id || movedTaskIds.has(task.id)}
                          className="inline-flex h-5 items-center gap-1 rounded border border-slate-200 bg-white px-1.5 text-[9px] font-medium text-slate-500 transition hover:bg-slate-100 hover:cursor-pointer disabled:opacity-60"
                          title="Add this assignment to Tasks"
                        >
                          <HugeiconsIcon
                            icon={movingTaskId === task.id ? Loading03Icon : TaskDaily02Icon}
                            className={`h-2.5 w-2.5 ${movingTaskId === task.id ? "animate-spin" : ""}`}
                          />
                          {movingTaskId === task.id ? "Adding..." : movedTaskIds.has(task.id) ? "Added" : "Work on task"}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(task)}
                          className="inline-flex h-5 w-5 items-center justify-center rounded text-slate-300 transition hover:bg-slate-100 hover:text-slate-600 hover:cursor-pointer"
                          aria-label="Edit task"
                        >
                          <HugeiconsIcon icon={PencilEdit01Icon} className="h-2.5 w-2.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeTask(task.id)}
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
              {stats.total} deadline{stats.total !== 1 ? "s" : ""} · {stats.done} completed · {stats.overdue > 0 && <span className="text-red-500 font-medium">{stats.overdue} overdue</span>}
            </div>
          </div>
        )}
      </div>

      <datalist id="deadline-group-options">
        {availableGroups.map((group) => (
          <option key={group} value={group} />
        ))}
      </datalist>

      {/* ── Import from Course Modal ── */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <HugeiconsIcon icon={Link01Icon} className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Import from Course</h2>
                <p className="text-xs text-slate-400">Extract deadlines from a course page or syllabus</p>
              </div>
            </div>

            {extractedDeadlines.length === 0 ? (
              /* ── Step 1: Input ── */
              <div className="mt-5 grid gap-4">
                {/* Tab toggle */}
                <div className="flex rounded-xl border border-slate-200 p-1">
                  <button
                    type="button"
                    onClick={() => setImportTab("url")}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium transition hover:cursor-pointer ${importTab === "url" ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}
                  >
                    <HugeiconsIcon icon={Link01Icon} className="h-3.5 w-3.5" />
                    Course URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportTab("paste")}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium transition hover:cursor-pointer ${importTab === "paste" ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}
                  >
                    <HugeiconsIcon icon={FileEditIcon} className="h-3.5 w-3.5" />
                    Paste Syllabus
                  </button>
                </div>

                {importTab === "url" ? (
                  <div className="grid gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Course page URL</label>
                    <input
                      type="url"
                      value={importUrl}
                      onChange={(e) => setImportUrl(e.target.value)}
                      placeholder="https://canvas.instructure.com/courses/..."
                      className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <p className="text-xs text-slate-400">Works best with public course pages. Password-protected portals may not load — use &ldquo;Paste Syllabus&rdquo; instead.</p>
                  </div>
                ) : (
                  <div className="grid gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Paste your syllabus or course schedule</label>
                    <textarea
                      rows={8}
                      value={importContent}
                      onChange={(e) => setImportContent(e.target.value)}
                      placeholder="Paste your course syllabus, schedule, or any text that lists assignments and due dates..."
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                    />
                  </div>
                )}

                <div className="grid gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Grouping <span className="normal-case tracking-normal text-slate-400 font-normal">(course tag)</span>
                  </label>
                  <input
                    value={importGrouping}
                    onChange={(e) => setImportGrouping(e.target.value)}
                    placeholder="CIS2700, Personal, Work..."
                    list="deadline-group-options"
                    className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={importGroupingColor}
                      onChange={(e) => setImportGroupingColor(e.target.value)}
                      className="h-7 w-9 rounded border border-slate-200 bg-white p-1"
                      aria-label="Grouping color"
                    />
                    <div className="flex flex-wrap gap-1">
                      {GROUP_COLOR_OPTIONS.map((color) => (
                        <button
                          key={`import-step1-${color}`}
                          type="button"
                          onClick={() => setImportGroupingColor(color)}
                          className={`h-5 w-5 rounded-full border transition hover:cursor-pointer ${importGroupingColor === color ? "border-slate-600" : "border-slate-200"}`}
                          style={{ backgroundColor: color }}
                          aria-label={`Set group color ${color}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {importError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">{importError}</div>
                )}

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => { setIsImportModalOpen(false); resetImportModal(); }}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleExtract}
                    disabled={importLoading || (importTab === "url" ? !importUrl.trim() : !importContent.trim())}
                    className="inline-flex items-center gap-2 rounded-full bg-linear-to-b from-blue-400 via-blue-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 ring-1 ring-inset ring-white/20 transition hover:from-blue-300 hover:via-blue-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-60 hover:cursor-pointer"
                  >
                    <HugeiconsIcon
                      icon={importLoading ? Loading03Icon : SparklesIcon}
                      className={`h-4 w-4 ${importLoading ? "animate-spin" : ""}`}
                    />
                    {importLoading ? "Extracting..." : "Extract Deadlines"}
                  </button>
                </div>
              </div>
            ) : (
              /* ── Step 2: Preview & Confirm ── */
              <div className="mt-5 grid gap-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-700">
                    Found <span className="font-semibold text-blue-600">{extractedDeadlines.length}</span> deadline{extractedDeadlines.length !== 1 ? "s" : ""}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedImports.size === extractedDeadlines.length) {
                        setSelectedImports(new Set());
                      } else {
                        setSelectedImports(new Set(extractedDeadlines.map((_, i) => i)));
                      }
                    }}
                    className="text-xs text-blue-500 hover:underline"
                  >
                    {selectedImports.size === extractedDeadlines.length ? "Deselect all" : "Select all"}
                  </button>
                </div>

                <div className="grid gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Grouping <span className="normal-case tracking-normal text-slate-400 font-normal">(applies to selected deadlines)</span>
                  </label>
                  <input
                    value={importGrouping}
                    onChange={(e) => setImportGrouping(e.target.value)}
                    placeholder="CIS2700, Personal, Work..."
                    list="deadline-group-options"
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={importGroupingColor}
                      onChange={(e) => setImportGroupingColor(e.target.value)}
                      className="h-7 w-9 rounded border border-slate-200 bg-white p-1"
                      aria-label="Grouping color"
                    />
                    <div className="flex flex-wrap gap-1">
                      {GROUP_COLOR_OPTIONS.map((color) => (
                        <button
                          key={`import-step2-${color}`}
                          type="button"
                          onClick={() => setImportGroupingColor(color)}
                          className={`h-5 w-5 rounded-full border transition hover:cursor-pointer ${importGroupingColor === color ? "border-slate-600" : "border-slate-200"}`}
                          style={{ backgroundColor: color }}
                          aria-label={`Set group color ${color}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <ul className="max-h-80 space-y-2 overflow-y-auto">
                  {extractedDeadlines.map((item, i) => {
                    const isSelected = selectedImports.has(i);
                    return (
                      <li
                        key={i}
                        onClick={() => {
                          setSelectedImports((prev) => {
                            const next = new Set(prev);
                            if (next.has(i)) next.delete(i); else next.add(i);
                            return next;
                          });
                        }}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${isSelected ? "border-blue-200 bg-blue-50" : "border-slate-100 bg-white opacity-50"}`}
                      >
                        {/* Checkbox indicator */}
                        <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition ${isSelected ? "border-blue-500 bg-blue-500" : "border-slate-300"}`}>
                          {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-800">{item.title}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                            {item.deadline ? (
                              <span className="flex items-center gap-1">
                                <HugeiconsIcon icon={Calendar01Icon} className="h-3 w-3" />
                                {new Date(item.deadline).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                              </span>
                            ) : (
                              <span className="italic text-amber-400">No date found — will default to 7 days</span>
                            )}
                            {importGrouping.trim() && (
                              <span
                                className="rounded-md border px-1.5 py-0.5 text-[10px] font-medium"
                                style={{
                                  color: normalizeHexColor(importGroupingColor) ?? "#64748b",
                                  borderColor: toSoftBackground(normalizeHexColor(importGroupingColor) ?? "#64748b"),
                                  backgroundColor: toSoftBackground(normalizeHexColor(importGroupingColor) ?? "#64748b"),
                                }}
                              >
                                {importGrouping.trim()}
                              </span>
                            )}
                          </div>
                          {item.notes && (
                            <p className="mt-1 line-clamp-1 text-xs text-slate-400">{item.notes}</p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {importError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">{importError}</div>
                )}

                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => { setExtractedDeadlines([]); setSelectedImports(new Set()); setImportError(""); }}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:cursor-pointer"
                  >
                    ← Back
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => { setIsImportModalOpen(false); resetImportModal(); }}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleImportSave}
                      disabled={selectedImports.size === 0 || importSaving}
                      className="inline-flex items-center gap-2 rounded-full bg-linear-to-b from-blue-400 via-blue-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white ring-1 ring-inset ring-white/20 transition hover:from-blue-300 hover:via-blue-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-60 hover:cursor-pointer"
                    >
                      <HugeiconsIcon
                        icon={importSaving ? Loading03Icon : Download01Icon}
                        className={`h-4 w-4 ${importSaving ? "animate-spin" : ""}`}
                      />
                      {importSaving ? "Adding..." : `Add ${selectedImports.size} Deadline${selectedImports.size !== 1 ? "s" : ""}`}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl max-h-[92vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-slate-900">{editingId ? "Edit Deadline" : "New Deadline"}</h2>
            <p className="mt-0.5 text-xs text-slate-400">Add context so the AI can schedule and help smarter.</p>
            {formError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {formError}
              </div>
            )}

            <div className="mt-4 grid gap-3">

              {/* Title */}
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Deadline title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Finish chapter 5 notes"
                  className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Deadline */}
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Deadline</label>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-medium text-slate-600">
                      {selectedDeadlineDate
                        ? selectedDeadlineDate.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: "numeric" })
                        : "Select a date"}
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Previous month"
                      >
                        <HugeiconsIcon icon={ArrowLeft01Icon} className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Next month"
                      >
                        <HugeiconsIcon icon={ArrowRight01Icon} className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mb-2 text-center text-xs font-semibold text-slate-700">
                    {calendarMonth.toLocaleDateString([], { month: "long", year: "numeric" })}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                      <span key={day} className="text-center text-[10px] font-medium uppercase tracking-wide text-slate-400">
                        {day}
                      </span>
                    ))}
                    {calendarDays.map((cell) => {
                      const cellDate = formatDateInput(cell.date);
                      const isSelected = deadlineDate === cellDate;
                      const isToday = formatDateInput(new Date()) === cellDate;
                      return (
                        <button
                          key={cell.key}
                          type="button"
                          onClick={() => {
                            setDeadlineDate(cellDate);
                            setCalendarMonth(new Date(cell.date.getFullYear(), cell.date.getMonth(), 1));
                          }}
                          className={`h-8 rounded-md text-xs font-medium transition ${
                            isSelected
                              ? "bg-blue-500 text-white shadow-sm"
                              : cell.isCurrentMonth
                                ? "bg-white text-slate-700 hover:bg-slate-100"
                                : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                          } ${isToday && !isSelected ? "ring-1 ring-blue-300" : ""}`}
                        >
                          {cell.date.getDate()}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500">Time</span>
                    <input
                      type="time"
                      value={deadlineTime}
                      onChange={(e) => setDeadlineTime(e.target.value)}
                      step={60}
                      className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Grouping */}
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Grouping <span className="normal-case tracking-normal text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  value={grouping}
                  onChange={(e) => setGrouping(e.target.value)}
                  placeholder="CIS2700, Personal, Work..."
                  list="deadline-group-options"
                  className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={groupingColor}
                    onChange={(e) => setGroupingColor(e.target.value)}
                    className="h-7 w-9 rounded border border-slate-200 bg-white p-1"
                    aria-label="Grouping color"
                  />
                  <div className="flex flex-wrap gap-1">
                    {GROUP_COLOR_OPTIONS.map((color) => (
                      <button
                        key={`manual-${color}`}
                        type="button"
                        onClick={() => setGroupingColor(color)}
                        className={`h-5 w-5 rounded-full border transition hover:cursor-pointer ${groupingColor === color ? "border-slate-600" : "border-slate-200"}`}
                        style={{ backgroundColor: color }}
                        aria-label={`Set group color ${color}`}
                      />
                    ))}
                  </div>
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
                  placeholder="Any context for this deadline..."
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
                disabled={!title.trim() || !deadlineDate || saving}
                className="rounded-full bg-linear-to-b from-blue-400 via-blue-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white ring-1 ring-inset ring-white/20 transition hover:from-blue-300 hover:via-blue-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-60 hover:cursor-pointer"
              >
                {saving ? (editingId ? "Saving..." : "Adding...") : editingId ? "Save changes" : "Add deadline"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
