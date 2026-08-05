"use client";

import React from "react";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { ClientChatView } from "@/components/chat/ClientChatView";

export default function ClientMessagesPage() {
  return (
    <ClientLayout>
      <ClientChatView />
    </ClientLayout>
  );
}
