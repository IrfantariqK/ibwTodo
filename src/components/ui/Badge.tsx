import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "urgent" | "high" | "medium" | "low" | "emerald" | "amber" | "outline" | "in-progress" | "planning" | "devops";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "medium",
  className,
}) => {
  const variants = {
    urgent: "bg-red-50 text-red-700 border-red-200",
    high: "bg-amber-50 text-amber-700 border-amber-200",
    medium: "bg-slate-100 text-slate-700 border-slate-200",
    low: "bg-emerald-50 text-emerald-700 border-emerald-200",
    emerald: "bg-[#E6F4F1] text-[#006858] border-[#006858]/30 font-bold",
    amber: "bg-amber-50 text-amber-800 border-amber-200 font-bold",
    "in-progress": "bg-[#E6F4F1] text-[#006858] border-[#006858]/30 font-semibold",
    planning: "bg-amber-100/70 text-amber-800 border-amber-300/60 font-semibold",
    devops: "bg-emerald-100 text-emerald-800 border-emerald-200 font-bold uppercase tracking-wider text-[10px]",
    outline: "bg-white text-slate-600 border-slate-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all duration-200",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
};
