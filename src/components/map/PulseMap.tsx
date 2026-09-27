"use client";

import React, { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Ambulance as AmbulanceIcon,
  Building2,
  AlertTriangle,
  Phone,
  User,
  MapPin,
  Navigation,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatTimeAgo } from "@/lib/utils";
import {
  simulatedPositionAlongPath,
  nearestHospital,
  type LatLng,
} from "@/lib/geo";

// ---------- Types ----------

export type MapAmbulance = {
  id: string;
  vehicleNumber: string;
  driverName: string;
  contact: string;
  status: string;
  baseLocation: string;
  latitude: number;
  longitude: number;
  emergencies?: { id: string; emergencyType: string; status: string; patient?: { fullName: string } }[];
};

export type MapHospital = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  emergencyReady: boolean;
  totalBeds: number;
  availableBeds: number;
  departmentStatus: string;
};

export type MapEmergency = {
  id: string;
  emergencyType: string;
  location: string;
  latitude: number;
  longitude: number;
  priority: string;
  status: string;
  ambulanceId?: string | null;
  hospitalId?: string | null;
  createdAt: string;
  patient?: { fullName: string; bloodGroup?: string };
  ambulance?: MapAmbulance | null;
  hospital?: MapHospital | null;
  timelineEvents?: { stage: string; timestamp: string }[];
};

export type MapFilter =
  | "ALL"
  | "AMBULANCES"
  | "HOSPITALS"
  | "EMERGENCIES"
  | "AVAILABLE_AMBULANCES"
  | "ACTIVE_EMERGENCIES";

export type FocusTarget = { lat: number; lng: number; zoom?: number } | null;

interface PulseMapProps {
  ambulances: MapAmbulance[];
  hospitals: MapHospital[];
  emergencies: MapEmergency[];
  filter: MapFilter;
  focusTarget: FocusTarget;
  tick: number; // increments every few seconds to drive simulated animation
}

// Demo simulation constant: how long (ms) a dispatched ambulance takes to
// visually travel base -> incident -> hospital. Purely cosmetic/demo.
const SIMULATED_TRAVEL_MS = 6 * 60 * 1000; // 6 minutes

// ---------- Icon builders ----------

