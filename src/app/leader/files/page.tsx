"use client";

import React from "react";
import { LeaderLayout } from "@/components/layout/LeaderLayout";
import { FilesView } from "@/components/views/FilesView";

export default function LeaderFilesPage() {
  return (
    <LeaderLayout>
      <FilesView />
    </LeaderLayout>
  );
}
