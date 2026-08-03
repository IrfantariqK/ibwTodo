"use client";

import React, { useState } from "react";
import { Settings, Shield, Bell, Key, User, Save, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const SettingsView: React.FC = () => {
  const [saved, setSaved] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("TaskConnect Enterprise");
  const [emailNotifications, setEmailNotifications] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans text-[#0F172A]">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#006858]" />
          Workspace Settings & Preferences
        </h1>
        <p className="text-xs text-slate-500 font-semibold mt-1">
          Configure security, notifications, branding, and API integrations.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Workspace Details */}
        <div className="modern-card rounded-3xl p-6 bg-white border border-slate-200/90 shadow-sm space-y-4">
          <h3 className="font-extrabold text-base flex items-center gap-2">
            <User className="w-4 h-4 text-[#006858]" />
            General Information
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Workspace Title</label>
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="w-full bg-slate-50 text-slate-900 font-bold p-2.5 rounded-xl border border-slate-200 focus:border-[#006858] text-xs"
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="modern-card rounded-3xl p-6 bg-white border border-slate-200/90 shadow-sm space-y-4">
          <h3 className="font-extrabold text-base flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#006858]" />
            Notification Preferences
          </h3>

          <label className="flex items-center gap-3 cursor-pointer text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              className="rounded border-slate-300 text-[#006858] focus:ring-[#006858]"
            />
            <span>Receive email notifications for urgent tasks & meeting updates</span>
          </label>
        </div>

        {/* Security & Database */}
        <div className="modern-card rounded-3xl p-6 bg-white border border-slate-200/90 shadow-sm space-y-4">
          <h3 className="font-extrabold text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#006858]" />
            Database & Security Status
          </h3>

          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-xs font-semibold text-emerald-800 space-y-1">
            <p className="font-bold">MongoDB Atlas Live Connection Active</p>
            <p className="text-[11px] opacity-80">Cluster 0 • AES-256 Encryption • HTTP-Only Cookie Session</p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            icon={saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            className="bg-[#006858] hover:bg-[#005245] rounded-xl font-bold px-6"
          >
            {saved ? "Saved Successfully!" : "Save Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
};
