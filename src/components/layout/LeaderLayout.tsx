"use client";

import React, { useEffect, useState } from "react";
import { LeaderSidebar } from "@/components/layout/LeaderSidebar";
import { LeaderHeader } from "@/components/layout/LeaderHeader";
import { CreateTaskModal } from "@/components/modals/CreateTaskModal";
import { CreateProjectModal } from "@/components/modals/CreateProjectModal";
import { TaskItem } from "@/types";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/Skeleton";
import { useProject } from "@/context/ProjectContext";

interface LeaderLayoutProps {
  children: React.ReactNode;
}

export const LeaderLayout: React.FC<LeaderLayoutProps> = ({ children }) => {
  const router = useRouter();
  const { refreshProjects } = useProject();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("taskconnect_user");
    if (!saved) {
      router.push("/leader/login");
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

      const isTeam =
        !isClient &&
        (typeLower === "team" ||
          roleLower.includes("team") ||
          roleLower.includes("developer") ||
          roleLower.includes("member") ||
          emailLower.includes("member"));

      if (isClient) {
        router.push("/client/dashboard");
        return;
      }
      if (isTeam) {
        router.push("/member/dashboard");
        return;
      }
      setAuthorized(true);
    } catch (e) {
      router.push("/leader/login");
    }
  }, [router]);

  const handleCreateTask = async (newTask: TaskItem) => {
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });
      window.location.reload();
    } catch (err) {
      console.warn("Error posting task to API:", err);
    }
  };

  const handleProjectCreated = async () => {
    await refreshProjects();
  };

  if (authorized === null) {
    return (
      <div className="flex min-h-screen bg-white items-center justify-center p-8">
        <div className="space-y-4 text-center max-w-sm">
          <Skeleton className="w-16 h-16 rounded-2xl mx-auto bg-purple-100" />
          <Skeleton className="w-48 h-5 rounded-lg mx-auto" />
          <Skeleton className="w-32 h-4 rounded-md mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white text-[#0F172A]">
      {/* Persistent Leader Sidebar */}
      <LeaderSidebar
        onOpenCreateTask={() => setIsCreateTaskOpen(true)}
        onOpenCreateProject={() => setIsCreateProjectOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <LeaderHeader
          onOpenQuickAdd={() => setIsCreateTaskOpen(true)}
          onOpenCreateProject={() => setIsCreateProjectOpen(true)}
        />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-white">
          {children}
        </main>
      </div>

      {/* Global Modals for Leader */}
      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        onCreateTask={handleCreateTask}
      />

      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
};
