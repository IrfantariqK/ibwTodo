"use client";

import React from "react";
import { MemberLayout } from "@/components/layout/MemberLayout";
import { TeamView } from "@/components/views/TeamView";

export default function MemberTeamPage() {
  return (
    <MemberLayout>
      <TeamView />
    </MemberLayout>
  );
}
