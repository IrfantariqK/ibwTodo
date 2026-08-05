"use client";

import React from "react";
import { useProject } from "@/context/ProjectContext";
import { LeaderChatView } from "./LeaderChatView";
import { ClientChatView } from "./ClientChatView";
import { TeamMemberChatView } from "./TeamMemberChatView";

export const ChatView: React.FC = () => {
  const { isLeader, isClient, isTeam } = useProject();

  if (isClient) {
    return <ClientChatView />;
  }

  if (isTeam) {
    return <TeamMemberChatView />;
  }

  return <LeaderChatView />;
};
