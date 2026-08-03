"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Trash2,
  CheckSquare,
  Plus,
  Clock,
  Paperclip,
  MessageSquare,
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  Layers,
  Sparkles,
} from "lucide-react";
import { TaskItem, TaskAttachment } from "@/types";
import { Badge } from "@/components/ui/Badge";

interface TaskDetailModalProps {
  task: TaskItem;
  onClose: () => void;
  onUpdateTask?: (updated: TaskItem) => void;
  onUpdate?: (updated: TaskItem) => void;
  onDeleteTask?: (id: string) => void;
  onDelete?: (id: string) => void;
}

function getFileIcon(type: string) {
  if (type?.startsWith("image/")) return <FileImage className="w-4 h-4 text-sky-500" />;
  if (type === "application/pdf") return <FileText className="w-4 h-4 text-red-500" />;
  if (type?.includes("word")) return <FileText className="w-4 h-4 text-blue-600" />;
  if (type?.includes("excel") || type?.includes("spreadsheet") || type === "text/csv")
    return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
  return <File className="w-4 h-4 text-slate-500" />;
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  onClose,
  onUpdateTask,
  onUpdate,
  onDeleteTask,
  onDelete,
}) => {
  const [subtasks, setSubtasks] = useState(task.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [status, setStatus] = useState<TaskItem["status"]>(task.status || "todo");
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const handleStatusChange = (newStatus: TaskItem["status"]) => {
    setStatus(newStatus);
    const updatedTask = { ...task, status: newStatus, subtasks };
    if (onUpdateTask) onUpdateTask(updatedTask);
    if (onUpdate) onUpdate(updatedTask);
  };

  const handleToggleSubtask = (index: number) => {
    const updatedSubtasks = subtasks.map((s, i) =>
      i === index ? { ...s, completed: !s.completed } : s
    );
    setSubtasks(updatedSubtasks);

    const updatedTask = { ...task, status, subtasks: updatedSubtasks };
    if (onUpdateTask) onUpdateTask(updatedTask);
    if (onUpdate) onUpdate(updatedTask);
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    const updatedSubtasks = [
      ...subtasks,
      { id: `sub-${Date.now()}`, title: newSubtaskTitle.trim(), completed: false },
    ];
    setSubtasks(updatedSubtasks);
    setNewSubtaskTitle("");

    const updatedTask = { ...task, status, subtasks: updatedSubtasks };
    if (onUpdateTask) onUpdateTask(updatedTask);
    if (onUpdate) onUpdate(updatedTask);
  };

  const handleDelete = () => {
    const taskId = task.id || task._id;
    if (taskId) {
      if (onDeleteTask) onDeleteTask(taskId);
      if (onDelete) onDelete(taskId);
    }
    onClose();
  };

  const attachments: TaskAttachment[] = task.attachments || [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl shadow-black/20 overflow-hidden font-sans max-h-[90vh] flex flex-col z-10"
        >
          {/* Header Bar */}
          <div
            className="px-6 pt-6 pb-4 relative shrink-0"
            style={{ backgroundImage: "linear-gradient(135deg, #004d40 0%, #00897b 100%)" }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant={task.priority}>{task.priority.toUpperCase()}</Badge>
                  <span className="text-[11px] font-extrabold text-emerald-200 uppercase tracking-wider bg-white/10 px-2.5 py-0.5 rounded-full border border-white/20">
                    {task.category || "General"}
                  </span>
                </div>
                <h2 className="text-xl font-black text-white leading-snug mt-1">{task.title}</h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all border border-white/10 text-white shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stage Selector Pill Bar */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/15">
              <span className="text-[11px] font-bold text-white/70 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" /> Stage:
              </span>
              {[
                { key: "todo", label: "To Do" },
                { key: "in-progress", label: "In Progress" },
                { key: "done", label: "Completed" },
              ].map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => handleStatusChange(s.key as any)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    status === s.key
                      ? "bg-white text-[#006858] shadow-sm scale-105"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* Description */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#006858]" /> Description
              </h4>
              <p className="text-xs text-slate-700 font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                {task.description || "No additional details provided."}
              </p>
            </div>

            {/* Attachments Section */}
            {attachments.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-[#006858]" /> Attachments & Screenshots ({attachments.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {attachments.map((att, idx) => (
                    <div
                      key={att.id || idx}
                      className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-xs space-y-2"
                    >
                      {att.type?.startsWith("image/") && att.data ? (
                        <div
                          onClick={() => setZoomedImage(att.data)}
                          className="relative h-36 bg-slate-900 cursor-pointer overflow-hidden group"
                        >
                          <img
                            src={att.data}
                            alt={att.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                            Click to View Fullsize 🔍
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 p-3 bg-slate-50 border-b border-slate-100">
                          <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                            {getFileIcon(att.type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-800 truncate">{att.name}</p>
                            <p className="text-[10px] text-slate-400">{formatBytes(att.size)}</p>
                          </div>
                        </div>
                      )}

                      {/* File Annotations / Notes */}
                      {att.comment && (
                        <div className="p-3 pt-0">
                          <div className="flex items-start gap-1.5 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900 font-medium">
                            <MessageSquare className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <p className="text-[10px] font-black uppercase tracking-wider text-amber-700">Client Feedback / Instructions</p>
                              <p className="text-slate-800">{att.comment}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Subtasks Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-[#006858]" />
                  Subtasks Checklist ({subtasks.filter((s) => s.completed).length}/{subtasks.length})
                </h4>
              </div>

              <div className="space-y-2">
                {subtasks.map((st, i) => (
                  <div
                    key={st.id || i}
                    onClick={() => handleToggleSubtask(i)}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-200/80 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={st.completed}
                      onChange={() => {}}
                      className="w-4 h-4 rounded text-[#006858] focus:ring-[#006858] cursor-pointer"
                    />
                    <span
                      className={`text-xs font-semibold ${
                        st.completed ? "line-through text-slate-400" : "text-slate-800"
                      }`}
                    >
                      {st.title}
                    </span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddSubtask} className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="Add new subtask..."
                  className="flex-1 bg-slate-50 text-slate-900 font-semibold text-xs px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#006858] focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-[#006858] hover:bg-[#005245] text-white font-extrabold text-xs rounded-xl flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </form>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-all border border-red-200/60"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Task
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-[#006858] hover:bg-[#005245] text-white font-extrabold text-xs rounded-xl transition-all shadow-sm"
            >
              Close
            </button>
          </div>
        </motion.div>

        {/* Zoomed Image Lightbox */}
        {zoomedImage && (
          <div
            onClick={() => setZoomedImage(null)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 cursor-pointer"
          >
            <img
              src={zoomedImage}
              alt="Zoomed Screenshot"
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
            />
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};
