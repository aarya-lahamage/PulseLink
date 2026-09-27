"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Ambulance,
  Activity,
  Droplet,
  ShieldAlert,
  Radio,
  Clock,
  MapPinned,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    name: "Emergency Center",
    href: "/emergencies",
    icon: Activity,
    badge: "LIVE",
    badgeColor: "bg-red-500 text-white animate-pulse",
  },
  {
    name: "Live Map",
    href: "/map",
    icon: MapPinned,
    badge: null,
  },
  {
    name: "Patients",
    href: "/patients",
    icon: Users,
    badge: null,
  },
  {
    name: "Appointments",
    href: "/appointments",
    icon: CalendarDays,
    badge: null,
  },
  {
    name: "Ambulances",
    href: "/ambulances",
    icon: Ambulance,
    badge: null,
  },
  {
    name: "Blood Requests",
    href: "/blood-requests",
    icon: Droplet,
    badge: null,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col shrink-0 border-r border-slate-800 min-h-screen">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center shadow-lg shadow-rose-900/40 text-white transition-transform group-hover:scale-105">
            <Activity className="w-6 h-6 animate-alert-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-white">
                Pulse<span className="text-red-500">Link</span>
              </span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Coordination Center
            </p>
          </div>
        </Link>
      </div>

      {/* Operational Status Tag */}
      <div className="px-5 py-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-slate-300">
            Dispatch Link Active
          </span>
        </div>
        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
          ONLINE
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Command Menu
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 group",
                isActive
                  ? "bg-red-600/15 text-white border border-red-500/30 shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive
                      ? "text-red-400"
                      : "text-slate-400 group-hover:text-slate-200"
                  )}
                />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span
                  className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider",
                    item.badgeColor
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>


      {/* System Safety Notice */}
      <div className="p-4 m-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5 text-slate-300 font-semibold mb-1">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          <span>Operations Protocol</span>
        </div>
        <p className="leading-relaxed">
          Logistics and triage coordination platform. Medical decisions follow
          standard physician protocols.
        </p>
      </div>

      {/* Footer User Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-white">
          CC
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-200 truncate">
            Duty Dispatcher
          </p>
          <p className="text-[11px] text-slate-400 truncate">Station 01</p>
        </div>
      </div>
    </aside>
  );
}
