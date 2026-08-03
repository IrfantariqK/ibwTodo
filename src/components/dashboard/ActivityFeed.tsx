"use client";

import React from "react";
import { CheckCircle2, MessageSquare, PlusCircle, ArrowUpRight } from "lucide-react";
import { TaskItem } from "@/types";
import { formatDate } from "@/lib/utils";

interface ActivityFeedProps {
  tasks: TaskItem[];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ tasks }) => {
  const recentActivities = [
    {
      id: "act-1",
      user: "Irfan Tariq",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      action: "moved task",
      target: tasks[0]?.title || "Glassmorphism Tokens",
      from: "Backlog",
      to: "In Progress",
      time: "12 mins ago",
      icon: ArrowUpRight,
      color: "text-[#8B5CF6]",
    },
    {
      id: "act-2",
      user: "Elena Rostova",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      action: "commented on",
      target: tasks[1]?.title || "MongoDB Schema Integration",
      time: "45 mins ago",
      icon: MessageSquare,
      color: "text-purple-400",
    },
    {
      id: "act-3",
      user: "Alex Thorne",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
      action: "completed milestone",
      target: tasks[4]?.title || "Sprint Beta Release Candidate",
      time: "2 hours ago",
      icon: CheckCircle2,
      color: "text-emerald-400",
    },
    {
      id: "act-4",
      user: "Sarah Chen",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150",
      action: "created security task",
      target: tasks[3]?.title || "Security & Role-Based Access",
      time: "3 hours ago",
      icon: PlusCircle,
      color: "text-amber-400",
    },
  ];

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-800/80">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-base font-bold text-white">Live Activity Feed</h4>
        <span className="text-xs text-slate-500 font-mono">Real-time sync</span>
      </div>

      <div className="space-y-4">
        {recentActivities.map((act) => {
          const Icon = act.icon;
          return (
            <div
              key={act.id}
              className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/50 hover:bg-slate-900/80 transition-colors"
            >
              <img
                src={act.avatar}
                alt={act.user}
                className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-700 mt-0.5"
              />
              <div className="flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">{act.user}</span>
                  <span className="text-[10px] text-slate-500">{act.time}</span>
                </div>
                <p className="text-slate-400 mt-0.5 leading-relaxed">
                  {act.action}{" "}
                  <span className="text-[#D0BCFF] font-medium">&quot;{act.target}&quot;</span>
                  {act.to && (
                    <span className="ml-1 text-slate-400">
                      → <span className="text-emerald-400 font-medium">{act.to}</span>
                    </span>
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
