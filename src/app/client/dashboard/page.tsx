"use client";

import React, { useState, useEffect } from "react";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { CreateTaskModal } from "@/components/modals/CreateTaskModal";
import { TaskItem } from "@/types";
import { useRouter } from "next/navigation";

export default function ClientDashboardPage() {
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
    <ClientLayout>
      <DashboardView
        tasks={tasks}
        onOpenCreateTask={() => setIsCreateTaskOpen(true)}
        onNavigateTab={(tab) => {
          if (tab === "dashboard") router.push("/client/dashboard");
          else if (tab === "kanban") router.push("/client/tasks");
          else if (tab === "chat") router.push("/client/messages");
          else if (tab === "calendar") router.push("/client/calendar");
        }}
      />

      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        onCreateTask={handleCreateTask}
      />
    </ClientLayout>
  );
}
