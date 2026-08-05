"use client";

import React from "react";
import { MemberLayout } from "@/components/layout/MemberLayout";
import { FilesView } from "@/components/views/FilesView";

export default function MemberFilesPage() {
  return (
    <MemberLayout>
      <FilesView />
    </MemberLayout>
  );
}