function divIcon(html: string, size: number) {
  return L.divIcon({
    html,
    className: "pulse-map-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function ambulanceIconHtml(status: string) {
  const color =
    status === "Available"
      ? "#10b981" // emerald
      : status === "Assigned"
      ? "#6366f1" // indigo
      : status === "En Route"
      ? "#f59e0b" // amber
      : status === "At Hospital"
      ? "#06b6d4" // cyan
      : "#64748b"; // slate (offline)
  const pulse = status === "En Route" ? "pulse-marker-ring" : "";
  return `
    <div class="pulse-marker-wrap ${pulse}" style="--marker-color:${color}">
      <div class="pulse-marker-badge" style="background:${color}">🚑</div>
    </div>`;
}

function hospitalIconHtml(h: MapHospital) {
  const color = !h.emergencyReady
    ? "#ef4444"
    : h.departmentStatus === "Limited"
    ? "#f59e0b"
    : "#2563eb";
  return `
    <div class="pulse-marker-wrap">
      <div class="pulse-marker-badge pulse-marker-square" style="background:${color}">🏥</div>
    </div>`;
}

function emergencyIconHtml(priority: string, status: string) {
  const color =
    priority === "HIGH" ? "#dc2626" : priority === "MEDIUM" ? "#f59e0b" : "#3b82f6";
  const pulse = priority === "HIGH" && status !== "RESOLVED" ? "pulse-marker-ring" : "";
  return `
    <div class="pulse-marker-wrap ${pulse}" style="--marker-color:${color}">
      <div class="pulse-marker-badge" style="background:${color}">🚨</div>
    </div>`;
}

// ---------- Map view controller (handles fly-to / fit-bounds) ----------

function MapController({
  focusTarget,
  allPoints,
}: {
  focusTarget: FocusTarget;
  allPoints: LatLng[];
}) {
  const map = useMap();

  useEffect(() => {
    if (focusTarget) {
      map.flyTo([focusTarget.lat, focusTarget.lng], focusTarget.zoom ?? 15, {
        duration: 1.1,
      });
    }
  }, [focusTarget, map]);

  useEffect(() => {
    if (!focusTarget && allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints.map((p) => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
    }
    // Only run on mount / when the point set size changes meaningfully
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allPoints.length]);

  return null;
}

// ---------- Main map ----------

export default function PulseMap({
  ambulances,
  hospitals,
  emergencies,
  filter,
  focusTarget,
  tick,
}: PulseMapProps) {
  const showAmbulances = filter === "ALL" || filter === "AMBULANCES" || filter === "AVAILABLE_AMBULANCES";
  const showHospitals = filter === "ALL" || filter === "HOSPITALS";
  const showEmergencies = filter === "ALL" || filter === "EMERGENCIES" || filter === "ACTIVE_EMERGENCIES";

  const visibleAmbulances = useMemo(() => {
    if (filter === "AVAILABLE_AMBULANCES") {
      return ambulances.filter((a) => a.status === "Available");
    }
    return ambulances;
  }, [ambulances, filter]);

  const visibleEmergencies = useMemo(() => {
    if (filter === "ACTIVE_EMERGENCIES") {
      return emergencies.filter((e) => e.status !== "RESOLVED");
    }
    return emergencies;
  }, [emergencies, filter]);

  // Compute simulated live position + route path for each active, ambulance-assigned emergency
  const activeRoutes = useMemo(() => {
    return emergencies
      .filter(
        (e) =>
          e.ambulanceId &&
          e.ambulance &&
          (e.status === "ASSIGNED" || e.status === "IN_PROGRESS") &&
          e.latitude &&
          e.longitude
      )
      .map((e) => {
        const amb = e.ambulance!;
        const hospitalPoints = hospitals.map((h) => ({ ...h, lat: h.latitude, lng: h.longitude }));
        const destHospital =
          e.hospital || nearestHospital({ lat: e.latitude, lng: e.longitude }, hospitalPoints);
        const path: LatLng[] = [
          { lat: amb.latitude, lng: amb.longitude },
          { lat: e.latitude, lng: e.longitude },
          ...(destHospital ? [{ lat: destHospital.latitude, lng: destHospital.longitude }] : []),
        ];

        const assignedEvent = e.timelineEvents?.find((ev) => ev.stage === "AMBULANCE_ASSIGNED");
        const startTime = assignedEvent ? new Date(assignedEvent.timestamp).getTime() : new Date(e.createdAt).getTime();
        const elapsed = e.status === "IN_PROGRESS" ? Date.now() - startTime : 0;

        const simulatedPos =
          e.status === "IN_PROGRESS"
            ? simulatedPositionAlongPath(path, elapsed, SIMULATED_TRAVEL_MS)
            : path[0];

        return { emergency: e, path, simulatedPos, hospital: destHospital };
      });
    // `tick` is intentionally in deps to force re-computation as time passes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emergencies, hospitals, tick]);

  const allPoints: LatLng[] = useMemo(() => {
    const pts: LatLng[] = [];
    visibleAmbulances.forEach((a) => a.latitude && a.longitude && pts.push({ lat: a.latitude, lng: a.longitude }));
    if (showHospitals) hospitals.forEach((h) => pts.push({ lat: h.latitude, lng: h.longitude }));
    visibleEmergencies.forEach((e) => e.latitude && e.longitude && pts.push({ lat: e.latitude, lng: e.longitude }));
    return pts;
  }, [visibleAmbulances, hospitals, visibleEmergencies, showHospitals]);

  const defaultCenter: [number, number] = allPoints.length
    ? [allPoints[0].lat, allPoints[0].lng]
    : [28.6139, 77.209];

  return (
    <MapContainer
      center={defaultCenter}
      zoom={12}
      scrollWheelZoom
      className="w-full h-full rounded-2xl z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapController focusTarget={focusTarget} allPoints={allPoints} />

      {/* Simulated route lines: ambulance base -> incident -> hospital */}
      {activeRoutes.map(({ emergency, path }) => (
        <Polyline
          key={`route-${emergency.id}`}
          positions={path.map((p) => [p.lat, p.lng]) as [number, number][]}
          pathOptions={{
            color: emergency.status === "IN_PROGRESS" ? "#dc2626" : "#94a3b8",
            weight: emergency.status === "IN_PROGRESS" ? 3 : 2,
            dashArray: emergency.status === "IN_PROGRESS" ? undefined : "6 8",
            opacity: 0.75,
          }}
        />
      ))}

      {/* Hospitals */}
      {showHospitals &&
        hospitals.map((h) => (
          <Marker
            key={`hospital-${h.id}`}
            position={[h.latitude, h.longitude]}
            icon={divIcon(hospitalIconHtml(h), 34)}
          >
            <Popup minWidth={240}>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  {h.name}
                </div>
                <p className="text-xs text-slate-500">{h.address}</p>
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Phone className="w-3 h-3" /> {h.phone}
                </div>
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <Badge variant={h.emergencyReady ? "available" : "high"}>
                    {h.emergencyReady ? "ER Ready" : "ER Closed"}
                  </Badge>
                  <Badge variant={h.departmentStatus === "Diverting" ? "high" : h.departmentStatus === "Limited" ? "medium" : "available"}>
                    {h.departmentStatus}
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 pt-1">
                  <span className="font-semibold text-slate-800">{h.availableBeds}</span> / {h.totalBeds} beds available
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

      {/* Ambulances (static base position, or simulated live position if actively dispatched) */}
      {showAmbulances &&
        visibleAmbulances.map((a) => {
          const activeRoute = activeRoutes.find((r) => r.emergency.ambulanceId === a.id);
          const pos = activeRoute ? activeRoute.simulatedPos : { lat: a.latitude, lng: a.longitude };
          return (
            <Marker
              key={`ambulance-${a.id}`}
              position={[pos.lat, pos.lng]}
              icon={divIcon(ambulanceIconHtml(a.status), 34)}
            >
              <Popup minWidth={230}>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                    <AmbulanceIcon className="w-4 h-4 text-slate-700" />
                    {a.vehicleNumber}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <User className="w-3 h-3" /> {a.driverName}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <Phone className="w-3 h-3" /> {a.contact}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="w-3 h-3" /> Base: {a.baseLocation}
                  </div>
                  <Badge variant={a.status.toLowerCase() as any}>{a.status}</Badge>
                  {activeRoute && (
                    <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1 mt-1">
                      Simulated tracking &mdash; demo position, not live GPS.
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

      {/* Emergency incidents */}
      {showEmergencies &&
        visibleEmergencies.map((e) => (
          <Marker
            key={`emergency-${e.id}`}
            position={[e.latitude, e.longitude]}
            icon={divIcon(emergencyIconHtml(e.priority, e.status), 34)}
          >
            <Popup minWidth={250}>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  {e.emergencyType}
                </div>
                {e.patient && (
                  <p className="text-xs text-slate-600">Patient: {e.patient.fullName}</p>
                )}
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <MapPin className="w-3 h-3" /> {e.location}
                </div>
                <div className="flex items-center gap-2 flex-wrap pt-0.5">
                  <Badge variant={e.priority.toLowerCase() as any}>{e.priority}</Badge>
                  <Badge variant={e.status.toLowerCase() as any}>{e.status.replace("_", " ")}</Badge>
                </div>
                <p className="text-[11px] text-slate-400">{formatTimeAgo(e.createdAt)}</p>
                {e.ambulance && (
                  <p className="text-xs text-slate-600 pt-1 flex items-center gap-1">
                    <Navigation className="w-3 h-3 text-indigo-600" />
                    Unit {e.ambulance.vehicleNumber} dispatched
                  </p>
                )}
                {e.hospital && (
                  <p className="text-xs text-slate-600 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-blue-600" />
                    Destination: {e.hospital.name}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}
