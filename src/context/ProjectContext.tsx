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
  userRole: "",
  userType: "",
});

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [activeProjectId, setActiveProjectIdState] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const [userType, setUserType] = useState("");

  const fetchProjects = async () => {
    try {
      let userEmail = "";
      let roleVal = "";
      let typeVal = "";

      const savedUser = localStorage.getItem("taskconnect_user");
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          userEmail = (parsed.email || "").toLowerCase().trim();
          roleVal = parsed.role || "";
          typeVal = parsed.type || "";

          // Determine typeVal from role if missing
          if (!typeVal) {
            if (roleVal.toLowerCase().includes("client")) {
              typeVal = "client";
            } else if (roleVal.toLowerCase().includes("team") || roleVal.toLowerCase().includes("member")) {
              typeVal = "team";
            } else {
              typeVal = "leader";
            }
          }
        } catch (e) {
          console.warn("Error parsing user session in ProjectContext:", e);
        }
      }

      setUserRole(roleVal);
      setUserType(typeVal);

      const queryParams = new URLSearchParams();
      if (userEmail) queryParams.set("email", userEmail);

      const res = await fetch(`/api/projects?${queryParams.toString()}`);
      if (res.ok) {
        let allProjects: ProjectItem[] = await res.json();
        let filteredProjects: ProjectItem[] = allProjects;

        if (userEmail) {
          const isAssignedAsClient = allProjects.some((p) =>
            p.clients?.some((c) => c.email?.toLowerCase().trim() === userEmail)
          );
          const isAssignedAsTeam = allProjects.some((p) =>
            p.teamMembers?.some((m) => m.email?.toLowerCase().trim() === userEmail)
          );

          const isLeader = typeVal === "leader" || roleVal === "Leader" || (!isAssignedAsClient && !isAssignedAsTeam && typeVal !== "client" && typeVal !== "team");

          if (typeVal === "client" || (isAssignedAsClient && !isLeader)) {
            // CLIENT: View ONLY projects where assigned as client
            filteredProjects = allProjects.filter((p) =>
              p.clients?.some((c) => c.email?.toLowerCase().trim() === userEmail)
            );
          } else if (typeVal === "team" || (isAssignedAsTeam && !isLeader)) {
            // TEAM MEMBER: View ONLY projects where assigned as team member
            filteredProjects = allProjects.filter((p) =>
              p.teamMembers?.some((m) => m.email?.toLowerCase().trim() === userEmail)
            );
          }
        }

        setProjects(filteredProjects);

        // Auto-select active project
        if (filteredProjects.length > 0) {
          const savedActive = localStorage.getItem("taskconnect_active_project");
          const isValidActive = savedActive && filteredProjects.some((p) => (p.id === savedActive || p._id === savedActive));
          if (!isValidActive) {
            const firstId = filteredProjects[0].id || filteredProjects[0]._id || "all";
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
