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
  Code,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MemberSidebarProps {
  onOpenCreateTask?: () => void;
}

export const MemberSidebar: React.FC<MemberSidebarProps> = ({ onOpenCreateTask }) => {
  const pathname = usePathname();

  const memberNav = [
    { id: "dashboard", label: "Dashboard", href: "/member/dashboard", icon: LayoutDashboard },
    { id: "messages", label: "Messages", href: "/member/messages", icon: MessageSquare },
    { id: "tasks", label: "Tasks", href: "/member/tasks", icon: CheckSquare },
    { id: "calendar", label: "Calendar", href: "/member/calendar", icon: Calendar },
    { id: "calls", label: "Calls", href: "/member/calls", icon: PhoneCall },
    { id: "files", label: "Files", href: "/member/files", icon: FileText },
    { id: "team", label: "Team", href: "/member/team", icon: Users },
    { id: "settings", label: "Settings", href: "/member/settings", icon: Settings },
  ] as const;

  return (
    <aside className="w-60 shrink-0 bg-[#F8FAFC] border-r border-slate-200/90 flex flex-col justify-between h-screen sticky top-0 z-30 p-4 font-sans">
      <div>
        {/* Team Member Brand */}
        <Link href="/member/dashboard" className="flex items-center gap-2.5 px-3 py-3 mb-4 group cursor-pointer">
          <div className="w-8 h-8 rounded-xl bg-purple-700 flex items-center justify-center text-white font-black text-sm shadow-md shadow-purple-600/30 group-hover:scale-105 transition-transform">
            <Code className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-slate-900 tracking-tight flex items-center leading-none">
              Developer Hub
              <span className="w-2 h-2 rounded-full bg-purple-600 ml-1" />
            </h1>
            <span className="text-[10px] font-extrabold uppercase text-purple-700 tracking-wider">
              Team Member Workspace
            </span>
          </div>
        </Link>

        {/* Member Nav Items */}
        <nav className="space-y-1.5">
          {memberNav.map((item) => {
            const Icon = item.icon;
            const isTabActive = pathname === item.href || (pathname?.startsWith(item.href) && item.href !== "/member/dashboard");

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 relative cursor-pointer",
                  isTabActive
                    ? "bg-white text-purple-900 shadow-sm font-bold border-2 border-purple-600/70"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isTabActive ? "text-purple-700" : "text-slate-400"
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Member Action Card */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-purple-800 to-indigo-900 text-white shadow-lg shadow-purple-900/20 relative overflow-hidden">
        <div className="text-[10px] font-black uppercase tracking-wider text-purple-200 mb-1">
          ENGINEERING MODE
        </div>
        <p className="text-xs text-purple-100 leading-snug font-medium mb-3">
          Track sprint progress & log project deliverables.
        </p>
        <button
          onClick={onOpenCreateTask}
          className="w-full py-2 px-3 rounded-xl bg-white text-purple-900 font-bold text-xs hover:bg-purple-50 transition-colors shadow-sm cursor-pointer"
        >
          + Add Team Task
        </button>
      </div>
    </aside>
  );
};
