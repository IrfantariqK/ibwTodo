"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { ProjectItem } from "@/types";

interface ProjectContextType {
  projects: ProjectItem[];
  activeProject: ProjectItem | null;
  activeProjectId: string;
  setActiveProjectId: (id: string) => void;
  refreshProjects: () => Promise<void>;
  loading: boolean;
  userRole: string;
  userType: string;
}

const ProjectContext = createContext<ProjectContextType>({
  projects: [],
  activeProject: null,
  activeProjectId: "all",
  setActiveProjectId: () => {},
  refreshProjects: async () => {},
  loading: true,
  userRole: "Leader",
  userType: "leader",
});

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [activeProjectId, setActiveProjectIdState] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("Leader");
  const [userType, setUserType] = useState("leader");

  const fetchProjects = async () => {
    try {
      let userEmail = "";
      let roleVal = "Leader";
      let typeVal = "leader";

      const savedUser = localStorage.getItem("taskconnect_user");
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          userEmail = parsed.email || "";
          roleVal = parsed.role || "Leader";
          typeVal = parsed.type || (roleVal === "Leader" ? "leader" : "team");
        } catch (e) {
          console.warn("Error parsing user session in ProjectContext:", e);
        }
      }

      setUserRole(roleVal);
      setUserType(typeVal);

      const queryParams = new URLSearchParams();
      if (userEmail) queryParams.set("email", userEmail);
      if (roleVal) queryParams.set("role", roleVal);
      if (typeVal) queryParams.set("type", typeVal);

      const res = await fetch(`/api/projects?${queryParams.toString()}`);
      if (res.ok) {
        let data: ProjectItem[] = await res.json();

        const cleanEmail = userEmail.toLowerCase().trim();
        const isLeader = roleVal === "Leader" || typeVal === "leader" || !cleanEmail || cleanEmail === "admin@ibwtech.com" || cleanEmail === "user@ibwtech.com";

        if (!isLeader && cleanEmail) {
          if (typeVal === "client") {
            // CLIENT: Can view ONLY projects where assigned as client
            data = data.filter((p) =>
              p.clients?.some((c) => c.email?.toLowerCase().trim() === cleanEmail)
            );
          } else if (typeVal === "team") {
            // TEAM MEMBER: Can view ONLY projects where assigned as team member
            data = data.filter((p) =>
              p.teamMembers?.some((m) => m.email?.toLowerCase().trim() === cleanEmail)
            );
          } else {
            data = data.filter((p) => {
              const hasClient = p.clients?.some((c) => c.email?.toLowerCase().trim() === cleanEmail);
              const hasTeam = p.teamMembers?.some((m) => m.email?.toLowerCase().trim() === cleanEmail);
              return hasClient || hasTeam;
            });
          }
        }

        setProjects(data);

        // Auto-select first permitted project if activeProjectId is invalid or restricted
        if (data.length > 0) {
          const savedActive = localStorage.getItem("taskconnect_active_project");
          const isValidActive = savedActive && data.some((p) => (p.id === savedActive || p._id === savedActive));
          if (!isValidActive && savedActive !== "all") {
            const firstId = data[0].id || data[0]._id || "all";
            setActiveProjectIdState(firstId);
            localStorage.setItem("taskconnect_active_project", firstId);
          }
        }
      }
    } catch (err) {
      console.warn("Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("taskconnect_active_project");
    if (saved) {
      setActiveProjectIdState(saved);
    }
    fetchProjects();
  }, []);

  const setActiveProjectId = (id: string) => {
    setActiveProjectIdState(id);
    localStorage.setItem("taskconnect_active_project", id);
  };

  const activeProject =
    activeProjectId === "all"
      ? null
      : projects.find((p) => (p.id === activeProjectId || p._id === activeProjectId)) || null;

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        activeProjectId,
        setActiveProjectId,
        refreshProjects: fetchProjects,
        loading,
        userRole,
        userType,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => useContext(ProjectContext);
