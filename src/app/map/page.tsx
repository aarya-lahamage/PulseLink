"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  Ambulance as AmbulanceIcon,
  Building2,
  AlertTriangle,
  MapPinned,
  Layers,
  RefreshCw,
  Crosshair,
  Info,
  Radio,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatTimeAgo } from "@/lib/utils";
import type {
  MapAmbulance,
  MapHospital,
  MapEmergency,
  MapFilter,
  FocusTarget,
} from "@/components/map/PulseMap";

// Leaflet touches `window` on import, so the map must be client-only.
const PulseMap = dynamic(() => import("@/components/map/PulseMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full rounded-2xl bg-slate-100 animate-pulse flex items-center justify-center">
      <p className="text-sm text-slate-400 font-medium">Loading map…</p>
    </div>
  ),
});

const FILTERS: { key: MapFilter; label: string; icon: React.ElementType }[] = [
  { key: "ALL", label: "All", icon: Layers },
  { key: "AMBULANCES", label: "Ambulances", icon: AmbulanceIcon },
  { key: "HOSPITALS", label: "Hospitals", icon: Building2 },
  { key: "EMERGENCIES", label: "Emergencies", icon: AlertTriangle },
  { key: "AVAILABLE_AMBULANCES", label: "Available Units", icon: AmbulanceIcon },
  { key: "ACTIVE_EMERGENCIES", label: "Active Only", icon: Radio },
];

