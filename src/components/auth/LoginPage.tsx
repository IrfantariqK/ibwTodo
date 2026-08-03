"use client";

import React, { useState } from "react";
import { Zap, Mail, Lock, User as UserIcon, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = isSignUp ? "/api/auth/signup" : "/api/auth/login";
    const payload = isSignUp ? { name, email, password } : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      // Generate a cool cartoon avatar based on seed
      const userObj = {
        name: data.user?.name || name || email.split("@")[0],
        email: data.user?.email || email,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
          data.user?.email || email
        )}`,
      };

      localStorage.setItem("taskconnect_user", JSON.stringify(userObj));
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4 font-sans text-[#0F172A]">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#006858] text-white mx-auto flex items-center justify-center shadow-lg shadow-[#006858]/30">
            <Zap className="w-6 h-6 fill-white" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-[#0F172A]">Form IBW TECH</h2>
          <p className="text-xs text-slate-500 font-semibold">
            TaskConnect Enterprise Management Platform
          </p>
        </div>

        {/* Auth Card */}
        <div className="modern-card rounded-3xl p-8 bg-white border border-slate-200/90 shadow-xl space-y-6">
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                !isSignUp ? "bg-white text-[#006858] shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                isSignUp ? "bg-white text-[#006858] shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Irfan Tariq"
                    className="w-full bg-slate-50 text-slate-900 font-bold p-3 pl-10 rounded-xl border border-slate-200 focus:border-[#006858] text-xs"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@ibwtech.com"
                  className="w-full bg-slate-50 text-slate-900 font-bold p-3 pl-10 rounded-xl border border-slate-200 focus:border-[#006858] text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 text-slate-900 font-bold p-3 pl-10 rounded-xl border border-slate-200 focus:border-[#006858] text-xs"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              icon={<ArrowRight className="w-4 h-4" />}
              className="w-full py-3 bg-[#006858] hover:bg-[#005245] rounded-xl font-extrabold shadow-md shadow-[#006858]/20"
            >
              {loading
                ? "Connecting to MongoDB..."
                : isSignUp
                ? "Create Account"
                : "Sign In"}
            </Button>
          </form>

          <div className="pt-2 text-center border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-[#006858]" />
            Encrypted Session via Form IBW TECH & MongoDB Atlas
          </div>
        </div>
      </div>
    </div>
  );
};
