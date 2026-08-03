"use client";

import React from "react";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { CallsView } from "@/components/views/CallsView";

export default function CallsPage() {
  return (
    <WorkspaceShell>
      <CallsView />
    </WorkspaceShell>
  );
}
