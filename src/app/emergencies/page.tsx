"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Ambulance as AmbulanceIcon,
  Droplet,
  PlusCircle,
  Search,
  Filter,
  Clock,
  MapPin,
  CheckCircle2,
  Navigation,
  Check,
  User,
  Phone,
  RefreshCw,
  ChevronRight,
  Shield,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ToastProvider";
import { formatTimeAgo, formatDateTime } from "@/lib/utils";

const TIMELINE_STAGES = [
  { key: "CREATED", label: "Request Created" },
  { key: "PRIORITY_IDENTIFIED", label: "Priority Identified" },
  { key: "AMBULANCE_ASSIGNED", label: "Ambulance Assigned" },
  { key: "EN_ROUTE", label: "Ambulance En Route" },
  { key: "PATIENT_REACHED", label: "Patient Reached" },
  { key: "RESOLVED", label: "Emergency Resolved" },
];

import { Suspense } from "react";

function EmergencyCenterContent() {
  const searchParams = useSearchParams();
  const [emergencies, setEmergencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedEmergency, setSelectedEmergency] = useState<any | null>(null);

  // Form State
  const [patients, setPatients] = useState<any[]>([]);
  const [availableAmbulances, setAvailableAmbulances] = useState<any[]>([]);
  const [newEmergency, setNewEmergency] = useState({
    patientId: "",
    emergencyType: "Acute Coronary Syndrome",
    location: "",
    priority: "HIGH",
    ambulanceRequired: true,
    bloodRequired: false,
    ambulanceId: "",
    bloodUnits: 2,
    bloodUrgency: "Critical",
    notes: "",
  });

  const { addToast } = useToast();

  const fetchEmergencies = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (priorityFilter !== "ALL") params.append("priority", priorityFilter);
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (searchTerm) params.append("search", searchTerm);

      const res = await fetch(`/api/emergencies?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load emergencies");
      const data = await res.json();
      setEmergencies(data);

      // Check if URL query has an ID or action=new
      const targetId = searchParams.get("id");
      if (targetId && data.length > 0) {
        const found = data.find((e: any) => e.id === targetId);
        if (found) {
          setSelectedEmergency(found);
          setDetailModalOpen(true);
        }
      }
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Load Error",
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  }, [priorityFilter, statusFilter, searchTerm, searchParams, addToast]);

  useEffect(() => {
    fetchEmergencies();
  }, [fetchEmergencies]);

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      openCreateModal();
    }
  }, [searchParams]);

  const openCreateModal = async () => {
    try {
      const [patRes, ambRes] = await Promise.all([
        fetch("/api/patients"),
        fetch("/api/ambulances?status=Available"),
      ]);
      const pats = await patRes.json();
      const ambs = await ambRes.json();
      setPatients(pats);
      setAvailableAmbulances(ambs);
      if (pats.length > 0) {
        setNewEmergency((prev) => ({
          ...prev,
          patientId: pats[0].id,
          location: pats[0].address || "",
        }));
      }
      setCreateModalOpen(true);
    } catch (err) {
      addToast({
        type: "error",
        title: "Setup Error",
        message: "Failed to load patients/ambulances for dispatch form",
      });
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmergency.patientId || !newEmergency.emergencyType || !newEmergency.location) {
      addToast({
        type: "warning",
        title: "Incomplete Fields",
        message: "Please fill out patient, emergency type, and location.",
      });
      return;
    }

    try {
      const res = await fetch("/api/emergencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: newEmergency.patientId,
          emergencyType: newEmergency.emergencyType,
          location: newEmergency.location,
          priority: newEmergency.priority,
          ambulanceRequired: newEmergency.ambulanceRequired,
          bloodRequired: newEmergency.bloodRequired,
          ambulanceId: newEmergency.ambulanceId || null,
          bloodDetails: newEmergency.bloodRequired
            ? {
                unitsRequired: newEmergency.bloodUnits,
                urgency: newEmergency.bloodUrgency,
              }
            : undefined,
          notes: newEmergency.notes,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create emergency");
      }

      const created = await res.json();
      addToast({
        type: "success",
        title: "Emergency Case Created",
        message: `Case #${created.id.slice(-6)} logged. Live coordination active.`,
      });

      setCreateModalOpen(false);
      fetchEmergencies();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Dispatch Failure",
        message: err.message,
      });
    }
  };

  const handleAmbulanceAction = async (action: string) => {
    if (!selectedEmergency) return;
    try {
      const res = await fetch(`/api/emergencies/${selectedEmergency.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ambulanceAction: action,
        }),
      });

      if (!res.ok) throw new Error("Failed to update status");
      const updated = await res.json();
      setSelectedEmergency(updated);

      addToast({
        type: "success",
        title: "Status Progressed",
        message: `Emergency workflow advanced to ${action}.`,
      });

      fetchEmergencies();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Update Error",
        message: err.message,
      });
    }
  };

  const handleAssignAmbulance = async (ambulanceId: string) => {
    if (!selectedEmergency) return;
    try {
      const res = await fetch(`/api/emergencies/${selectedEmergency.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ambulanceId,
          status: "ASSIGNED",
        }),
      });

      if (!res.ok) throw new Error("Failed to assign ambulance");
      const updated = await res.json();
      setSelectedEmergency(updated);
      setAssignModalOpen(false);

      addToast({
        type: "success",
        title: "Ambulance Unit Assigned",
        message: "Unit successfully attached and dispatched.",
      });

      fetchEmergencies();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Assignment Failed",
        message: err.message,
      });
    }
  };

  // Helper to determine stage progression in timeline
  const getTimelineStageStatus = (stageKey: string, emergency: any) => {
    const stageOrder = [
      "CREATED",
      "PRIORITY_IDENTIFIED",
      "AMBULANCE_ASSIGNED",
      "EN_ROUTE",
      "PATIENT_REACHED",
      "RESOLVED",
    ];

    const eventStages = emergency.timelineEvents?.map((e: any) => e.stage) || [];
    const isCompleted = eventStages.includes(stageKey);

    // Current stage
    let currentStage = "CREATED";
    if (emergency.status === "RESOLVED") currentStage = "RESOLVED";
    else if (emergency.ambulance?.status === "At Hospital") currentStage = "PATIENT_REACHED";
    else if (emergency.ambulance?.status === "En Route" || emergency.status === "IN_PROGRESS") currentStage = "EN_ROUTE";
    else if (emergency.ambulanceId || emergency.status === "ASSIGNED") currentStage = "AMBULANCE_ASSIGNED";
    else currentStage = "PRIORITY_IDENTIFIED";

    const isCurrent = currentStage === stageKey;

    return { isCompleted, isCurrent };
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-red-600 text-white shadow-md shadow-red-600/30">
              <Activity className="w-5 h-5 animate-alert-pulse" />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Emergency Coordination Center
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Live triage dispatch, ambulance en route telemetry, and blood supply synchronization.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchEmergencies()}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Refresh</span>
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 shadow-md shadow-red-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Emergency Case</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search emergency by patient, symptom/type, vehicle number, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Priority filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="HIGH">HIGH Priority</option>
              <option value="MEDIUM">MEDIUM Priority</option>
              <option value="LOW">LOW Priority</option>
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">NEW</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="IN_PROGRESS">IN PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Emergency Cases Grid / Cards */}
      {loading ? (
        <div className="text-center py-16">
          <Activity className="w-8 h-8 text-red-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading emergency telemetry...</p>
        </div>
      ) : emergencies.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">
            No Emergency Cases Found
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            No emergency requests match the current search or filters. Create a new case or reset filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {emergencies.map((emg) => {
            const isHigh = emg.priority === "HIGH";
            const isResolved = emg.status === "RESOLVED";

            return (
              <div
                key={emg.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md ${
                  isHigh && !isResolved
                    ? "bg-rose-50/40 border-rose-300 ring-1 ring-rose-300/60"
                    : "bg-white border-slate-200"
                }`}
              >
                {/* Header */}
                <div className="p-5 border-b border-slate-100/80">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-mono text-slate-400">
                        CASE #{emg.id.slice(-6).toUpperCase()}
                      </span>
                      <h3 className="font-extrabold text-base text-slate-900 mt-0.5">
                        {emg.patient?.fullName}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {emg.patient?.age} yrs • {emg.patient?.gender} • Blood:{" "}
                        <span className="font-bold text-rose-700">
                          {emg.patient?.bloodGroup}
                        </span>
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        variant={emg.priority.toLowerCase()}
                        pulse={isHigh && !isResolved}
                      >
                        {emg.priority}
                      </Badge>
                      <Badge variant={emg.status.toLowerCase()}>{emg.status}</Badge>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-semibold text-red-700 bg-red-100/70 px-2 py-0.5 rounded-md">
                      {emg.emergencyType}
                    </span>
                    <span className="text-slate-400 text-[11px] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(emg.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-5 space-y-3 flex-1 text-xs">
                  {/* Location */}
                  <div className="flex items-start gap-2 text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{emg.location}</span>
                  </div>

                  {/* Ambulance Status */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AmbulanceIcon className="w-4 h-4 text-slate-600" />
                      <div>
                        <p className="text-[11px] text-slate-500 font-medium">Ambulance Fleet</p>
                        <p className="font-bold text-slate-800">
                          {emg.ambulance
                            ? `${emg.ambulance.vehicleNumber} (${emg.ambulance.driverName})`
                            : emg.ambulanceRequired
                            ? "Pending Assignment"
                            : "Not Needed"}
                        </p>
                      </div>
                    </div>
                    {emg.ambulance && (
                      <Badge variant={emg.ambulance.status.toLowerCase()}>
                        {emg.ambulance.status}
                      </Badge>
                    )}
                  </div>

                  {/* Blood Requirement */}
                  {emg.bloodRequired && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Droplet className="w-4 h-4 fill-rose-600 text-rose-600" />
                        <div>
                          <p className="text-[11px] font-bold">Blood Requested</p>
                          <p className="text-xs text-rose-700">
                            {emg.bloodRequests?.[0]
                              ? `${emg.bloodRequests[0].unitsRequired} Units (${emg.bloodRequests[0].bloodGroup})`
                              : `${emg.patient?.bloodGroup} Units Needed`}
                          </p>
                        </div>
                      </div>
                      {emg.bloodRequests?.[0] && (
                        <Badge variant={emg.bloodRequests[0].status.toLowerCase()}>
                          {emg.bloodRequests[0].status}
                        </Badge>
                      )}
                    </div>
                  )}

                  {emg.notes && (
                    <p className="text-slate-500 italic text-[11px] bg-slate-50/70 p-2 rounded-lg border border-slate-100 line-clamp-2">
                      "{emg.notes}"
                    </p>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setSelectedEmergency(emg);
                      setDetailModalOpen(true);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-600" />
                    <span>View Timeline & Case</span>
                  </button>

                  {!emg.ambulanceId && emg.status !== "RESOLVED" && (
                    <button
                      onClick={async () => {
                        setSelectedEmergency(emg);
                        const res = await fetch("/api/ambulances?status=Available");
                        const ambs = await res.json();
                        setAvailableAmbulances(ambs);
                        setAssignModalOpen(true);
                      }}
                      className="py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                    >
                      <AmbulanceIcon className="w-3.5 h-3.5" />
                      <span>Dispatch</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE EMERGENCY MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Emergency Coordination Case"
        subtitle="Log immediate medical logistics dispatch"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {/* Patient Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase">
                Patient <span className="text-red-500">*</span>
              </label>
              <Link
                href="/patients"
                className="text-[11px] text-blue-600 hover:underline"
              >
                + Register New Patient
              </Link>
            </div>
            <select
              value={newEmergency.patientId}
              onChange={(e) => {
                const patId = e.target.value;
                const p = patients.find((x) => x.id === patId);
                setNewEmergency((prev) => ({
                  ...prev,
                  patientId: patId,
                  location: p?.address || prev.location,
                }));
              }}
              required
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} ({p.age}y, {p.gender}, Blood: {p.bloodGroup})
                </option>
              ))}
            </select>
          </div>

          {/* Emergency Type & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Emergency Category <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newEmergency.emergencyType}
                onChange={(e) =>
                  setNewEmergency({ ...newEmergency, emergencyType: e.target.value })
                }
                placeholder="e.g. Acute Trauma, Stroke, Anaphylaxis"
                required
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Priority Classification <span className="text-red-500">*</span>
              </label>
              <select
                value={newEmergency.priority}
                onChange={(e) =>
                  setNewEmergency({ ...newEmergency, priority: e.target.value })
                }
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none font-bold"
              >
                <option value="HIGH">HIGH (Immediate Life Threat)</option>
                <option value="MEDIUM">MEDIUM (Urgent Operational Support)</option>
                <option value="LOW">LOW (Standard Clinical Transfer)</option>
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Incident Location / Pickup Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newEmergency.location}
              onChange={(e) =>
                setNewEmergency({ ...newEmergency, location: e.target.value })
              }
              placeholder="e.g. Sector 4 Main Market, Apt 3B"
              required
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
            />
          </div>

          {/* Logistics Options: Ambulance & Blood */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Operational Fleet & Supply Coordination
            </h4>

            {/* Ambulance */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newEmergency.ambulanceRequired}
                  onChange={(e) =>
                    setNewEmergency({
                      ...newEmergency,
                      ambulanceRequired: e.target.checked,
                    })
                  }
                  className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                />
                <span className="text-xs font-bold text-slate-800">
                  Ambulance Dispatch Required
                </span>
              </label>

              {newEmergency.ambulanceRequired && (
                <div className="pl-6">
                  <select
                    value={newEmergency.ambulanceId}
                    onChange={(e) =>
                      setNewEmergency({ ...newEmergency, ambulanceId: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                  >
                    <option value="">-- Assign Later from Coordination Center --</option>
                    {availableAmbulances.map((amb) => (
                      <option key={amb.id} value={amb.id}>
                        {amb.vehicleNumber} — Driver: {amb.driverName} ({amb.baseLocation})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Blood Requirement */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newEmergency.bloodRequired}
                  onChange={(e) =>
                    setNewEmergency({
                      ...newEmergency,
                      bloodRequired: e.target.checked,
                    })
                  }
                  className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                />
                <span className="text-xs font-bold text-rose-800 flex items-center gap-1">
                  <Droplet className="w-3.5 h-3.5 fill-rose-600" />
                  Blood Supply Required (Auto-creates Blood Request)
                </span>
              </label>

              {newEmergency.bloodRequired && (
                <div className="pl-6 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Units Required
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={newEmergency.bloodUnits}
                      onChange={(e) =>
                        setNewEmergency({
                          ...newEmergency,
                          bloodUnits: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Urgency
                    </label>
                    <select
                      value={newEmergency.bloodUrgency}
                      onChange={(e) =>
                        setNewEmergency({
                          ...newEmergency,
                          bloodUrgency: e.target.value,
                        })
                      }
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl font-bold"
                    >
                      <option value="Critical">Critical (Immediate)</option>
                      <option value="Urgent">Urgent (Within 1 hour)</option>
                      <option value="Normal">Normal Reserve</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Operational Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Incident Dispatch Notes
            </label>
            <textarea
              rows={2}
              value={newEmergency.notes}
              onChange={(e) =>
                setNewEmergency({ ...newEmergency, notes: e.target.value })
              }
              placeholder="e.g. Caller reported chest pain, responsive, bystander CPR initiated..."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-md shadow-red-600/30"
            >
              Deploy & Initiate Case
            </button>
          </div>
        </form>
      </Modal>

      {/* EMERGENCY DETAIL & TIMELINE MODAL */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedEmergency(null);
        }}
        title={`Emergency Case: ${selectedEmergency?.emergencyType || ""}`}
        subtitle={`Patient: ${selectedEmergency?.patient?.fullName || ""} • Case #${selectedEmergency?.id.slice(-6).toUpperCase()}`}
        maxWidth="2xl"
      >
        {selectedEmergency && (
          <div className="space-y-6">
            {/* Top Overview Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-bold">
                  Priority
                </span>
                <div className="mt-1">
                  <Badge variant={selectedEmergency.priority.toLowerCase()}>
                    {selectedEmergency.priority}
                  </Badge>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-bold">
                  Case Status
                </span>
                <div className="mt-1">
                  <Badge variant={selectedEmergency.status.toLowerCase()}>
                    {selectedEmergency.status}
                  </Badge>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-bold">
                  Ambulance
                </span>
                <p className="mt-1 font-bold text-xs text-slate-900">
                  {selectedEmergency.ambulance
                    ? selectedEmergency.ambulance.vehicleNumber
                    : "Not Assigned"}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-bold">
                  Blood Reserve
                </span>
                <p className="mt-1 font-bold text-xs text-rose-700">
                  {selectedEmergency.bloodRequired
                    ? `${selectedEmergency.patient?.bloodGroup} Needed`
                    : "Not Required"}
                </p>
              </div>
            </div>

            {/* Operational Workflow Progression Controller */}
            {selectedEmergency.status !== "RESOLVED" && (
              <div className="p-4 bg-slate-900 text-white rounded-xl shadow-lg border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Direct Operational Command
                  </span>
                  <span className="text-[11px] text-red-400 font-mono">
                    ACTIVE TRIAGE
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {/* Step 1: Assign Ambulance if none */}
                  {!selectedEmergency.ambulanceId && (
                    <button
                      onClick={async () => {
                        const res = await fetch("/api/ambulances?status=Available");
                        const ambs = await res.json();
                        setAvailableAmbulances(ambs);
                        setAssignModalOpen(true);
                      }}
                      className="px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow"
                    >
                      <AmbulanceIcon className="w-4 h-4" />
                      <span>1. Assign Ambulance</span>
                    </button>
                  )}

                  {/* Step 2: Ambulance En Route */}
                  {selectedEmergency.ambulanceId &&
                    selectedEmergency.ambulance?.status !== "En Route" &&
                    selectedEmergency.ambulance?.status !== "At Hospital" && (
                      <button
                        onClick={() => handleAmbulanceAction("EN_ROUTE")}
                        className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow"
                      >
                        <Navigation className="w-4 h-4" />
                        <span>2. Mark Ambulance En Route</span>
                      </button>
                    )}

                  {/* Step 3: Patient Reached / At Hospital */}
                  {selectedEmergency.ambulanceId &&
                    selectedEmergency.ambulance?.status === "En Route" && (
                      <button
                        onClick={() => handleAmbulanceAction("PATIENT_REACHED")}
                        className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow"
                      >
                        <MapPin className="w-4 h-4" />
                        <span>3. Mark Patient Reached / At Hospital</span>
                      </button>
                    )}

                  {/* Step 4: Resolve Emergency */}
                  <button
                    onClick={() => handleAmbulanceAction("RESOLVE")}
                    className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow ml-auto"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Resolve Emergency (Free Ambulance)</span>
                  </button>
                </div>
              </div>
            )}

            {/* VISUAL EMERGENCY TIMELINE (Section 5 requirement) */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                Emergency Lifecycle Timeline
              </h4>

              {/* Step indicator bar */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 mb-6">
                {TIMELINE_STAGES.map((stage, idx) => {
                  const { isCompleted, isCurrent } = getTimelineStageStatus(
                    stage.key,
                    selectedEmergency
                  );
                  return (
                    <div
                      key={stage.key}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        isCurrent
                          ? "bg-red-600 text-white border-red-700 font-bold shadow-sm"
                          : isCompleted
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-medium"
                          : "bg-slate-50 text-slate-400 border-slate-200"
                      }`}
                    >
                      <div className="text-[10px] uppercase font-mono">
                        Stage {idx + 1}
                      </div>
                      <p className="text-xs leading-tight mt-0.5">{stage.label}</p>
                    </div>
                  );
                })}
              </div>

              {/* Timeline Log Events */}
              <div className="space-y-4 border-l-2 border-slate-200 pl-4 ml-2">
                {selectedEmergency.timelineEvents?.map((event: any) => (
                  <div key={event.id} className="relative group">
                    <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-red-600 group-hover:scale-125 transition-transform" />
                    <div className="flex items-baseline justify-between">
                      <p className="text-xs font-bold text-slate-900">
                        {event.title}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatDateTime(event.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {event.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Patient & Incident Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h5 className="font-bold text-slate-800 uppercase text-[11px]">
                  Patient Profile
                </h5>
                <p>
                  <strong className="text-slate-700">Full Name:</strong>{" "}
                  {selectedEmergency.patient?.fullName}
                </p>
                <p>
                  <strong className="text-slate-700">Phone:</strong>{" "}
                  {selectedEmergency.patient?.phone}
                </p>
                <p>
                  <strong className="text-slate-700">Address:</strong>{" "}
                  {selectedEmergency.patient?.address}
                </p>
                <p>
                  <strong className="text-slate-700">Emergency Contact:</strong>{" "}
                  {selectedEmergency.patient?.emergencyContact || "None"}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h5 className="font-bold text-slate-800 uppercase text-[11px]">
                  Dispatch Details
                </h5>
                <p>
                  <strong className="text-slate-700">Scene Location:</strong>{" "}
                  {selectedEmergency.location}
                </p>
                <p>
                  <strong className="text-slate-700">Incident Category:</strong>{" "}
                  {selectedEmergency.emergencyType}
                </p>
                <p>
                  <strong className="text-slate-700">Created:</strong>{" "}
                  {formatDateTime(selectedEmergency.createdAt)}
                </p>
                {selectedEmergency.resolvedAt && (
                  <p>
                    <strong className="text-slate-700">Resolved:</strong>{" "}
                    {formatDateTime(selectedEmergency.resolvedAt)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* AMBULANCE ASSIGNMENT MODAL */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Assign Ambulance Unit"
        subtitle={`Select vehicle for ${selectedEmergency?.patient?.fullName || "emergency"}`}
      >
        <div className="space-y-4">
          {availableAmbulances.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-600">
                Select an available unit from the fleet:
              </p>
              {availableAmbulances.map((amb) => (
                <div
                  key={amb.id}
                  onClick={() => handleAssignAmbulance(amb.id)}
                  className="p-3 rounded-xl border border-slate-200 hover:border-red-500 hover:bg-red-50/40 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs">
                      {amb.vehicleNumber.slice(-3)}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-900 group-hover:text-red-700">
                        {amb.vehicleNumber}
                      </p>
                      <p className="text-xs text-slate-500">
                        Driver: {amb.driverName} • Contact: {amb.contact}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Station: {amb.baseLocation}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-red-600 group-hover:translate-x-1 transition-transform" />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
              No available ambulances in depot. All active units are currently deployed.
            </div>
          )}

          <div className="flex justify-end pt-3">
            <button
              onClick={() => setAssignModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function EmergencyCenterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <Activity className="w-8 h-8 text-red-600 animate-spin" />
        </div>
      }
    >
      <EmergencyCenterContent />
    </Suspense>
  );
}

