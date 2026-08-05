"use client";

import React from "react";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { CallsView } from "@/components/views/CallsView";

export default function ClientCallsPage() {
  return (
    <ClientLayout>
      <CallsView />
    </ClientLayout>
  );
}
