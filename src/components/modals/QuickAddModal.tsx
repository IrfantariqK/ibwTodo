"use client";

import React, { useState } from "react";
import { ModalWrapper } from "@/components/ui/ModalWrapper";
import { Search, Plus, MessageSquare, Calendar, Kanban } from "lucide-react";

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateTask: () => void;
  onNavigateTab: (tab: "dashboard" | "kanban" | "chat" | "calendar") => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  onOpenCreateTask,
  onNavigateTab,
}) => {
  const [query, setQuery] = useState("");

  const actions = [
    {
      id: "create-task",
      title: "Create New Task",
      subtitle: "Add task to Kanban board",
      icon: Plus,
      action: () => {
        onClose();
        onOpenCreateTask();
      },
    },
    {
      id: "kanban",
      title: "Go to Tasks & Board",
      subtitle: "View Backlog, In Progress, Review, Completed",
      icon: Kanban,
      action: () => {
        onClose();
        onNavigateTab("kanban");
      },
    },
    {
      id: "chat",
      title: "Go to Messages",
      subtitle: "#general, #sprint-beta, #engineering",
      icon: MessageSquare,
      action: () => {
        onClose();
        onNavigateTab("chat");
      },
    },
    {
      id: "calendar",
      title: "Go to Calendar",
      subtitle: "Sprint milestones & schedule events",
      icon: Calendar,
      action: () => {
        onClose();
        onNavigateTab("calendar");
      },
    },
  ];

  const filtered = actions.filter((a) =>
    a.title.toLowerCase().includes(query.toLowerCase()) ||
    a.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Command Palette"
      subtitle="Quick actions & navigation shortcuts"
      maxWidth="md"
    >
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="w-full bg-slate-50 text-xs font-bold text-slate-900 placeholder-slate-400 pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-[#006858]"
          />
        </div>

        <div className="space-y-1.5 pt-2 max-h-64 overflow-y-auto">
          {filtered.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={item.action}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-[#006858] hover:bg-white hover:shadow-sm transition-all text-left group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-[#E6F4F1] border border-[#006858]/20 flex items-center justify-center text-[#006858] group-hover:bg-[#006858] group-hover:text-white transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 group-hover:text-[#006858]">
                    {item.title}
                  </h4>
                  <p className="text-[11px] font-medium text-slate-500">{item.subtitle}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </ModalWrapper>
  );
};
