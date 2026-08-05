"use client";

import React, { useState, useEffect } from "react";
import { Search, Bell, LogOut, Briefcase, ChevronDown, Check, Code, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useProject } from "@/context/ProjectContext";
import { cn } from "@/lib/utils";

interface MemberHeaderProps {
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onOpenQuickAdd?: () => void;
}

export const MemberHeader: React.FC<MemberHeaderProps> = ({
  searchQuery = "",
  onSearchChange,
  onOpenQuickAdd,
}) => {
  const router = useRouter();
  const { projects, activeProject, setActiveProjectId } = useProject();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<"online" | "busy" | "offline">("online");
  const [user, setUser] = useState<{
    name: string;
    email: string;
    role: string;
    avatar: string;
  }>({
    name: "Team Engineer",
    email: "",
    role: "Team Developer",
    avatar: "",
  });

  useEffect(() => {
    const saved = localStorage.getItem("taskconnect_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser({
          name: parsed.name || "Team Engineer",
          email: parsed.email || "",
          role: parsed.role || "Team Developer",
          avatar:
            parsed.avatar ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
              parsed.email || "Member"
            )}`,
        });
      } catch (e) {
        console.warn("Failed to parse user session in MemberHeader:", e);
      }
    }
  }, []);

  const handleUpdateStatus = async (status: "online" | "busy" | "offline") => {
    setCurrentStatus(status);
    try {
      await fetch("/api/user/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, presenceStatus: status }),
      });
    } catch (err) {
      console.warn("Failed to update status:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      localStorage.removeItem("taskconnect_user");
      localStorage.removeItem("taskconnect_active_project");
      router.push("/member/login");
      router.refresh();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <header className="h-16 shrink-0 bg-white px-8 flex items-center justify-between sticky top-0 z-20 pt-2 border-b border-slate-100 font-sans">
      {/* Search & Assigned Project Selector */}
      <div className="flex items-center gap-4">
        <div className="relative w-72 md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder="Search code, team tasks, or docs..."
            className="w-full bg-[#EEF2F6] text-xs text-slate-900 font-medium placeholder-slate-400 pl-10 pr-4 py-2 rounded-full border border-slate-200/60 focus:bg-white focus:ring-2 focus:ring-purple-600 transition-all shadow-inner"
          />
        </div>

        {/* Assigned Project Selector (No 'All Projects' option) */}
        {projects.length > 1 ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProjectMenu(!showProjectMenu)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-purple-50 text-purple-900 border border-purple-200/80 hover:bg-purple-100/70 transition-all text-xs font-bold cursor-pointer shadow-2xs"
            >
              <Briefcase className="w-3.5 h-3.5 text-purple-700" />
              <span className="max-w-[140px] truncate">
                {activeProject ? activeProject.name : projects[0]?.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-purple-700/70" />
            </button>

            {showProjectMenu && (
              <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl p-2 shadow-xl border border-slate-200 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-1.5 border-b border-slate-100 mb-1 flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Assigned Team Projects</p>
                  <span className="text-[10px] font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded-full">{projects.length} Total</span>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-0.5">
                  {projects.map((p) => {
                    const pId = p.id || p._id || "";
                    const isSel = (activeProject?.id || activeProject?._id) === pId;
                    return (
                      <button
                        key={pId}
                        type="button"
                        onClick={() => {
                          setActiveProjectId(pId);
                          setShowProjectMenu(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left ${
                          isSel ? "bg-purple-800 text-white" : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="truncate pr-2">{p.name}</span>
                        {isSel && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-purple-50 text-purple-900 border border-purple-200/80 text-xs font-bold shadow-2xs">
            <Briefcase className="w-3.5 h-3.5 text-purple-700" />
            <span className="max-w-[180px] truncate">
              Project: {activeProject ? activeProject.name : (projects[0]?.name || "Assigned Project")}
            </span>
          </div>
        )}
      </div>

      {/* Right Controls: Quick Add Task, Notifications & User Dropdown */}
      <div className="flex items-center gap-4">
        {onOpenQuickAdd && (
          <button
            type="button"
            onClick={onOpenQuickAdd}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        )}

        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-800 border border-purple-200/80 text-[11px] font-extrabold">
          <Code className="w-3.5 h-3.5 text-purple-700" />
          <span>Team Member</span>
        </div>

        <button
          type="button"
          aria-label="Notifications"
          className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-600 rounded-full ring-2 ring-white" />
        </button>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 p-1 rounded-full hover:bg-slate-100 transition-colors"
          >
            <div className="relative">
              <img
                src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`}
                alt={user.name}
                className="w-9 h-9 rounded-full bg-purple-50 border border-slate-200/80 object-cover ring-2 ring-purple-600/30"
              />
              <span
                className={cn(
                  "w-2.5 h-2.5 rounded-full absolute -bottom-0.5 -right-0.5 ring-2 ring-white shadow-2xs",
                  currentStatus === "online" ? "bg-emerald-500" : currentStatus === "busy" ? "bg-amber-500" : "bg-slate-400"
                )}
              />
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl p-2 shadow-xl border border-slate-100 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                <span className="inline-block mt-1 text-[9px] font-black uppercase bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                  Team Member
                </span>
              </div>

              {/* Status Picker */}
              <div className="px-3 py-2 border-b border-slate-100 space-y-1">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Set Status</p>
                <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus("online")}
                    className={cn(
                      "flex-1 py-1 rounded-lg text-[10px] font-extrabold flex items-center justify-center gap-1 transition-all cursor-pointer",
                      currentStatus === "online" ? "bg-emerald-500 text-white shadow-2xs" : "text-slate-600 hover:bg-slate-200/60"
                    )}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white" /> Online
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus("busy")}
                    className={cn(
                      "flex-1 py-1 rounded-lg text-[10px] font-extrabold flex items-center justify-center gap-1 transition-all cursor-pointer",
                      currentStatus === "busy" ? "bg-amber-500 text-white shadow-2xs" : "text-slate-600 hover:bg-slate-200/60"
                    )}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white" /> Busy
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus("offline")}
                    className={cn(
                      "flex-1 py-1 rounded-lg text-[10px] font-extrabold flex items-center justify-center gap-1 transition-all cursor-pointer",
                      currentStatus === "offline" ? "bg-slate-600 text-white shadow-2xs" : "text-slate-600 hover:bg-slate-200/60"
                    )}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white" /> Offline
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer mt-1"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
