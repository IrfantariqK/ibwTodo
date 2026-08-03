"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { CreateTaskModal } from "@/components/modals/CreateTaskModal";
import { TaskItem } from "@/types";

interface WorkspaceShellProps {
  children: React.ReactNode;
}

export const WorkspaceShell: React.FC<WorkspaceShellProps> = ({ children }) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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

  return (
    <div className="flex min-h-screen bg-white text-[#0F172A]">
      {/* Persistent Sidebar */}
      <Sidebar onOpenCreateTask={() => setIsCreateModalOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <Header onOpenQuickAdd={() => setIsCreateModalOpen(true)} />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-white">
          {children}
        </main>
      </div>

      {/* Global Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateTask={handleCreateTask}
      />
    </div>
  );
};
