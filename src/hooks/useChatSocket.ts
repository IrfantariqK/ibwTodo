"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ChatMessage } from "@/types";

interface UseChatSocketOptions {
  userEmail: string;
  userName: string;
  channelId?: string;
  recipientId?: string;
  onNewMessage?: (message: ChatMessage) => void;
  onMessageEdited?: (message: ChatMessage) => void;
  onMessageDeleted?: (payload: { messageId: string; mode: "me" | "everyone"; userEmail?: string; message?: ChatMessage }) => void;
  onMessagesSeen?: (payload: { channelId: string; recipientId: string; userEmail: string }) => void;
  onTypingStateChange?: (typingUser: string | null) => void;
}

export function useChatSocket({
  userEmail,
  userName,
  channelId = "general",
  recipientId = "",
  onNewMessage,
  onMessageEdited,
  onMessageDeleted,
  onMessagesSeen,
  onTypingStateChange,
}: UseChatSocketOptions) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Send typing event to backend
  const sendTyping = useCallback(
    (isTyping: boolean) => {
      try {
        fetch("/api/chat/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "typing",
            userName,
            userEmail,
            channelId,
            recipientId,
            isTyping,
          }),
        }).catch(() => {});
      } catch (e) {}
    },
    [userName, userEmail, channelId, recipientId]
  );

  // Send read receipt to backend
  const markAsSeen = useCallback(
    (messageIds?: string[]) => {
      try {
        fetch("/api/chat/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messageIds,
            channelId,
            recipientId,
            userEmail,
            userName,
          }),
        }).catch(() => {});
      } catch (e) {}
    },
    [userEmail, userName, channelId, recipientId]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const streamUrl = userEmail
      ? `/api/chat/stream?email=${encodeURIComponent(userEmail)}`
      : "/api/chat/stream";
    const eventSource = new EventSource(streamUrl);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (!data || !data.type) return;

        if (data.type === "message:new" && data.payload) {
          const msg: ChatMessage = data.payload;
          const isCurrentScope = recipientId
            ? msg.recipientId === userEmail || msg.sender?.email === recipientId
            : msg.channelId === channelId;

          if (isCurrentScope && onNewMessage) {
            onNewMessage(msg);
          }
        }

        if (data.type === "message:edited" && data.payload) {
          if (onMessageEdited) {
            onMessageEdited(data.payload);
          }
        }

        if (data.type === "message:deleted" && data.payload) {
          if (onMessageDeleted) {
            onMessageDeleted(data.payload);
          }
        }

        if (data.type === "typing" && data.payload) {
          const { user, userEmail: senderEmail, channelId: tChannel, recipientId: tRecipient, isTyping } = data.payload;

          if (senderEmail && senderEmail.toLowerCase() === userEmail.toLowerCase()) return;

          const isMatchingScope = recipientId
            ? tRecipient === userEmail || senderEmail === recipientId
            : tChannel === channelId;

          if (isMatchingScope && onTypingStateChange) {
            if (isTyping) {
              onTypingStateChange(user);
              if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
              typingTimerRef.current = setTimeout(() => {
                onTypingStateChange(null);
              }, 3000);
            } else {
              onTypingStateChange(null);
            }
          }
        }

        if (data.type === "message:seen" && data.payload) {
          if (onMessagesSeen) {
            onMessagesSeen(data.payload);
          }
        }
      } catch (err) {
        console.warn("Error parsing SSE event:", err);
      }
    };

    eventSource.onerror = () => {
      if (eventSource.readyState === EventSource.CLOSED) {
        // SSE closed
      }
    };

    return () => {
      eventSource.close();
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [channelId, recipientId, userEmail, onNewMessage, onMessageEdited, onMessageDeleted, onMessagesSeen, onTypingStateChange]);

  return {
    sendTyping,
    markAsSeen,
  };
}
