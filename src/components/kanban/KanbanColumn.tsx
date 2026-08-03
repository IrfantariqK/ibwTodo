"use client";

import React from "react";
import { Plus, CheckCircle2, Clock, CircleDot } from "lucide-react";
import { TaskItem } from "@/types";
import { TaskCard } from "./TaskCard";

interface KanbanColumnProps {
  title: string;
  count: number;
  tasks: TaskItem[];
  status: TaskItem["status"];
  onSelectTask: (task: TaskItem) => void;
  onMoveStatus: (id: string, newStatus: TaskItem["status"]) => void;
  onDeleteTask: (id: string) => void;
  onOpenCreateTask?: () => void;
}

const columnThemes: Record<string, { dot: string; border: string; bg: string; text: string; icon: React.ReactNode }> = {
  todo: {
    dot: "bg-slate-400",
    border: "border-slate-300",
    bg: "bg-slate-50",
    text: "text-slate-700",
    icon: <CircleDot className="w-4 h-4 text-slate-500" />,
  },
  "in-progress": {
    dot: "bg-[#006858]",
    border: "border-[#006858]",
    bg: "bg-emerald-50/50",
    text: "text-[#006858]",
    icon: <Clock className="w-4 h-4 text-[#006858]" />,
  },
  done: {
    dot: "bg-emerald-500",
    border: "border-emerald-400",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
  },
};

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  title,
  count,
  tasks,
  status,
  onSelectTask,
  onMoveStatus,
  onDeleteTask,
  onOpenCreateTask,
}) => {
  const theme = columnThemes[status] || columnThemes.todo;

  return (
    <div className="bg-[#F8FAFC] border border-slate-200/80 rounded-3xl p-4 min-h-[580px] flex flex-col space-y-4 shadow-xs">
      {/* Column Header Bar */}
      <div className="flex items-center justify-between px-1 pb-1 border-b border-slate-200/60">
        <div className="flex items-center gap-2">
          {theme.icon}
          <h3 className="font-black text-sm text-[#0F172A] tracking-tight">{title}</h3>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded-full font-black text-xs border ${theme.bg} ${theme.text} ${theme.border}`}>
            {count}
          </span>
          {onOpenCreateTask && (
            <button
              type="button"
              onClick={onOpenCreateTask}
              className="w-7 h-7 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center transition-all cursor-pointer shadow-xs"
              title="Add task to this stage"
            >
              <Plus className="w-3.5 h-3.5 text-slate-600" />
            </button>
          )}
        </div>
      </div>

      {/* Task Cards List */}
      <div className="flex-1 space-y-3.5 overflow-y-auto max-h-[700px] pr-0.5">
        {tasks.length === 0 ? (
          <div className="h-44 border-2 border-dashed border-slate-200/90 rounded-2xl flex flex-col items-center justify-center p-4 text-center space-y-2 bg-white/50">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              {theme.icon}
            </div>
            <p className="text-xs font-bold text-slate-500">No tasks in {title}</p>
            <p className="text-[10px] text-slate-400">Tasks shifted or created will appear here</p>
            {onOpenCreateTask && (
              <button
                type="button"
                onClick={onOpenCreateTask}
                className="text-[11px] font-extrabold text-[#006858] hover:underline pt-1"
              >
                + Add First Task
              </button>
            )}
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id || task._id}
              task={task}
              onSelect={onSelectTask}
              onMoveStatus={onMoveStatus}
              onDelete={onDeleteTask}
            />
          ))
        )}
      </div>
    </div>
  );
};
