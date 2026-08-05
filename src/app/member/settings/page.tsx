"use client";

import React from "react";
import { MemberLayout } from "@/components/layout/MemberLayout";
import { SettingsView } from "@/components/views/SettingsView";

export default function MemberSettingsPage() {
  return (
    <MemberLayout>
      <SettingsView />
    </MemberLayout>
  );
}