export default function EmergencyMapPage() {
  const [ambulances, setAmbulances] = useState<MapAmbulance[]>([]);
  const [hospitals, setHospitals] = useState<MapHospital[]>([]);
  const [emergencies, setEmergencies] = useState<MapEmergency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<MapFilter>("ALL");
  const [focusTarget, setFocusTarget] = useState<FocusTarget>(null);
  const [tick, setTick] = useState(0);

  const fetchData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [ambRes, hospRes, emgRes] = await Promise.all([
        fetch("/api/ambulances"),
        fetch("/api/hospitals"),
        fetch("/api/emergencies"),
      ]);
      if (!ambRes.ok || !hospRes.ok || !emgRes.ok) {
        throw new Error("One or more map data sources failed to load.");
      }
      const [ambData, hospData, emgData] = await Promise.all([
        ambRes.json(),
        hospRes.json(),
        emgRes.json(),
      ]);
      setAmbulances(ambData);
      setHospitals(hospData);
      setEmergencies(emgData);
      setError(null);
    } catch (e: any) {
      setError(e.message || "Failed to load map data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const refreshInterval = setInterval(() => fetchData(true), 8000);
    const tickInterval = setInterval(() => setTick((t) => t + 1), 2000);
    return () => {
      clearInterval(refreshInterval);
      clearInterval(tickInterval);
    };
  }, [fetchData]);

  const activeEmergencies = useMemo(
    () => emergencies.filter((e) => e.status !== "RESOLVED"),
    [emergencies]
  );
  const availableAmbulances = useMemo(
    () => ambulances.filter((a) => a.status === "Available"),
    [ambulances]
  );
  const dispatchedAmbulances = useMemo(
    () => ambulances.filter((a) => a.status === "Assigned" || a.status === "En Route"),
    [ambulances]
  );

  const mostUrgent = useMemo(() => {
    const high = activeEmergencies.filter((e) => e.priority === "HIGH");
    return high[0] || activeEmergencies[0] || null;
  }, [activeEmergencies]);

  const handleCenterOnUrgent = () => {
    if (mostUrgent && mostUrgent.latitude && mostUrgent.longitude) {
      setFocusTarget({ lat: mostUrgent.latitude, lng: mostUrgent.longitude, zoom: 15 });
    }
  };

  const focusOn = (lat: number, lng: number) => {
    if (!lat && !lng) return;
    setFocusTarget({ lat, lng, zoom: 15 });
    // Reset so the same target can be re-clicked and still trigger a flyTo
    setTimeout(() => setFocusTarget(null), 1200);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] min-h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <MapPinned className="w-6 h-6 text-red-600" />
            Emergency Live Map
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Ambulances, hospitals &amp; active incidents across the coverage zone.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <Info className="w-3 h-3" /> Simulated demo tracking
          </span>
          <button
            onClick={() => fetchData()}
            className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {FILTERS.map((f) => {
          const Icon = f.icon;
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                active
                  ? "bg-red-600 border-red-600 text-white shadow-sm"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {f.label}
            </button>
          );
        })}
        <button
          onClick={handleCenterOnUrgent}
          disabled={!mostUrgent}
          className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Crosshair className="w-3.5 h-3.5" /> Center on Active Emergency
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      )}

      {/* Main content: map + side panel */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
        {/* Map */}
        <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-100 min-h-[360px]">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-sm text-slate-400 font-medium">Loading coordination map…</p>
            </div>
          ) : ambulances.length === 0 && hospitals.length === 0 && emergencies.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-center px-6">
              <MapPinned className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-500">No map data yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Seed the database or create ambulances, hospitals, and emergencies to see them here.
              </p>
            </div>
          ) : (
            <PulseMap
              ambulances={ambulances}
              hospitals={hospitals}
              emergencies={emergencies}
              filter={filter}
              focusTarget={focusTarget}
              tick={tick}
            />
          )}
        </div>

        {/* Side panel */}
        <div className="flex flex-col gap-4 min-h-0 overflow-y-auto pr-0.5">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Active Emergencies" value={activeEmergencies.length} color="rose" />
            <StatCard label="Available Units" value={availableAmbulances.length} color="emerald" />
            <StatCard label="Dispatched" value={dispatchedAmbulances.length} color="amber" />
            <StatCard label="Hospitals" value={hospitals.length} color="blue" />
          </div>

          {/* Live feed list */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3 flex-1 min-h-[220px] flex flex-col">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400 px-1 mb-2">
              Live Feed
            </p>
            <div className="space-y-1.5 overflow-y-auto flex-1">
              {activeEmergencies.length === 0 && dispatchedAmbulances.length === 0 && (
                <p className="text-xs text-slate-400 px-1 py-4 text-center">
                  No active incidents right now.
                </p>
              )}
              {activeEmergencies.map((e) => (
                <button
                  key={e.id}
                  onClick={() => focusOn(e.latitude, e.longitude)}
                  className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-800 truncate">
                      {e.emergencyType}
                    </span>
                    <Badge variant={e.priority.toLowerCase() as any} className="shrink-0">
                      {e.priority}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {e.location} &middot; {formatTimeAgo(e.createdAt)}
                  </p>
                </button>
              ))}
              {ambulances
                .filter((a) => a.status === "Assigned" || a.status === "En Route")
                .map((a) => (
                  <button
                    key={a.id}
                    onClick={() => focusOn(a.latitude, a.longitude)}
                    className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-800 truncate flex items-center gap-1.5">
                        <AmbulanceIcon className="w-3 h-3 text-slate-500" />
                        {a.vehicleNumber}
                      </span>
                      <Badge variant={a.status.toLowerCase() as any} className="shrink-0">
                        {a.status}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{a.driverName}</p>
                  </button>
                ))}
            </div>
          </div>

          {/* Legend */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">
              Legend
            </p>
            <div className="space-y-1.5 text-xs text-slate-600">
              <LegendRow emoji="🚑" label="Ambulance (color = status)" />
              <LegendRow emoji="🏥" label="Hospital (color = ER readiness)" />
              <LegendRow emoji="🚨" label="Emergency incident (color = priority)" />
              <div className="flex items-center gap-2 pt-1 border-t border-slate-100 mt-1.5">
                <span className="w-5 border-t-2 border-red-600" /> Active route (simulated)
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 border-t-2 border-dashed border-slate-400" /> Pending dispatch
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "rose" | "emerald" | "amber" | "blue";
}) {
  const colors: Record<string, string> = {
    rose: "bg-rose-50 border-rose-200 text-rose-700",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
    amber: "bg-amber-50 border-amber-200 text-amber-700",
    blue: "bg-blue-50 border-blue-200 text-blue-700",
  };
  return (
    <div className={`rounded-2xl border p-3 ${colors[color]}`}>
      <p className="text-2xl font-extrabold leading-none">{value}</p>
      <p className="text-[11px] font-semibold mt-1 opacity-80">{label}</p>
    </div>
  );
}

function LegendRow({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">{emoji}</span>
      <span>{label}</span>
    </div>
  );
}
