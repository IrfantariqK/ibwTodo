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
  isLeader: boolean;
  isClient: boolean;
  isTeam: boolean;
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
  isLeader: true,
  isClient: false,
  isTeam: false,
});

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [activeProjectId, setActiveProjectIdState] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const [userType, setUserType] = useState("");
  const [isLeader, setIsLeader] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [isTeam, setIsTeam] = useState(false);

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
        } catch (e) {
          console.warn("Error parsing user session in ProjectContext:", e);
        }
      }

      const roleLower = (roleVal || "").toLowerCase();
      const typeLower = (typeVal || "").toLowerCase();

      const clientFlag = typeLower === "client" || roleLower.includes("client");
      const teamFlag = typeLower === "team" || roleLower.includes("team");
      const leaderFlag = !clientFlag && !teamFlag;

      setUserRole(roleVal);
      setUserType(typeVal);
      setIsLeader(leaderFlag);
      setIsClient(clientFlag);
      setIsTeam(teamFlag);

      const queryParams = new URLSearchParams();
      if (userEmail) queryParams.set("email", userEmail);

      const res = await fetch(`/api/projects?${queryParams.toString()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (res.ok) {
        const allProjects: ProjectItem[] = await res.json();
        let filteredProjects: ProjectItem[] = allProjects;

        if (!leaderFlag && userEmail) {
          if (clientFlag) {
            filteredProjects = allProjects.filter((p) =>
              p.clients?.some((c) => c.email?.toLowerCase().trim() === userEmail)
            );
          } else if (teamFlag) {
            filteredProjects = allProjects.filter((p) =>
              p.teamMembers?.some((m) => m.email?.toLowerCase().trim() === userEmail)
            );
          }
        }

        setProjects(filteredProjects);

        // Project selection logic:
        // For Client or Team Member: CANNOT select "all". Must auto-select their assigned project.
        if (!leaderFlag) {
          if (filteredProjects.length > 0) {
            const savedActive = localStorage.getItem("taskconnect_active_project");
            const isValidActive =
              savedActive &&
              savedActive !== "all" &&
              filteredProjects.some((p) => (p.id === savedActive || p._id === savedActive));

            const targetId = isValidActive
              ? savedActive!
              : filteredProjects[0].id || filteredProjects[0]._id || "";

            setActiveProjectIdState(targetId);
            localStorage.setItem("taskconnect_active_project", targetId);
          } else {
            setActiveProjectIdState("");
          }
        } else {
          // For Leader: Allow "all" or specific project
          const savedActive = localStorage.getItem("taskconnect_active_project");
          if (savedActive) {
            const isValidActive =
              savedActive === "all" ||
              filteredProjects.some((p) => (p.id === savedActive || p._id === savedActive));
            if (isValidActive) {
              setActiveProjectIdState(savedActive);
            } else {
              setActiveProjectIdState("all");
              localStorage.setItem("taskconnect_active_project", "all");
            }
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
    fetchProjects();

    const handleFocus = () => {
      fetchProjects();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, []);

  const setActiveProjectId = (id: string) => {
    // Prevent non-leader from selecting "all"
    if (!isLeader && id === "all" && projects.length > 0) {
      const fallbackId = projects[0].id || projects[0]._id || "";
      setActiveProjectIdState(fallbackId);
      localStorage.setItem("taskconnect_active_project", fallbackId);
      return;
    }
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
        isLeader,
        isClient,
        isTeam,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => useContext(ProjectContext);
