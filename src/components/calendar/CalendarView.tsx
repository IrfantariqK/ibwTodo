"use client";

import React, { useState, useEffect } from "react";
import { CalendarEventItem } from "@/types";
import { EventCard } from "./EventCard";
import { AddEventModal } from "./AddEventModal";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProject } from "@/context/ProjectContext";

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const CalendarView: React.FC = () => {
  const { projects: contextProjects, activeProject, activeProjectId, isLeader } = useProject();
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEventItem | null>(null);

  // Real-time Date & Month Navigation state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [realTime, setRealTime] = useState(new Date());

  // Location & Timezone metadata
  const [timeZone, setTimeZone] = useState("UTC");
  const [locationName, setLocationName] = useState("Local Timezone");

  // Real-time ticking clock
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    setTimeZone(tz);

    if (tz.includes("/")) {
      const parts = tz.split("/");
      const city = parts[parts.length - 1].replace(/_/g, " ");
      const region = parts[0];
      setLocationName(`${city}, ${region}`);
    } else {
      setLocationName(tz);
    }

    const timer = setInterval(() => {
      setRealTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      let url = "/api/calendar";
      if (activeProject && activeProjectId !== "all") {
        const pId = activeProject.id || activeProject._id;
        if (pId) url += `?projectId=${encodeURIComponent(pId)}`;
      }
      const res = await fetch(url, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (res.ok) {
        const data: CalendarEventItem[] = await res.json();
        let allowedProjects = contextProjects;
        if (!isLeader) {
          allowedProjects = activeProject ? [activeProject] : contextProjects;
        } else if (activeProject && activeProjectId !== "all") {
          allowedProjects = [activeProject];
        }

        const allowedProjectIds = new Set(allowedProjects.map((p) => (p.id || p._id || "").toString()));

        const filtered = data.filter((evt) => {
          const pId = (evt.projectId || "").toString();
          if (activeProject && activeProjectId !== "all") {
            return pId === (activeProject.id || activeProject._id || "").toString();
          }
          return allowedProjectIds.has(pId) || allowedProjects.length === 0;
        });

        setEvents(filtered);
      }
    } catch (err) {
      console.warn("Failed to fetch calendar API:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [activeProject, activeProjectId, contextProjects, isLeader]);

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

  const handleUpdateEvent = async (updatedEvent: CalendarEventItem) => {
    const eventId = updatedEvent.id || updatedEvent._id;
    if (!eventId) return;

    try {
      const res = await fetch("/api/calendar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updatedEvent,
          id: eventId,
        }),
      });
      if (res.ok) {
        await fetchEvents();
        setEditingEvent(null);
        setIsModalOpen(false);
      }
    } catch (err) {
      console.warn("Error updating event:", err);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!eventId) return;
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const res = await fetch(`/api/calendar?id=${encodeURIComponent(eventId)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchEvents();
      }
    } catch (err) {
      console.warn("Error deleting event:", err);
    }
  };

  // Month navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleGoToToday = () => {
    setCurrentDate(new Date());
  };

  // Calculations for dynamic calendar grid
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0 - 11

  const realToday = new Date();
  const realDay = realToday.getDate();
  const realMonth = realToday.getMonth();
  const realYear = realToday.getFullYear();

  // First day of month (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  // Total days in current month
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const daysArray = Array.from({ length: totalDaysInMonth }, (_, i) => i + 1);
  const leadingPaddingArray = Array.from({ length: firstDayOfWeek });

  // Format real-time clock
  const formattedTime = realTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const formattedDate = realTime.toLocaleDateString([], {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans text-[#0F172A]">

      {/* Real-time Location & Timezone Header Banner */}
      <div className="modern-card rounded-3xl p-5 bg-white border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#006858] flex items-center justify-center shadow-inner shrink-0">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-[#006858] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                <MapPin className="w-3 h-3" /> {locationName}
              </span>
              <span className="text-[10px] font-bold text-slate-400">Timezone: {timeZone}</span>
            </div>
            <h2 className="text-xl font-black text-[#0F172A] tracking-tight mt-1 flex items-center gap-2">
              <span>{formattedTime}</span>
              <span className="text-xs text-slate-400 font-semibold font-mono">({timeZone})</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">{formattedDate}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={handleGoToToday}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#006858] text-xs font-black border border-emerald-200 transition-colors cursor-pointer"
          >
            Today ({realDay} {monthNames[realMonth].slice(0, 3)})
          </button>
        </div>
      </div>

      {/* Calendar Controls & Month Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-3xl light-card shadow-sm bg-white border border-slate-200/90">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#E6F4F1] border border-[#006858]/20 flex items-center justify-center text-[#006858]">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-lg text-slate-900">
              {monthNames[month]} {year}
            </h3>
            <p className="text-xs font-semibold text-slate-500">
              Real-time workspace milestones & event schedule
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handlePrevMonth} variant="outline" size="sm" icon={<ChevronLeft className="w-4 h-4" />}>
            Prev
          </Button>
          <Button onClick={handleNextMonth} variant="outline" size="sm" icon={<ChevronRight className="w-4 h-4" />}>
            Next
          </Button>
          <Button
            onClick={() => {
              setEditingEvent(null);
              setIsModalOpen(true);
            }}
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4 stroke-[3]" />}
            className="rounded-xl bg-[#006858] hover:bg-[#005245] cursor-pointer"
          >
            Add Event
          </Button>
        </div>
      </div>

      {/* Main Grid & Upcoming Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dynamic Month Calendar Grid */}
        <div className="lg:col-span-2 light-card p-6 rounded-3xl shadow-sm bg-white border border-slate-200/90">
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
            {/* Leading empty cells for days before start of month */}
            {leadingPaddingArray.map((_, idx) => (
              <div key={`pad-${idx}`} className="h-24 bg-slate-50/40 rounded-2xl border border-slate-100/60" />
            ))}

            {/* Days of the month */}
            {daysArray.map((day) => {
              const monthStr = month + 1 < 10 ? `0${month + 1}` : `${month + 1}`;
              const dayPadded = day < 10 ? `0${day}` : `${day}`;
              const dayStr = `${year}-${monthStr}-${dayPadded}`;

              const dayEvents = events.filter((e) => e.date === dayStr);

              // REAL-TIME TODAY CHECK
              const isToday = day === realDay && month === realMonth && year === realYear;

              return (
                <div
                  key={day}
                  className={cn(
                    "h-24 p-2 rounded-2xl border transition-all hover:border-[#006858] flex flex-col justify-between overflow-hidden",
                    isToday
                      ? "bg-[#E6F4F1] border-[#006858] shadow-md ring-2 ring-[#006858]"
                      : "bg-slate-50/60 border-slate-200/80"
                  )}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={cn(
                        "font-extrabold font-mono px-1.5 py-0.5 rounded-md text-[11px]",
                        isToday ? "bg-[#006858] text-white shadow-xs" : "text-slate-700"
                      )}
                    >
                      {day}
                    </span>
                    {isToday && (
                      <span className="text-[9px] font-black uppercase text-[#006858] bg-white px-1 py-0.2 rounded-md border border-[#006858]/30">
                        Today
                      </span>
                    )}
                    {dayEvents.length > 0 && !isToday && (
                      <span className="w-2 h-2 rounded-full bg-[#006858] animate-pulse" />
                    )}
                  </div>

                  <div className="space-y-1 overflow-y-auto max-h-14 pr-0.5">
                    {dayEvents.map((evt) => (
                      <div
                        key={evt.id || evt._id}
                        onClick={() => {
                          setEditingEvent(evt);
                          setIsModalOpen(true);
                        }}
                        className="text-[10px] truncate px-1.5 py-0.5 rounded bg-white text-[#006858] border border-[#006858]/20 font-bold shadow-2xs cursor-pointer hover:bg-emerald-50"
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

        {/* Right Column: Upcoming Timeline */}
        <div className="light-card p-6 rounded-3xl space-y-4 shadow-sm bg-white border border-slate-200/90">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-black text-slate-900 text-sm">Upcoming Timeline</h4>
            <span className="text-xs font-mono font-bold text-[#006858] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
              {events.length} Events
            </span>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {events.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400 font-bold space-y-1">
                <p>No events scheduled for this project.</p>
                <button
                  onClick={() => {
                    setEditingEvent(null);
                    setIsModalOpen(true);
                  }}
                  className="text-[#006858] underline font-extrabold cursor-pointer"
                >
                  + Add New Event
                </button>
              </div>
            ) : (
              events.map((evt) => (
                <EventCard
                  key={evt.id || evt._id}
                  event={evt}
                  onEdit={(selectedEvt) => {
                    setEditingEvent(selectedEvt);
                    setIsModalOpen(true);
                  }}
                  onDelete={handleDeleteEvent}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <AddEventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEvent(null);
        }}
        onAddEvent={handleAddEvent}
        onEditEvent={handleUpdateEvent}
        editEventData={editingEvent}
      />
    </div>
  );
};
