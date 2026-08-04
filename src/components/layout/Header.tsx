"use client";

import React, { useState, useEffect } from "react";
import { Search, Bell, LogOut, Briefcase, ChevronDown, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useProject } from "@/context/ProjectContext";

interface HeaderProps {
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onOpenQuickAdd?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery = "",
  onSearchChange,
}) => {
  const router = useRouter();
  const { projects, activeProject, activeProjectId, setActiveProjectId, userRole, userType } = useProject();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [user, setUser] = useState<{
    name: string;
    email: string;
    role: string;
    type: string;
    avatar: string;
  }>({
    name: "User",
    email: "",
    role: "",
    type: "",
    avatar: "",
  });

  useEffect(() => {
    const saved = localStorage.getItem("taskconnect_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser({
          name: parsed.name || "User",
          email: parsed.email || "",
          role: parsed.role || "",
          type: parsed.type || "",
          avatar:
            parsed.avatar ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
              parsed.email || "User"
            )}`,
        });
      } catch (e) {
        console.warn("Failed to parse user session in Header:", e);
      }
    }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      localStorage.removeItem("taskconnect_user");
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // Determine if current user is a Client vs Leader
  const isClient =
    user.type === "client" ||
    userType === "client" ||
    user.role?.toLowerCase().includes("client") ||
    userRole?.toLowerCase().includes("client");

  const isLeader = !isClient;

  return (
    <header className="h-16 shrink-0 bg-white px-8 flex items-center justify-between sticky top-0 z-20 pt-2 border-b border-slate-100 font-sans">
      {/* Search Input & Project Switcher */}
      <div className="flex items-center gap-4">
        <div className="relative w-72 md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder="Search tasks, projects, or team..."
            className="w-full bg-[#EEF2F6] text-xs text-slate-900 font-medium placeholder-slate-400 pl-10 pr-4 py-2 rounded-full border border-slate-200/60 focus:bg-white focus:ring-2 focus:ring-[#006858] transition-all shadow-inner"
          />
        </div>

        {/* Active Project Switcher: Interactive Dropdown for Leader ONLY, Static Label for Client/Team */}
        {isLeader ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProjectMenu(!showProjectMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-emerald-50 text-[#006858] border border-emerald-200/80 hover:bg-emerald-100/70 transition-all text-xs font-bold cursor-pointer shadow-2xs"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span className="max-w-[140px] truncate">
                {activeProject ? activeProject.name : "All Projects"}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#006858]/70" />
            </button>

            {showProjectMenu && (
              <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl p-2 shadow-xl border border-slate-200 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-1.5 border-b border-slate-100 mb-1 flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Select Active Project</p>
                  <span className="text-[10px] font-bold text-[#006858] bg-emerald-50 px-2 py-0.5 rounded-full">{projects.length} Total</span>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveProjectId("all");
                      setShowProjectMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left ${
                      activeProjectId === "all"
                        ? "bg-[#006858] text-white"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>All Projects</span>
                    {activeProjectId === "all" && <Check className="w-3.5 h-3.5" />}
                  </button>

                  {projects.map((p) => {
                    const pId = p.id || p._id || "";
                    const isSel = activeProjectId === pId;
                    return (
                      <button
                        key={pId}
                        type="button"
                        onClick={() => {
                          setActiveProjectId(pId);
                          setShowProjectMenu(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left ${
                          isSel ? "bg-[#006858] text-white" : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div className="truncate pr-2">
                          <p className="truncate">{p.name}</p>
                          {p.clients && p.clients.length > 0 && (
                            <p className={`text-[10px] font-medium ${isSel ? "text-white/80" : "text-slate-400"}`}>
                              {p.clients.length} Client{p.clients.length > 1 ? "s" : ""} · {p.teamMembers?.length || 0} Team
                            </p>
                          )}
                        </div>
                        {isSel && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-emerald-50 text-[#006858] border border-emerald-200/80 text-xs font-bold">
            <Briefcase className="w-3.5 h-3.5" />
            <span className="max-w-[160px] truncate">
              Project: {activeProject ? activeProject.name : (projects[0]?.name || "Assigned Workspace")}
            </span>
          </div>
        )}
      </div>

      {/* Right Controls: Notifications & User Avatar Dropdown */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label="Notifications"
          className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
        </button>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 p-1 rounded-full hover:bg-slate-100 transition-colors"
          >
            <img
              src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`}
              alt={user.name}
              className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200/80 object-cover"
            />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl p-2 shadow-xl border border-slate-100 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
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
