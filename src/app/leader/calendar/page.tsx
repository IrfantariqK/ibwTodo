"use client";

import React from "react";
import { LeaderLayout } from "@/components/layout/LeaderLayout";
import { CalendarView } from "@/components/calendar/CalendarView";

export default function LeaderCalendarPage() {
  return (
    <LeaderLayout>
      <CalendarView />
    </LeaderLayout>
  );
}
