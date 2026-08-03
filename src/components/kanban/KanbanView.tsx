"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Filter,
  Kanban as KanbanIcon,
  Search,
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
  LayoutGrid,
  List,
} from "lucide-react";
import { TaskItem } from "@/types";
import { KanbanColumn } from "./KanbanColumn";
import { TaskDetailModal } from "./TaskDetailModal";

interface KanbanViewProps {
  tasks: TaskItem[];
  searchQuery: string;
  onUpdateTask: (task: TaskItem) => void;
  onDeleteTask: (id: string) => void;
  onMoveStatus: (id: string, newStatus: TaskItem["status"]) => void;
  onOpenCreateTask: () => void;
}

export const KanbanView: React.FC<KanbanViewProps> = ({
  tasks,
  searchQuery,
  onUpdateTask,
  onDeleteTask,
  onMoveStatus,
  onOpenCreateTask,
}) => {
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [localSearch, setLocalSearch] = useState<string>("");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");

  const effectiveSearch = (searchQuery || localSearch).toLowerCase().trim();

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      !effectiveSearch ||
      task.title.toLowerCase().includes(effectiveSearch) ||
      (task.description || "").toLowerCase().includes(effectiveSearch) ||
      (task.category || "").toLowerCase().includes(effectiveSearch);
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const todoTasks = filteredTasks.filter((t) => t.status === "todo");
  const inProgressTasks = filteredTasks.filter((t) => t.status === "in-progress");
  const doneTasks = filteredTasks.filter((t) => t.status === "done");
  const urgentCount = tasks.filter((t) => t.priority === "urgent" || t.priority === "high").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans text-[#0F172A]">
      {/* 1. Modern Workspace Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-[#006858] text-white flex items-center justify-center shadow-md shadow-[#006858]/20">
              <KanbanIcon className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-[#006858] uppercase tracking-wider">Task Workspace</span>
          </div>
          <h1 className="text-3xl font-black text-[#0F172A] tracking-tight">
            Task Workspace Board
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Track, shift, and manage team deliverables live with MongoDB Atlas.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                viewMode === "kanban" ? "bg-white text-[#006858] shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Board</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                viewMode === "list" ? "bg-white text-[#006858] shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenCreateTask}
            className="flex items-center gap-2 py-3 px-5 bg-[#006858] hover:bg-[#005245] text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-[#006858]/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Task
          </motion.button>
        </div>
      </div>

      {/* 2. Real-Time Workspace Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Tasks", count: tasks.length, icon: <Layers className="w-4 h-4 text-[#006858]" />, bg: "bg-emerald-50", border: "border-emerald-100" },
          { label: "To Do", count: tasks.filter(t => t.status === "todo").length, icon: <Clock className="w-4 h-4 text-slate-600" />, bg: "bg-slate-50", border: "border-slate-200" },
          { label: "In Progress", count: tasks.filter(t => t.status === "in-progress").length, icon: <Clock className="w-4 h-4 text-[#006858]" />, bg: "bg-emerald-50/50", border: "border-emerald-100" },
          { label: "High / Urgent", count: urgentCount, icon: <AlertCircle className="w-4 h-4 text-purple-600" />, bg: "bg-purple-50", border: "border-purple-100" },
        ].map((stat, i) => (
          <div key={i} className={`p-4 rounded-2xl border ${stat.bg} ${stat.border} flex items-center justify-between shadow-2xs`}>
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">{stat.label}</p>
              <p className="text-2xl font-black text-[#0F172A] mt-0.5">{stat.count}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center shadow-xs">
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
        {/* Local Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search tasks by title, category, or description..."
            className="w-full bg-slate-50 text-slate-900 font-semibold text-xs py-2.5 pl-10 pr-4 rounded-xl border border-slate-200 focus:border-[#006858] focus:outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Priority Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mr-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Priority:
          </span>
          {["all", "urgent", "high", "medium", "low"].map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer shrink-0 ${
                priorityFilter === p
                  ? "bg-[#006858] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Board Grid View OR Compact List View */}
      {viewMode === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <KanbanColumn
            title="To Do"
            status="todo"
            count={todoTasks.length}
            tasks={todoTasks}
            onSelectTask={setSelectedTask}
            onMoveStatus={onMoveStatus}
            onDeleteTask={onDeleteTask}
            onOpenCreateTask={onOpenCreateTask}
          />
          <KanbanColumn
            title="In Progress"
            status="in-progress"
            count={inProgressTasks.length}
            tasks={inProgressTasks}
            onSelectTask={setSelectedTask}
            onMoveStatus={onMoveStatus}
            onDeleteTask={onDeleteTask}
            onOpenCreateTask={onOpenCreateTask}
          />
          <KanbanColumn
            title="Completed"
            status="done"
            count={doneTasks.length}
            tasks={doneTasks}
            onSelectTask={setSelectedTask}
            onMoveStatus={onMoveStatus}
            onDeleteTask={onDeleteTask}
            onOpenCreateTask={onOpenCreateTask}
          />
        </div>
      ) : (
        /* List Mode */
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 space-y-2">
          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center text-xs font-bold text-slate-400">
              No tasks match your search filter.
            </div>
          ) : (
            filteredTasks.map((t) => (
              <div
                key={t.id || t._id}
                onClick={() => setSelectedTask(t)}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${
                    t.status === "done" ? "bg-emerald-500" : t.status === "in-progress" ? "bg-[#006858]" : "bg-slate-300"
                  }`} />
                  <div>
                    <h4 className="font-bold text-[#0F172A] text-xs">{t.title}</h4>
                    <p className="text-[10px] text-slate-400">{t.dueDate} · {t.category || "General"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                    {t.priority}
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#006858] text-white">
                    {t.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
        />
      )}
    </div>
  );
};
