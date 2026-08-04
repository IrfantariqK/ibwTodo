"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle,
  Shield,
  Activity,
  CheckSquare,
  KeyRound,
  RotateCcw,
} from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<"signup" | "otp">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const strength =
    password.length === 0 ? 0 :
    password.length < 6 ? 1 :
    password.length < 10 ? 2 : 3;

  const strengthLabel = ["", "Weak", "Good", "Strong"];
  const strengthColors = ["", "#ef4444", "#f59e0b", "#10b981"];

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed.");

      if (data.requireOtp) {
        setStep("otp");
        setSuccessMsg(data.message || "A 6-digit verification code has been sent to your email.");
        setResendCooldown(60);
      } else {
        const userObj = {
          name: data.user.name,
          email: data.user.email,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.user.email)}`,
        };
        localStorage.setItem("taskconnect_user", JSON.stringify(userObj));
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[index] = val.slice(-1);
    setOtp(newOtp);

    // Auto focus next box
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const fullOtp = otp.join("");
    if (fullOtp.length !== 6) {
      setError("Please enter all 6 digits of the verification code.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: fullOtp }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed.");

      const userObj = {
        name: data.user.name,
        email: data.user.email,
        role: data.user.role || "Leader",
        type: data.user.type || "leader",
        avatar: data.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.user.email)}`,
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

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resend code.");

      setSuccessMsg(data.message || "A new 6-digit code has been sent to your email.");
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || "Failed to resend code.");
    }
  };

  const features = [
    "Real-time task tracking with Kanban boards",
    "Live MongoDB Atlas data sync",
    "Team collaboration & direct messaging",
    "Calendar events & meeting scheduling",
  ];

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
        {/* Background rings */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-40 -right-20 w-[500px] h-[500px] rounded-full bg-white/5" />

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
        <div className="relative z-10 space-y-8">
          <div className="absolute -top-16 -left-4 text-[120px] font-black text-white/[0.07] leading-none select-none pointer-events-none">
            TC
          </div>

          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <h1 className="text-5xl font-black text-white leading-tight">
              Join
              <br />
              <span className="text-emerald-200">TaskConnect</span>
            </h1>
            <p className="mt-4 text-sm text-white/70 font-medium leading-relaxed max-w-sm">
              Create your account and start managing tasks, projects, and
              team collaboration powered by MongoDB Atlas.
            </p>
          </motion.div>

          {/* Feature list */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="space-y-3"
          >
            {features.map((feat, i) => (
              <motion.div
                key={i}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 + i * 0.1, duration: 0.4 }}
                className="flex items-center gap-3"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-400/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-3 h-3 text-emerald-300" />
                </div>
                <span className="text-xs text-white/70 font-medium">{feat}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Security badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10 max-w-xs"
          >
            <Shield className="w-4 h-4 text-emerald-300 shrink-0" />
            <p className="text-[11px] text-white/60 font-medium">
              6-Digit Email Verification · Encrypted Passwords · MongoDB Atlas
            </p>
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
        className="flex-1 flex flex-col justify-center px-8 md:px-16 bg-white overflow-y-auto py-12"
      >
        <div className="w-full max-w-sm mx-auto space-y-6">
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

          {step === "signup" ? (
            /* STEP 1: SIGNUP FORM */
            <>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <Zap className="w-3.5 h-3.5 text-[#006858]" />
                  <span className="text-xs font-bold text-[#006858]">Create New Account</span>
                </div>
                <h2 className="text-2xl font-black text-[#0F172A]">Get Started</h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Already have an account?{" "}
                  <Link href="/login" className="text-[#006858] font-bold hover:underline">
                    Sign In →
                  </Link>
                </p>
              </motion.div>

              <motion.form
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                onSubmit={handleSignup}
                className="space-y-4"
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

                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Irfan Tariq"
                      className="w-full bg-slate-50 text-slate-900 font-semibold text-sm p-3 pl-10 rounded-xl border border-slate-200 focus:border-[#006858] focus:outline-none focus:ring-2 focus:ring-[#006858]/20 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-slate-50 text-slate-900 font-semibold text-sm p-3 pl-10 rounded-xl border border-slate-200 focus:border-[#006858] focus:outline-none focus:ring-2 focus:ring-[#006858]/20 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="w-full bg-slate-50 text-slate-900 font-semibold text-sm p-3 pl-10 pr-10 rounded-xl border border-slate-200 focus:border-[#006858] focus:outline-none focus:ring-2 focus:ring-[#006858]/20 transition-all placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Strength meter */}
                  {password.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-2 space-y-1"
                    >
                      <div className="flex gap-1">
                        {[1, 2, 3].map((i) => (
                          <motion.div
                            key={i}
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            className="h-1 flex-1 rounded-full transition-all duration-300"
                            style={{
                              backgroundColor: i <= strength ? strengthColors[strength] : "#e2e8f0",
                            }}
                          />
                        ))}
                      </div>
                      <p className="text-[10px] font-bold" style={{ color: strengthColors[strength] }}>
                        {strengthLabel[strength]} password
                      </p>
                    </motion.div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your password"
                      className={`w-full bg-slate-50 text-slate-900 font-semibold text-sm p-3 pl-10 pr-10 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#006858]/20 transition-all placeholder:text-slate-400 ${
                        confirmPassword.length > 0 && confirmPassword !== password
                          ? "border-red-400"
                          : confirmPassword.length > 0 && confirmPassword === password
                          ? "border-emerald-400"
                          : "border-slate-200 focus:border-[#006858]"
                      }`}
                    />
                    <AnimatePresence>
                      {confirmPassword.length > 0 && confirmPassword === password && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2"
                        >
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

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
                      Sending 6-Digit Code...
                    </>
                  ) : (
                    <>
                      Create Account & Send Code
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </motion.form>
            </>
          ) : (
            /* STEP 2: 6-DIGIT EMAIL VERIFICATION OTP SCREEN */
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="space-y-6 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#006858] flex items-center justify-center mx-auto shadow-inner">
                <KeyRound className="w-7 h-7" />
              </div>

              <div>
                <h2 className="text-2xl font-black text-[#0F172A]">Verify Your Email</h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  We sent a 6-digit verification code to:
                  <br />
                  <strong className="text-slate-800 font-bold">{email}</strong>
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold text-left"
                    >
                      ⚠ {error}
                    </motion.div>
                  )}
                  {successMsg && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold text-left"
                    >
                      ✓ {successMsg}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 6-Digit Box Inputs */}
                <div className="flex items-center justify-center gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-input-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-11 h-13 text-center text-xl font-black bg-slate-50 border border-slate-200 rounded-xl focus:border-[#006858] focus:bg-white focus:ring-2 focus:ring-[#006858]/20 focus:outline-none transition-all text-slate-900"
                    />
                  ))}
                </div>

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
                      Verifying Code in MongoDB...
                    </>
                  ) : (
                    <>
                      Verify Account & Sign In
                      <CheckCircle className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </form>

              {/* Resend Code Link */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setStep("signup")}
                  className="text-slate-400 hover:text-slate-600 font-semibold"
                >
                  ← Change Email
                </button>

                <button
                  type="button"
                  disabled={resendCooldown > 0}
                  onClick={handleResendOtp}
                  className="text-[#006858] font-bold hover:underline disabled:opacity-50 disabled:no-underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend Code"}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
