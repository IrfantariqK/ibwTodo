"use client";

import React, { useState, useEffect } from "react";
import { ChannelList } from "./ChannelList";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { ChatMessage, ProjectMember } from "@/types";
import { Hash, User, Sparkles, Building } from "lucide-react";
import { useProject } from "@/context/ProjectContext";

export const ChatView: React.FC = () => {
  const { activeProject } = useProject();
  const [activeChannel, setActiveChannel] = useState("general");
  const [activeRecipient, setActiveRecipient] = useState<ProjectMember | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  // Current logged in user details from session
  const [currentUser, setCurrentUser] = useState({
    name: "Irfan Tariq",
    email: "irfan@ibwtech.com",
    role: "Lead Developer",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Irfan",
  });

  useEffect(() => {
    const saved = localStorage.getItem("taskconnect_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCurrentUser({
          name: parsed.name || "Irfan Tariq",
          email: parsed.email || "irfan@ibwtech.com",
          role: "Team Member",
          avatar:
            parsed.avatar ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
              parsed.email || "Irfan"
            )}`,
        });
      } catch (e) {}
    }
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      let url = `/api/chat?`;
      if (activeRecipient) {
        url += `recipientId=${encodeURIComponent(activeRecipient.email)}`;
      } else {
        url += `channelId=${encodeURIComponent(activeChannel)}`;
      }
      if (activeProject) {
        const pId = activeProject.id || activeProject._id;
        if (pId) url += `&projectId=${encodeURIComponent(pId)}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.warn("Failed to fetch chat messages:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [activeChannel, activeRecipient, activeProject]);

  const handleSelectChannel = (channelId: string, recipient?: ProjectMember) => {
    if (recipient) {
      setActiveRecipient(recipient);
      setActiveChannel(recipient.email);
    } else {
      setActiveRecipient(null);
      setActiveChannel(channelId);
    }
  };

  const handleSendMessage = async (content: string, isCode: boolean) => {
    const payload = {
      projectId: activeProject ? activeProject.id || activeProject._id : "",
      channelId: activeRecipient ? "" : activeChannel,
      recipientId: activeRecipient ? activeRecipient.email : "",
      sender: currentUser,
      content,
      isCodeSnippet: isCode,
    };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchMessages();
      }
    } catch (err) {
      console.error("Error sending message to MongoDB:", err);
    }
  };

  const handleSendVoiceNote = async (audioUrl: string, duration: string) => {
    const payload = {
      projectId: activeProject ? activeProject.id || activeProject._id : "",
      channelId: activeRecipient ? "" : activeChannel,
      recipientId: activeRecipient ? activeRecipient.email : "",
      sender: currentUser,
      content: "🎤 Voice Note",
      isVoiceNote: true,
      audioUrl,
      audioDuration: duration,
    };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchMessages();
      }
    } catch (err) {
      console.error("Error sending voice note to MongoDB:", err);
    }
  };

  return (
    <div className="flex gap-5 h-[calc(100vh-160px)] max-w-7xl mx-auto font-sans">
      {/* Left Channels & Project DMs Sidebar */}
      <ChannelList activeChannel={activeChannel} onSelectChannel={handleSelectChannel} />

      {/* Right Main Chat Window */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-200/90 flex flex-col justify-between overflow-hidden shadow-sm">
        {/* Chat Header Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white backdrop-blur-md">
          <div className="flex items-center gap-3">
            {activeRecipient ? (
              <div className="relative">
                <img
                  src={activeRecipient.avatar}
                  alt={activeRecipient.name}
                  className="w-10 h-10 rounded-2xl object-cover ring-2 ring-[#006858] bg-emerald-50"
                />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute -bottom-0.5 -right-0.5 ring-2 ring-white" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-[#006858]">
                <Hash className="w-5 h-5" />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 text-sm">
                  {activeRecipient ? activeRecipient.name : `#${activeChannel}`}
                </h3>
                {activeRecipient && (
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-[#006858]">
                    {activeRecipient.type === "client" ? "Client" : "Team Member"}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium">
                {activeRecipient
                  ? `${activeRecipient.role} · Direct Message`
                  : `Real-time channel · ${activeProject ? activeProject.name : "All Projects"}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-[#006858] border border-emerald-200/80 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live MongoDB Sync
            </span>
          </div>
        </div>

        {/* Messages List Area */}
        <MessageList messages={messages} />

        {/* Message & Voice Note Input Area */}
        <MessageInput onSendMessage={handleSendMessage} onSendVoiceNote={handleSendVoiceNote} />
      </div>
    </div>
  );
};
