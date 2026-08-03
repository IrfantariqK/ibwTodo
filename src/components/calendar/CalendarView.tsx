"use client";

import React, { useState, useEffect } from "react";
import { CalendarEventItem } from "@/types";
import { EventCard } from "./EventCard";
import { AddEventModal } from "./AddEventModal";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

import { useProject } from "@/context/ProjectContext";

export const CalendarView: React.FC = () => {
  const { activeProject } = useProject();
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchEvents = async () => {
    try {
      let url = "/api/calendar";
      if (activeProject) {
        const pId = activeProject.id || activeProject._id;
        if (pId) url += `?projectId=${encodeURIComponent(pId)}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.warn("Failed to fetch calendar API:", err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [activeProject]);

  const handleAddEvent = async (newEvent: CalendarEventItem) => {
    const payload = {
      ...newEvent,
      projectId: activeProject ? activeProject.id || activeProject._id : "",
    };
    try {
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await fetchEvents();
      }
    } catch (err) {
      console.warn("Error posting event:", err);
    }
  };

  const daysInMonth = 31;
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-3xl light-card shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#E6F4F1] border border-[#006858]/20 flex items-center justify-center text-[#006858]">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900">August 2026</h3>
            <p className="text-xs font-medium text-slate-500">Sprint 24 & 25 Scheduled Milestones</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<ChevronLeft className="w-4 h-4" />}>
            Prev
          </Button>
          <Button variant="outline" size="sm" icon={<ChevronRight className="w-4 h-4" />}>
            Next
          </Button>
          <Button
            onClick={() => setIsModalOpen(true)}
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4 stroke-[3]" />}
            className="rounded-xl"
          >
            Add Event
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 light-card p-6 rounded-3xl shadow-sm">
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            <div className="h-20 bg-slate-50 rounded-2xl border border-slate-100" />
            <div className="h-20 bg-slate-50 rounded-2xl border border-slate-100" />

            {daysArray.map((day) => {
              const dayStr = `2026-08-${day < 10 ? `0${day}` : day}`;
              const dayEvents = events.filter((e) => e.date === dayStr);
              const isToday = day === 3;

              return (
                <div
                  key={day}
                  className={cn(
                    "h-24 p-2 rounded-2xl border transition-all hover:border-[#006858] flex flex-col justify-between overflow-hidden",
                    isToday
                      ? "bg-[#E6F4F1] border-[#006858] shadow-sm"
                      : "bg-slate-50/60 border-slate-200/80"
                  )}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={cn(
                        "font-extrabold font-mono px-1.5 py-0.5 rounded-md",
                        isToday ? "bg-[#006858] text-white" : "text-slate-700"
                      )}
                    >
                      {day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#006858] animate-pulse" />
                    )}
                  </div>

                  <div className="space-y-1 overflow-y-auto max-h-14">
                    {dayEvents.map((evt) => (
                      <div
                        key={evt.id}
                        className="text-[10px] truncate px-1.5 py-0.5 rounded bg-white text-[#006858] border border-[#006858]/20 font-bold shadow-2xs"
                        title={evt.title}
                      >
                        {evt.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="light-card p-6 rounded-3xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-bold text-slate-900 text-sm">Upcoming Timeline</h4>
            <span className="text-xs font-mono font-bold text-slate-400">{events.length} Events</span>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {events.map((evt) => (
              <EventCard key={evt.id} event={evt} />
            ))}
          </div>
        </div>
      </div>

      <AddEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddEvent={handleAddEvent}
      />
    </div>
  );
};
