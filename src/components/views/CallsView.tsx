"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PhoneCall, Video, PhoneOff, Mic, MicOff, VideoOff, Users, Building, Crown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useProject } from "@/context/ProjectContext";
import { ProjectMember } from "@/types";

export const CallsView: React.FC = () => {
  const { activeProject, isClient, isLeader, isTeam } = useProject();
  const [inCall, setInCall] = useState(false);
  const [activeCallHost, setActiveCallHost] = useState("Meeting Room");
  const [muted, setMuted] = useState(false);
  const [videoOn, setVideoOn] = useState(true);

  const [dbLeaders, setDbLeaders] = useState<ProjectMember[]>([]);
  const [dbClients, setDbClients] = useState<ProjectMember[]>([]);
  const [dbTeam, setDbTeam] = useState<ProjectMember[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("taskconnect_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.email) setCurrentUserEmail(parsed.email.toLowerCase().trim());
      } catch (e) {}
    }

    async function fetchUsersFromDb() {
      try {
        const res = await fetch("/api/users", {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.leaders) setDbLeaders(data.leaders);
          if (data.clients) setDbClients(data.clients);
          if (data.teamMembers) setDbTeam(data.teamMembers);
        }
      } catch (err) {
        console.warn("Failed to fetch MongoDB users in CallsView:", err);
      }
    }

    fetchUsersFromDb();
  }, []);

  // Filter out the currently logged-in user from call targets
  const displayLeaders = dbLeaders.filter(
    (l) => (l.email || "").toLowerCase().trim() !== currentUserEmail
  );
  const displayTeam = dbTeam.filter(
    (m) => (m.email || "").toLowerCase().trim() !== currentUserEmail
  );
  const displayClients = dbClients.filter(
    (c) => (c.email || "").toLowerCase().trim() !== currentUserEmail
  );

  // Dynamic role-based call participants:
  // Client sees: Project Leaders & Team Members (Clients excluded)
  // Team Member sees: Project Leaders, Clients & Team Members
  // Leader sees: Clients & Team Members
  let allParticipants: ProjectMember[] = [];
  if (isClient) {
    allParticipants = [...displayLeaders, ...displayTeam];
  } else if (isTeam) {
    allParticipants = [...displayLeaders, ...displayTeam, ...displayClients];
  } else {
    allParticipants = [...displayClients, ...displayTeam];
  }

  // Deduplicate by email
  const participantMap = new Map<string, ProjectMember>();
  allParticipants.forEach((p) => {
    const e = (p.email || "").toLowerCase().trim();
    if (e && !participantMap.has(e)) {
      participantMap.set(e, p);
    }
  });

  const uniqueParticipants = Array.from(participantMap.values());

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans text-[#0F172A]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-[#006858] uppercase tracking-wider">
              {activeProject ? `Project: ${activeProject.name}` : "All Workspace Calls"}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <PhoneCall className="w-6 h-6 text-[#006858]" />
            Video & Audio Calls
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Enterprise high-definition room conferencing for clients & team members.
          </p>
        </div>

        <Button
          onClick={() => {
            setActiveCallHost(activeProject ? activeProject.name : "Instant Sync");
            setInCall(true);
          }}
          variant="primary"
          icon={<Video className="w-4 h-4" />}
          className="bg-[#006858] hover:bg-[#005245] rounded-xl font-bold"
        >
          Start Instant Room
        </Button>
      </div>

      {/* Active Call Stage / Meeting Room */}
      {inCall ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="modern-card rounded-3xl bg-slate-900 text-white p-8 space-y-6 relative overflow-hidden shadow-2xl"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
              <h3 className="font-extrabold text-base">
                Live Room: {activeCallHost} Sync
              </h3>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-bold bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
              00:04:12 • 1080p HD Live
            </span>
          </div>

          {/* Video Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[300px]">
            {uniqueParticipants.slice(0, 6).map((p) => (
              <div
                key={p.id || p.email}
                className="bg-slate-800 rounded-2xl relative overflow-hidden flex items-center justify-center border border-slate-700 p-4"
              >
                <img
                  src={p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(p.name || "User")}`}
                  alt={p.name}
                  className="w-full h-full object-cover rounded-xl"
                />
                <span className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 rounded-lg text-xs font-bold text-white flex items-center gap-1">
                  {p.type === "leader" ? <Crown className="w-3 h-3 text-purple-400" /> : p.type === "client" ? <Building className="w-3 h-3 text-emerald-400" /> : null}
                  {p.name} ({p.role})
                </span>
              </div>
            ))}
          </div>

          {/* Controls Toolbar */}
          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              onClick={() => setMuted(!muted)}
              className={`p-3.5 rounded-2xl transition-all cursor-pointer ${
                muted ? "bg-red-500 text-white" : "bg-slate-800 hover:bg-slate-700 text-white"
              }`}
            >
              {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setVideoOn(!videoOn)}
              className={`p-3.5 rounded-2xl transition-all cursor-pointer ${
                !videoOn ? "bg-red-500 text-white" : "bg-slate-800 hover:bg-slate-700 text-white"
              }`}
            >
              {!videoOn ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setInCall(false)}
              className="p-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white transition-all cursor-pointer shadow-lg shadow-red-600/30"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <h3 className="font-extrabold text-lg">Project Call Participants</h3>
            {uniqueParticipants.length === 0 ? (
              <div className="modern-card rounded-3xl p-8 bg-white border border-slate-200/90 text-center space-y-2">
                <Users className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-700 text-sm">No Call Participants Available</p>
                <p className="text-xs text-slate-400">
                  There are currently no team leaders or team members available to call.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {uniqueParticipants.map((p) => (
                  <div
                    key={p.id || p.email}
                    className="modern-card rounded-2xl p-4 bg-white border border-slate-200/90 shadow-sm flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(p.name || "User")}`}
                        alt={p.name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-[#006858]"
                      />
                      <div>
                        <h4 className="font-bold text-sm text-[#0F172A] flex items-center gap-1.5">
                          {p.name}
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            p.type === "leader"
                              ? "bg-purple-100 text-purple-800 border border-purple-200"
                              : p.type === "client"
                              ? "bg-emerald-100 text-[#006858]"
                              : "bg-slate-100 text-slate-600"
                          }`}>
                            {p.type === "leader" ? "Project Leader" : p.type === "client" ? "Client Contact" : "Team Member"}
                          </span>
                        </h4>
                        <p className="text-xs text-slate-500 font-medium">{p.role} • {p.email}</p>
                      </div>
                    </div>

                    <Button
                      onClick={() => {
                        setActiveCallHost(p.name);
                        setInCall(true);
                      }}
                      size="sm"
                      className="bg-[#006858] hover:bg-[#005245] rounded-xl font-bold"
                    >
                      Call Room
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="font-extrabold text-lg">Recent Call Logs</h3>
            <div className="modern-card rounded-3xl p-5 bg-white border border-slate-200/90 shadow-sm space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="font-bold text-[#0F172A]">Workspace Call Sync</p>
                  <p className="text-[10px] text-slate-400 font-mono">Today • 12 mins</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Completed
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
