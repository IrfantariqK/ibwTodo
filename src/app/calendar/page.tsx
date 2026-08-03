"use client";

import React from "react";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { CalendarView } from "@/components/calendar/CalendarView";

export default function CalendarPage() {
  return (
    <WorkspaceShell>
      <CalendarView />
    </WorkspaceShell>
  );
}
