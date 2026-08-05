"use client";

import React from "react";
import { MemberLayout } from "@/components/layout/MemberLayout";
import { CallsView } from "@/components/views/CallsView";

export default function MemberCallsPage() {
  return (
    <MemberLayout>
      <CallsView />
    </MemberLayout>
  );
}
