"use client";

import React from "react";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { TeamView } from "@/components/views/TeamView";

export default function ClientTeamPage() {
  return (
    <ClientLayout>
      <TeamView />
    </ClientLayout>
  );
}
