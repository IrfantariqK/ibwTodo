"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FolderPlus,
  AlignLeft,
  Users,
  Building,
  UserPlus,
  Trash2,
  Sparkles,
  CheckCircle2,
  Tag,
  Briefcase,
} from "lucide-react";
import { ProjectMember } from "@/types";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: () => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated,
}) => {
  const [activeTab, setActiveTab] = useState<"info" | "clients" | "team">("info");
  const [name, setName] = useState("");
  const [channelName, setChannelName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"In Progress" | "Planning" | "Completed" | "On Hold">("In Progress");
  const [progress, setProgress] = useState("25");
  const [tags, setTags] = useState("Web, Design, API");

  const handleNameChange = (val: string) => {
    setName(val);
    setChannelName(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""));
  };

  // Client inputs
  const [clients, setClients] = useState<ProjectMember[]>([]);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientRole, setClientRole] = useState("Client Lead / Owner");

  // Team Member inputs
  const [teamMembers, setTeamMembers] = useState<ProjectMember[]>([]);
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("Full-Stack Dev");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setName("");
      setDescription("");
      setStatus("In Progress");
      setProgress("25");
      setTags("Web, Design, API");
      setClients([]);
      setTeamMembers([]);
      setError("");
      setActiveTab("info");
    }
  }, [isOpen]);

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientEmail.trim()) return;

    const newClient: ProjectMember = {
      id: `client-${Date.now()}`,
      name: clientName.trim(),
      email: clientEmail.trim().toLowerCase(),
      role: clientRole.trim() || "Client",
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(clientEmail.trim())}`,
      type: "client",
    };

    setClients((prev) => [...prev, newClient]);
    setClientName("");
    setClientEmail("");
    setClientRole("Client Lead / Owner");
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim() || !memberEmail.trim()) return;

    const newMember: ProjectMember = {
      id: `team-${Date.now()}`,
      name: memberName.trim(),
      email: memberEmail.trim().toLowerCase(),
      role: memberRole.trim() || "Team Member",
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(memberEmail.trim())}`,
      type: "team",
    };

    setTeamMembers((prev) => [...prev, newMember]);
    setMemberName("");
    setMemberEmail("");
    setMemberRole("Full-Stack Dev");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          channelName: channelName.trim(),
          description: description.trim(),
          status,
          progress: parseInt(progress) || 0,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
          clients,
          teamMembers,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create project");

      // Send invitations to all added clients and team members
      const allRecipients = [
        ...clients.map((c) => ({ ...c, type: "client" as const })),
        ...teamMembers.map((m) => ({ ...m, type: "team" as const })),
      ];

      for (const recipient of allRecipients) {
        try {
          await fetch("/api/invitations/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: recipient.email,
              name: recipient.name,
              role: recipient.role,
              type: recipient.type,
              projectId: data.id,
              projectName: data.name,
            }),
          });
        } catch (inviteErr) {
          console.warn("Invitation send warning:", inviteErr);
        }
      }

      onProjectCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "info", label: "Project Info", icon: <Briefcase className="w-3.5 h-3.5" /> },
    { id: "clients", label: "Clients", icon: <Building className="w-3.5 h-3.5" />, count: clients.length },
    { id: "team", label: "Team Members", icon: <Users className="w-3.5 h-3.5" />, count: teamMembers.length },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl shadow-black/20 overflow-hidden font-sans max-h-[90vh] flex flex-col">
              {/* Header */}
              <div
                className="relative px-6 pt-6 pb-4 shrink-0"
                style={{ backgroundImage: "linear-gradient(135deg, #004d40 0%, #00897b 100%)" }}
              >
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
                      <FolderPlus className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-white">Create New Project</h2>
                      <p className="text-[11px] text-white/60 font-medium">
                        Add project details, assign clients & team members to MongoDB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all border border-white/10 text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Tabs Switcher */}
                <div className="flex gap-1 mt-4 bg-black/20 rounded-2xl p-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        activeTab === tab.id
                          ? "bg-white text-[#006858] shadow-sm"
                          : "text-white/70 hover:text-white"
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                      {(tab as any).count > 0 && (
                        <span className="w-4 h-4 rounded-full text-[10px] font-black bg-[#006858] text-white flex items-center justify-center">
                          {(tab as any).count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Content Body */}
              <div className="overflow-y-auto flex-1">
                <form onSubmit={handleSubmit}>
                  {error && (
                    <div className="m-6 mb-0 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                      ⚠ {error}
                    </div>
                  )}

                  <AnimatePresence mode="wait">
                    {/* TAB 1: PROJECT INFO */}
                    {activeTab === "info" && (
                      <motion.div
                        key="info"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="p-6 space-y-5"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-500">
                              <Briefcase className="w-3.5 h-3.5" /> Project Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={name}
                              onChange={(e) => handleNameChange(e.target.value)}
                              placeholder="e.g. Nexus Cloud Migration"
                              className="w-full bg-slate-50 text-slate-900 font-semibold text-sm px-4 py-3 rounded-2xl border border-slate-200 focus:border-[#006858] focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-500">
                              <Sparkles className="w-3.5 h-3.5 text-[#006858]" /> Workspace Chat Channel
                            </label>
                            <div className="relative">
                              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-sm">#</span>
                              <input
                                type="text"
                                value={channelName}
                                onChange={(e) => setChannelName(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                                placeholder="nexus-chat"
                                className="w-full bg-slate-50 text-[#006858] font-bold text-sm pl-8 pr-4 py-3 rounded-2xl border border-slate-200 focus:border-[#006858] focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-500">
                            <AlignLeft className="w-3.5 h-3.5" /> Description
                          </label>
                          <textarea
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe project objectives, deliverables, and scope..."
                            className="w-full bg-slate-50 text-slate-900 font-medium text-sm px-4 py-3 rounded-2xl border border-slate-200 focus:border-[#006858] focus:outline-none resize-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">Status</label>
                            <select
                              value={status}
                              onChange={(e) => setStatus(e.target.value as any)}
                              className="w-full bg-slate-50 font-bold text-xs px-4 py-3 rounded-2xl border border-slate-200 focus:border-[#006858] focus:outline-none text-slate-800 cursor-pointer"
                            >
                              <option value="In Progress">In Progress</option>
                              <option value="Planning">Planning</option>
                              <option value="Completed">Completed</option>
                              <option value="On Hold">On Hold</option>
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">Progress Target (%)</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={progress}
                              onChange={(e) => setProgress(e.target.value)}
                              className="w-full bg-slate-50 text-slate-900 font-bold text-xs px-4 py-3 rounded-2xl border border-slate-200 focus:border-[#006858] focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-500">
                            <Tag className="w-3.5 h-3.5" /> Tags
                          </label>
                          <input
                            type="text"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            placeholder="Design, Next.js, Cloud"
                            className="w-full bg-slate-50 text-slate-900 font-semibold text-xs px-4 py-3 rounded-2xl border border-slate-200 focus:border-[#006858] focus:outline-none"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => setActiveTab("clients")}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-50 text-[#006858] font-bold text-xs border border-emerald-200 hover:bg-emerald-100 transition-all"
                        >
                          Next: Add Clients →
                        </button>
                      </motion.div>
                    )}

                    {/* TAB 2: CLIENTS */}
                    {activeTab === "clients" && (
                      <motion.div
                        key="clients"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="p-6 space-y-5"
                      >
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                          <h4 className="text-xs font-black text-[#0F172A] flex items-center gap-1.5">
                            <UserPlus className="w-4 h-4 text-[#006858]" /> Add Client to Project
                          </h4>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <input
                              type="text"
                              value={clientName}
                              onChange={(e) => setClientName(e.target.value)}
                              placeholder="Client Name (e.g. Sarah Jenkins)"
                              className="bg-white text-xs font-semibold p-2.5 rounded-xl border border-slate-200 focus:border-[#006858]"
                            />
                            <input
                              type="email"
                              value={clientEmail}
                              onChange={(e) => setClientEmail(e.target.value)}
                              placeholder="client@company.com"
                              className="bg-white text-xs font-semibold p-2.5 rounded-xl border border-slate-200 focus:border-[#006858]"
                            />
                            <input
                              type="text"
                              value={clientRole}
                              onChange={(e) => setClientRole(e.target.value)}
                              placeholder="Role / Title"
                              className="bg-white text-xs font-semibold p-2.5 rounded-xl border border-slate-200 focus:border-[#006858]"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={handleAddClient}
                            className="w-full py-2.5 bg-[#006858] hover:bg-[#005245] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                          >
                            + Add Client to Project
                          </button>
                        </div>

                        {/* Clients list */}
                        <div className="space-y-2">
                          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                            {clients.length} Client{clients.length !== 1 ? "s" : ""} Added
                          </p>
                          {clients.length === 0 ? (
                            <div className="p-4 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400 font-medium">
                              No clients added yet. Add clients above to enable direct messaging and call invites.
                            </div>
                          ) : (
                            clients.map((c) => (
                              <div
                                key={c.id}
                                className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs"
                              >
                                <div className="flex items-center gap-3">
                                  <img
                                    src={c.avatar}
                                    alt={c.name}
                                    className="w-8 h-8 rounded-full object-cover bg-emerald-50"
                                  />
                                  <div>
                                    <p className="text-xs font-bold text-slate-800">{c.name}</p>
                                    <p className="text-[10px] text-slate-400">{c.email} · <span className="text-[#006858] font-bold">{c.role}</span></p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setClients(clients.filter((cl) => cl.id !== c.id))}
                                  className="w-7 h-7 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => setActiveTab("team")}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-50 text-[#006858] font-bold text-xs border border-emerald-200 hover:bg-emerald-100 transition-all"
                        >
                          Next: Add Team Members →
                        </button>
                      </motion.div>
                    )}

                    {/* TAB 3: TEAM MEMBERS */}
                    {activeTab === "team" && (
                      <motion.div
                        key="team"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="p-6 space-y-5"
                      >
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                          <h4 className="text-xs font-black text-[#0F172A] flex items-center gap-1.5">
                            <UserPlus className="w-4 h-4 text-[#006858]" /> Add Team Member
                          </h4>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <input
                              type="text"
                              value={memberName}
                              onChange={(e) => setMemberName(e.target.value)}
                              placeholder="Member Name"
                              className="bg-white text-xs font-semibold p-2.5 rounded-xl border border-slate-200 focus:border-[#006858]"
                            />
                            <input
                              type="email"
                              value={memberEmail}
                              onChange={(e) => setMemberEmail(e.target.value)}
                              placeholder="member@ibwtech.com"
                              className="bg-white text-xs font-semibold p-2.5 rounded-xl border border-slate-200 focus:border-[#006858]"
                            />
                            <input
                              type="text"
                              value={memberRole}
                              onChange={(e) => setMemberRole(e.target.value)}
                              placeholder="Role (e.g. Lead, Dev, QA)"
                              className="bg-white text-xs font-semibold p-2.5 rounded-xl border border-slate-200 focus:border-[#006858]"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={handleAddMember}
                            className="w-full py-2.5 bg-[#006858] hover:bg-[#005245] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                          >
                            + Add Team Member
                          </button>
                        </div>

                        {/* Team members list */}
                        <div className="space-y-2">
                          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                            {teamMembers.length} Team Member{teamMembers.length !== 1 ? "s" : ""} Added
                          </p>
                          {teamMembers.length === 0 ? (
                            <div className="p-4 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400 font-medium">
                              No team members added yet. Add team members to assign tasks and chat.
                            </div>
                          ) : (
                            teamMembers.map((m) => (
                              <div
                                key={m.id}
                                className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs"
                              >
                                <div className="flex items-center gap-3">
                                  <img
                                    src={m.avatar}
                                    alt={m.name}
                                    className="w-8 h-8 rounded-full object-cover bg-emerald-50"
                                  />
                                  <div>
                                    <p className="text-xs font-bold text-slate-800">{m.name}</p>
                                    <p className="text-[10px] text-slate-400">{m.email} · <span className="text-[#006858] font-bold">{m.role}</span></p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setTeamMembers(teamMembers.filter((mem) => mem.id !== m.id))}
                                  className="w-7 h-7 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Footer */}
                  <div className="px-6 pb-6 pt-2 flex gap-3 border-t border-slate-100 bg-white">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 py-3 px-4 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !name.trim()}
                      className="flex-[2] py-3 px-6 rounded-2xl font-extrabold text-sm text-white shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
                      style={{ backgroundImage: "linear-gradient(135deg, #006858 0%, #00897b 100%)" }}
                    >
                      {loading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          Saving to MongoDB...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Save Project to MongoDB
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
