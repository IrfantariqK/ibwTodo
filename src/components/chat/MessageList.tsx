"use client";

import React, { useState, useRef } from "react";
import { ChatMessage } from "@/types";
import { Play, Pause, Mic, Volume2 } from "lucide-react";

interface MessageListProps {
  messages: ChatMessage[];
}

const VoiceNotePlayer: React.FC<{ audioUrl: string; duration?: string }> = ({
  audioUrl,
  duration = "0:05",
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 shadow-xs max-w-sm">
      <button
        type="button"
        onClick={togglePlay}
        className="w-9 h-9 rounded-xl bg-[#006858] hover:bg-[#005245] text-white flex items-center justify-center transition-all shrink-0 shadow-sm cursor-pointer"
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>

      {/* Waveform Graphic */}
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-1">
          <Mic className="w-3 h-3 text-[#006858]" />
          <span className="text-[10px] font-black uppercase text-[#006858] tracking-wider">Voice Note</span>
          <span className="text-[10px] font-mono font-bold text-slate-500 ml-auto">{duration}</span>
        </div>

        <div className="flex items-center gap-1 h-4">
          {[40, 70, 30, 90, 50, 80, 40, 100, 60, 30, 75, 45, 85, 35, 65, 95, 40, 60].map((h, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-300 ${
                isPlaying ? "bg-[#006858] animate-pulse" : "bg-emerald-300"
              }`}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#006858] flex items-center justify-center">
          <Volume2 className="w-6 h-6" />
        </div>
        <h4 className="font-extrabold text-slate-800 text-sm">No Messages Yet</h4>
        <p className="text-xs text-slate-400 max-w-xs">
          Be the first to post a message or send a voice note in this conversation.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4 font-sans bg-white">
      {messages.map((msg) => {
        const senderName = typeof msg.sender === "object" ? msg.sender.name : msg.sender;
        const senderAvatar =
          typeof msg.sender === "object"
            ? msg.sender.avatar || (msg as any).avatar
            : (msg as any).avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(senderName || "User")}`;
        const senderRole = typeof msg.sender === "object" ? msg.sender.role : "Member";

        return (
          <div
            key={msg.id || msg._id}
            className="flex items-start gap-3.5 p-3.5 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
          >
            <img
              src={
                senderAvatar ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(senderName || "User")}`
              }
              alt={senderName}
              className="w-9 h-9 rounded-xl object-cover ring-2 ring-[#006858] mt-0.5 shrink-0 bg-emerald-50"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-extrabold text-xs text-[#0F172A]">{senderName}</span>
                <span className="text-[10px] font-bold text-[#006858] bg-emerald-50 px-2 py-0.5 rounded-md">
                  {senderRole}
                </span>
                <span className="text-[10px] text-slate-400 font-mono ml-auto">
                  {msg.timestamp || msg.time}
                </span>
              </div>

              {/* Voice Note rendering */}
              {msg.isVoiceNote && msg.audioUrl ? (
                <VoiceNotePlayer audioUrl={msg.audioUrl} duration={msg.audioDuration} />
              ) : msg.isCodeSnippet ? (
                <div className="bg-slate-900 text-emerald-400 font-mono text-xs p-3.5 rounded-2xl overflow-x-auto shadow-inner border border-slate-800">
                  <pre>{msg.content}</pre>
                </div>
              ) : (
                <p className="text-xs text-slate-700 font-medium leading-relaxed">
                  {msg.content}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
