import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | "default"
    | "high"
    | "medium"
    | "low"
    | "new"
    | "assigned"
    | "in_progress"
    | "resolved"
    | "available"
    | "en_route"
    | "at_hospital"
    | "pending"
    | "confirmed"
    | "completed"
    | "cancelled"
    | "critical"
    | "urgent"
    | "matching"
    | "fulfilled";
  className?: string;
  pulse?: boolean;
}

export function Badge({
  children,
  variant = "default",
  className,
  pulse = false,
}: BadgeProps) {
  const getVariantStyles = () => {
    switch (variant.toLowerCase()) {
      // Priorities
      case "high":
      case "critical":
        return "bg-rose-100 text-rose-800 border-rose-300 font-semibold";
      case "medium":
      case "urgent":
        return "bg-amber-100 text-amber-800 border-amber-300 font-medium";
      case "low":
      case "normal":
        return "bg-blue-100 text-blue-800 border-blue-300 font-medium";

      // Emergency / Workflow Statuses
      case "new":
        return "bg-purple-100 text-purple-800 border-purple-300 font-semibold";
      case "assigned":
      case "matching":
        return "bg-indigo-100 text-indigo-800 border-indigo-300 font-medium";
      case "in_progress":
      case "en_route":
      case "en route":
        return "bg-amber-100 text-amber-800 border-amber-300 font-medium";
      case "resolved":
      case "available":
      case "fulfilled":
      case "completed":
        return "bg-emerald-100 text-emerald-800 border-emerald-300 font-medium";
      case "at_hospital":
      case "at hospital":
        return "bg-cyan-100 text-cyan-800 border-cyan-300 font-medium";

      // Appointments
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "confirmed":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "cancelled":
        return "bg-slate-100 text-slate-700 border-slate-300";

      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs border tracking-wide uppercase transition-colors",
        getVariantStyles(),
        pulse && "animate-pulse",
        className
      )}
    >
      {pulse && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
      )}
      {children}
    </span>
  );
}
