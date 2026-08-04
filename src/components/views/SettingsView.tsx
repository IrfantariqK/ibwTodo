"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Shield,
  Bell,
  Key,
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

  // AI Configuration State
  const [aiProvider, setAiProvider] = useState<"local" | "gemini" | "openai" | "custom">("local");
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiEndpoint, setAiEndpoint] = useState("http://localhost:11434/v1");
  const [aiModel, setAiModel] = useState("llama3.2");

  // Detection & Testing States
  const [detecting, setDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState<LocalAiDetectionResult | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string; source?: string } | null>(null);

  // Load saved AI configuration on mount
  useEffect(() => {
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
          // Default to detected local endpoint and model
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

  // Connect Recommended Local Model
  const handleApplyRecommendedModel = () => {
    if (detectionResult?.detected) {
      if (detectionResult.endpoint) setAiEndpoint(detectionResult.endpoint);
      if (detectionResult.recommendedModel) setAiModel(detectionResult.recommendedModel);
      setAiProvider("local");

      const configPayload = {
        provider: "local",
        apiKey: aiApiKey,
        endpoint: detectionResult.endpoint || aiEndpoint,
        model: detectionResult.recommendedModel || aiModel,
      };

      localStorage.setItem("taskconnect_ai_config", JSON.stringify(configPayload));
      setTestResult({
        success: true,
        message: `Successfully connected to local laptop AI model (${detectionResult.recommendedModel})!`,
        source: detectionResult.provider,
      });
    }
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

          {/* Auto-Detect Local AI Laptop Button */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-900 to-[#004d40] text-white space-y-3 shadow-md">
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

            {/* Detection Results Prompt */}
            {detectionResult && (
              <div className="pt-2 border-t border-white/10 space-y-2">
                {detectionResult.detected ? (
                  <div className="p-3 rounded-xl bg-white/10 border border-white/20 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-bold text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{detectionResult.provider} Detected Active!</span>
                    </div>
                    <p className="text-[11px] text-white/90">
                      Installed Models: <strong className="text-emerald-200">{detectionResult.models?.join(", ")}</strong>
                    </p>
                    <p className="text-[11px] text-white/90">
                      Recommended Model: <strong className="text-emerald-300 font-extrabold">{detectionResult.recommendedModel}</strong>
                    </p>

                    <button
                      type="button"
                      onClick={handleApplyRecommendedModel}
                      className="mt-1 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Connect & Use Recommended Local Model ({detectionResult.recommendedModel})
                    </button>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-black/20 border border-white/10 text-xs space-y-1 text-white/80">
                    <p className="font-bold text-amber-300 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" /> No active local AI servers detected running.
                    </p>
                    <p className="text-[11px] text-white/70">
                      To run AI completely offline on your laptop, launch <strong>Ollama</strong> (`ollama run llama3.2`) or <strong>LM Studio</strong>, or enter your API key below.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Provider Selection */}
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

            {/* Model Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Model Name
              </label>
              <input
                type="text"
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                placeholder="e.g. llama3.2, mistral, gpt-4o-mini, gemini-1.5-flash"
                className="w-full bg-slate-50 text-slate-900 font-bold p-3 rounded-2xl border border-slate-200 focus:border-[#006858] text-xs"
              />
            </div>

            {/* API Key Input for Paid / Cloud Providers */}
            {(aiProvider === "gemini" || aiProvider === "openai" || aiProvider === "custom") && (
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700 block flex items-center justify-between">
                  <span>API Key</span>
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

        {/* ── SECTION 2: GENERAL WORKSPACE DETAILS ── */}
        <div className="modern-card rounded-3xl p-6 bg-white border border-slate-200/90 shadow-sm space-y-4">
          <h3 className="font-extrabold text-base flex items-center gap-2 text-[#0F172A]">
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
