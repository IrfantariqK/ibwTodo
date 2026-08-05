"use client";

import React, { useEffect, useState } from "react";
import { ClientSidebar } from "@/components/layout/ClientSidebar";
import { ClientHeader } from "@/components/layout/ClientHeader";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/Skeleton";

interface ClientLayoutProps {
  children: React.ReactNode;
}

export const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("taskconnect_user");
    if (!saved) {
      router.push("/client/login");
      return;
    }
    try {
      const parsed = JSON.parse(saved);
      const roleLower = (parsed.role || "").toLowerCase();
      const typeLower = (parsed.type || "").toLowerCase();
      const emailLower = (parsed.email || "").toLowerCase();

      const isClient =
        typeLower === "client" ||
        roleLower.includes("client") ||
        emailLower.includes("client");

      if (!isClient) {
        // If logged in as leader or member, redirect appropriately
        if (typeLower === "team" || roleLower.includes("team") || roleLower.includes("member")) {
          router.push("/member/dashboard");
        } else {
          router.push("/dashboard");
        }
        return;
      }
      setAuthorized(true);
    } catch (e) {
      router.push("/client/login");
    }
  }, [router]);

  if (authorized === null) {
    return (
      <div className="flex min-h-screen bg-white items-center justify-center p-8">
        <div className="space-y-4 text-center max-w-sm">
          <Skeleton className="w-16 h-16 rounded-2xl mx-auto" />
          <Skeleton className="w-48 h-5 rounded-lg mx-auto" />
          <Skeleton className="w-32 h-4 rounded-md mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white text-[#0F172A]">
      {/* Persistent Client Sidebar */}
      <ClientSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <ClientHeader />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-white">
          {children}
        </main>
      </div>
    </div>
  );
};
