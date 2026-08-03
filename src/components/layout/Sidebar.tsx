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
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  onOpenCreateTask?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenCreateTask }) => {
  const pathname = usePathname();

  const mainNav = [
    { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { id: "messages", label: "Messages", href: "/messages", icon: MessageSquare },
    { id: "tasks", label: "Tasks", href: "/tasks", icon: CheckSquare },
    { id: "calendar", label: "Calendar", href: "/calendar", icon: Calendar },
    { id: "calls", label: "Calls", href: "/calls", icon: PhoneCall },
    { id: "files", label: "Files", href: "/files", icon: FileText },
    { id: "team", label: "Team", href: "/team", icon: Users },
    { id: "settings", label: "Settings", href: "/settings", icon: Settings },
  ] as const;

  return (
    <aside className="w-60 shrink-0 bg-[#F8FAFC] border-r border-slate-200/90 flex flex-col justify-between h-screen sticky top-0 z-30 p-4 font-sans">
      <div>
        {/* Brand Header */}
        <Link href="/dashboard" className="flex items-center gap-2.5 px-3 py-3 mb-4 group cursor-pointer">
          <div className="w-8 h-8 rounded-xl bg-[#006858] flex items-center justify-center text-white font-black text-sm shadow-md shadow-[#006858]/30 group-hover:scale-105 transition-transform">
            <Zap className="w-4 h-4 fill-white" />
          </div>
          <h1 className="font-extrabold text-xl text-slate-900 tracking-tight flex items-center">
            TaskConnect
            <span className="w-2 h-2 rounded-full bg-[#006858] ml-1" />
          </h1>
        </Link>

        {/* Sidebar Nav Items with Real Routing */}
        <nav className="space-y-1.5">
          {mainNav.map((item) => {
            const Icon = item.icon;
            const isTabActive =
              item.href === "/dashboard"
                ? pathname === "/" || pathname === "/dashboard"
                : pathname?.startsWith(item.href);

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 relative cursor-pointer",
                  isTabActive
                    ? "bg-white text-[#006858] shadow-sm font-bold border-2 border-[#006858]/70"
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

      {/* Upgrade Callout Card */}
      <div className="p-4 rounded-3xl bg-[#006858] text-white shadow-lg shadow-[#006858]/20 relative overflow-hidden">
        <div className="text-[10px] font-black uppercase tracking-wider text-emerald-200 mb-1">
          UPGRADE
        </div>
        <p className="text-xs text-emerald-50 leading-snug font-medium mb-3">
          Get advanced analytics and unlimited tasks.
        </p>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
            N
          </div>
          <button
            onClick={onOpenCreateTask}
            className="flex-1 py-2 px-3 rounded-xl bg-white text-[#006858] font-bold text-xs hover:bg-emerald-50 transition-colors shadow-sm cursor-pointer"
          >
            Go Pro
          </button>
        </div>
      </div>
    </aside>
  );
};
