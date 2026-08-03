"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  CheckSquare,
  Clock,
  Paperclip,
  ArrowRight,
  MoreVertical,
  Trash2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { TaskItem } from "@/types";

interface TaskCardProps {
  task: TaskItem;
  onClick?: () => void;
  onSelect?: (task: TaskItem) => void;
  onMoveStatus?: (id: string, newStatus: TaskItem["status"]) => void;
  onDelete?: (id: string) => void;
}

const priorityStyles: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  urgent: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", dot: "bg-purple-500" },
  high:   { bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200",    dot: "bg-red-500" },
  medium: { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200",  dot: "bg-amber-500" },
  low:    { bg: "bg-emerald-50",text: "text-emerald-700",border: "border-emerald-200",dot: "bg-emerald-500" },
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onClick,
  onSelect,
  onMoveStatus,
  onDelete,
}) => {
  const handleClick = () => {
    if (onSelect) onSelect(task);
    if (onClick) onClick();
  };

  const completedSubtasks = task.subtasks ? task.subtasks.filter((s) => s.completed).length : 0;
  const totalSubtasks = task.subtasks ? task.subtasks.length : 0;
  const progressPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  // Find first image attachment for card banner preview
  const imageAttachment = task.attachments?.find((att) => att.type?.startsWith("image/") && att.data);
  const attachmentCount = task.attachments?.length || 0;

  const prio = priorityStyles[task.priority] || priorityStyles.medium;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      onClick={handleClick}
      className="group relative bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-[#006858]/30 transition-all duration-200 cursor-pointer overflow-hidden flex flex-col"
    >
      {/* Top Banner Image if task has attached screenshot */}
      {imageAttachment && (
        <div className="relative h-28 w-full bg-slate-900 overflow-hidden border-b border-slate-100">
          <img
            src={imageAttachment.data}
            alt={imageAttachment.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
          />
          <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <Paperclip className="w-3 h-3 text-emerald-400" />
            <span>Screenshot Attached</span>
          </div>
        </div>
      )}

      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        {/* Header Badges & Due Date */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${prio.bg} ${prio.text} ${prio.border}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${prio.dot}`} />
              {task.priority}
            </span>
            {task.category && (
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {task.category}
              </span>
            )}
          </div>

          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 shrink-0 font-mono">
            <Clock className="w-3 h-3 text-slate-400" />
            {task.dueDate}
          </span>
        </div>

        {/* Task Title & Description */}
        <div className="space-y-1">
          <h4 className="font-extrabold text-sm text-[#0F172A] group-hover:text-[#006858] transition-colors leading-snug line-clamp-2">
            {task.title}
          </h4>
          {task.description && (
            <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}
        </div>

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] font-extrabold bg-emerald-50 text-[#006858] border border-emerald-200/50 px-2 py-0.5 rounded-lg"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Subtask Progress Bar */}
        {totalSubtasks > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
              <span className="flex items-center gap-1">
                <CheckSquare className="w-3 h-3 text-[#006858]" />
                Subtasks ({completedSubtasks}/{totalSubtasks})
              </span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#006858] h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer Metrics & Assignee Avatar */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-semibold">
          <div className="flex items-center gap-3">
            {attachmentCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                <Paperclip className="w-3 h-3 text-[#006858]" />
                {attachmentCount}
              </span>
            )}
            <span className="flex items-center gap-1 text-[11px]">
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
              {task.commentsCount || 0}
            </span>
          </div>

          {/* Quick status shift buttons on hover */}
          <div className="flex items-center gap-2">
            {onMoveStatus && task.status !== "done" && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveStatus(task.id, task.status === "todo" ? "in-progress" : "done");
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-0.5 rounded-lg bg-[#006858] text-white text-[10px] font-bold flex items-center gap-1 hover:bg-[#005245]"
                title="Move to next stage"
              >
                <span>{task.status === "todo" ? "In Progress" : "Complete"}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}

            {task.assignee && (
              <img
                src={
                  task.assignee.avatar ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                    task.assignee.name || "User"
                  )}`
                }
                alt={task.assignee.name}
                title={task.assignee.name}
                className="w-6 h-6 rounded-full object-cover ring-2 ring-slate-100 shadow-xs shrink-0"
              />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
