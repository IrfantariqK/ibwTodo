"use client";

import React from "react";
import { MemberLayout } from "@/components/layout/MemberLayout";
import { TeamMemberChatView } from "@/components/chat/TeamMemberChatView";

export default function MemberMessagesPage() {
  return (
    <MemberLayout>
      <TeamMemberChatView />
    </MemberLayout>
  );
}
