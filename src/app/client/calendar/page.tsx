"use client";

import React from "react";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { CalendarView } from "@/components/calendar/CalendarView";

export default function ClientCalendarPage() {
  return (
    <ClientLayout>
      <CalendarView />
    </ClientLayout>
  );
}
