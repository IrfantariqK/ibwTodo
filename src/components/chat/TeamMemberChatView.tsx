import React, { useState, useEffect, useCallback } from "react";
import { ChannelList } from "./ChannelList";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { ChatMessage, ProjectMember } from "@/types";
import { Users, Menu, X } from "lucide-react";
import { useProject } from "@/context/ProjectContext";
import { Skeleton } from "@/components/ui/Skeleton";
import { playSendSound } from "@/lib/sound";
import { useChatSocket } from "@/hooks/useChatSocket";
import { cn } from "@/lib/utils";

export const TeamMemberChatView: React.FC = () => {
  const { activeProject } = useProject();
  const [activeChannel, setActiveChannel] = useState("general");
  const [activeRecipient, setActiveRecipient] = useState<ProjectMember | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const localTypingTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const [currentUser, setCurrentUser] = useState({
    name: "Team Engineer",
    email: "member@ibwtech.com",
    role: "Team Developer",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Member",
  });

  useEffect(() => {
    const saved = localStorage.getItem("taskconnect_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCurrentUser({
          name: parsed.name || "Team Engineer",
          email: parsed.email || "member@ibwtech.com",
          role: "Team Member",
          avatar:
            parsed.avatar ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
              parsed.email || "Member"
            )}`,
        });
      } catch (e) {}
    }
  }, []);

  const handleSocketNewMessage = useCallback((newMsg: ChatMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === newMsg.id || (m._id && m._id === newMsg._id))) {
        return prev;
      }
      return [...prev, newMsg];
    });
  }, []);

  const handleSocketMessageEdited = useCallback((editedMsg: ChatMessage) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === editedMsg.id || (m._id && m._id === editedMsg._id)
          ? { ...m, content: editedMsg.content, isEdited: true }
          : m
      )
    );
  }, []);

  const handleSocketMessageDeleted = useCallback(
    (payload: { messageId: string; mode: "me" | "everyone"; userEmail?: string; message?: ChatMessage }) => {
      setMessages((prev) => {
        if (payload.mode === "everyone") {
          return prev.map((m) =>
            m.id === payload.messageId || (m._id && m._id === payload.messageId)
              ? { ...m, content: "This message was deleted", isDeletedForEveryone: true, isEdited: false }
              : m
          );
        } else {
          return prev.filter((m) => m.id !== payload.messageId && m._id !== payload.messageId);
        }
      });
    },
    []
  );

  const handleSocketMessagesSeen = useCallback(() => {
    setMessages((prev) =>
      prev.map((m) => ({
        ...m,
        seen: true,
        status: "seen",
      }))
    );
  }, []);

  const handleSocketTypingState = useCallback((user: string | null) => {
    setTypingUser(user);
  }, []);

  const { sendTyping, markAsSeen } = useChatSocket({
    userEmail: currentUser.email,
    userName: currentUser.name,
    channelId: activeRecipient ? "" : activeChannel,
    recipientId: activeRecipient ? activeRecipient.email : "",
    onNewMessage: handleSocketNewMessage,
    onMessageEdited: handleSocketMessageEdited,
    onMessageDeleted: handleSocketMessageDeleted,
    onMessagesSeen: handleSocketMessagesSeen,
    onTypingStateChange: handleSocketTypingState,
  });

  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      const res = await fetch("/api/chat", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId,
          content: newContent,
          userEmail: currentUser.email,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        handleSocketMessageEdited(data);
      }
    } catch (err) {
      console.warn("Failed to edit message:", err);
    }
  };

  const handleDeleteMessage = async (messageId: string, mode: "me" | "everyone") => {
    try {
      const res = await fetch(
        `/api/chat?messageId=${encodeURIComponent(messageId)}&mode=${mode}&userEmail=${encodeURIComponent(currentUser.email)}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        handleSocketMessageDeleted({ messageId, mode, userEmail: currentUser.email });
      }
    } catch (err) {
      console.warn("Failed to delete message:", err);
    }
  };

  const activeRecipientEmail = activeRecipient?.email || "";
  const activeProjectId = activeProject ? (activeProject.id || activeProject._id || "") : "";

  const fetchMessages = async (isInitial = false) => {
    if (isInitial || messages.length === 0) {
      setLoading(true);
    }
    try {
      let url = `/api/chat?`;
      if (activeRecipientEmail) {
        url += `recipientId=${encodeURIComponent(activeRecipientEmail)}&senderEmail=${encodeURIComponent(currentUser.email)}`;
      } else {
        url += `channelId=${encodeURIComponent(activeChannel)}`;
      }
      if (activeProjectId) {
        url += `&projectId=${encodeURIComponent(activeProjectId)}`;
      }

      const res = await fetch(url, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (res.ok) {
        const data = await res.json();
        const seenIds = new Set<string>();
        const uniqueMessages = (data || []).filter((m: ChatMessage) => {
          const idKey = (m.id || m._id || "").toString();
          if (idKey && seenIds.has(idKey)) return false;
          if (idKey) seenIds.add(idKey);
          return true;
        });
        setMessages(uniqueMessages);
        markAsSeen();
      }
    } catch (err) {
      console.warn("Failed to fetch chat messages:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages(true);
  }, [activeChannel, activeRecipientEmail, activeProjectId]);

  const handleSelectChannel = (channelId: string, recipient?: ProjectMember) => {
    if (recipient) {
      setActiveRecipient(recipient);
      setActiveChannel(recipient.email);
    } else {
      setActiveRecipient(null);
      setActiveChannel(channelId);
    }
    setIsMobileSidebarOpen(false);
  };

  const handleSendMessage = async (content: string, isCode: boolean) => {
    sendTyping(false);
    const tempId = "temp-" + Date.now();
    const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const optimisticMsg: ChatMessage = {
      id: tempId,
      projectId: activeProject ? activeProject.id || activeProject._id : "",
      channelId: activeRecipient ? "" : activeChannel,
      recipientId: activeRecipient ? activeRecipient.email : "",
      sender: currentUser,
      content,
      isCodeSnippet: isCode,
      timestamp: nowStr,
      status: "pending",
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(optimisticMsg),
      });

      if (res.ok) {
        const createdMsg = await res.json();
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...createdMsg, status: "delivered" } : m))
        );
        playSendSound();
      } else {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, status: "failed" } : m))
        );
      }
    } catch (err) {
      console.error("Failed to send message via API:", err);
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: "failed" } : m))
      );
    }
  };

  const handleSendVoiceNote = async (audioUrl: string, duration: string) => {
    sendTyping(false);
    const tempId = "temp-vn-" + Date.now();
    const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const optimisticMsg: ChatMessage = {
      id: tempId,
      projectId: activeProject ? activeProject.id || activeProject._id : "",
      channelId: activeRecipient ? "" : activeChannel,
      recipientId: activeRecipient ? activeRecipient.email : "",
      sender: currentUser,
      content: "🎤 Voice Note Recorded",
      isVoiceNote: true,
      audioUrl,
      audioDuration: duration,
      timestamp: nowStr,
      status: "pending",
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(optimisticMsg),
      });

      if (res.ok) {
        const createdMsg = await res.json();
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...createdMsg, status: "delivered" } : m))
        );
        playSendSound();
      } else {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, status: "failed" } : m))
        );
      }
    } catch (err) {
      console.error("Failed to upload voice note:", err);
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: "failed" } : m))
      );
    }
  };

  const handleRetryMessage = async (failedMsg: ChatMessage) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === failedMsg.id ? { ...m, status: "pending" } : m))
    );

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(failedMsg),
      });

      if (res.ok) {
        const createdMsg = await res.json();
        setMessages((prev) =>
          prev.map((m) => (m.id === failedMsg.id ? { ...createdMsg, status: "delivered" } : m))
        );
        playSendSound();
      } else {
        setMessages((prev) =>
          prev.map((m) => (m.id === failedMsg.id ? { ...m, status: "failed" } : m))
        );
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) => (m.id === failedMsg.id ? { ...m, status: "failed" } : m))
      );
    }
  };

  const handleLocalTyping = () => {
    sendTyping(true);
    if (localTypingTimerRef.current) clearTimeout(localTypingTimerRef.current);
    localTypingTimerRef.current = setTimeout(() => {
      sendTyping(false);
    }, 2500);
  };

  return (
    <div className="relative flex h-[calc(100vh-5rem)] bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden font-sans">
      {/* Sidebar Channel List (Desktop & Mobile Drawer) */}
      <div
        className={cn(
          "w-full md:w-80 border-r border-slate-200/90 bg-slate-50/50 flex-col shrink-0 transition-all duration-300 z-20",
          isMobileSidebarOpen ? "flex absolute inset-0 bg-white" : "hidden md:flex"
        )}
      >
        <div className="md:hidden p-3 border-b border-slate-200 flex justify-between items-center bg-white">
          <span className="font-bold text-xs text-slate-800">Channels & Direct Messages</span>
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <ChannelList activeChannel={activeChannel} onSelectChannel={handleSelectChannel} />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col justify-between bg-white min-w-0">
        {/* Team Member Chat Header */}
        <div className="h-16 px-4 sm:px-6 border-b border-slate-100 flex items-center justify-between bg-[#FCFDFE] shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            {activeRecipient ? (
              <div className="relative">
                <img
                  src={activeRecipient.avatar}
                  alt={activeRecipient.name}
                  className="w-9 h-9 rounded-xl object-cover ring-2 ring-[#006858] bg-emerald-50"
                />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute -bottom-0.5 -right-0.5 ring-2 ring-white" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
            )}

            <div>
              <h3 className="font-extrabold text-sm text-[#0F172A] flex items-center gap-2">
                {activeRecipient ? activeRecipient.name : `#${activeChannel}`}
                {activeRecipient && (
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    Direct Contact
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400 font-medium truncate max-w-xs sm:max-w-md">
                {activeRecipient
                  ? `${activeRecipient.role} • ${activeRecipient.email}`
                  : `Team Member Channel · ${activeProject ? activeProject.name : "Assigned Workspace"}`}
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-black text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> Team Collaboration Workspace
            </span>
          </div>
        </div>

        {/* Message Trajectory List */}
        {loading ? (
          <div className="flex-1 p-6 space-y-4 overflow-y-auto">
            <div className="flex items-start gap-3">
              <Skeleton className="w-8 h-8 rounded-full shrink-0" />
              <div className="space-y-2 max-w-sm">
                <Skeleton className="w-24 h-3 rounded-md" />
                <Skeleton className="w-64 h-12 rounded-2xl" />
              </div>
            </div>
            <div className="flex items-start gap-3 justify-end">
              <div className="space-y-2 max-w-sm flex flex-col items-end">
                <Skeleton className="w-20 h-3 rounded-md" />
                <Skeleton className="w-48 h-10 rounded-2xl" />
              </div>
              <Skeleton className="w-8 h-8 rounded-full shrink-0" />
            </div>
          </div>
        ) : (
          <MessageList
            messages={messages}
            currentUserEmail={currentUser.email}
            onRetryMessage={handleRetryMessage}
            onEditMessage={handleEditMessage}
            onDeleteMessage={handleDeleteMessage}
          />
        )}

        {/* Peer Typing Indicator Bar */}
        {typingUser && (
          <div className="px-6 py-1 bg-[#006858]/5 text-[10px] font-bold text-[#006858] flex items-center gap-2 border-t border-slate-100">
            <span className="flex gap-0.5">
              <span className="w-1.5 h-1.5 bg-[#006858] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 bg-[#006858] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 bg-[#006858] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </span>
            <span>{typingUser} is typing...</span>
          </div>
        )}

        {/* Message Input */}
        <MessageInput
          onSendMessage={handleSendMessage}
          onSendVoiceNote={handleSendVoiceNote}
          onTyping={handleLocalTyping}
        />
      </div>
    </div>
  );
};
