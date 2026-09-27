"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  CalendarDays,
  Activity,
  Ambulance as AmbulanceIcon,
  Droplet,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  PlusCircle,
  MapPin,
  HeartPulse,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ToastProvider";
import { formatTimeAgo } from "@/lib/utils";

interface DashboardData {
  stats: {
    totalPatients: number;
    todayAppointments: number;
    activeEmergencies: number;
    availableAmbulances: number;
    pendingBloodRequests: number;
  };
  activeEmergencies: any[];
  pendingActions: {
    urgentEmergenciesWithoutAmbulance: any[];
    urgentBloodRequests: any[];
    appointmentsAwaitingConfirmation: any[];
  };
  todayAppointments: any[];
  recentActivity: any[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEmergency, setSelectedEmergency] = useState<any | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [emergencyToAssign, setEmergencyToAssign] = useState<any | null>(null);
  const [availableAmbulances, setAvailableAmbulances] = useState<any[]>([]);
  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState("");
  const { addToast } = useToast();

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Failed to load dashboard data");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Sync Error",
        message: err.message || "Failed to load dashboard data",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData(true);
  };

  const openAssignModal = async (emergency: any) => {
    setEmergencyToAssign(emergency);
    try {
      const res = await fetch("/api/ambulances?status=Available");
      const ambulances = await res.json();
      setAvailableAmbulances(ambulances);
      if (ambulances.length > 0) {
        setSelectedAmbulanceId(ambulances[0].id);
      } else {
        setSelectedAmbulanceId("");
      }
      setAssignModalOpen(true);
    } catch (err) {
      addToast({
        type: "error",
        title: "Ambulance Check Failed",
        message: "Could not fetch available ambulances",
      });
    }
  };

  const handleAssignAmbulance = async () => {
    if (!emergencyToAssign || !selectedAmbulanceId) {
      addToast({
        type: "warning",
        title: "Selection Needed",
        message: "Please choose an available ambulance unit.",
      });
      return;
    }

    try {
      const res = await fetch(`/api/emergencies/${emergencyToAssign.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ambulanceId: selectedAmbulanceId,
          status: "ASSIGNED",
        }),
      });

      if (!res.ok) throw new Error("Failed to assign ambulance");

      addToast({
        type: "success",
        title: "Ambulance Dispatched",
        message: `Ambulance assigned to ${emergencyToAssign.patient?.fullName || "emergency case"}.`,
      });

      setAssignModalOpen(false);
      setEmergencyToAssign(null);
      fetchDashboardData(true);
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Assignment Failed",
        message: err.message,
      });
    }
  };

  const handleConfirmAppointment = async (id: string, patientName: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Confirmed" }),
      });

      if (!res.ok) throw new Error("Failed to confirm appointment");

      addToast({
        type: "success",
        title: "Appointment Confirmed",
        message: `Appointment for ${patientName} has been confirmed.`,
      });
      fetchDashboardData(true);
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Action Failed",
        message: err.message,
      });
    }
  };

  const handleFulfillBlood = async (id: string, bloodGroup: string, units: number) => {
    try {
      const res = await fetch(`/api/blood-requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Fulfilled" }),
      });

      if (!res.ok) throw new Error("Failed to fulfill blood request");

      addToast({
        type: "success",
        title: "Blood Units Allocated",
        message: `${units} units of ${bloodGroup} allocated and fulfilled.`,
      });
      fetchDashboardData(true);
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Allocation Failed",
        message: err.message,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Activity className="w-10 h-10 text-red-500 animate-spin" />
        <p className="text-sm font-medium text-slate-500">
          Initializing Coordination Command Center...
        </p>
      </div>
    );
  }

  const stats = data?.stats || {
    totalPatients: 0,
    todayAppointments: 0,
    activeEmergencies: 0,
    availableAmbulances: 0,
    pendingBloodRequests: 0,
  };

  const totalPendingActions =
    (data?.pendingActions?.urgentEmergenciesWithoutAmbulance?.length || 0) +
    (data?.pendingActions?.urgentBloodRequests?.length || 0) +
    (data?.pendingActions?.appointmentsAwaitingConfirmation?.length || 0);

  return (
    <div className="space-y-8">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Operations Coordination Center
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time clinic triage, emergency response fleet, and blood bank operations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-red-600" : ""}`} />
            <span>Sync Live</span>
          </button>
          <Link
            href="/emergencies"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 shadow-md shadow-red-600/20 transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Open Emergency Center</span>
          </Link>
        </div>
      </div>

      {/* Top Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Patients */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Patients
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {stats.totalPatients}
            </span>
            <span className="text-[11px] text-slate-400">Registered</span>
          </div>
          <Link
            href="/patients"
            className="mt-3 text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
          >
            <span>View directory</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Today's Appointments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Today's Appts
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {stats.todayAppointments}
            </span>
            <span className="text-[11px] text-slate-400">Scheduled today</span>
          </div>
          <Link
            href="/appointments"
            className="mt-3 text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
          >
            <span>Manage schedule</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Active Emergencies (Highlighted) */}
        <div
          className={`p-5 rounded-2xl border shadow-sm transition-all ${
            stats.activeEmergencies > 0
              ? "bg-red-50/70 border-red-200 hover:border-red-300 text-red-950"
              : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-700 uppercase tracking-wider flex items-center gap-1.5">
              {stats.activeEmergencies > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-600 animate-alert-pulse"></span>
              )}
              Active Emergencies
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center shadow-sm">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-red-600">
              {stats.activeEmergencies}
            </span>
            <span className="text-[11px] text-red-700/80">In coordination</span>
          </div>
          <Link
            href="/emergencies"
            className="mt-3 text-xs font-bold text-red-700 hover:text-red-800 flex items-center gap-1 group"
          >
            <span>Emergency center</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Available Ambulances */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Ambulances Ready
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <AmbulanceIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600">
              {stats.availableAmbulances}
            </span>
            <span className="text-[11px] text-slate-400">Available</span>
          </div>
          <Link
            href="/ambulances"
            className="mt-3 text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group"
          >
            <span>Fleet view</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Pending Blood Requests */}
        <div
          className={`p-5 rounded-2xl border shadow-sm transition-all col-span-2 lg:col-span-1 ${
            stats.pendingBloodRequests > 0
              ? "bg-amber-50/60 border-amber-200 hover:border-amber-300"
              : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-900 uppercase tracking-wider">
              Blood Requests
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <Droplet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-700">
              {stats.pendingBloodRequests}
            </span>
            <span className="text-[11px] text-amber-900/80">Pending match</span>
          </div>
          <Link
            href="/blood-requests"
            className="mt-3 text-xs font-medium text-amber-800 hover:text-amber-900 flex items-center gap-1 group"
          >
            <span>Blood inventory</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* PENDING ACTIONS SECTION (High attention trigger) */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Pending Operational Actions
                {totalPendingActions > 0 && (
                  <span className="bg-red-600 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full">
                    {totalPendingActions} REQUIRES ATTENTION
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Actionable triage items demanding dispatcher intervention
              </p>
            </div>
          </div>
        </div>

        {totalPendingActions === 0 ? (
          <div className="bg-slate-800/40 rounded-xl p-6 text-center border border-slate-800">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-200">
              No pending emergency bottlenecks
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              All active emergencies have units assigned, blood requests are fulfilled, and appointments are confirmed.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Urgent Emergencies without Ambulance */}
            <div className="bg-slate-800/60 rounded-xl p-4 border border-red-500/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                  <span className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                    Ambulance Needed ({data?.pendingActions?.urgentEmergenciesWithoutAmbulance?.length || 0})
                  </span>
                  <Badge variant="high">PRIORITY</Badge>
                </div>
                <div className="mt-3 space-y-2">
                  {data?.pendingActions?.urgentEmergenciesWithoutAmbulance?.length ? (
                    data.pendingActions.urgentEmergenciesWithoutAmbulance.map((emg: any) => (
                      <div
                        key={emg.id}
                        className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-700/80"
                      >
                        <div className="flex justify-between items-start">
                          <p className="text-xs font-bold text-white">
                            {emg.patient?.fullName} ({emg.patient?.bloodGroup})
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {formatTimeAgo(emg.createdAt)}
                          </span>
                        </div>
                        <p className="text-[11px] text-red-300 mt-0.5 font-medium line-clamp-1">
                          {emg.emergencyType}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1 line-clamp-1">
                          <MapPin className="w-2.5 h-2.5 shrink-0" /> {emg.location}
                        </p>
                        <button
                          onClick={() => openAssignModal(emg)}
                          className="mt-2 w-full py-1.5 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold tracking-wide transition-colors flex items-center justify-center gap-1.5 shadow"
                        >
                          <AmbulanceIcon className="w-3.5 h-3.5" />
                          <span>Dispatch Ambulance</span>
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 py-3 text-center">
                      All emergencies have assigned transport.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Urgent Blood Requests */}
            <div className="bg-slate-800/60 rounded-xl p-4 border border-amber-500/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Droplet className="w-3.5 h-3.5 text-rose-400" />
                    Urgent Blood Needs ({data?.pendingActions?.urgentBloodRequests?.length || 0})
                  </span>
                  <Badge variant="urgent">SUPPLY</Badge>
                </div>
                <div className="mt-3 space-y-2">
                  {data?.pendingActions?.urgentBloodRequests?.length ? (
                    data.pendingActions.urgentBloodRequests.map((req: any) => (
                      <div
                        key={req.id}
                        className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-700/80"
                      >
                        <div className="flex justify-between items-start">
                          <p className="text-xs font-bold text-white">
                            {req.patient?.fullName}
                          </p>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                            {req.bloodGroup}
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-300 mt-0.5">
                          Requires: <span className="font-bold">{req.unitsRequired} Units</span> • {req.urgency}
                        </p>
                        <button
                          onClick={() => handleFulfillBlood(req.id, req.bloodGroup, req.unitsRequired)}
                          className="mt-2 w-full py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold tracking-wide transition-colors flex items-center justify-center gap-1.5 shadow"
                        >
                          <Droplet className="w-3.5 h-3.5" />
                          <span>Fulfill & Deduct Inventory</span>
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 py-3 text-center">
                      No urgent blood requests pending.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Appointments Awaiting Confirmation */}
            <div className="bg-slate-800/60 rounded-xl p-4 border border-blue-500/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5 text-blue-400" />
                    Appts Pending Conf. ({data?.pendingActions?.appointmentsAwaitingConfirmation?.length || 0})
                  </span>
                  <Badge variant="pending">INTAKE</Badge>
                </div>
                <div className="mt-3 space-y-2">
                  {data?.pendingActions?.appointmentsAwaitingConfirmation?.length ? (
                    data.pendingActions.appointmentsAwaitingConfirmation.map((appt: any) => (
                      <div
                        key={appt.id}
                        className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-700/80"
                      >
                        <div className="flex justify-between items-start">
                          <p className="text-xs font-bold text-white truncate max-w-[150px]">
                            {appt.patient?.fullName}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {appt.time}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-0.5 truncate">
                          Dr. {appt.doctor?.name} • {appt.reason}
                        </p>
                        <button
                          onClick={() => handleConfirmAppointment(appt.id, appt.patient?.fullName)}
                          className="mt-2 w-full py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold tracking-wide transition-colors flex items-center justify-center gap-1.5 shadow"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirm Appointment</span>
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 py-3 text-center">
                      All incoming appointments confirmed.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MAIN SECTION: Emergency Coordination Center Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-red-600" />
              Emergency Coordination Board
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Active patient triage: Patient → Priority → Ambulance → Blood Supply → Status
            </p>
          </div>
          <Link
            href="/emergencies"
            className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1"
          >
            <span>Full Emergency Center</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Emergencies Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-100/70 text-slate-700 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Patient</th>
                <th className="px-6 py-3.5">Emergency Type</th>
                <th className="px-6 py-3.5">Priority</th>
                <th className="px-6 py-3.5">Location</th>
                <th className="px-6 py-3.5">Ambulance</th>
                <th className="px-6 py-3.5">Blood Requirement</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Time</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.activeEmergencies?.length ? (
                data.activeEmergencies.map((emg: any) => {
                  const isHigh = emg.priority === "HIGH";
                  return (
                    <tr
                      key={emg.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isHigh ? "bg-red-50/20" : ""
                      }`}
                    >
                      {/* Patient */}
                      <td className="px-6 py-4">
                        <Link
                          href={`/patients/${emg.patient?.id}`}
                          className="font-bold text-slate-900 hover:text-blue-600 transition-colors block"
                        >
                          {emg.patient?.fullName}
                        </Link>
                        <span className="text-xs text-slate-400">
                          {emg.patient?.age} yrs • {emg.patient?.gender} • Blood:{" "}
                          <span className="font-semibold text-rose-700">
                            {emg.patient?.bloodGroup}
                          </span>
                        </span>
                      </td>

                      {/* Emergency Type */}
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-900">
                          {emg.emergencyType}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="px-6 py-4">
                        <Badge
                          variant={emg.priority.toLowerCase()}
                          pulse={emg.priority === "HIGH"}
                        >
                          {emg.priority}
                        </Badge>
                      </td>

                      {/* Location */}
                      <td className="px-6 py-4 max-w-[200px]">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 truncate" title={emg.location}>
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{emg.location}</span>
                        </div>
                      </td>

                      {/* Ambulance Status */}
                      <td className="px-6 py-4">
                        {emg.ambulance ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <AmbulanceIcon className="w-3.5 h-3.5 text-slate-500" />
                              <span className="font-semibold text-xs text-slate-900">
                                {emg.ambulance.vehicleNumber}
                              </span>
                            </div>
                            <Badge variant={emg.ambulance.status.toLowerCase()}>
                              {emg.ambulance.status}
                            </Badge>
                          </div>
                        ) : emg.ambulanceRequired ? (
                          <button
                            onClick={() => openAssignModal(emg)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-100 text-red-800 text-xs font-bold hover:bg-red-200 transition-colors"
                          >
                            <AmbulanceIcon className="w-3 h-3" />
                            <span>Assign Unit</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">Not required</span>
                        )}
                      </td>

                      {/* Blood Requirement */}
                      <td className="px-6 py-4">
                        {emg.bloodRequired ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700">
                              <Droplet className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
                              {emg.bloodRequests?.[0]
                                ? `${emg.bloodRequests[0].unitsRequired} Units (${emg.bloodRequests[0].bloodGroup})`
                                : "Required"}
                            </span>
                            {emg.bloodRequests?.[0] && (
                              <div>
                                <Badge variant={emg.bloodRequests[0].status.toLowerCase()}>
                                  {emg.bloodRequests[0].status}
                                </Badge>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">None</span>
                        )}
                      </td>

                      {/* Current Status */}
                      <td className="px-6 py-4">
                        <Badge variant={emg.status.toLowerCase()}>
                          {emg.status}
                        </Badge>
                      </td>

                      {/* Time */}
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {formatTimeAgo(emg.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/emergencies?id=${emg.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
                        >
                          Coordinate
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-slate-400">
                    No active emergency incidents currently reported.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* LOWER SECTION: Today's Appointments & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Today's Appointments */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900">Today's Clinic Schedule</h3>
            </div>
            <Link
              href="/appointments"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              All Appointments →
            </Link>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {data?.todayAppointments?.length ? (
              data.todayAppointments.map((appt: any) => (
                <div key={appt.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-900 truncate">
                      {appt.patient?.fullName}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {appt.doctor?.name} ({appt.doctor?.department})
                    </p>
                    <p className="text-xs text-slate-400 italic mt-0.5 truncate">
                      "{appt.reason}"
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                      {appt.time}
                    </span>
                    <Badge variant={appt.status.toLowerCase()}>{appt.status}</Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">
                No appointments booked for today.
              </p>
            )}
          </div>
        </div>

        {/* Recent Operational Activity */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900">Recent Operational Feed</h3>
            </div>
            <span className="text-[11px] text-slate-400">Live Log</span>
          </div>

          <div className="mt-4 space-y-4">
            {data?.recentActivity?.length ? (
              data.recentActivity.map((event: any) => (
                <div key={event.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between">
                      <p className="text-xs font-bold text-slate-900">
                        {event.title}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {formatTimeAgo(event.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {event.description}
                    </p>
                    {event.emergency?.patient && (
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Patient: {event.emergency.patient.fullName}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">
                No recent activity logged yet.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* AMBULANCE DISPATCH MODAL */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => {
          setAssignModalOpen(false);
          setEmergencyToAssign(null);
        }}
        title="Dispatch Ambulance Unit"
        subtitle={`Assign transport for ${emergencyToAssign?.patient?.fullName || "emergency incident"}`}
      >
        <div className="space-y-4">
          <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-900">
            <p className="font-bold">{emergencyToAssign?.emergencyType}</p>
            <p className="mt-0.5 text-red-700">{emergencyToAssign?.location}</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
              Select Available Ambulance
            </label>
            {availableAmbulances.length > 0 ? (
              <select
                value={selectedAmbulanceId}
                onChange={(e) => setSelectedAmbulanceId(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
              >
                {availableAmbulances.map((amb) => (
                  <option key={amb.id} value={amb.id}>
                    {amb.vehicleNumber} — Driver: {amb.driverName} ({amb.baseLocation})
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                All ambulances are currently assigned or en route. Check the Ambulances page to update vehicle status.
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setAssignModalOpen(false);
                setEmergencyToAssign(null);
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedAmbulanceId}
              onClick={handleAssignAmbulance}
              className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow disabled:opacity-50"
            >
              Confirm & Dispatch
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
