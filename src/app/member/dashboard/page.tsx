"use client";

import React, { useState, useEffect } from "react";
import { MemberLayout } from "@/components/layout/MemberLayout";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { CreateTaskModal } from "@/components/modals/CreateTaskModal";
import { TaskItem } from "@/types";
import { useRouter } from "next/navigation";

export default function MemberDashboardPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.warn("Failed to fetch tasks API:", err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreateTask = async (task: TaskItem) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
      });
      if (res.ok) {
        await fetchTasks();
      }
    } catch (err) {
      console.warn("Error creating task:", err);
    }
  };

  return (
    <MemberLayout>
      <DashboardView
        tasks={tasks}
        onOpenCreateTask={() => setIsCreateTaskOpen(true)}
        onNavigateTab={(tab) => {
          if (tab === "dashboard") router.push("/member/dashboard");
          else if (tab === "kanban") router.push("/member/tasks");
          else if (tab === "chat") router.push("/member/messages");
          else if (tab === "calendar") router.push("/member/calendar");
        }}
      />

      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        onCreateTask={handleCreateTask}
      />
    </MemberLayout>
  );
}
