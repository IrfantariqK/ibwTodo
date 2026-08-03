"use client";

import React from "react";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { FilesView } from "@/components/views/FilesView";

export default function FilesPage() {
  return (
    <WorkspaceShell>
      <FilesView />
    </WorkspaceShell>
  );
}
