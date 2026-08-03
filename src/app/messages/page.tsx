"use client";

import React from "react";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { ChatView } from "@/components/chat/ChatView";

export default function MessagesPage() {
  return (
    <WorkspaceShell>
      <div className="h-[calc(100vh-7rem)]">
        <ChatView />
      </div>
    </WorkspaceShell>
  );
}
