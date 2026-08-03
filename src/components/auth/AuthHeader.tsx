"use client";

import React from "react";
import { Zap } from "lucide-react";

interface AuthHeaderProps {
  isSignUp: boolean;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({ isSignUp }) => {
  return (
    <div className="flex flex-col items-center text-center space-y-2">
      <div className="w-14 h-14 rounded-2xl bg-[#006858] flex items-center justify-center text-white shadow-xl shadow-[#006858]/25 ring-4 ring-[#E6F4F1]">
        <Zap className="w-7 h-7 fill-white" />
      </div>
      <h2 className="text-2xl font-black text-[#0F172A] tracking-tight flex items-center gap-1.5 mt-2">
        TaskConnect
        <span className="w-2.5 h-2.5 rounded-full bg-[#006858]" />
      </h2>
      <p className="text-xs text-slate-500 font-semibold">
        {isSignUp
          ? "Create your enterprise workspace account"
          : "Sign in to access your task workspace"}
      </p>
    </div>
  );
};
