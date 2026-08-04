"use client";

import React from "react";
import { Clock, Users, Edit2, Trash2 } from "lucide-react";
import { CalendarEventItem } from "@/types";

interface EventCardProps {
  event: CalendarEventItem;
  onEdit?: (event: CalendarEventItem) => void;
  onDelete?: (eventId: string) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onEdit, onDelete }) => {
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

  const eventId = event.id || event._id || "";

  return (
    <div
      className={`p-3 rounded-2xl border transition-all duration-200 hover:shadow-md relative group ${styleClass}`}
    >
      <div className="flex items-center justify-between font-bold text-xs">
        <span className="truncate pr-2">{event.title}</span>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="flex items-center gap-1 font-mono text-[11px] opacity-80">
            <Clock className="w-3 h-3" />
            {event.startTime || event.time}
          </span>

          {/* Action buttons (Edit & Delete) */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ml-1">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(event)}
                className="p-1 rounded-lg hover:bg-black/10 transition-colors text-slate-700 cursor-pointer"
                title="Edit Event"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            )}
            {onDelete && eventId && (
              <button
                type="button"
                onClick={() => onDelete(eventId)}
                className="p-1 rounded-lg hover:bg-red-500 hover:text-white transition-colors text-red-600 cursor-pointer"
                title="Delete Event"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {event.description && (
        <p className="text-[11px] opacity-90 mt-1 line-clamp-2">{event.description}</p>
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
