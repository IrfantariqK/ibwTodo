"use client";

import React from "react";
import { Users, Mail, UserPlus, Building, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useProject } from "@/context/ProjectContext";

export const TeamView: React.FC = () => {
  const { activeProject } = useProject();

  const clients = activeProject?.clients || [];
  const teamMembers = activeProject?.teamMembers || [];

  // Combine clients & team members for display
  const allMembers = [
    ...clients.map((c) => ({ ...c, isClient: true })),
    ...teamMembers.map((t) => ({ ...t, isClient: false })),
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans text-[#0F172A]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-[#006858] uppercase tracking-wider">
              {activeProject ? `Project: ${activeProject.name}` : "All Organization Directory"}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#006858]" />
            Team & Client Directory
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Manage team members, client contacts, roles, and project access permissions.
          </p>
        </div>
      </div>

      {allMembers.length === 0 ? (
        <div className="modern-card rounded-3xl p-10 bg-white border border-slate-200/90 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#006858] flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h4 className="font-extrabold text-slate-800 text-sm">No Members or Clients Assigned</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Select or create a project with team members and clients to view their roles and contact info here.
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
                    member.isClient
                      ? "bg-emerald-100 text-[#006858] border-emerald-300"
                      : "bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  {member.isClient ? "Client Contact" : "Team Member"}
                </span>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-[#0F172A] flex items-center gap-1.5">
                  {member.name}
                  {member.isClient && <Building className="w-4 h-4 text-[#006858]" />}
                </h3>
                <p className="text-xs text-[#006858] font-extrabold mt-0.5">{member.role}</p>
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-1 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{member.email}</span>
                </p>
              </div>

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
