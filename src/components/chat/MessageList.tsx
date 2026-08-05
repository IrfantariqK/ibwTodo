"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatMessage } from "@/types";
import { Play, Pause, Mic, Volume2, Check, CheckCheck, Clock, AlertTriangle, ArrowDown, Copy, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageListProps {
  messages: ChatMessage[];
  currentUserEmail?: string;
  onRetryMessage?: (msg: ChatMessage) => void;
}

const VoiceNotePlayer: React.FC<{ audioUrl: string; duration?: string; isOutgoing?: boolean }> = ({
  audioUrl,
  duration = "0:05",
  isOutgoing = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

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
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-2xl border shadow-xs max-w-xs sm:max-w-sm transition-all",
        isOutgoing
          ? "bg-white/10 text-white border-white/20"
          : "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200/80"
      )}
    >
      <button
        type="button"
        onClick={togglePlay}
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 shadow-sm cursor-pointer",
          isOutgoing
            ? "bg-white text-[#006858] hover:bg-slate-100"
            : "bg-[#006858] hover:bg-[#005245] text-white"
        )}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>

      {/* Waveform Graphic */}
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-1">
          <Mic className={cn("w-3 h-3", isOutgoing ? "text-emerald-200" : "text-[#006858]")} />
          <span className={cn("text-[10px] font-black uppercase tracking-wider", isOutgoing ? "text-emerald-100" : "text-[#006858]")}>
            Voice Note
          </span>
          <span className={cn("text-[10px] font-mono font-bold ml-auto", isOutgoing ? "text-emerald-100" : "text-slate-500")}>
            {duration}
          </span>
        </div>

        <div className="flex items-center gap-1 h-4">
          {[40, 70, 30, 90, 50, 80, 40, 100, 60, 30, 75, 45, 85, 35, 65, 95, 40, 60].map((h, i) => (
            <div
              key={i}
              className={cn(
                "w-1 rounded-full transition-all duration-300",
                isOutgoing
                  ? isPlaying ? "bg-white animate-pulse" : "bg-emerald-200/60"
                  : isPlaying ? "bg-[#006858] animate-pulse" : "bg-emerald-300"
              )}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const CodeSnippetBlock: React.FC<{ code: string; isOutgoing?: boolean }> = ({ code, isOutgoing }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 text-emerald-400 font-mono text-xs shadow-inner">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/80 border-b border-slate-800 text-[10px] text-slate-400 font-sans">
        <span>Code Snippet</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[#006858] hover:text-emerald-300 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Copied!
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" /> Copy
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto whitespace-pre-wrap leading-relaxed">{code}</pre>
    </div>
  );
};

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserEmail = "",
  onRetryMessage,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevMessagesLength = useRef(messages.length);

  const userEmailNormalized = (currentUserEmail || "").toLowerCase().trim();

  // Scroll listener to manage auto-scroll state
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    if (isAtBottom) {
      setIsScrolledUp(false);
      setUnreadCount(0);
    } else {
      setIsScrolledUp(true);
    }
  };

  const scrollToBottom = (smooth = true) => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
      setIsScrolledUp(false);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      if (!isScrolledUp) {
        scrollToBottom(true);
      } else {
        setUnreadCount((prev) => prev + (messages.length - prevMessagesLength.current));
      }
    } else {
      // Initial mount or complete refresh
      scrollToBottom(false);
    }
    prevMessagesLength.current = messages.length;
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white space-y-3">
        <div className="w-14 h-14 rounded-3xl bg-emerald-50 text-[#006858] flex items-center justify-center shadow-inner">
          <Volume2 className="w-7 h-7" />
        </div>
        <h4 className="font-extrabold text-slate-800 text-sm">No Messages Yet</h4>
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
          Be the first to post a message or send a voice note in this conversation.
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex-1 flex flex-col min-h-0 bg-slate-50/50">
      {/* Scrollable Message Container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 font-sans"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => {
            const senderName = typeof msg.sender === "object" ? msg.sender.name : msg.sender;
            const senderEmail = typeof msg.sender === "object" ? msg.sender.email || "" : "";
            const senderAvatar =
              typeof msg.sender === "object"
                ? msg.sender.avatar || (msg as any).avatar
                : (msg as any).avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(senderName || "User")}`;
            const senderRole = typeof msg.sender === "object" ? msg.sender.role : "Member";

            const isOutgoing =
              Boolean(userEmailNormalized) &&
              (senderEmail.toLowerCase().trim() === userEmailNormalized ||
                senderName.toLowerCase().includes("leader") ||
                senderName.toLowerCase().includes("you"));

            const isPending = msg.status === "pending";
            const isFailed = msg.status === "failed";
            const isDelivered = msg.status === "delivered" || msg.status === "sent" || (!msg.status && !isPending && !isFailed);

            const uniqueKey = (msg.id || msg._id || "msg").toString() + "-" + idx;

            return (
              <motion.div
                key={uniqueKey}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={cn(
                  "flex items-end gap-2.5 max-w-[85%] sm:max-w-[75%]",
                  isOutgoing ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                {/* Avatar */}
                <img
                  src={
                    senderAvatar ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(senderName || "User")}`
                  }
                  alt={senderName}
                  className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200 shadow-2xs mb-1 bg-white"
                />

                <div className={cn("flex flex-col space-y-1", isOutgoing ? "items-end" : "items-start")}>
                  {/* Header metadata */}
                  <div className="flex items-center gap-1.5 px-1 text-[10px]">
                    <span className="font-extrabold text-slate-700">{senderName}</span>
                    {senderRole && (
                      <span className="font-bold text-[#006858] bg-emerald-50 px-1.5 py-0.5 rounded text-[9px]">
                        {senderRole}
                      </span>
                    )}
                    <span className="text-slate-400 font-mono">
                      {msg.timestamp || msg.time || "Just now"}
                    </span>
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={cn(
                      "p-3.5 rounded-2xl shadow-xs transition-all text-xs font-medium leading-relaxed break-words",
                      isOutgoing
                        ? "bg-[#006858] text-white rounded-br-none"
                        : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-none",
                      isPending && "opacity-70 animate-pulse",
                      isFailed && "bg-rose-50 text-rose-900 border-rose-200"
                    )}
                  >
                    {/* Content rendering */}
                    {msg.isVoiceNote && msg.audioUrl ? (
                      <VoiceNotePlayer audioUrl={msg.audioUrl} duration={msg.audioDuration} isOutgoing={isOutgoing} />
                    ) : msg.isCodeSnippet ? (
                      <CodeSnippetBlock code={msg.content} isOutgoing={isOutgoing} />
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>

                  {/* Status indicators for outgoing messages */}
                  {isOutgoing && (
                    <div className="flex items-center gap-1 text-[9px] px-1 font-bold">
                      {isPending && (
                        <span className="text-amber-600 flex items-center gap-1">
                          <Clock className="w-3 h-3 animate-spin" /> Sending...
                        </span>
                      )}
                      {isFailed && (
                        <button
                          onClick={() => onRetryMessage && onRetryMessage(msg)}
                          className="text-rose-600 hover:underline flex items-center gap-1 cursor-pointer font-extrabold"
                        >
                          <AlertTriangle className="w-3 h-3" /> Sending failed · Retry
                        </button>
                      )}
                      {!isPending && !isFailed && (
                        msg.seen || msg.status === "seen" ? (
                          <span className="text-[#006858] flex items-center gap-1 font-black">
                            <CheckCheck className="w-3.5 h-3.5 text-[#006858]" /> Seen
                          </span>
                        ) : msg.status === "sent" ? (
                          <span className="text-slate-400 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Sent
                          </span>
                        ) : (
                          <span className="text-slate-500 flex items-center gap-1">
                            <CheckCheck className="w-3 h-3 text-slate-400" /> Delivered
                          </span>
                        )
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* Floating "New Messages ↓" Scroll Indicator */}
      <AnimatePresence>
        {isScrolledUp && (
          <motion.button
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            onClick={() => scrollToBottom(true)}
            className="absolute bottom-4 right-6 px-3.5 py-1.5 rounded-full bg-[#006858] text-white text-xs font-extrabold shadow-lg hover:bg-[#005245] transition-all flex items-center gap-1.5 cursor-pointer z-10 border border-emerald-400/40"
          >
            <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
            <span>New Messages</span>
            {unreadCount > 0 && (
              <span className="ml-1 bg-white text-[#006858] px-1.5 py-0.5 rounded-full text-[10px] font-black">
                {unreadCount}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

