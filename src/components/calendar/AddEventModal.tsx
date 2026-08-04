"use client";

import React, { useState } from "react";
import { ModalWrapper } from "@/components/ui/ModalWrapper";
import { Button } from "@/components/ui/Button";
import { EventItem } from "@/types";
import { Sparkles, Wand2 } from "lucide-react";

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEvent: (event: EventItem) => void;
}

export const AddEventModal: React.FC<AddEventModalProps> = ({
  isOpen,
  onClose,
  onAddEvent,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("10:00 AM");
  const [endTime, setEndTime] = useState("11:00 AM");
  const [category, setCategory] = useState<string>("meeting");

  const [aiLoadingTitle, setAiLoadingTitle] = useState(false);
  const [aiLoadingDesc, setAiLoadingDesc]   = useState(false);

  const handleAiTitle = async () => {
    setAiLoadingTitle(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "event_title", prompt: title || category || "sprint review" }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.result) setTitle(data.result);
      }
    } catch (err) {
      console.warn("AI event title error:", err);
    } finally {
      setAiLoadingTitle(false);
    }
  };

  const handleAiDescription = async () => {
    setAiLoadingDesc(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "event_description", prompt: title || description || "project meeting" }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.result) setDescription(data.result);
      }
    } catch (err) {
      console.warn("AI event description error:", err);
    } finally {
      setAiLoadingDesc(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddEvent({
      id: `evt-${Date.now()}`,
      title: title.trim(),
      time: startTime,
      type: (category as any) || "meeting",
      description: description.trim(),
      date,
      startTime,
      endTime,
      category,
      attendees: ["Alex Rivera", "Irfan Tariq"],
    });

    setTitle("");
    setDescription("");
    onClose();
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Schedule New Meeting / Event">
      <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="font-bold text-slate-700 block">Event Title</label>
            <button
              type="button"
              onClick={handleAiTitle}
              disabled={aiLoadingTitle}
              className="px-2 py-0.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-[#006858] text-[9px] font-extrabold flex items-center gap-1 border border-emerald-200"
            >
              <Wand2 className={`w-2.5 h-2.5 ${aiLoadingTitle ? "animate-spin" : ""}`} />
              {aiLoadingTitle ? "Suggesting..." : "✨ AI Suggest Title"}
            </button>
          </div>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Architecture Sync"
            className="w-full bg-slate-50 text-slate-900 font-bold p-2.5 rounded-xl border border-slate-200 focus:border-[#006858]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-50 text-slate-900 font-bold p-2.5 rounded-xl border border-slate-200 focus:border-[#006858]"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-50 text-slate-900 font-bold p-2.5 rounded-xl border border-slate-200 focus:border-[#006858]"
            >
              <option value="meeting">Meeting</option>
              <option value="demo">Demo</option>
              <option value="sync">Sync</option>
              <option value="deadline">Deadline</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Start Time</label>
            <input
              type="text"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              placeholder="10:00 AM"
              className="w-full bg-slate-50 text-slate-900 font-bold p-2.5 rounded-xl border border-slate-200 focus:border-[#006858]"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">End Time</label>
            <input
              type="text"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              placeholder="11:00 AM"
              className="w-full bg-slate-50 text-slate-900 font-bold p-2.5 rounded-xl border border-slate-200 focus:border-[#006858]"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="font-bold text-slate-700 block">Description (Optional)</label>
            <button
              type="button"
              onClick={handleAiDescription}
              disabled={aiLoadingDesc}
              className="px-2 py-0.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-[#006858] text-[9px] font-extrabold flex items-center gap-1 border border-emerald-200"
            >
              <Sparkles className={`w-2.5 h-2.5 ${aiLoadingDesc ? "animate-spin" : ""}`} />
              {aiLoadingDesc ? "Drafting..." : "✨ AI Draft Agenda"}
            </button>
          </div>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Agenda or meeting link..."
            className="w-full bg-slate-50 text-slate-900 font-bold p-2.5 rounded-xl border border-slate-200 focus:border-[#006858] resize-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="bg-[#006858] hover:bg-[#005245]">
            Save Event
          </Button>
        </div>
      </form>
    </ModalWrapper>
  );
};
