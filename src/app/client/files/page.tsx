"use client";

import React from "react";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { FilesView } from "@/components/views/FilesView";

export default function ClientFilesPage() {
  return (
    <ClientLayout>
      <FilesView />
    </ClientLayout>
  );
}
