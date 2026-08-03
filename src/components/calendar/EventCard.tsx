"use client";

import React from "react";
import { Clock, Users } from "lucide-react";
import { CalendarEventItem } from "@/types";

interface EventCardProps {
  event: CalendarEventItem;
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const categoryColors: Record<string, string> = {
    standup: "border-purple-200 bg-purple-50 text-purple-800",
    review: "border-amber-200 bg-amber-50 text-amber-800",
    sprint: "border-emerald-200 bg-[#E6F4F1] text-[#006858]",
    meeting: "border-[#006858]/30 bg-[#E6F4F1] text-[#006858]",
    sync: "border-blue-200 bg-blue-50 text-blue-800",
    demo: "border-emerald-200 bg-emerald-50 text-emerald-800",
    deadline: "border-red-200 bg-red-50 text-red-800",
  };

  const styleClass =
    categoryColors[event.category || event.type || "meeting"] ||
    "border-slate-200 bg-slate-50 text-slate-800";

  return (
    <div
      className={`p-3 rounded-2xl border transition-all duration-200 hover:shadow-md ${styleClass}`}
    >
      <div className="flex items-center justify-between font-bold text-xs">
        <span className="truncate pr-2">{event.title}</span>
        <span className="shrink-0 flex items-center gap-1 font-mono text-[11px] opacity-80">
          <Clock className="w-3 h-3" />
          {event.startTime || event.time}
        </span>
      </div>

      {event.description && (
        <p className="text-[11px] opacity-90 mt-1 line-clamp-1">{event.description}</p>
      )}

      {event.attendees && event.attendees.length > 0 && (
        <div className="flex items-center gap-1 mt-2 text-[10px] opacity-80 font-medium">
          <Users className="w-3 h-3" />
          <span>{event.attendees.join(", ")}</span>
        </div>
      )}
    </div>
  );
};
