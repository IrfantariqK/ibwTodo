"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, AlertCircle, Loader2, ArrowRight, ShieldCheck, Briefcase, Mail } from "lucide-react";
import Link from "next/link";

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [inviteData, setInviteData] = useState<any>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError("No invitation token provided. Please check your invitation email link.");
      return;
    }

    async function verifyAndAccept() {
      try {
        const res = await fetch(`/api/invitations/accept?token=${encodeURIComponent(token!)}`);
        const data = await res.json();

        if (res.ok && data.success) {
          setSuccess(true);
          setInviteData(data.invite);
        } else {
          setError(data.error || "Invalid or expired invitation token.");
        }
      } catch (err) {
        setError("Failed to connect to invitation server. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    verifyAndAccept();
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#006858]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 relative z-10 animate-in fade-in zoom-in duration-300">
        {/* Top Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-14 h-14 bg-emerald-50 text-[#006858] rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-emerald-100">
            <Briefcase className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">TaskConnect</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Project Invitation & Account Activation</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-12 text-center space-y-4">
            <Loader2 className="w-10 h-10 text-[#006858] animate-spin mx-auto" />
            <p className="text-sm font-bold text-slate-700">Verifying project invitation token...</p>
            <p className="text-xs text-slate-400">Connecting to TaskConnect secure servers</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium space-y-2 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-900 text-sm">Invitation Error</p>
                <p className="text-rose-700">{error}</p>
              </div>
            </div>

            <Link
              href="/login"
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl transition-all shadow-md"
            >
              Go to Login Page
            </Link>
          </div>
        )}

        {/* Success State */}
        {!loading && success && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-[#006858] text-xs font-medium space-y-2 flex items-start gap-3 shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-[#006858] shrink-0 mt-0.5" />
              <div>
                <p className="font-black text-[#006858] text-sm">Account Activated Successfully!</p>
                <p className="text-emerald-800 font-semibold">
                  You have accepted your invitation to join <span className="font-bold text-[#006858]">{inviteData?.projectName || "the Project"}</span>.
                </p>
              </div>
            </div>

            {/* Invite Details Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/80">
                <span className="font-bold text-slate-500 uppercase text-[10px]">Recipient Email</span>
                <span className="font-extrabold text-slate-800 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[#006858]" />
                  {inviteData?.email}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/80">
                <span className="font-bold text-slate-500 uppercase text-[10px]">Project</span>
                <span className="font-extrabold text-[#006858]">{inviteData?.projectName || "Workspace Project"}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-500 uppercase text-[10px]">Assigned Role</span>
                <span className="font-extrabold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full text-[11px]">
                  {inviteData?.role || (inviteData?.type === "client" ? "Client Contact" : "Team Member")}
                </span>
              </div>
            </div>

            {/* Auto Password Note if exists */}
            {inviteData?.autoPassword && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold space-y-1">
                <p className="font-bold text-amber-950 uppercase text-[10px]">Your Temporary Password</p>
                <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-xl border border-amber-200">
                  <span className="font-mono text-sm font-bold text-[#006858]">{inviteData.autoPassword}</span>
                  <span className="text-[10px] text-amber-700">Use this to log in</span>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => router.push(`/login?email=${encodeURIComponent(inviteData?.email || "")}`)}
              className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-[#006858] hover:bg-[#005246] text-white text-xs font-extrabold rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-[0.99] cursor-pointer"
            >
              <span>Proceed to Login & Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400 font-medium flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            TaskConnect Enterprise Secure Auth
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#006858] animate-spin" />
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}
