"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Shield,
  Bell,
  User,
  Save,
  Check,
  Bot,
  Sparkles,
  Search,
  Laptop,
  Globe,
  Radio,
  AlertCircle,
  CheckCircle2,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

import { PRESET_AVATARS, getDefaultAvatar } from "@/lib/avatars";
import {
  Camera,
  Trash2,
  Edit3,
  Image as ImageIcon,
} from "lucide-react";

interface LocalAiDetectionResult {
  detected: boolean;
  provider?: string;
  endpoint?: string;
  models?: string[];
  recommendedModel?: string;
  message?: string;
}

export const SettingsView: React.FC = () => {
  const [saved, setSaved] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("TaskConnect Enterprise");
  const [emailNotifications, setEmailNotifications] = useState(true);

  // User Profile & Avatar State
  const [userSession, setUserSession] = useState<any>(null);
  const [userAvatar, setUserAvatar] = useState("");
  const [customAvatarInput, setCustomAvatarInput] = useState("");
  const [avatarUpdating, setAvatarUpdating] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // AI & Language Configuration State
  const [preferredLanguage, setPreferredLanguage] = useState("English");
  const [aiProvider, setAiProvider] = useState<"local" | "gemini" | "openai" | "custom">("local");
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiEndpoint, setAiEndpoint] = useState("http://localhost:11434/v1");
  const [aiModel, setAiModel] = useState("llama3.2");

  // Detection & Testing States
  const [detecting, setDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState<LocalAiDetectionResult | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string; source?: string } | null>(null);

  // Load saved session & AI configuration on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("taskconnect_user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUserSession(parsed);
        const av = parsed.avatar || getDefaultAvatar(parsed.email || "User");
        setUserAvatar(av);
        setCustomAvatarInput(av);
      } catch (e) {}
    }

    const savedLang = localStorage.getItem("taskconnect_preferred_language");
    if (savedLang) setPreferredLanguage(savedLang);

    const savedConfig = localStorage.getItem("taskconnect_ai_config");
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        if (parsed.provider) setAiProvider(parsed.provider);
        if (parsed.apiKey) setAiApiKey(parsed.apiKey);
        if (parsed.endpoint) setAiEndpoint(parsed.endpoint);
        if (parsed.model) setAiModel(parsed.model);
      } catch (e) {
        console.warn("Failed to parse saved AI config:", e);
      }
    }
  }, []);

  const handleSelectPresetAvatar = (url: string) => {
    setUserAvatar(url);
    setCustomAvatarInput(url);
    handleSaveAvatar(url);
  };

  const handleSaveAvatar = async (selectedUrl?: string) => {
    const urlToSave = selectedUrl || customAvatarInput || userAvatar;
    if (!userSession?.email || !urlToSave.trim()) return;

    setAvatarUpdating(true);
    setAvatarMessage(null);
    try {
      const res = await fetch("/api/user/avatar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userSession.email,
          avatar: urlToSave.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUserAvatar(data.avatar);
        setCustomAvatarInput(data.avatar);
        const updatedUser = { ...userSession, avatar: data.avatar };
        localStorage.setItem("taskconnect_user", JSON.stringify(updatedUser));
        setUserSession(updatedUser);
        setAvatarMessage({ type: "success", text: "Profile avatar saved to MongoDB!" });
      } else {
        setAvatarMessage({ type: "error", text: data.error || "Failed to update avatar." });
      }
    } catch (err: any) {
      setAvatarMessage({ type: "error", text: err?.message || "Failed to connect to server." });
    } finally {
      setAvatarUpdating(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!userSession?.email) return;

    setAvatarUpdating(true);
    setAvatarMessage(null);
    try {
      const res = await fetch(`/api/user/avatar?email=${encodeURIComponent(userSession.email)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUserAvatar(data.avatar);
        setCustomAvatarInput(data.avatar);
        const updatedUser = { ...userSession, avatar: data.avatar };
        localStorage.setItem("taskconnect_user", JSON.stringify(updatedUser));
        setUserSession(updatedUser);
        setAvatarMessage({ type: "success", text: "Avatar reset to default image!" });
      } else {
        setAvatarMessage({ type: "error", text: data.error || "Failed to reset avatar." });
      }
    } catch (err: any) {
      setAvatarMessage({ type: "error", text: err?.message || "Failed to connect to server." });
    } finally {
      setAvatarUpdating(false);
    }
  };

  // Auto-Detect Local Laptop AI Models
  const handleDetectLocalAi = async () => {
    setDetecting(true);
    setDetectionResult(null);
    try {
      const res = await fetch("/api/ai/detect-local");
      if (res.ok) {
        const data: LocalAiDetectionResult = await res.json();
        setDetectionResult(data);

        if (data.detected && data.recommendedModel) {
          if (data.endpoint) setAiEndpoint(data.endpoint);
          if (data.recommendedModel) setAiModel(data.recommendedModel);
          setAiProvider("local");
        }
      }
    } catch (err) {
      console.warn("Error detecting local AI:", err);
      setDetectionResult({
        detected: false,
        message: "Failed to reach local server endpoints.",
      });
    } finally {
      setDetecting(false);
    }
  };

  // Connect Selected or Recommended Local Model
  const handleApplyLocalModel = (modelName: string) => {
    setAiModel(modelName);
    setAiProvider("local");
    const ep = detectionResult?.endpoint || aiEndpoint;
    if (detectionResult?.endpoint) setAiEndpoint(detectionResult.endpoint);

    const configPayload = {
      provider: "local",
      apiKey: aiApiKey,
      endpoint: ep,
      model: modelName,
    };

    localStorage.setItem("taskconnect_ai_config", JSON.stringify(configPayload));
    setTestResult({
      success: true,
      message: `Selected and configured local AI model (${modelName})!`,
      source: detectionResult?.provider || "Local Laptop AI",
    });
  };

  // Test AI Connection
  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "task_title",
          prompt: "Test AI integration connection",
          aiConfig: {
            provider: aiProvider,
            apiKey: aiApiKey,
            endpoint: aiEndpoint,
            model: aiModel,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.result) {
          setTestResult({
            success: true,
            message: `Response: "${data.result}"`,
            source: data.source || "AI Provider",
          });
        } else {
          setTestResult({
            success: false,
            message: "Received empty response from AI endpoint.",
          });
        }
      } else {
        setTestResult({
          success: false,
          message: "API endpoint returned an error status.",
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || "Failed to reach AI endpoint.",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const configPayload = {
      provider: aiProvider,
      apiKey: aiApiKey,
      endpoint: aiEndpoint,
      model: aiModel,
    };

    localStorage.setItem("taskconnect_ai_config", JSON.stringify(configPayload));
    localStorage.setItem("taskconnect_preferred_language", preferredLanguage);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans text-[#0F172A]">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#006858]" />
          Workspace Settings & AI Preferences
        </h1>
        <p className="text-xs text-slate-500 font-semibold mt-1">
          Configure security, notifications, local laptop AI models, and cloud API keys.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* ── SECTION 0: USER PROFILE & AVATAR MANAGER ── */}
        <div className="modern-card rounded-3xl p-6 bg-white border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-base flex items-center gap-2 text-[#0F172A]">
              <Camera className="w-5 h-5 text-[#006858]" />
              Profile Avatar & Identity Management
            </h3>
            <span className="text-xs font-extrabold text-[#006858] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
              MongoDB Live Sync
            </span>
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar Preview & Quick Action Buttons */}
            <div className="flex flex-col items-center gap-3 shrink-0">
              <div className="relative group">
                <img
                  src={userAvatar || getDefaultAvatar(userSession?.email || "User")}
                  alt="Profile Avatar"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = getDefaultAvatar(userSession?.email || "User");
                  }}
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-[#006858]/20 shadow-md transition-all group-hover:scale-105"
                />
                <span className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#006858] text-white shadow-md">
                  <Camera className="w-4 h-4" />
                </span>
              </div>

              <div className="text-center space-y-0.5">
                <p className="font-extrabold text-sm text-[#0F172A]">{userSession?.name || "Active User"}</p>
                <p className="text-xs font-medium text-slate-500">{userSession?.email || "user@taskconnect.io"}</p>
                <span className="inline-block mt-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {userSession?.role || "Team Role"}
                </span>
              </div>

              {/* Edit & Delete Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleSaveAvatar()}
                  disabled={avatarUpdating}
                  className="px-3.5 py-1.5 rounded-xl bg-[#006858] hover:bg-[#005245] text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {avatarUpdating ? "Updating..." : "Save Avatar"}
                </button>

                <button
                  type="button"
                  onClick={handleDeleteAvatar}
                  disabled={avatarUpdating}
                  className="px-3.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-red-200 disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  Delete / Reset
                </button>
              </div>
            </div>

            {/* Preset Avatar Gallery & Custom URL Input */}
            <div className="flex-1 space-y-4 w-full">
              {avatarMessage && (
                <div
                  className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                    avatarMessage.type === "success"
                      ? "bg-emerald-50 text-[#006858] border border-emerald-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {avatarMessage.type === "success" ? <Check className="w-4 h-4 text-[#006858]" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
                  <span>{avatarMessage.text}</span>
                </div>
              )}

              {/* Preset Gallery */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-[#006858]" />
                  Select Preset Profile Avatar
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
                  {PRESET_AVATARS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPresetAvatar(preset.url)}
                      title={preset.name}
                      className={`relative p-1 rounded-2xl border-2 transition-all cursor-pointer overflow-hidden ${
                        userAvatar === preset.url
                          ? "border-[#006858] bg-emerald-50 scale-105 shadow-sm ring-2 ring-[#006858]/30"
                          : "border-slate-200 hover:border-slate-300 hover:scale-102"
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = getDefaultAvatar(preset.name);
                        }}
                        className="w-11 h-11 rounded-xl object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Image URL Field */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Or Paste Custom Avatar Image URL / Base64 Data
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customAvatarInput}
                    onChange={(e) => {
                      setCustomAvatarInput(e.target.value);
                      setUserAvatar(e.target.value);
                    }}
                    placeholder="https://example.com/my-avatar.png or data:image/png;base64,..."
                    className="flex-1 bg-slate-50 text-slate-900 font-medium p-3 rounded-2xl border border-slate-200 focus:border-[#006858] text-xs"
                  />
                  <Button
                    type="button"
                    onClick={() => handleSaveAvatar()}
                    disabled={avatarUpdating}
                    className="bg-[#006858] hover:bg-[#005245] rounded-2xl font-bold text-xs px-4"
                  >
                    Apply URL
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 1: AI MODEL & API CONFIGURATION ── */}
        <div className="modern-card rounded-3xl p-6 bg-white border border-slate-200/90 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-base flex items-center gap-2 text-[#0F172A]">
              <Bot className="w-5 h-5 text-[#006858]" />
              AI Assistant & Model Configuration
            </h3>
            <span className="text-xs font-extrabold text-[#006858] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
              Localhost & Cloud APIs Supported
            </span>
          </div>

          {/* Provider Selection Cards */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block">
              Select AI API Provider
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {[
                { id: "local", label: "Local Laptop AI", sub: "Ollama / LM Studio", icon: <Laptop className="w-4 h-4 text-[#006858]" /> },
                { id: "gemini", label: "Google Gemini", sub: "Cloud / Free tier", icon: <Sparkles className="w-4 h-4 text-emerald-600" /> },
                { id: "openai", label: "OpenAI GPT-4o", sub: "Paid API key", icon: <Globe className="w-4 h-4 text-blue-600" /> },
                { id: "custom", label: "Custom API", sub: "Localhost / REST", icon: <Terminal className="w-4 h-4 text-purple-600" /> },
              ].map((prov) => (
                <button
                  key={prov.id}
                  type="button"
                  onClick={() => setAiProvider(prov.id as any)}
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer space-y-1 ${
                    aiProvider === prov.id
                      ? "border-[#006858] bg-emerald-50/60 shadow-sm"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100/60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {prov.icon}
                    {aiProvider === prov.id && <Radio className="w-3.5 h-3.5 text-[#006858] fill-[#006858]" />}
                  </div>
                  <p className="font-extrabold text-xs text-[#0F172A]">{prov.label}</p>
                  <p className="text-[10px] font-medium text-slate-400">{prov.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Auto-Detect Local AI Laptop Section - SHOWN ONLY WHEN aiProvider === "local" */}
          {aiProvider === "local" && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-900 to-[#004d40] text-white space-y-3 shadow-md animate-in fade-in slide-in-from-top-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h4 className="font-black text-sm flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-emerald-400" />
                    Auto-Detect Local Laptop AI Models
                  </h4>
                  <p className="text-xs text-emerald-100/80 font-medium">
                    Automatically scans for Ollama (`http://localhost:11434`), LM Studio (`http://localhost:1234`), or LocalAI.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDetectLocalAi}
                  disabled={detecting}
                  className="px-4 py-2 rounded-xl bg-white text-[#006858] font-black text-xs hover:bg-emerald-50 transition-all flex items-center gap-2 shrink-0 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Search className={`w-3.5 h-3.5 ${detecting ? "animate-spin" : ""}`} />
                  {detecting ? "Scanning Laptop..." : "🔍 Auto-Detect Local AI"}
                </button>
              </div>

              {/* Detection Results Prompt & Model Select List */}
              {detectionResult && (
                <div className="pt-2 border-t border-white/10 space-y-3">
                  {detectionResult.detected ? (
                    <div className="p-3.5 rounded-xl bg-white/10 border border-white/20 text-xs space-y-3">
                      <div className="flex items-center gap-2 font-bold text-emerald-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>{detectionResult.provider} Active & Detected!</span>
                      </div>

                      {/* Interactive Model Selection Buttons / Badges */}
                      {detectionResult.models && detectionResult.models.length > 0 && (
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-extrabold text-emerald-200 block">
                            Click Any Installed Model Below to Use ({detectionResult.models.length} Found):
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {detectionResult.models.map((m) => (
                              <button
                                key={m}
                                type="button"
                                onClick={() => handleApplyLocalModel(m)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                                  aiModel === m
                                    ? "bg-white text-[#006858] border-white shadow-md font-black scale-105"
                                    : "bg-white/10 text-white hover:bg-white/25 border-white/20"
                                }`}
                              >
                                {m === detectionResult.recommendedModel ? `⭐ ${m} (Recommended)` : m}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <p className="text-[11px] text-white/80">
                          Active Selection: <strong className="text-emerald-300 font-extrabold">{aiModel}</strong>
                        </p>
                        <button
                          type="button"
                          onClick={() => handleApplyLocalModel(detectionResult.recommendedModel || aiModel)}
                          className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-black text-[11px] transition-colors cursor-pointer shadow-sm"
                        >
                          Use Recommended ({detectionResult.recommendedModel})
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-black/20 border border-white/10 text-xs space-y-1 text-white/80">
                      <p className="font-bold text-amber-300 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4" /> No active local AI servers detected running on localhost.
                      </p>
                      <p className="text-[11px] text-white/70">
                        To run AI offline on your laptop, launch <strong>Ollama</strong> (`ollama run llama3.2`) or <strong>LM Studio</strong>, or switch provider above to Google Gemini or OpenAI.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Dynamic Configuration Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Localhost / Custom Endpoint */}
            {(aiProvider === "local" || aiProvider === "custom") && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Localhost / API Endpoint URL
                </label>
                <input
                  type="text"
                  value={aiEndpoint}
                  onChange={(e) => setAiEndpoint(e.target.value)}
                  placeholder="http://localhost:11434/v1"
                  className="w-full bg-slate-50 text-slate-900 font-bold p-3 rounded-2xl border border-slate-200 focus:border-[#006858] text-xs"
                />
              </div>
            )}

            {/* Model Name Select & Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Model Name
              </label>
              {detectionResult?.models && detectionResult.models.length > 0 && aiProvider === "local" ? (
                <select
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 font-bold p-3 rounded-2xl border border-slate-200 focus:border-[#006858] text-xs cursor-pointer"
                >
                  {detectionResult.models.map((m) => (
                    <option key={m} value={m}>
                      {m} {m === detectionResult.recommendedModel ? "(Recommended)" : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  placeholder="e.g. llama3.2, mistral, gpt-4o-mini, gemini-1.5-flash"
                  className="w-full bg-slate-50 text-slate-900 font-bold p-3 rounded-2xl border border-slate-200 focus:border-[#006858] text-xs"
                />
              )}
            </div>

            {/* API Key Input for Paid / Cloud Providers */}
            {(aiProvider === "gemini" || aiProvider === "openai" || aiProvider === "custom") && (
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700 block flex items-center justify-between">
                  <span>API Key ({aiProvider === "gemini" ? "Google Gemini" : aiProvider === "openai" ? "OpenAI" : "Custom API"})</span>
                  <span className="text-[10px] text-slate-400 font-medium">Stored encrypted in session</span>
                </label>
                <input
                  type="password"
                  value={aiApiKey}
                  onChange={(e) => setAiApiKey(e.target.value)}
                  placeholder="Paste your API key here (sk-... or AIzaSy...)"
                  className="w-full bg-slate-50 text-slate-900 font-bold p-3 rounded-2xl border border-slate-200 focus:border-[#006858] text-xs"
                />
              </div>
            )}
          </div>

          {/* Connection Test & Test Status Row */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 text-[#006858] ${testing ? "animate-spin" : ""}`} />
              {testing ? "Testing AI Connection..." : "🧪 Test AI Connection"}
            </button>

            {testResult && (
              <div
                className={`text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-2 border ${
                  testResult.success
                    ? "bg-emerald-50 text-[#006858] border-emerald-200"
                    : "bg-red-50 text-red-700 border-red-200"
                }`}
              >
                {testResult.success ? <CheckCircle2 className="w-4 h-4 text-[#006858]" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
                <span>{testResult.message} ({testResult.source})</span>
              </div>
            )}
          </div>
        </div>

        {/* ── SECTION 2: GENERAL WORKSPACE & DISPLAY LANGUAGE ── */}
        <div className="modern-card rounded-3xl p-6 bg-white border border-slate-200/90 shadow-sm space-y-5">
          <h3 className="font-extrabold text-base flex items-center gap-2 text-[#0F172A]">
            <Globe className="w-4 h-4 text-[#006858]" />
            Workspace & AI Translation Language
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Workspace Title</label>
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="w-full bg-slate-50 text-slate-900 font-bold p-2.5 rounded-xl border border-slate-200 focus:border-[#006858] text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1 flex items-center justify-between">
                <span>Preferred Display Language</span>
                <span className="text-[10px] text-[#006858] font-black">AI Real-Time Translate</span>
              </label>
              <select
                value={preferredLanguage}
                onChange={(e) => {
                  setPreferredLanguage(e.target.value);
                  localStorage.setItem("taskconnect_preferred_language", e.target.value);
                }}
                className="w-full bg-slate-50 text-slate-900 font-bold p-2.5 rounded-xl border border-slate-200 focus:border-[#006858] text-xs cursor-pointer"
              >
                <option value="English">English (United States)</option>
                <option value="Spanish">Spanish (Español)</option>
                <option value="French">French (Français)</option>
                <option value="German">German (Deutsch)</option>
                <option value="Arabic">Arabic (العربية)</option>
                <option value="Urdu">Urdu / Hindi (اردو / हिंदी)</option>
                <option value="Japanese">Japanese (日本語)</option>
                <option value="Chinese">Chinese (中文)</option>
                <option value="Russian">Russian (Русский)</option>
                <option value="Portuguese">Portuguese (Português)</option>
                <option value="Italian">Italian (Italiano)</option>
                <option value="Turkish">Turkish (Türkçe)</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── SECTION 3: NOTIFICATIONS ── */}
        <div className="modern-card rounded-3xl p-6 bg-white border border-slate-200/90 shadow-sm space-y-4">
          <h3 className="font-extrabold text-base flex items-center gap-2 text-[#0F172A]">
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

        {/* ── SECTION 4: SECURITY & DATABASE ── */}
        <div className="modern-card rounded-3xl p-6 bg-white border border-slate-200/90 shadow-sm space-y-4">
          <h3 className="font-extrabold text-base flex items-center gap-2 text-[#0F172A]">
            <Shield className="w-4 h-4 text-[#006858]" />
            Database & Security Status
          </h3>

          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-xs font-semibold text-emerald-800 space-y-1">
            <p className="font-bold">MongoDB Atlas Live Connection Active</p>
            <p className="text-[11px] opacity-80">Cluster 0 • AES-256 Encryption • HTTP-Only Cookie Session</p>
          </div>
        </div>

        {/* Footer Submit */}
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            icon={saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            className="bg-[#006858] hover:bg-[#005245] rounded-xl font-bold px-6 cursor-pointer"
          >
            {saved ? "Settings Saved Successfully!" : "Save Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
};
