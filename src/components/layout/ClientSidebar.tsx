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
  Building,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const ClientSidebar: React.FC = () => {
  const pathname = usePathname();

  const clientNav = [
    { id: "dashboard", label: "Dashboard", href: "/client/dashboard", icon: LayoutDashboard },
    { id: "messages", label: "Messages", href: "/client/messages", icon: MessageSquare },
    { id: "tasks", label: "Tasks", href: "/client/tasks", icon: CheckSquare },
    { id: "calendar", label: "Calendar", href: "/client/calendar", icon: Calendar },
    { id: "calls", label: "Calls", href: "/client/calls", icon: PhoneCall },
    { id: "files", label: "Files", href: "/client/files", icon: FileText },
    { id: "team", label: "Team", href: "/client/team", icon: Users },
    { id: "settings", label: "Settings", href: "/client/settings", icon: Settings },
  ] as const;

  return (
    <aside className="w-60 shrink-0 bg-[#F8FAFC] border-r border-slate-200/90 flex flex-col justify-between h-screen sticky top-0 z-30 p-4 font-sans">
      <div>
        {/* Client Portal Brand */}
        <Link href="/client/dashboard" className="flex items-center gap-2.5 px-3 py-3 mb-4 group cursor-pointer">
          <div className="w-8 h-8 rounded-xl bg-[#006858] flex items-center justify-center text-white font-black text-sm shadow-md shadow-[#006858]/30 group-hover:scale-105 transition-transform">
            <Building className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-slate-900 tracking-tight flex items-center leading-none">
              Client Portal
              <span className="w-2 h-2 rounded-full bg-[#006858] ml-1" />
            </h1>
            <span className="text-[10px] font-extrabold uppercase text-[#006858] tracking-wider">
              Client Contact Access
            </span>
          </div>
        </Link>

        {/* Client Nav Items */}
        <nav className="space-y-1.5">
          {clientNav.map((item) => {
            const Icon = item.icon;
            const isTabActive = pathname === item.href || (pathname?.startsWith(item.href) && item.href !== "/client/dashboard");

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

      {/* Client Support / Info Card */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-[#006858] to-emerald-700 text-white shadow-lg shadow-[#006858]/20 relative overflow-hidden">
        <div className="text-[10px] font-black uppercase tracking-wider text-emerald-200 mb-1">
          PROJECT SUPPORT
        </div>
        <p className="text-xs text-emerald-50 leading-snug font-medium mb-2">
          Direct client collaboration & project status updates.
        </p>
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-100 bg-white/10 px-2.5 py-1.5 rounded-xl backdrop-blur-xs">
          <Building className="w-3.5 h-3.5" /> Client Verified
        </div>
      </div>
    </aside>
  );
};
