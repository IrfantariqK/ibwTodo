"use client";

import React from "react";
import { LeaderLayout } from "@/components/layout/LeaderLayout";
import { LeaderChatView } from "@/components/chat/LeaderChatView";

export default function LeaderMessagesPage() {
  return (
    <LeaderLayout>
      <LeaderChatView />
    </LeaderLayout>
  );
}
