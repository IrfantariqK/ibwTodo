"use client";

import React from "react";
import { LeaderLayout } from "@/components/layout/LeaderLayout";
import { CallsView } from "@/components/views/CallsView";

export default function LeaderCallsPage() {
  return (
    <LeaderLayout>
      <CallsView />
    </LeaderLayout>
  );
}
