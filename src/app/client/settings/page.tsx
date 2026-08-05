"use client";

import React from "react";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { SettingsView } from "@/components/views/SettingsView";

export default function ClientSettingsPage() {
  return (
    <ClientLayout>
      <SettingsView />
    </ClientLayout>
  );
}
