"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ShieldCheck } from "lucide-react";

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onFinish, 500); // Wait for exit animation
    }, 2200);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white text-[#0F172A]"
        >
          {/* Logo & Icon Animation */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, type: "spring", damping: 15 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-[#006858] flex items-center justify-center text-white shadow-2xl shadow-[#006858]/30">
                <Zap className="w-10 h-10 fill-white" />
              </div>
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-3xl bg-[#006858] -z-10 blur-xl"
              />
            </div>

            <div className="text-center space-y-1">
              <h1 className="text-3xl font-black text-[#0F172A] tracking-tight flex items-center justify-center gap-1.5">
                TaskConnect
                <span className="w-2.5 h-2.5 rounded-full bg-[#006858]" />
              </h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Enterprise Collaboration Workspace
              </p>
            </div>
          </motion.div>

          {/* Loading Progress Line */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 180 }}
            transition={{ duration: 1.8, ease: "easeInOut" }}
            className="h-1 bg-[#006858] rounded-full mt-10 shadow-sm"
          />

          <div className="absolute bottom-8 flex items-center gap-1.5 text-xs text-slate-500 font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-[#006858]" /> From IBW TECH
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
