"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CheckSquare,
  AlignLeft,
  Tag,
  Calendar,
  Flag,
  Layers,
  ChevronDown,
  Sparkles,
  Paperclip,
  Upload,
  FileText,
  FileImage,
  FileSpreadsheet,
  File,
  MessageSquare,
  Trash2,
  ImageIcon,
  CheckCircle2,
} from "lucide-react";
import { TaskItem, TaskAttachment } from "@/types";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: (task: TaskItem) => void;
}

// ── uploading item tracked separately ──
interface UploadingFile {
  id: string;
  name: string;
  type: string;
  size: number;
  progress: number;   // 0-100
  done: boolean;
}

const priorities = [
  { value: "low",    label: "Low",    color: "#22c55e", bg: "#f0fdf4", border: "#bbf7d0" },
  { value: "medium", label: "Medium", color: "#f59e0b", bg: "#fffbeb", border: "#fde68a" },
  { value: "high",   label: "High",   color: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
  { value: "urgent", label: "Urgent", color: "#8b5cf6", bg: "#faf5ff", border: "#e9d5ff" },
];

const statuses = [
  { value: "todo",        label: "To Do",       color: "#64748b" },
  { value: "in-progress", label: "In Progress", color: "#006858" },
  { value: "done",        label: "Done",        color: "#22c55e" },
];

const ACCEPTED_TYPES = [
  "image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain", "text/csv",
];

const MAX_FILE_SIZE_MB = 5;

function getFileIcon(type: string, size = 5) {
  const cls = `w-${size} h-${size}`;
  if (type.startsWith("image/"))  return <FileImage       className={`${cls} text-sky-500`} />;
  if (type === "application/pdf") return <FileText        className={`${cls} text-red-500`} />;
  if (type.includes("word"))      return <FileText        className={`${cls} text-blue-600`} />;
  if (type.includes("excel") || type.includes("spreadsheet") || type === "text/csv")
                                  return <FileSpreadsheet className={`${cls} text-emerald-600`} />;
  return                                 <File            className={`${cls} text-slate-500`} />;
}

function formatBytes(bytes: number) {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return                          `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Simulate animated progress (0 → ~85% fast, then waits for real read, then jumps to 100)
function simulateProgress(
  id: string,
  setUploading: React.Dispatch<React.SetStateAction<UploadingFile[]>>
): () => void {
  let pct = 0;
  const tick = setInterval(() => {
    pct += Math.random() * 18 + 4;
    if (pct >= 88) { clearInterval(tick); pct = 88; }
    setUploading((prev) =>
      prev.map((f) => (f.id === id ? { ...f, progress: Math.min(pct, 88) } : f))
    );
  }, 80);
  return () => clearInterval(tick);
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onCreateTask,
}) => {
  const [title, setTitle]               = useState("");
  const [description, setDescription]   = useState("");
  const [status, setStatus]             = useState<TaskItem["status"]>("todo");
  const [priority, setPriority]         = useState<TaskItem["priority"]>("medium");
  const [category, setCategory]         = useState("");
  const [dueDate, setDueDate]           = useState("");
  const [tags, setTags]                 = useState("");
  const [attachments, setAttachments]   = useState<TaskAttachment[]>([]);
  const [uploading, setUploading]       = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging]     = useState(false);
  const [fileError, setFileError]       = useState("");
  const [loading, setLoading]           = useState(false);
  const [activeTab, setActiveTab]       = useState<"details" | "attachments">("details");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(""); setDescription(""); setStatus("todo"); setPriority("medium");
      setCategory(""); setDueDate(""); setTags("");
      setAttachments([]); setUploading([]);
      setFileError(""); setActiveTab("details");
    }
  }, [isOpen]);

  const selectedPriority = priorities.find((p) => p.value === priority)!;
  const selectedStatus   = statuses.find((s) => s.value === status)!;

  const processFiles = useCallback(async (files: FileList | File[]) => {
    setFileError("");
    const fileArr = Array.from(files);

    for (const file of fileArr) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setFileError(`"${file.name}" is not a supported file type.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setFileError(`"${file.name}" exceeds ${MAX_FILE_SIZE_MB}MB limit.`);
        continue;
      }

      const id = `att-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      // Add to uploading list immediately
      setUploading((prev) => [
        ...prev,
        { id, name: file.name, type: file.type, size: file.size, progress: 0, done: false },
      ]);
      setActiveTab("attachments");

      // Start fake progress animation
      const stop = simulateProgress(id, setUploading);

      // Actually read file
      const base64 = await fileToBase64(file);
      stop();

      // Jump to 100% then mark done
      setUploading((prev) => prev.map((f) => (f.id === id ? { ...f, progress: 100 } : f)));

      await new Promise((r) => setTimeout(r, 500)); // pause at 100% so user sees it

      // Promote from "uploading" to "attachments"
      setUploading((prev) => prev.filter((f) => f.id !== id));
      setAttachments((prev) => [
        ...prev,
        {
          id,
          name: file.name,
          type: file.type,
          size: file.size,
          data: base64,
          comment: "",
          uploadedAt: new Date().toISOString(),
        },
      ]);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const updateComment   = (id: string, comment: string) =>
    setAttachments((prev) => prev.map((a) => (a.id === id ? { ...a, comment } : a)));
  const removeAttachment = (id: string) =>
    setAttachments((prev) => prev.filter((a) => a.id !== id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);

    let assignee = {
      name: "Irfan Tariq",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Irfan",
      role: "Member",
    };
    try {
      const savedUser = localStorage.getItem("taskconnect_user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed.name) assignee.name = parsed.name;
        if (parsed.email) {
          assignee.avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(parsed.email)}`;
        }
      }
    } catch (err) {}

    await onCreateTask({
      id: `task-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      status, priority,
      category: category.trim() || "General",
      dueDate: dueDate || "No due date",
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      assignee,
      attachments,
    });
    setLoading(false);
    onClose();
  };

  const totalFiles = attachments.length + uploading.length;

  const tabs = [
    { id: "details",     label: "Task Details", icon: <CheckSquare className="w-3.5 h-3.5" /> },
    { id: "attachments", label: "Attachments",  icon: <Paperclip  className="w-3.5 h-3.5" />, count: totalFiles },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl shadow-black/20 overflow-hidden font-sans max-h-[90vh] flex flex-col">

              {/* ── Header ── */}
              <div
                className="relative px-6 pt-6 pb-4 shrink-0"
                style={{ backgroundImage: "linear-gradient(135deg,#004d40 0%,#00897b 100%)" }}
              >
                <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/5" />
                <div className="absolute top-2 right-12 w-12 h-12 rounded-full bg-white/5" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
                      <CheckSquare className="w-[18px] h-[18px] text-white" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-white">Create New Task</h2>
                      <p className="text-[11px] text-white/60 font-medium">
                        Save to MongoDB Atlas · Attach screenshots & files
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all border border-white/10"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mt-4 bg-black/20 rounded-2xl p-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id} type="button"
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        activeTab === tab.id
                          ? "bg-white text-[#006858] shadow-sm"
                          : "text-white/70 hover:text-white"
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                      {(tab as any).count > 0 && (
                        <span className={`w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center ${
                          activeTab === tab.id ? "bg-[#006858] text-white" : "bg-white/20 text-white"
                        }`}>
                          {(tab as any).count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Scrollable Body ── */}
              <div className="overflow-y-auto flex-1">
                <form onSubmit={handleSubmit}>
                  <AnimatePresence mode="wait">

                    {/* ── TAB 1: TASK DETAILS ── */}
                    {activeTab === "details" && (
                      <motion.div key="details"
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}
                        className="p-6 space-y-5"
                      >
                        {/* Title */}
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-500">
                            <CheckSquare className="w-3.5 h-3.5" />
                            Task Title <span className="text-red-500">*</span>
                          </label>
                          <input type="text" required autoFocus value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Redesign the onboarding flow"
                            className="w-full bg-slate-50 text-slate-900 font-semibold text-sm px-4 py-3 rounded-2xl border border-slate-200 focus:border-[#006858] focus:outline-none focus:ring-2 focus:ring-[#006858]/20 transition-all placeholder:text-slate-400 placeholder:font-normal"
                          />
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-500">
                            <AlignLeft className="w-3.5 h-3.5" />Description
                          </label>
                          <textarea rows={3} value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What needs to be done? Add detailed requirements..."
                            className="w-full bg-slate-50 text-slate-900 font-medium text-sm px-4 py-3 rounded-2xl border border-slate-200 focus:border-[#006858] focus:outline-none focus:ring-2 focus:ring-[#006858]/20 transition-all placeholder:text-slate-400 placeholder:font-normal resize-none"
                          />
                        </div>

                        {/* Priority */}
                        <div className="space-y-2">
                          <label className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-500">
                            <Flag className="w-3.5 h-3.5" />Priority
                          </label>
                          <div className="grid grid-cols-4 gap-2">
                            {priorities.map((p) => (
                              <button key={p.value} type="button"
                                onClick={() => setPriority(p.value as TaskItem["priority"])}
                                className="py-2.5 px-2 rounded-2xl border-2 text-xs font-bold transition-all text-center"
                                style={{
                                  backgroundColor: priority === p.value ? p.bg : "#f8fafc",
                                  borderColor: priority === p.value ? p.color : "#e2e8f0",
                                  color: priority === p.value ? p.color : "#94a3b8",
                                  transform: priority === p.value ? "scale(1.03)" : "scale(1)",
                                }}
                              >
                                <div className="w-2 h-2 rounded-full mx-auto mb-1"
                                  style={{ backgroundColor: priority === p.value ? p.color : "#cbd5e1" }} />
                                {p.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Status + Category */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-500">
                              <Layers className="w-3.5 h-3.5" />Status
                            </label>
                            <div className="relative">
                              <select value={status} onChange={(e) => setStatus(e.target.value as TaskItem["status"])}
                                className="w-full appearance-none bg-slate-50 font-semibold text-xs px-4 py-3 pr-8 rounded-2xl border border-slate-200 focus:border-[#006858] focus:outline-none cursor-pointer"
                                style={{ color: selectedStatus.color }}
                              >
                                {statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                              </select>
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-500">
                              <Sparkles className="w-3.5 h-3.5" />Category
                            </label>
                            <input type="text" value={category} onChange={(e) => setCategory(e.target.value)}
                              placeholder="e.g. Design, Dev, QA"
                              className="w-full bg-slate-50 text-slate-900 font-semibold text-xs px-4 py-3 rounded-2xl border border-slate-200 focus:border-[#006858] focus:outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
                            />
                          </div>
                        </div>

                        {/* Due Date + Tags */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-500">
                              <Calendar className="w-3.5 h-3.5" />Due Date
                            </label>
                            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                              className="w-full bg-slate-50 text-slate-700 font-semibold text-xs px-4 py-3 rounded-2xl border border-slate-200 focus:border-[#006858] focus:outline-none transition-all cursor-pointer"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-500">
                              <Tag className="w-3.5 h-3.5" />Tags
                            </label>
                            <input type="text" value={tags} onChange={(e) => setTags(e.target.value)}
                              placeholder="UI, Frontend, API"
                              className="w-full bg-slate-50 text-slate-900 font-semibold text-xs px-4 py-3 rounded-2xl border border-slate-200 focus:border-[#006858] focus:outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
                            />
                          </div>
                        </div>

                        {/* Quick attach */}
                        <button type="button" onClick={() => setActiveTab("attachments")}
                          className="w-full flex items-center gap-2 px-4 py-3 rounded-2xl border-2 border-dashed border-slate-200 hover:border-[#006858]/40 hover:bg-emerald-50/50 transition-all text-xs font-bold text-slate-400 hover:text-[#006858]"
                        >
                          <Paperclip className="w-4 h-4" />
                          Attach screenshots, PDFs, or documents
                          {totalFiles > 0 && (
                            <span className="ml-auto bg-[#006858] text-white px-2 py-0.5 rounded-full text-[10px]">
                              {totalFiles} file{totalFiles > 1 ? "s" : ""}
                            </span>
                          )}
                        </button>

                        {/* Summary badge */}
                        <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold border"
                          style={{ backgroundColor: selectedPriority.bg, borderColor: selectedPriority.border, color: selectedPriority.color }}
                        >
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedPriority.color }} />
                          {selectedPriority.label} Priority · {selectedStatus.label}
                          {title && (
                            <span className="ml-auto text-slate-500 font-medium truncate max-w-[160px]">"{title}"</span>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* ── TAB 2: ATTACHMENTS ── */}
                    {activeTab === "attachments" && (
                      <motion.div key="attachments"
                        initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}
                        className="p-6 space-y-5"
                      >
                        {/* Drop Zone */}
                        <div
                          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                          onDragLeave={() => setIsDragging(false)}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className={`relative rounded-3xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200 ${
                            isDragging
                              ? "border-[#006858] bg-emerald-50 scale-[1.01]"
                              : "border-slate-200 hover:border-[#006858]/50 hover:bg-slate-50"
                          }`}
                        >
                          <input ref={fileInputRef} type="file" multiple
                            accept={ACCEPTED_TYPES.join(",")} className="hidden"
                            onChange={(e) => e.target.files && processFiles(e.target.files)}
                          />
                          <div className="flex flex-col items-center gap-3">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                              isDragging ? "bg-[#006858]" : "bg-slate-100"
                            }`}>
                              <Upload className={`w-6 h-6 transition-all ${isDragging ? "text-white" : "text-slate-400"}`} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-700">
                                {isDragging ? "Drop files here!" : "Drag & drop files, or click to browse"}
                              </p>
                              <p className="text-xs text-slate-400 mt-1">
                                Screenshots, PDFs, Word, Excel, images · Max {MAX_FILE_SIZE_MB}MB per file
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap justify-center">
                              {[
                                { icon: <ImageIcon       className="w-3.5 h-3.5 text-sky-500" />,     label: "Images" },
                                { icon: <FileText        className="w-3.5 h-3.5 text-red-500" />,     label: "PDF"    },
                                { icon: <FileText        className="w-3.5 h-3.5 text-blue-600" />,    label: "Word"   },
                                { icon: <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />, label: "Excel"  },
                              ].map((t) => (
                                <span key={t.label} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-[11px] font-bold text-slate-500">
                                  {t.icon} {t.label}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* File error */}
                        <AnimatePresence>
                          {fileError && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold"
                            >
                              ⚠ {fileError}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* ── UPLOADING PROGRESS CARDS ── */}
                        <AnimatePresence>
                          {uploading.map((uf) => (
                            <motion.div key={uf.id}
                              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                            >
                              {/* Top bar */}
                              <div className="flex items-center gap-3 px-4 py-3">
                                {/* Animated file icon */}
                                <div className="relative w-10 h-10 shrink-0">
                                  {/* Spinning ring */}
                                  <svg className="absolute inset-0 w-10 h-10 -rotate-90" viewBox="0 0 40 40">
                                    <circle cx="20" cy="20" r="17" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                                    <motion.circle
                                      cx="20" cy="20" r="17" fill="none"
                                      stroke="#006858" strokeWidth="3"
                                      strokeLinecap="round"
                                      strokeDasharray={`${2 * Math.PI * 17}`}
                                      animate={{
                                        strokeDashoffset: `${2 * Math.PI * 17 * (1 - uf.progress / 100)}`,
                                      }}
                                      transition={{ duration: 0.15, ease: "easeOut" }}
                                    />
                                  </svg>
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    {uf.progress < 100
                                      ? <span className="text-[9px] font-black text-[#006858]">{Math.round(uf.progress)}%</span>
                                      : <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                        </motion.div>
                                    }
                                  </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-slate-800 truncate">{uf.name}</p>
                                  <p className="text-[10px] text-slate-400">{formatBytes(uf.size)}</p>
                                </div>

                                <div className={`text-[10px] font-black px-2.5 py-1 rounded-full transition-all ${
                                  uf.progress >= 100
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-slate-100 text-slate-500"
                                }`}>
                                  {uf.progress >= 100 ? "✓ Done" : "Uploading..."}
                                </div>
                              </div>

                              {/* Progress bar */}
                              <div className="h-1.5 bg-slate-100 mx-4 mb-3 rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full rounded-full"
                                  style={{
                                    backgroundImage: uf.progress >= 100
                                      ? "linear-gradient(90deg,#22c55e,#16a34a)"
                                      : "linear-gradient(90deg,#006858,#00897b,#43d4b8)",
                                    backgroundSize: "200% 100%",
                                  }}
                                  animate={{
                                    width: `${uf.progress}%`,
                                    backgroundPosition: uf.progress < 100 ? ["0% 0%", "100% 0%"] : "0% 0%",
                                  }}
                                  transition={{
                                    width: { duration: 0.15, ease: "easeOut" },
                                    backgroundPosition: { duration: 1.5, repeat: Infinity, ease: "linear" },
                                  }}
                                />
                              </div>

                              {/* Shimmer row while loading */}
                              {uf.progress < 100 && (
                                <div className="px-4 pb-3">
                                  <div className="h-2 bg-slate-100 rounded-full w-3/4 overflow-hidden">
                                    <motion.div
                                      className="h-full bg-gradient-to-r from-transparent via-slate-200 to-transparent"
                                      animate={{ x: ["-100%", "200%"] }}
                                      transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                                    />
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          ))}
                        </AnimatePresence>

                        {/* ── COMPLETED ATTACHMENTS ── */}
                        {attachments.length === 0 && uploading.length === 0 ? (
                          <div className="text-center py-6 text-xs text-slate-400 font-medium">
                            No files attached yet. Upload screenshots or documents above.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {attachments.length > 0 && (
                              <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                                {attachments.length} Uploaded · Add comments below each file
                              </p>
                            )}
                            {attachments.map((att, idx) => (
                              <motion.div key={att.id}
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.04 }}
                                className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm"
                              >
                                {/* Image Preview */}
                                {att.type.startsWith("image/") && (
                                  <div className="relative bg-slate-900 max-h-48 overflow-hidden">
                                    <img src={att.data} alt={att.name}
                                      className="w-full object-contain max-h-48" />
                                    <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-lg backdrop-blur-sm">
                                      Screenshot #{idx + 1}
                                    </div>
                                    <div className="absolute top-2 right-2 bg-emerald-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3" /> Uploaded
                                    </div>
                                  </div>
                                )}

                                {/* Non-image file header */}
                                {!att.type.startsWith("image/") && (
                                  <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-100">
                                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                                      {getFileIcon(att.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-bold text-slate-800 truncate">{att.name}</p>
                                      <p className="text-[10px] text-slate-400">{formatBytes(att.size)}</p>
                                    </div>
                                    <div className="flex items-center gap-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
                                      <CheckCircle2 className="w-3 h-3" /> Done
                                    </div>
                                    <button type="button" onClick={() => removeAttachment(att.id)}
                                      className="w-7 h-7 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-center transition-all">
                                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                    </button>
                                  </div>
                                )}

                                {/* File meta row for images */}
                                {att.type.startsWith("image/") && (
                                  <div className="flex items-center gap-3 px-4 py-2 border-b border-slate-100">
                                    <div className="w-5 h-5 shrink-0">{getFileIcon(att.type, 4)}</div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[11px] font-bold text-slate-700 truncate">{att.name}</p>
                                    </div>
                                    <span className="text-[10px] text-slate-400">{formatBytes(att.size)}</span>
                                    <button type="button" onClick={() => removeAttachment(att.id)}
                                      className="w-7 h-7 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-center transition-all">
                                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                    </button>
                                  </div>
                                )}

                                {/* Per-file comment */}
                                <div className="p-3">
                                  <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                                    <MessageSquare className="w-3 h-3" />
                                    {att.type.startsWith("image/") ? "Annotation / What to change" : "Notes about this file"}
                                  </label>
                                  <textarea rows={2} value={att.comment}
                                    onChange={(e) => updateComment(att.id, e.target.value)}
                                    placeholder={
                                      att.type.startsWith("image/")
                                        ? "e.g. Change the button colour to green, move the logo top-left..."
                                        : "Add notes or instructions about this document..."
                                    }
                                    className="w-full bg-slate-50 text-slate-800 text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 focus:border-[#006858] focus:outline-none focus:ring-2 focus:ring-[#006858]/20 transition-all placeholder:text-slate-300 resize-none"
                                  />
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ── Sticky Footer ── */}
                  <div className="px-6 pb-6 pt-2 flex gap-3 border-t border-slate-100 bg-white">
                    <button type="button" onClick={onClose}
                      className="flex-1 py-3 px-4 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all">
                      Cancel
                    </button>
                    <motion.button type="submit"
                      disabled={loading || !title.trim() || uploading.length > 0}
                      whileHover={{ scale: loading || !title.trim() ? 1 : 1.01 }}
                      whileTap={{ scale: loading || !title.trim() ? 1 : 0.98 }}
                      className="flex-[2] py-3 px-6 rounded-2xl font-extrabold text-sm text-white shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundImage: "linear-gradient(135deg,#006858 0%,#00897b 100%)" }}
                    >
                      {loading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          Saving to MongoDB...
                        </>
                      ) : uploading.length > 0 ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          Waiting for uploads...
                        </>
                      ) : (
                        <>
                          <CheckSquare className="w-4 h-4" />
                          Create Task
                          {attachments.length > 0 && (
                            <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded-full text-[10px]">
                              + {attachments.length} file{attachments.length > 1 ? "s" : ""}
                            </span>
                          )}
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
