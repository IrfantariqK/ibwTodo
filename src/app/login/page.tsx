"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  CheckSquare,
  TrendingUp,
  Activity,
} from "lucide-react";

export default function LoginRoutePage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Login failed.");

      const userObj = {
        name: data.user.name,
        email: data.user.email,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.user.email)}`,
      };
      localStorage.setItem("taskconnect_user", JSON.stringify(userObj));
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans">
      {/* ─── LEFT PANEL ─── */}
      <motion.div
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col justify-between p-12"
        style={{ background: "linear-gradient(135deg, #004d40 0%, #00897b 50%, #43d4b8 100%)" }}
      >
        {/* Subtle background rings */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-40 -right-20 w-[500px] h-[500px] rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-white/[0.03]" />

        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
            <Activity className="w-3.5 h-3.5 text-emerald-200" />
            <span className="text-xs font-bold text-white/90">Enterprise Task Management</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
            <CheckSquare className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10 space-y-6">
          {/* Large watermark */}
          <div className="absolute -top-20 -left-6 text-[120px] font-black text-white/[0.07] leading-none select-none pointer-events-none">
            TC
          </div>

          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <h1 className="text-5xl font-black text-white leading-tight">
              TaskConnect
              <br />
              <span className="text-emerald-200">Workspace</span>
            </h1>
            <p className="mt-4 text-sm text-white/70 font-medium leading-relaxed max-w-sm">
              Manage tasks, track projects, schedule meetings, and collaborate
              with your team — all powered by real-time MongoDB Atlas data.
            </p>
          </motion.div>

          {/* Analytics preview card */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-5 space-y-4 max-w-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/50">
                WORKSPACE ANALYTICS
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-300">Live Sync</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Active Tasks", value: "–", color: "text-emerald-300" },
                { label: "Projects", value: "–", color: "text-amber-300" },
                { label: "Meetings", value: "–", color: "text-sky-300" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
                  <p className="text-[10px] text-white/50 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex items-center justify-between text-[10px] text-white/50 font-bold mb-1.5">
                <span>Monthly Target</span>
                <span>MongoDB Atlas</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "62%" }}
                  transition={{ delay: 0.9, duration: 1, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
              <span className="text-xs text-white/60 font-medium">
                Real data updates instantly on every action
              </span>
            </div>
          </motion.div>
        </div>

        {/* Bottom text */}
        <div className="relative z-10">
          <p className="text-xs text-white/40 font-medium">
            © 2026 TaskConnect · Powered by IBWTECH
          </p>
        </div>
      </motion.div>

      {/* ─── RIGHT PANEL ─── */}
      <motion.div
        initial={{ x: 60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="flex-1 flex flex-col justify-center px-8 md:px-16 bg-white"
      >
        <div className="w-full max-w-sm mx-auto space-y-8">
          {/* Logo */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex items-center gap-2.5"
          >
            <div className="w-10 h-10 rounded-xl bg-[#006858] flex items-center justify-center shadow-lg shadow-[#006858]/30">
              <Zap className="w-5 h-5 fill-white text-white" />
            </div>
            <span className="text-lg font-extrabold text-[#0F172A]">TaskConnect</span>
          </motion.div>

          {/* Heading */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <Zap className="w-3.5 h-3.5 text-[#006858]" />
              <span className="text-xs font-bold text-[#006858]">
                Task Management Portal
              </span>
            </div>
            <h2 className="text-2xl font-black text-[#0F172A]">Welcome Back</h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Sign in to manage your tasks, projects, and team.
            </p>
          </motion.div>

          {/* Form */}
          <motion.form
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold"
                >
                  ⚠ {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                Work Email / Employee ID
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@ibwtech.com"
                  className="w-full bg-slate-50 text-slate-900 font-semibold text-sm p-3 pl-10 rounded-xl border border-slate-200 focus:border-[#006858] focus:outline-none focus:ring-2 focus:ring-[#006858]/20 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                Access Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 text-slate-900 font-semibold text-sm p-3 pl-10 pr-10 rounded-xl border border-slate-200 focus:border-[#006858] focus:outline-none focus:ring-2 focus:ring-[#006858]/20 transition-all placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <div
                onClick={() => setRememberMe(!rememberMe)}
                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                  rememberMe ? "bg-[#006858] border-[#006858]" : "border-slate-300 bg-white"
                }`}
              >
                {rememberMe && <span className="text-white text-[10px] font-black">✓</span>}
              </div>
              <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">
                Remember Me
              </span>
            </label>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-[#006858] hover:bg-[#005245] disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold text-sm rounded-xl shadow-lg shadow-[#006858]/25 transition-all"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Enter TaskConnect
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </motion.form>

          {/* Signup Link */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-center text-xs text-slate-500 font-medium"
          >
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-[#006858] font-bold hover:underline transition-all"
            >
              Create Account →
            </Link>
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
