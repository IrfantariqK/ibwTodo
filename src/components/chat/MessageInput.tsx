"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Code, Mic, Square, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  onSendMessage: (content: string, isCode: boolean) => void;
  onSendVoiceNote?: (audioUrl: string, duration: string) => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onSendVoiceNote,
}) => {
  const [content, setContent] = useState("");
  const [isCodeSnippet, setIsCodeSnippet] = useState(false);

  // Audio Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access denied or error:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecordingAndSend = () => {
    if (!mediaRecorderRef.current) return;

    if (timerRef.current) clearInterval(timerRef.current);

    const formatTime = (secs: number) => {
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      return `${m}:${s < 10 ? "0" : ""}${s}`;
    };
    const durationStr = formatTime(recordingSeconds);

    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Audio = reader.result as string;
        if (onSendVoiceNote) {
          onSendVoiceNote(base64Audio, durationStr);
        }
      };
      reader.readAsDataURL(audioBlob);

      // Stop stream tracks
      mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      setRecordingSeconds(0);
    };

    mediaRecorderRef.current.stop();
  };

  const cancelRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim()) return;
    onSendMessage(content, isCodeSnippet);
    setContent("");
    setIsCodeSnippet(false);
  };

  const formatSecs = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-200 rounded-b-3xl">
      {isRecording ? (
        /* Live Recording Overlay */
        <div className="flex items-center justify-between p-3 rounded-2xl bg-red-50 border border-red-200 animate-pulse">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
            <span className="text-xs font-black text-red-700 font-mono">
              Recording Voice Note... ({formatSecs(recordingSeconds)})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cancelRecording}
              className="p-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-all"
              title="Cancel recording"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={stopRecordingAndSend}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold transition-all shadow-md"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              Send Voice Note
            </button>
          </div>
        </div>
      ) : (
        /* Standard Message & Voice Note Input */
        <div className="relative">
          <textarea
            rows={isCodeSnippet ? 3 : 2}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={
              isCodeSnippet
                ? "Paste your code snippet here..."
                : "Type message or record voice note (Press Enter to send)..."
            }
            className={cn(
              "w-full bg-slate-50 text-xs text-slate-900 font-medium placeholder-slate-400 p-3 pr-32 rounded-2xl border border-slate-200 focus:border-[#006858] transition-all resize-none",
              isCodeSnippet && "font-mono text-[#006858] border-[#006858]/50"
            )}
          />

          <div className="absolute right-2 bottom-3 flex items-center gap-1.5">
            {/* Mic Record Button */}
            <button
              type="button"
              onClick={startRecording}
              className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#006858] transition-all cursor-pointer border border-emerald-200/60"
              title="Record Voice Note"
            >
              <Mic className="w-4 h-4 text-[#006858]" />
            </button>

            {/* Code Snippet Toggle */}
            <button
              type="button"
              onClick={() => setIsCodeSnippet(!isCodeSnippet)}
              className={cn(
                "p-2 rounded-xl text-slate-400 hover:text-slate-900 transition-colors cursor-pointer border border-slate-200/60 bg-slate-50",
                isCodeSnippet && "bg-[#006858] text-white border-[#006858]"
              )}
              title="Toggle Code Snippet Mode"
            >
              <Code className="w-4 h-4" />
            </button>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!content.trim()}
              className="p-2.5 rounded-xl bg-[#006858] hover:bg-[#005245] disabled:opacity-40 text-white transition-all shadow-sm cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </form>
  );
};
