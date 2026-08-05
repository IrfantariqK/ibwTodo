"use client";

import React from "react";
import { MemberLayout } from "@/components/layout/MemberLayout";
import { CalendarView } from "@/components/calendar/CalendarView";

export default function MemberCalendarPage() {
  return (
    <MemberLayout>
      <CalendarView />
    </MemberLayout>
  );
}
