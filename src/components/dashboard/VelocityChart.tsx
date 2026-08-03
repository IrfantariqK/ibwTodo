"use client";

import React from "react";
import { motion } from "framer-motion";

export const VelocityChart: React.FC = () => {
  const data = [
    { sprint: "Sprint 21", target: 40, completed: 38 },
    { sprint: "Sprint 22", target: 42, completed: 44 },
    { sprint: "Sprint 23", target: 45, completed: 41 },
    { sprint: "Sprint 24", target: 48, completed: 46 },
    { sprint: "Sprint 25 (Active)", target: 50, completed: 36 },
  ];

  const maxVal = 55;

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-800/80">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h4 className="text-base font-bold text-white flex items-center gap-2">
            Team Velocity Overview
          </h4>
          <p className="text-xs text-slate-400">Story points completed vs target per sprint</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#8B5CF6]" />
            <span className="text-slate-300">Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-slate-700" />
            <span className="text-slate-400">Target</span>
          </div>
        </div>
      </div>

      {/* Chart Bars */}
      <div className="h-48 flex items-end justify-between gap-4 pt-6 pb-2 px-2">
        {data.map((item, index) => {
          const completedHeight = (item.completed / maxVal) * 100;
          const targetHeight = (item.target / maxVal) * 100;

          return (
            <div key={item.sprint} className="flex-1 flex flex-col items-center gap-2 group">
              <div className="w-full flex items-end justify-center gap-1.5 h-full relative">
                {/* Target Bar */}
                <div
                  style={{ height: `${targetHeight}%` }}
                  className="w-3 bg-slate-800 rounded-t-sm transition-all group-hover:bg-slate-700"
                />
                {/* Completed Bar */}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${completedHeight}%` }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="w-5 bg-gradient-to-t from-[#8B5CF6] to-[#C084FC] rounded-t-md shadow-lg shadow-[#8B5CF6]/20 group-hover:brightness-125 transition-all relative"
                >
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-700 transition-opacity whitespace-nowrap">
                    {item.completed} pts
                  </div>
                </motion.div>
              </div>

              <span className="text-[11px] font-medium text-slate-400 group-hover:text-white transition-colors">
                {item.sprint}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
