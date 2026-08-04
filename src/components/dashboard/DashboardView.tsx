"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  TrendingUp,
  Plus,
  Video,
  Sparkles,
  Calendar,
  CheckCircle,
  Inbox,
  FolderPlus,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { TaskItem, EventItem } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CreateProjectModal } from "@/components/modals/CreateProjectModal";
import { ProjectDetailModal } from "@/components/modals/ProjectDetailModal";
import { ProjectItem } from "@/types";
import { useProject } from "@/context/ProjectContext";

interface DashboardViewProps {
  tasks: TaskItem[];
  onOpenCreateTask: () => void;
  onNavigateTab: (tab: "dashboard" | "kanban" | "chat" | "calendar") => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tasks,
  onOpenCreateTask,
  onNavigateTab,
}) => {
  const { projects: contextProjects, activeProject, userRole: ctxUserRole, userType: ctxUserType } = useProject();
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [user, setUser] = useState({
    name: "User",
    email: "user@ibwtech.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=User",
  });
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);

  // Load logged-in user details from localStorage session
  useEffect(() => {
    const savedUser = localStorage.getItem("taskconnect_user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setSessionUser(parsed);
        setUser({
          name: parsed.name || "User",
          email: parsed.email || "user@ibwtech.com",
          avatar:
            parsed.avatar ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
              parsed.email || "User"
            )}`,
        });
      } catch (e) {
        console.warn("Failed to parse user session:", e);
      }
    }
  }, []);

  // Determine if logged-in user is a Leader vs Client / Team Member
  const effectiveType = (sessionUser?.type || ctxUserType || "").toLowerCase().trim();
  const effectiveRole = (sessionUser?.role || ctxUserRole || "").toLowerCase().trim();

  const isClientOrTeam =
    effectiveType === "client" ||
    effectiveType === "team" ||
    effectiveRole === "client" ||
    effectiveRole.includes("client") ||
    effectiveRole.includes("team member");

  const isLeader =
    effectiveType === "leader" ||
    effectiveRole === "leader" ||
    !isClientOrTeam;

  // Fetch real MongoDB Atlas Dashboard metrics
  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch (err) {
      console.warn("Error fetching dashboard from MongoDB API:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [tasks]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  // Scope project metrics by active project selection
  const mongoProjects = dashboardData?.projects ?? contextProjects ?? [];
  const activePId = activeProject ? activeProject.id || activeProject._id : null;

  const mongoUrgentTasks: TaskItem[] = activePId
    ? (dashboardData?.urgentTasks ?? tasks.filter((t: TaskItem) => t.priority === "high" || t.priority === "urgent")).filter(
        (t: TaskItem) => t.projectId === activePId
      )
    : (dashboardData?.urgentTasks ?? tasks.filter((t: TaskItem) => t.priority === "high" || t.priority === "urgent"));

  const mongoMeetings: EventItem[] = activePId
    ? (dashboardData?.upcomingMeetings ?? []).filter((evt: EventItem) => evt.projectId === activePId)
    : (dashboardData?.upcomingMeetings ?? []);

  const mongoTasksCount = activePId ? mongoUrgentTasks.length : (dashboardData?.totalTasks ?? tasks.length);
  const mongoPulseFeed = dashboardData?.pulseFeed ?? [];
  const taskEfficiency = dashboardData?.taskEfficiency ?? "0%";
  const teamVelocity = dashboardData?.teamVelocity ?? "0 pts/wk";
  const focusTime = dashboardData?.focusTime ?? "0h";
  const focusPercent = dashboardData?.focusPercent ?? 0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 max-w-7xl mx-auto font-sans text-[#0F172A]"
    >
      {/* 1. Welcome Header Section */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2"
      >
        <div>
          <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Welcome Back, <span className="text-[#006858]">{user.name}</span>
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            You have <strong className="text-[#0F172A] font-black">{mongoTasksCount} tasks</strong> to complete today and{" "}
            <strong className="text-[#0F172A] font-black">{mongoMeetings.length} upcoming meetings</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={onOpenCreateTask}
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            className="rounded-xl shadow-md bg-[#006858] hover:bg-[#005245] cursor-pointer"
          >
            New Task
          </Button>

          {/* New Project button is visible ONLY to the Leader */}
          {isLeader && (
            <Button
              onClick={() => setIsProjectModalOpen(true)}
              variant="outline"
              size="md"
              icon={<FolderPlus className="w-4 h-4 text-[#006858]" />}
              className="rounded-xl text-slate-700 hover:bg-slate-100 font-bold cursor-pointer"
            >
              New Project
            </Button>
          )}
        </div>
      </motion.div>

      {/* 2. Top Metric Cards Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Task Efficiency */}
        <div className="modern-card rounded-3xl p-6 relative overflow-hidden bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#006858]">
              <Zap className="w-5 h-5 fill-[#006858]" />
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full">
              Live Mongo Metric
            </span>
          </div>
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
            TASK EFFICIENCY
          </div>
          <div className="text-3xl font-black text-[#0F172A] tracking-tight">{taskEfficiency}</div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: taskEfficiency }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="bg-[#006858] h-full rounded-full"
            />
          </div>
        </div>

        {/* Card 2: Team Velocity */}
        <div className="modern-card rounded-3xl p-6 relative overflow-hidden bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-2.5 py-1 rounded-full">
              Live Velocity
            </span>
          </div>
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
            TEAM VELOCITY
          </div>
          <div className="text-3xl font-black text-[#0F172A] tracking-tight">{teamVelocity}</div>

          {/* Velocity Progress Bars */}
          <div className="flex gap-1.5 mt-4">
            <div className="h-2 flex-1 rounded-full bg-amber-200" />
            <div className="h-2 flex-1 rounded-full bg-amber-400" />
            <div className="h-2 flex-1 rounded-full bg-amber-100" />
            <div className="h-2 flex-1 rounded-full bg-amber-700" />
          </div>
        </div>

        {/* Card 3: Focus Time (AVG) */}
        <div className="modern-card rounded-3xl p-6 relative overflow-hidden bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
              FOCUS TIME (AVG)
            </div>
            <div className="text-3xl font-black text-[#0F172A] tracking-tight">{focusTime}</div>
            <p className="text-xs font-semibold text-slate-500 mt-2">
              Calculated from MongoDB Tasks
            </p>
          </div>

          {/* SVG Donut Ring */}
          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-100"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <motion.path
                initial={{ strokeDasharray: "0, 100" }}
                animate={{ strokeDasharray: `${focusPercent}, 100` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="text-[#006858]"
                strokeWidth="3.5"
                strokeDasharray={`${focusPercent}, 100`}
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-xs font-black text-[#0F172A]">{focusPercent}%</span>
          </div>
        </div>
      </motion.div>

      {/* 3. Middle Section: Recent Projects & Upcoming Meetings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Projects */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-[#0F172A]">Projects</h2>
            {isLeader && (
              <button
                onClick={() => setIsProjectModalOpen(true)}
                className="text-xs font-bold text-[#006858] hover:underline cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Project
              </button>
            )}
          </div>

          <div className="modern-card rounded-3xl p-5 bg-white border border-slate-200/90 shadow-sm h-[320px] flex flex-col">
            {mongoProjects.length === 0 ? (
              <div className="my-auto text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#006858] flex items-center justify-center">
                  <Inbox className="w-6 h-6" />
                </div>
                <h4 className="font-extrabold text-slate-800 text-sm">No Projects in MongoDB Database</h4>
                <p className="text-xs text-slate-500 max-w-sm">
                  {isLeader
                    ? "Add a new project to track progress, team members, and status live in your database."
                    : "You have not been assigned to any project yet."}
                </p>
                {isLeader && (
                  <Button onClick={() => setIsProjectModalOpen(true)} size="sm" className="bg-[#006858] hover:bg-[#005245] rounded-xl font-bold cursor-pointer">
                    + Create First Project
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-1 flex-1">
                {mongoProjects.map((proj: any, idx: number) => (
                  <div
                    key={proj._id || idx}
                    onClick={() => {
                      if (isLeader) {
                        setSelectedProject(proj);
                        setIsEditProjectModalOpen(true);
                      }
                    }}
                    className={`modern-card rounded-3xl p-4 bg-slate-50/70 border border-slate-200/80 shadow-2xs transition-all space-y-3 group ${
                      isLeader ? "hover:shadow-md hover:border-[#006858]/40 hover:bg-white cursor-pointer" : "cursor-default"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100/70 text-[#006858] flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="flex items-center gap-2">
                        {isLeader && (
                          <span className="text-[10px] font-extrabold text-[#006858] opacity-0 group-hover:opacity-100 transition-opacity">
                            Edit ✏️
                          </span>
                        )}
                        <Badge variant={proj.status === "In Progress" ? "in-progress" : "planning"}>
                          {proj.status}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <h3 className={`font-bold text-[#0F172A] text-sm transition-colors ${isLeader ? "group-hover:text-[#006858]" : ""}`}>
                        {proj.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{proj.description}</p>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-[11px] font-bold mb-1">
                        <span className="text-slate-400">Progress</span>
                        <span className="text-[#006858] font-mono">{proj.progress || 0}%</span>
                      </div>
                      <div className="w-full bg-slate-200/60 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#006858] h-full rounded-full transition-all duration-500"
                          style={{ width: `${proj.progress || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Right Column: Upcoming Meetings */}
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-[#0F172A]">Upcoming Meetings</h2>
            <button
              onClick={() => onNavigateTab("calendar")}
              className="text-xs font-bold text-[#006858] hover:underline cursor-pointer"
            >
              Calendar
            </button>
          </div>

          <div className="modern-card rounded-3xl p-5 bg-white border border-slate-200/90 shadow-sm h-[320px] flex flex-col">
            {mongoMeetings.length === 0 ? (
              <div className="my-auto text-center space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
                  <Calendar className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-700">No Meetings Scheduled</p>
                <p className="text-[11px] text-slate-400">Your Event collection is currently empty.</p>
                <button
                  onClick={() => onNavigateTab("calendar")}
                  className="text-xs font-extrabold text-[#006858] hover:underline pt-1 block mx-auto cursor-pointer"
                >
                  + Schedule Event
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 overflow-y-auto flex-1 pr-0.5">
                {mongoMeetings.map((evt: EventItem) => (
                  <div
                    key={evt.id || evt._id}
                    className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center justify-between hover:bg-emerald-50/60 transition-colors"
                  >
                    <div className="space-y-0.5 pr-2 truncate">
                      <h4 className="font-extrabold text-xs text-[#0F172A] truncate">{evt.title}</h4>
                      <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#006858]" />
                        {evt.time || evt.startTime} {evt.date ? `· ${evt.date}` : ""}
                      </p>
                    </div>
                    {evt.link ? (
                      <a
                        href={evt.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-[#006858] font-extrabold text-[10px] hover:bg-emerald-50 transition-colors flex items-center gap-1 shrink-0 shadow-2xs"
                      >
                        <Video className="w-3 h-3" /> Join
                      </a>
                    ) : (
                      <span className="text-[10px] font-bold text-[#006858] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50 shrink-0">
                        {evt.category || "Meeting"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* 4. Bottom Section: Urgent Tasks & Live MongoDB Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Urgent Tasks Column */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-[#0F172A]">Urgent Tasks</h2>
            <button
              onClick={() => onNavigateTab("kanban")}
              className="text-xs font-bold text-[#006858] hover:underline cursor-pointer"
            >
              Open Kanban Board
            </button>
          </div>

          <div className="modern-card rounded-3xl p-5 bg-white border border-slate-200/90 shadow-sm h-[280px] flex flex-col">
            {mongoUrgentTasks.length === 0 ? (
              <div className="my-auto text-center text-xs font-bold text-slate-400 flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>No urgent priority tasks pending in MongoDB Atlas!</span>
              </div>
            ) : (
              <div className="space-y-2.5 overflow-y-auto flex-1 pr-0.5">
                {mongoUrgentTasks.map((t: TaskItem) => (
                  <div
                    key={t.id || t._id}
                    onClick={() => onNavigateTab("kanban")}
                    className="p-3 rounded-2xl bg-slate-50/80 hover:bg-emerald-50/60 transition-colors border border-slate-100 flex items-center justify-between cursor-pointer"
                  >
                    <div className="space-y-1 truncate pr-2">
                      <h4 className="font-extrabold text-xs text-[#0F172A] truncate">{t.title}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-200/60 px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" /> {t.priority}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">{t.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Pulse Feed Column */}
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-[#0F172A] flex items-center gap-2">
              Pulse Feed <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h2>
          </div>

          <div className="modern-card rounded-3xl p-5 bg-white border border-slate-200/90 shadow-sm h-[280px] flex flex-col">
            {mongoPulseFeed.length === 0 ? (
              <p className="text-xs font-medium text-slate-400 text-center my-auto">
                No recent activity logged in MongoDB.
              </p>
            ) : (
              <div className="space-y-3 overflow-y-auto flex-1 pr-0.5">
                {mongoPulseFeed.map((act: any, idx: number) => (
                  <div key={act._id || idx} className="flex items-start gap-3 text-xs border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                    <img
                      src={act.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(act.user || "User")}`}
                      alt={act.user}
                      className="w-7 h-7 rounded-full object-cover bg-emerald-50 mt-0.5 shrink-0 border border-slate-100"
                    />
                    <div>
                      <p className="font-bold text-slate-800 text-[11px]">
                        {act.user} <span className="font-medium text-slate-600">{act.action}</span>{" "}
                        <strong className="text-[#006858] font-bold">{act.target}</strong>
                      </p>
                      <p className="text-[9px] text-slate-400 font-medium">{act.timestamp || act.timeAgo || "Just now"}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Render Create/Edit Project Modals ONLY for Leader */}
      {isLeader && (
        <>
          <CreateProjectModal
            isOpen={isProjectModalOpen}
            onClose={() => setIsProjectModalOpen(false)}
            onProjectCreated={() => {
              fetchDashboard();
            }}
          />

          {selectedProject && (
            <ProjectDetailModal
              isOpen={isEditProjectModalOpen}
              onClose={() => {
                setIsEditProjectModalOpen(false);
                setSelectedProject(null);
              }}
              project={selectedProject}
              onUpdated={() => {
                fetchDashboard();
              }}
            />
          )}
        </>
      )}
    </motion.div>
  );
};
