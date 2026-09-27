"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, PlusCircle, AlertTriangle, Activity } from "lucide-react";

export function TopBar() {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
          <Clock className="w-4 h-4 text-slate-400" />
          <span className="font-mono bg-slate-100 text-slate-700 px-2 py-1 rounded-md border border-slate-200 font-semibold tracking-wider">
            {time || "00:00:00"}
          </span>
          <span className="hidden sm:inline text-slate-400">|</span>
          <span className="hidden sm:inline text-slate-600">
            Emergency Dispatch System
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/emergencies?action=new"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-600 text-white font-medium text-xs shadow-md shadow-red-600/20 hover:bg-red-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <AlertTriangle className="w-4 h-4 animate-pulse" />
          <span>New Emergency Case</span>
        </Link>
      </div>
    </header>
  );
}
