import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "light";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  icon,
  className,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95";

  const variants = {
    primary:
      "bg-[#006858] hover:bg-[#005245] text-white shadow-md shadow-[#006858]/20 border border-[#006858]/30",
    secondary:
      "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm",
    outline:
      "bg-transparent hover:bg-slate-100 text-slate-700 border border-slate-300",
    ghost:
      "bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900",
    light:
      "bg-[#EEF7F5] hover:bg-[#D9EFEA] text-[#006858] font-bold border border-[#006858]/20",
    danger:
      "bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
    md: "px-4 py-2 text-sm rounded-xl gap-2",
    lg: "px-6 py-3 text-base rounded-2xl gap-2.5",
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};
