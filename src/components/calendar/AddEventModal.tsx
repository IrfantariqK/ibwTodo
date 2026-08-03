"use client";

import React, { useState } from "react";
import { ModalWrapper } from "@/components/ui/ModalWrapper";
import { Button } from "@/components/ui/Button";
import { EventItem } from "@/types";

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
          <label className="font-bold text-slate-700 block mb-1">Event Title</label>
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
          <label className="font-bold text-slate-700 block mb-1">Description (Optional)</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Agenda or meeting link..."
            className="w-full bg-slate-50 text-slate-900 font-bold p-2.5 rounded-xl border border-slate-200 focus:border-[#006858]"
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
