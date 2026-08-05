"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Building, Mail, Lock, ArrowRight, Eye, EyeOff, ShieldCheck, CheckCircle } from "lucide-react";

export default function ClientLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("client@acme.com");
  const [password, setPassword] = useState("client123");
  const [showPassword, setShowPassword] = useState(false);
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

      const isClient = data.user.type === "client" || (data.user.role || "").toLowerCase().includes("client");

      if (!isClient) {
        throw new Error("This login portal is strictly for Client accounts. Please use the Team or Leader login.");
      }

      const userObj = {
        name: data.user.name,
        email: data.user.email,
        role: data.user.role || "Client Contact",
        type: "client",
        avatar: data.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.user.email)}`,
      };
      localStorage.setItem("taskconnect_user", JSON.stringify(userObj));
      router.push("/client/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans bg-slate-50">
      {/* LEFT BRAND PANEL */}
      <motion.div
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="hidden lg:flex lg:w-[50%] relative overflow-hidden flex-col justify-between p-12"
        style={{ background: "linear-gradient(135deg, #004d40 0%, #006858 50%, #059669 100%)" }}
      >
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
            <Building className="w-4 h-4 text-emerald-200" />
            <span className="text-xs font-bold text-white/90">Client Collaboration Portal</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <h1 className="text-5xl font-black text-white leading-tight">
              Client Contact
              <br />
              <span className="text-emerald-200">Portal</span>
            </h1>
            <p className="text-emerald-100 text-sm mt-4 max-w-md font-medium leading-relaxed">
              Access your dedicated project dashboard, review milestone progress, communicate directly with the team leader, and stay updated on deliverables.
            </p>
          </motion.div>

          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-3 text-white text-xs font-semibold">
              <CheckCircle className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Real-time status updates on assigned client projects</span>
            </div>
            <div className="flex items-center gap-3 text-white text-xs font-semibold">
              <CheckCircle className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Direct messaging with project leaders & developers</span>
            </div>
            <div className="flex items-center gap-3 text-white text-xs font-semibold">
              <CheckCircle className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Secure document & file attachments sharing</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-white/70 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-300" />
          <span>Encrypted Client Portal · TaskConnect Enterprise</span>
        </div>
      </motion.div>

      {/* RIGHT FORM PANEL */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md space-y-8 bg-white p-8 md:p-10 rounded-3xl border border-slate-200/90 shadow-xl"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#006858] flex items-center justify-center mb-4">
              <Building className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Client Sign In</h2>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Sign in with your registered client email to access your project dashboard.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Client Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="client@company.com"
                  required
                  className="w-full bg-[#EEF2F6] text-xs text-slate-900 font-bold placeholder-slate-400 pl-11 pr-4 py-3 rounded-2xl border border-slate-200/80 focus:bg-white focus:ring-2 focus:ring-[#006858] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#EEF2F6] text-xs text-slate-900 font-bold placeholder-slate-400 pl-11 pr-11 py-3 rounded-2xl border border-slate-200/80 focus:bg-white focus:ring-2 focus:ring-[#006858] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-[#006858] hover:bg-emerald-800 text-white font-extrabold text-xs rounded-2xl transition-all shadow-md shadow-[#006858]/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Sign In to Client Portal"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center space-y-2">
            <p className="text-xs text-slate-500 font-semibold">
              Are you a team member or leader?
            </p>
            <div className="flex items-center justify-center gap-4 text-xs font-bold text-[#006858]">
              <Link href="/member/login" className="hover:underline">Team Member Login</Link>
              <span>·</span>
              <Link href="/login" className="hover:underline">Leader Login</Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
