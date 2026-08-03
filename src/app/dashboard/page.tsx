"use client";

import React, { useState, useEffect } from "react";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { CreateTaskModal } from "@/components/modals/CreateTaskModal";
import { TaskItem } from "@/types";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
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
        // Refresh tasks from MongoDB after creation
        await fetchTasks();
      }
    } catch (err) {
      console.warn("Error creating task:", err);
    }
  };

  return (
    <WorkspaceShell>
      <DashboardView
        tasks={tasks}
        onOpenCreateTask={() => setIsCreateTaskOpen(true)}
        onNavigateTab={(tab) => {
          if (tab === "dashboard") router.push("/dashboard");
          else if (tab === "kanban") router.push("/tasks");
          else if (tab === "chat") router.push("/messages");
          else if (tab === "calendar") router.push("/calendar");
        }}
      />

      {/* Create Task Modal — wired to MongoDB via /api/tasks POST */}
      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        onCreateTask={handleCreateTask}
      />
    </WorkspaceShell>
  );
}
