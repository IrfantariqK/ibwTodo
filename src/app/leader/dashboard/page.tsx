"use client";

import React, { useState, useEffect } from "react";
import { LeaderLayout } from "@/components/layout/LeaderLayout";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { CreateTaskModal } from "@/components/modals/CreateTaskModal";
import { TaskItem } from "@/types";
import { useRouter } from "next/navigation";

export default function LeaderDashboardPage() {
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
    <LeaderLayout>
      <DashboardView
        tasks={tasks}
        onOpenCreateTask={() => setIsCreateTaskOpen(true)}
        onNavigateTab={(tab) => {
          if (tab === "dashboard") router.push("/leader/dashboard");
          else if (tab === "kanban") router.push("/leader/tasks");
          else if (tab === "chat") router.push("/leader/messages");
          else if (tab === "calendar") router.push("/leader/calendar");
        }}
      />

      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        onCreateTask={handleCreateTask}
      />
    </LeaderLayout>
  );
}
