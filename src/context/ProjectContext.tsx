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

const getInitialUserState = () => {
  if (typeof window === "undefined") {
    return { isLeader: true, isClient: false, isTeam: false, role: "Project Leader", type: "leader" };
  }
  try {
    const saved = localStorage.getItem("taskconnect_user");
    if (saved) {
      const parsed = JSON.parse(saved);
      const roleLower = (parsed.role || "").toLowerCase().trim();
      const typeLower = (parsed.type || "").toLowerCase().trim();
      const emailLower = (parsed.email || "").toLowerCase().trim();

      const clientFlag =
        typeLower === "client" ||
        roleLower.includes("client") ||
        emailLower.includes("client");

      const teamFlag =
        !clientFlag &&
        (typeLower === "team" ||
          roleLower.includes("team") ||
          roleLower.includes("developer") ||
          roleLower.includes("member") ||
          emailLower.includes("member"));

      const leaderFlag = !clientFlag && !teamFlag;

      return {
        isLeader: leaderFlag,
        isClient: clientFlag,
        isTeam: teamFlag,
        role: parsed.role || (clientFlag ? "Client Contact" : teamFlag ? "Team Member" : "Project Leader"),
        type: clientFlag ? "client" : teamFlag ? "team" : "leader",
      };
    }
  } catch (e) {}
  return { isLeader: true, isClient: false, isTeam: false, role: "Project Leader", type: "leader" };
};

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [initialState] = useState(getInitialUserState);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [activeProjectId, setActiveProjectIdState] = useState<string>(() => {
    if (!initialState.isLeader) return "";
    return "all";
  });
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(initialState.role);
  const [userType, setUserType] = useState(initialState.type);
  const [isLeader, setIsLeader] = useState(initialState.isLeader);
  const [isClient, setIsClient] = useState(initialState.isClient);
  const [isTeam, setIsTeam] = useState(initialState.isTeam);

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

      const roleLower = (roleVal || "").toLowerCase().trim();
      const typeLower = (typeVal || "").toLowerCase().trim();
      const emailLower = (userEmail || "").toLowerCase().trim();

      const clientFlag =
        typeLower === "client" ||
        roleLower.includes("client") ||
        emailLower.includes("client");

      const teamFlag =
        !clientFlag &&
        (typeLower === "team" ||
          roleLower.includes("team") ||
          roleLower.includes("developer") ||
          roleLower.includes("member") ||
          emailLower.includes("member"));

      const leaderFlag = !clientFlag && !teamFlag;

      setUserRole(roleVal || (clientFlag ? "Client Contact" : teamFlag ? "Team Member" : "Project Leader"));
      setUserType(clientFlag ? "client" : teamFlag ? "team" : "leader");
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
