"use client";

import React, { useEffect, useState } from "react";
import { Hash, Zap, Code, Palette, Users, User, Plus, MessageSquare, Building, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProject } from "@/context/ProjectContext";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProjectMember } from "@/types";

interface ChannelItem {
  id: string;
  name: string;
  topic?: string;
  icon?: string;
  isDirectMessage?: boolean;
  unread?: number;
}

interface ChannelListProps {
  activeChannel: string;
  onSelectChannel: (channelId: string, recipient?: ProjectMember) => void;
}

const iconMap: Record<string, any> = {
  Zap,
  Palette,
  Code,
  Users,
  User,
  Hash,
};

export const ChannelList: React.FC<ChannelListProps> = ({
  activeChannel,
  onSelectChannel,
}) => {
  const { projects, activeProject, isLeader, isClient, isTeam } = useProject();
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [isDM, setIsDM] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("taskconnect_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCurrentUserEmail((parsed.email || "").toLowerCase().trim());
      } catch (e) {}
    }
  }, []);

  const activeProjectIdStr = activeProject ? (activeProject.id || activeProject._id || "") : "";
  const projectsCount = projects.length;

  useEffect(() => {
    async function fetchChannels() {
      try {
        setLoading(true);
        let pId = activeProject ? activeProject.id || activeProject._id : "all";
        if (!isLeader && projects.length > 0) {
          const targetProj = activeProject || projects[0];
          pId = targetProj.id || targetProj._id || "";
        }
        const roleParam = isLeader ? "leader" : isClient ? "client" : "team";
        const queryParams = new URLSearchParams();
        if (pId) queryParams.set("projectId", pId);
        if (currentUserEmail) queryParams.set("email", currentUserEmail);
        queryParams.set("role", roleParam);

        const res = await fetch(`/api/chat/channels?${queryParams.toString()}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        if (res.ok) {
          const data = await res.json();
          setChannels(data);
        }
      } catch (err) {
        console.warn("Failed to fetch channels:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchChannels();
  }, [activeProjectIdStr, projectsCount, isLeader, isClient, isTeam, currentUserEmail]);

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    const pId = activeProject
      ? activeProject.id || activeProject._id
      : projects[0]?.id || projects[0]?._id || "";

    const channelPayload = {
      id: isDM ? `dm-${Date.now()}` : newChannelName.toLowerCase().replace(/\s+/g, "-"),
      projectId: pId,
      name: newChannelName.trim(),
      topic: isDM ? "Direct Conversation" : "Project Channel",
      icon: isDM ? "User" : "Hash",
      isDirectMessage: isDM,
    };

    try {
      const res = await fetch("/api/chat/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(channelPayload),
      });

      if (res.ok) {
        const created = await res.json();
        setChannels((prev) => [...prev, created]);
        onSelectChannel(created.id);
        setNewChannelName("");
        setShowAddModal(false);
      }
    } catch (err) {
      console.error("Error creating channel in MongoDB:", err);
    }
  };

  const [dbLeaders, setDbLeaders] = useState<ProjectMember[]>([]);
  const [dbClients, setDbClients] = useState<ProjectMember[]>([]);
  const [dbTeam, setDbTeam] = useState<ProjectMember[]>([]);
  const [presenceMap, setPresenceMap] = useState<Record<string, "online" | "offline" | "busy"> >({});

  useEffect(() => {
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

          const pMap: Record<string, "online" | "offline" | "busy"> = {};
          (data.allUsers || []).forEach((u: any) => {
            if (u.email) {
              const statusVal = u.presenceStatus || (u.isOnline ? "online" : "offline");
              pMap[u.email.toLowerCase().trim()] = statusVal;
            }
          });
          setPresenceMap(pMap);
        }
      } catch (err) {
        console.warn("Failed to fetch MongoDB users:", err);
      }
    }
    fetchUsersFromDb();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const eventSource = new EventSource("/api/chat/stream");
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data && data.type === "presence:update" && data.payload) {
          const { email, presenceStatus, isOnline } = data.payload;
          if (email) {
            const statusVal = presenceStatus || (isOnline ? "online" : "offline");
            setPresenceMap((prev) => ({
              ...prev,
              [email.toLowerCase().trim()]: statusVal,
            }));
          }
        }
      } catch (e) {}
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const publicChannels = channels.filter((c) => !c.isDirectMessage);

  const displayLeaders = dbLeaders.filter(
    (l) => (l.email || "").toLowerCase().trim() !== currentUserEmail
  );

  const displayClients = dbClients.filter(
    (c) => (c.email || "").toLowerCase().trim() !== currentUserEmail
  );

  const displayTeam = dbTeam.filter(
    (m) => (m.email || "").toLowerCase().trim() !== currentUserEmail
  );

  // STRICT CLIENT SCOPING RULES:
  // 1. Clients MUST NOT see the CLIENTS section or other clients
  // 2. Clients MUST see PROJECT LEADERS, TEAM MEMBERS, and CHANNELS
  const showLeadersSection = (isClient || isTeam || !isLeader) && displayLeaders.length > 0;
  const showClientsSection = !isClient && displayClients.length > 0; // HIDE COMPLETELY FOR CLIENT ROLE

  const renderPresenceBadge = (emailStr: string) => {
    const status = presenceMap[emailStr.toLowerCase().trim()] || "offline";
    let bgClass = "bg-slate-400";
    let title = "Offline";

    if (status === "online") {
      bgClass = "bg-emerald-500";
      title = "Online";
    } else if (status === "busy") {
      bgClass = "bg-amber-500";
      title = "Busy";
    }

    return (
      <span
        className={cn(
          "w-2.5 h-2.5 rounded-full absolute -bottom-0.5 -right-0.5 ring-2 ring-white shadow-xs transition-all",
          bgClass
        )}
        title={`Status: ${title}`}
      />
    );
  };

  return (
    <div className="w-64 bg-[#F8FAFC] border-r border-slate-200/90 flex flex-col justify-between h-full p-4 font-sans shrink-0">
      <div className="space-y-5 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-2 pt-1">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#006858]" />
            <h2 className="font-extrabold text-sm text-[#0F172A]">
              {isClient ? "Client Messages" : isTeam ? "Team Messages" : "Leader Messages"}
            </h2>
          </div>
          {isLeader && (
            <button
              onClick={() => setShowAddModal(true)}
              className="p-1 rounded-lg bg-white border border-slate-200 hover:bg-emerald-50 text-[#006858] transition-colors cursor-pointer shadow-2xs"
              title="Create Channel or DM"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Selected Project Indicator Banner */}
        <div className="px-3 py-2 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-[11px] font-bold text-[#006858]">
          <p className="uppercase tracking-wider text-[9px] text-[#006858]/70">Project Context</p>
          <p className="truncate font-black">
            {activeProject ? activeProject.name : isLeader ? "All Projects Scope" : (projects[0]?.name || "Assigned Project")}
          </p>
        </div>

        {/* Public Channels Section */}
        <div className="space-y-1">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2.5 mb-1 flex items-center justify-between">
            <span>CHANNELS</span>
            <span className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-full text-[9px]">
              {publicChannels.length}
            </span>
          </div>

          <div className="space-y-1">
            {loading ? (
              <div className="space-y-2 p-1">
                <Skeleton className="h-7 rounded-xl" />
                <Skeleton className="h-7 rounded-xl" />
              </div>
            ) : (
              publicChannels.map((channel) => {
                const Icon = (channel.icon && iconMap[channel.icon]) || Hash;
                const isActive = activeChannel === channel.id;

                return (
                  <button
                    key={channel.id}
                    onClick={() => onSelectChannel(channel.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                      isActive
                        ? "bg-white text-[#006858] shadow-sm border border-[#006858]/30 font-extrabold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={cn(
                          "w-4 h-4 shrink-0",
                          isActive ? "text-[#006858]" : "text-slate-400"
                        )}
                      />
                      <span className="truncate">#{channel.name}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* PROJECT LEADERS SECTION (Visible to Client & Team accounts) */}
        {showLeadersSection && (
          <div className="space-y-1 pt-2 border-t border-slate-200/60">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600 px-2.5 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Crown className="w-3 h-3 text-purple-600" /> PROJECT LEADERS
              </span>
              <span className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded-full text-[9px] font-black">
                {displayLeaders.length}
              </span>
            </div>

            <div className="space-y-1">
              {displayLeaders.map((leader) => {
                const isActive = activeChannel === leader.email;

                return (
                  <button
                    key={leader.id || leader.email}
                    type="button"
                    onClick={() => onSelectChannel(leader.email, leader)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-left",
                      isActive
                        ? "bg-purple-50 text-purple-900 shadow-sm border border-purple-300 font-extrabold"
                        : "bg-white/80 text-slate-700 hover:bg-purple-50/50 border border-slate-200/80"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={leader.avatar}
                          alt={leader.name}
                          className="w-6 h-6 rounded-full object-cover bg-purple-50 ring-1 ring-purple-400"
                        />
                        {renderPresenceBadge(leader.email)}
                      </div>
                      <div className="truncate">
                        <p className="truncate leading-none text-purple-950 font-black">{leader.name}</p>
                        <p className="text-[9px] text-purple-700 font-bold truncate mt-0.5">{leader.role}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* CLIENTS DIRECT MESSAGES SECTION (STRICTLY HIDDEN FOR CLIENT ROLE) */}
        {showClientsSection && (
          <div className="space-y-1 pt-2 border-t border-slate-200/60">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2.5 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Building className="w-3 h-3 text-[#006858]" /> CLIENTS
              </span>
              <span className="bg-emerald-100 text-[#006858] px-1.5 py-0.5 rounded-full text-[9px] font-bold">
                {displayClients.length}
              </span>
            </div>

            <div className="space-y-1">
              {displayClients.map((client) => {
                const isActive = activeChannel === client.email;

                return (
                  <button
                    key={client.id || client.email}
                    onClick={() => onSelectChannel(client.email, client)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-left",
                      isActive
                        ? "bg-white text-[#006858] shadow-sm border border-[#006858]/30 font-extrabold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={client.avatar}
                          alt={client.name}
                          className="w-6 h-6 rounded-full object-cover bg-emerald-50 ring-1 ring-emerald-300"
                        />
                        {renderPresenceBadge(client.email)}
                      </div>
                      <div className="truncate">
                        <p className="truncate leading-none">{client.name}</p>
                        <p className="text-[9px] text-slate-400 font-medium truncate mt-0.5">{client.role}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TEAM DIRECT MESSAGES SECTION */}
        <div className="space-y-1 pt-2 border-t border-slate-200/60">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2.5 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3 text-[#006858]" /> TEAM MEMBERS
            </span>
            <span className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-full text-[9px]">
              {displayTeam.length}
            </span>
          </div>

          <div className="space-y-1">
            {displayTeam.length > 0 ? (
              displayTeam.map((mem) => {
                const isActive = activeChannel === mem.email;

                return (
                  <button
                    key={mem.id || mem.email}
                    onClick={() => onSelectChannel(mem.email, mem)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-left",
                      isActive
                        ? "bg-white text-[#006858] shadow-sm border border-[#006858]/30 font-extrabold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={mem.avatar}
                          alt={mem.name}
                          className="w-6 h-6 rounded-full object-cover bg-emerald-50 ring-1 ring-slate-200"
                        />
                        {renderPresenceBadge(mem.email)}
                      </div>
                      <div className="truncate">
                        <p className="truncate leading-none">{mem.name}</p>
                        <p className="text-[9px] text-slate-400 font-medium truncate mt-0.5">{mem.role}</p>
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-2 text-[11px] text-slate-400 font-medium italic">
                No other team contacts.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Channel Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-slate-200 shadow-2xl space-y-4 font-sans">
            <h3 className="text-base font-extrabold text-[#0F172A]">Create Workspace Channel</h3>

            <form onSubmit={handleCreateChannel} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Channel Name</label>
                <input
                  type="text"
                  required
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="e.g. client-updates"
                  className="w-full bg-slate-50 text-slate-900 font-bold p-2.5 rounded-xl border border-slate-200 focus:border-[#006858] text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#006858] text-white hover:bg-[#005245]"
                >
                  Save in MongoDB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
