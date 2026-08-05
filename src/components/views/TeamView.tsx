"use client";

import React, { useEffect, useState } from "react";
import { Users, Mail, Building, ShieldCheck, Crown } from "lucide-react";
import { useProject } from "@/context/ProjectContext";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProjectMember } from "@/types";

export const TeamView: React.FC = () => {
  const { projects, activeProject, activeProjectId, isLeader, isClient, loading } = useProject();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem("taskconnect_user");
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  // Determine target projects based on role & active selection
  let targetProjects = projects;
  if (!isLeader) {
    targetProjects = activeProject ? [activeProject] : (projects.length > 0 ? [projects[0]] : []);
  } else if (activeProject) {
    targetProjects = [activeProject];
  }

  // Construct directory for target projects
  const memberMap = new Map<string, any>();

  targetProjects.forEach((proj) => {
    // 1. Add Project Leader card
    const leaderEmail = "leader@taskconnect.io";
    if (!memberMap.has(leaderEmail)) {
      memberMap.set(leaderEmail, {
        id: `leader-${proj.id || proj._id}`,
        name: "Irfan Tariq",
        email: leaderEmail,
        role: "Project Leader / Manager",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Irfan",
        isLeaderCard: true,
        isClientCard: false,
        projectName: proj.name,
      });
    }

    // 2. Add Team Members of project
    (proj.teamMembers || []).forEach((tm) => {
      const emailKey = (tm.email || "").toLowerCase().trim();
      if (emailKey && !memberMap.has(emailKey)) {
        memberMap.set(emailKey, {
          ...tm,
          isLeaderCard: false,
          isClientCard: false,
          projectName: proj.name,
        });
      }
    });

    // 3. Add Client Contacts of project (Excluding for Client accounts: Clients only see Leader & Team Members)
    if (!isClient) {
      (proj.clients || []).forEach((cl) => {
        const emailKey = (cl.email || "").toLowerCase().trim();
        if (emailKey && !memberMap.has(emailKey)) {
          memberMap.set(emailKey, {
            ...cl,
            isLeaderCard: false,
            isClientCard: true,
            projectName: proj.name,
          });
        }
      });
    }
  });

  const allMembers = Array.from(memberMap.values());

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans text-[#0F172A]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-[#006858] uppercase tracking-wider">
              {activeProject
                ? `Project: ${activeProject.name}`
                : isLeader
                ? "All Workspace Organization Directory"
                : `Project: ${targetProjects[0]?.name || "Assigned Workspace"}`}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#006858]" />
            Team & Client Directory
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            {isClient
              ? "View the Leader, team members, and client contacts assigned to your project."
              : "Manage team members, client contacts, roles, and project access permissions."}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="modern-card rounded-3xl p-6 bg-white border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <Skeleton className="w-14 h-14 rounded-2xl" />
              <Skeleton className="w-20 h-5 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="w-32 h-5 rounded-lg" />
              <Skeleton className="w-24 h-4 rounded-md" />
              <Skeleton className="w-40 h-3 rounded-md" />
            </div>
          </div>
          <div className="modern-card rounded-3xl p-6 bg-white border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <Skeleton className="w-14 h-14 rounded-2xl" />
              <Skeleton className="w-20 h-5 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="w-32 h-5 rounded-lg" />
              <Skeleton className="w-24 h-4 rounded-md" />
              <Skeleton className="w-40 h-3 rounded-md" />
            </div>
          </div>
          <div className="modern-card rounded-3xl p-6 bg-white border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <Skeleton className="w-14 h-14 rounded-2xl" />
              <Skeleton className="w-20 h-5 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="w-32 h-5 rounded-lg" />
              <Skeleton className="w-24 h-4 rounded-md" />
              <Skeleton className="w-40 h-3 rounded-md" />
            </div>
          </div>
        </div>
      ) : allMembers.length === 0 ? (
        <div className="modern-card rounded-3xl p-10 bg-white border border-slate-200/90 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#006858] flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h4 className="font-extrabold text-slate-800 text-sm">No Members or Clients Assigned</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            There are currently no team members or clients assigned to this project.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {allMembers.map((member, idx) => (
            <div
              key={member.id || idx}
              className="modern-card rounded-3xl p-6 bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="relative">
                  <img
                    src={
                      member.avatar ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                        member.email || "User"
                      )}`
                    }
                    alt={member.name}
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-[#006858] bg-emerald-50"
                  />
                  <span className="w-3.5 h-3.5 rounded-full absolute -bottom-1 -right-1 ring-2 ring-white bg-emerald-500" />
                </div>

                <span
                  className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                    member.isLeaderCard
                      ? "bg-purple-100 text-purple-700 border-purple-300"
                      : member.isClientCard
                      ? "bg-emerald-100 text-[#006858] border-emerald-300"
                      : "bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  {member.isLeaderCard
                    ? "Project Leader"
                    : member.isClientCard
                    ? "Client Contact"
                    : "Team Member"}
                </span>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-[#0F172A] flex items-center gap-1.5">
                  {member.name}
                  {member.isLeaderCard ? (
                    <Crown className="w-4 h-4 text-purple-600" />
                  ) : member.isClientCard ? (
                    <Building className="w-4 h-4 text-[#006858]" />
                  ) : null}
                </h3>
                <p className="text-xs text-[#006858] font-extrabold mt-0.5">{member.role}</p>
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-1 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{member.email}</span>
                </p>
              </div>

              {member.isClientCard && (
                <div className="text-[10px] text-emerald-800 font-extrabold flex items-start gap-1.5 bg-emerald-50/90 p-2.5 rounded-xl border border-emerald-200/80">
                  <Mail className="w-3.5 h-3.5 text-[#006858] shrink-0 mt-0.5" />
                  <span>Email has been sent. Please verify. Or tell your clients please verify your account.</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
                <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified Access
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
