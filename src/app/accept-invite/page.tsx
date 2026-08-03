"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, AlertCircle, ArrowRight, Lock, Mail, Building, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invite, setInvite] = useState<any>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setError("No invitation token provided.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/invitations/accept?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (res.ok && data.invite) {
          setInvite(data.invite);
          if (data.alreadyAccepted) {
            setSuccess(true);
          }
        } else {
          setError(data.error || "Invitation invalid or expired.");
        }
      } catch (err) {
        setError("Failed to verify invitation token.");
      } finally {
        setLoading(false);
      }
    }

    verifyToken();
  }, [token]);

  const handleAcceptAndLogin = async () => {
    if (!token) return;
    setAccepting(true);

    try {
      const res = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();
      if (res.ok && data.invite) {
        setSuccess(true);

        // Auto-login session in localStorage
        const userObj = {
          id: data.invite.email,
          name: data.invite.name,
          email: data.invite.email,
          role: data.invite.role,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.invite.email)}`,
        };

        localStorage.setItem("taskconnect_user", JSON.stringify(userObj));
        document.cookie = `auth_token=invite-session-${Date.now()}; path=/; max-age=86400`;

        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      } else {
        setError(data.error || "Failed to accept invitation.");
      }
    } catch (err: any) {
      setError(err.message || "Error processing invitation.");
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Top Glow Decor */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#006858] rounded-full blur-3xl opacity-30 pointer-events-none" />

        {/* Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#006858] flex items-center justify-center font-black text-white text-lg shadow-lg">
            TC
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-white tracking-tight">TaskConnect</h1>
            <p className="text-xs text-slate-400 font-medium">Project Invitation & Activation</p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#006858] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-400">Verifying project invitation...</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
            <h3 className="font-bold text-red-300 text-sm">Invitation Invalid</h3>
            <p className="text-xs text-red-400/80">{error}</p>
            <Button onClick={() => router.push("/login")} size="sm" className="bg-slate-800 hover:bg-slate-700 text-white w-full font-bold mt-2">
              Go to Login
            </Button>
          </div>
        ) : success ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h3 className="font-extrabold text-emerald-300 text-base">Invitation Accepted!</h3>
            <p className="text-xs text-emerald-400/80">
              Welcome, <strong>{invite?.name}</strong>! Your account has been activated and your workspace manager notified.
            </p>
            <p className="text-[11px] text-slate-400 animate-pulse pt-2">Redirecting to Dashboard...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#006858]/30 text-emerald-300 border border-[#006858]/40">
                  {invite?.type === "client" ? "Client Invitation" : "Team Member Invitation"}
                </span>
              </div>

              <h2 className="font-extrabold text-base text-white">
                {invite?.name}, you're invited to {invite?.projectName}!
              </h2>

              <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-700/60">
                <p className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#006858]" />
                  <span>Email: <strong className="text-white">{invite?.email}</strong></span>
                </p>
                <p className="flex items-center gap-2">
                  {invite?.type === "client" ? <Building className="w-3.5 h-3.5 text-[#006858]" /> : <Users className="w-3.5 h-3.5 text-[#006858]" />}
                  <span>Assigned Role: <strong className="text-white">{invite?.role}</strong></span>
                </p>
                <p className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-[#006858]" />
                  <span>Auto Password: <strong className="text-emerald-400 font-mono bg-slate-900 px-2 py-0.5 rounded">{invite?.autoPassword}</strong></span>
                </p>
              </div>
            </div>

            <Button
              onClick={handleAcceptAndLogin}
              disabled={accepting}
              variant="primary"
              className="w-full bg-[#006858] hover:bg-[#005245] rounded-xl py-3.5 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#006858]/30 cursor-pointer"
            >
              {accepting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Activating Account...
                </>
              ) : (
                <>
                  Accept Invitation & Launch Workspace
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>

            <p className="text-[11px] text-slate-500 text-center">
              By clicking Accept, your login credentials will be activated in MongoDB Atlas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Loading...</div>}>
      <AcceptInviteContent />
    </Suspense>
  );
}
