"use client";

import React from "react";
import { LeaderLayout } from "@/components/layout/LeaderLayout";
import { SettingsView } from "@/components/views/SettingsView";

export default function LeaderSettingsPage() {
  return (
    <LeaderLayout>
      <SettingsView />
    </LeaderLayout>
  );
}
