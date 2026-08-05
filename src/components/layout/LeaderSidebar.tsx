"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  CheckSquare,
  Calendar,
  PhoneCall,
  FileText,
  Users,
  Settings,
  Crown,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LeaderSidebarProps {
  onOpenCreateTask?: () => void;
  onOpenCreateProject?: () => void;
}

export const LeaderSidebar: React.FC<LeaderSidebarProps> = ({ onOpenCreateTask }) => {
  const pathname = usePathname();

  const leaderNav = [
    { id: "dashboard", label: "Dashboard", href: "/leader/dashboard", icon: LayoutDashboard },
    { id: "messages", label: "Messages", href: "/leader/messages", icon: MessageSquare },
    { id: "tasks", label: "Tasks", href: "/leader/tasks", icon: CheckSquare },
    { id: "calendar", label: "Calendar", href: "/leader/calendar", icon: Calendar },
    { id: "calls", label: "Calls", href: "/leader/calls", icon: PhoneCall },
    { id: "files", label: "Files", href: "/leader/files", icon: FileText },
    { id: "team", label: "Team & Clients", href: "/leader/team", icon: Users },
    { id: "settings", label: "Settings", href: "/leader/settings", icon: Settings },
  ] as const;

  return (
    <aside className="w-60 shrink-0 bg-[#F8FAFC] border-r border-slate-200/90 flex flex-col justify-between h-screen sticky top-0 z-30 p-4 font-sans">
      <div>
        {/* Leader Portal Brand */}
        <Link href="/leader/dashboard" className="flex items-center gap-2.5 px-3 py-3 mb-4 group cursor-pointer">
          <div className="w-8 h-8 rounded-xl bg-[#006858] flex items-center justify-center text-white font-black text-sm shadow-md shadow-[#006858]/30 group-hover:scale-105 transition-transform">
            <Crown className="w-4 h-4 text-emerald-100" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-slate-900 tracking-tight flex items-center leading-none">
              TaskConnect
              <span className="w-2 h-2 rounded-full bg-[#006858] ml-1" />
            </h1>
            <span className="text-[10px] font-extrabold uppercase text-[#006858] tracking-wider">
              Leader / Admin Portal
            </span>
          </div>
        </Link>

        {/* Leader Nav Items */}
        <nav className="space-y-1.5">
          {leaderNav.map((item) => {
            const Icon = item.icon;
            const isTabActive = pathname === item.href || (pathname?.startsWith(item.href) && item.href !== "/leader/dashboard");

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 relative cursor-pointer",
                  isTabActive
                    ? "bg-white text-[#006858] shadow-sm font-bold border-2 border-[#006858]"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isTabActive ? "text-[#006858]" : "text-slate-400"
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Leader Action Card */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-[#006858] via-[#004d40] to-slate-900 text-white shadow-lg shadow-[#006858]/20 relative overflow-hidden">
        <div className="text-[10px] font-black uppercase tracking-wider text-emerald-300 mb-1">
          PROJECT MANAGEMENT
        </div>
        <p className="text-xs text-emerald-100 leading-snug font-medium mb-3">
          Manage workspace, invite clients & create projects.
        </p>
        <button
          onClick={onOpenCreateTask}
          className="w-full py-2 px-3 rounded-xl bg-white text-[#006858] font-bold text-xs hover:bg-emerald-50 transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5 text-[#006858]" /> Create Task
        </button>
      </div>
    </aside>
  );
};
