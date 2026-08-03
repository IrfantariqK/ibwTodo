"use client";

import React from "react";
import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  change: string;
  isPositive?: boolean;
  icon: LucideIcon;
  iconColor?: string;
  bgGlow?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  isPositive = true,
  icon: Icon,
  iconColor = "text-[#8B5CF6]",
  bgGlow = "from-[#8B5CF6]/20 to-transparent",
}) => {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className="relative overflow-hidden rounded-2xl glass-panel p-5 border border-slate-800/80 hover:border-[#8B5CF6]/50 transition-all duration-300 group"
    >
      {/* Background Subtle Gradient Glow */}
      <div
        className={cn(
          "absolute -right-8 -top-8 w-32 h-32 rounded-full bg-gradient-to-br opacity-30 blur-2xl group-hover:opacity-60 transition-opacity",
          bgGlow
        )}
      />

      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
          <h3 className="text-3xl font-extrabold text-white mt-1 font-mono tracking-tight">
            {value}
          </h3>
        </div>
        <div
          className={cn(
            "w-10 h-10 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center shadow-inner",
            iconColor
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 relative z-10 text-xs">
        <span
          className={cn(
            "inline-flex items-center font-bold px-1.5 py-0.5 rounded-md",
            isPositive ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
          )}
        >
          {isPositive ? (
            <TrendingUp className="w-3 h-3 mr-1" />
          ) : (
            <TrendingDown className="w-3 h-3 mr-1" />
          )}
          {change}
        </span>
        <span className="text-slate-500">vs last week</span>
      </div>
    </motion.div>
  );
};
