"use client";

import React from "react";
import { LeaderLayout } from "@/components/layout/LeaderLayout";
import { TeamView } from "@/components/views/TeamView";

export default function LeaderTeamPage() {
  return (
    <LeaderLayout>
      <TeamView />
    </LeaderLayout>
  );
}
