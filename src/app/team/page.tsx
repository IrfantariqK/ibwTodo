"use client";

import React from "react";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { TeamView } from "@/components/views/TeamView";

export default function TeamPage() {
  return (
    <WorkspaceShell>
      <TeamView />
    </WorkspaceShell>
  );
}
