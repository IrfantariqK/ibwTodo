"use client";

import React, { useEffect, useState } from "react";
import { Hash, Zap, Code, Palette, Users, User, Plus, MessageSquare, Building } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProject } from "@/context/ProjectContext";
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
  const { activeProject } = useProject();
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [isDM, setIsDM] = useState(false);

  useEffect(() => {
    async function fetchChannels() {
      try {
        const pId = activeProject ? activeProject.id || activeProject._id : "all";
        const res = await fetch(`/api/chat/channels?projectId=${encodeURIComponent(pId!)}`);
        if (res.ok) {
          const data = await res.json();
          setChannels(data);
        }
      } catch (err) {
        console.warn("Failed to fetch channels:", err);
      }
    }
    fetchChannels();
  }, [activeProject]);

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    const pId = activeProject ? activeProject.id || activeProject._id : "";

    const channelPayload = {
      id: isDM ? `dm-${Date.now()}` : newChannelName.toLowerCase().replace(/\s+/g, "-"),
      projectId: pId,
      name: newChannelName.trim(),
      topic: isDM ? "Direct Conversation" : "Custom Project Channel",
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

  const publicChannels = channels.filter((c) => !c.isDirectMessage);

  // Active project clients and team members
  const projectClients = activeProject?.clients || [];
  const projectTeam = activeProject?.teamMembers || [];

  return (
    <div className="w-64 bg-[#F8FAFC] border-r border-slate-200/90 flex flex-col justify-between h-full p-4 font-sans shrink-0">
      <div className="space-y-5 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-2 pt-1">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#006858]" />
            <h2 className="font-extrabold text-sm text-[#0F172A]">Workspace Chat</h2>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="p-1 rounded-lg bg-white border border-slate-200 hover:bg-emerald-50 text-[#006858] transition-colors cursor-pointer shadow-2xs"
            title="Create Channel or DM"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Project Indicator Banner */}
        {activeProject && (
          <div className="px-3 py-2 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-[11px] font-bold text-[#006858]">
            <p className="uppercase tracking-wider text-[9px] text-[#006858]/70">Project Filtered</p>
            <p className="truncate font-black">{activeProject.name}</p>
          </div>
        )}

        {/* Public Channels Section */}
        <div className="space-y-1">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2.5 mb-1 flex items-center justify-between">
            <span>CHANNELS</span>
            <span className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-full text-[9px]">
              {publicChannels.length}
            </span>
          </div>

          <div className="space-y-1">
            {publicChannels.map((channel) => {
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
            })}
          </div>
        </div>

        {/* CLIENTS DIRECT MESSAGES SECTION */}
        {projectClients.length > 0 && (
          <div className="space-y-1 pt-2 border-t border-slate-200/60">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2.5 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Building className="w-3 h-3 text-[#006858]" /> CLIENTS
              </span>
              <span className="bg-emerald-100 text-[#006858] px-1.5 py-0.5 rounded-full text-[9px] font-bold">
                {projectClients.length}
              </span>
            </div>

            <div className="space-y-1">
              {projectClients.map((client) => {
                const isActive = activeChannel === client.email;

                return (
                  <button
                    key={client.id}
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
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute -bottom-0.5 -right-0.5 ring-1 ring-white" />
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
              <Users className="w-3 h-3 text-[#006858]" /> DIRECT MESSAGES
            </span>
            <span className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-full text-[9px]">
              {projectTeam.length > 0 ? projectTeam.length : "Team"}
            </span>
          </div>

          <div className="space-y-1">
            {projectTeam.length > 0 ? (
              projectTeam.map((mem) => {
                const isActive = activeChannel === mem.email;

                return (
                  <button
                    key={mem.id}
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
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute -bottom-0.5 -right-0.5 ring-1 ring-white" />
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
                Select a project or create one with team members.
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
