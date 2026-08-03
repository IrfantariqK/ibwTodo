"use client";

import React from "react";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { SettingsView } from "@/components/views/SettingsView";

export default function SettingsPage() {
  return (
    <WorkspaceShell>
      <SettingsView />
    </WorkspaceShell>
  );
}
