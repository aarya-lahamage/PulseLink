"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Ambulance as AmbulanceIcon,
  Phone,
  MapPin,
  PlusCircle,
  Activity,
  CheckCircle2,
  Navigation,
  RefreshCw,
  Edit2,
  Trash2,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ToastProvider";

const STATUSES = ["ALL", "Available", "Assigned", "En Route", "At Hospital"];

export default function AmbulancesPage() {
  const [ambulances, setAmbulances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedAmbulance, setSelectedAmbulance] = useState<any | null>(null);
  const [activeEmergencies, setActiveEmergencies] = useState<any[]>([]);
  const [selectedEmergencyId, setSelectedEmergencyId] = useState("");

  // Create Form
  const [formData, setFormData] = useState({
    vehicleNumber: "",
    driverName: "",
    contact: "",
    baseLocation: "Central Emergency Depot",
    status: "Available",
  });

  const { addToast } = useToast();

  const fetchAmbulances = useCallback(async () => {
    try {
      setLoading(true);
      const url =
        statusFilter === "ALL"
          ? "/api/ambulances"
          : `/api/ambulances?status=${statusFilter}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load ambulances");
      const data = await res.json();
      setAmbulances(data);
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Load Error",
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, addToast]);

  useEffect(() => {
    fetchAmbulances();
  }, [fetchAmbulances]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicleNumber || !formData.driverName || !formData.contact) {
      addToast({
        type: "warning",
        title: "Missing Fields",
        message: "Please fill in vehicle number, driver name, and phone.",
      });
      return;
    }

    try {
      const res = await fetch("/api/ambulances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add ambulance");
      }

      addToast({
        type: "success",
        title: "Ambulance Added",
        message: `Unit ${formData.vehicleNumber} enlisted in fleet.`,
      });

      setCreateModalOpen(false);
      setFormData({
        vehicleNumber: "",
        driverName: "",
        contact: "",
        baseLocation: "Central Emergency Depot",
        status: "Available",
      });
      fetchAmbulances();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Registration Error",
        message: err.message,
      });
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/ambulances/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      addToast({
        type: "success",
        title: "Ambulance Status Updated",
        message: `Status changed to ${newStatus}.`,
      });

      fetchAmbulances();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Update Error",
        message: err.message,
      });
    }
  };

  const openAssignModal = async (amb: any) => {
    setSelectedAmbulance(amb);
    try {
      const res = await fetch("/api/emergencies?status=NEW");
      const unassigned = await res.json();
      setActiveEmergencies(unassigned);
      if (unassigned.length > 0) {
        setSelectedEmergencyId(unassigned[0].id);
      } else {
        setSelectedEmergencyId("");
      }
      setAssignModalOpen(true);
    } catch (err) {
      addToast({
        type: "error",
        title: "Error",
        message: "Could not fetch unassigned emergencies",
      });
    }
  };

  const handleAssignToEmergency = async () => {
    if (!selectedAmbulance || !selectedEmergencyId) {
      addToast({
        type: "warning",
        title: "Select Case",
        message: "Choose an active emergency case to assign this ambulance to.",
      });
      return;
    }

    try {
      const res = await fetch(`/api/emergencies/${selectedEmergencyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ambulanceId: selectedAmbulance.id,
          status: "ASSIGNED",
        }),
      });

      if (!res.ok) throw new Error("Failed to assign ambulance to emergency");

      addToast({
        type: "success",
        title: "Ambulance Dispatched",
        message: `Unit ${selectedAmbulance.vehicleNumber} dispatched to case.`,
      });

      setAssignModalOpen(false);
      setSelectedAmbulance(null);
      fetchAmbulances();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Dispatch Failed",
        message: err.message,
      });
    }
  };

  const handleDelete = async (id: string, vehicleNumber: string) => {
    if (!window.confirm(`Decommission vehicle ${vehicleNumber}?`)) return;

    try {
      const res = await fetch(`/api/ambulances/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete vehicle");

      addToast({
        type: "info",
        title: "Vehicle Decommissioned",
        message: `Ambulance ${vehicleNumber} removed from active roster.`,
      });

      fetchAmbulances();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Error",
        message: err.message,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-md shadow-emerald-600/30">
              <AmbulanceIcon className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Ambulance Fleet Coordination
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Emergency response vehicle telemetry, driver dispatch, and hospital transfer tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchAmbulances()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-md shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Enlist Ambulance</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {STATUSES.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all ${
              statusFilter === status
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            {status === "ALL" ? "All Units" : status}
          </button>
        ))}
      </div>

      {/* Ambulance Grid */}
      {loading ? (
        <div className="text-center py-16">
          <Activity className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Checking fleet readiness...</p>
        </div>
      ) : ambulances.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <AmbulanceIcon className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">
            No Ambulances in this category
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Enlist new vehicles or adjust the status filter above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {ambulances.map((amb) => {
            const isAvailable = amb.status === "Available";
            const isEnRoute = amb.status === "En Route";
            const activeEmergency = amb.emergencies?.[0];

            return (
              <div
                key={amb.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                {/* Header */}
                <div className="p-5 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                          isAvailable
                            ? "bg-emerald-100 text-emerald-800"
                            : isEnRoute
                            ? "bg-amber-100 text-amber-800"
                            : "bg-indigo-100 text-indigo-800"
                        }`}
                      >
                        <AmbulanceIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                          {amb.vehicleNumber}
                        </h3>
                        <p className="text-[11px] text-slate-400 font-mono">
                          Station: {amb.baseLocation}
                        </p>
                      </div>
                    </div>

                    <Badge variant={amb.status.toLowerCase()} pulse={isEnRoute}>
                      {amb.status}
                    </Badge>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-5 space-y-3 flex-1 text-xs">
                  <div>
                    <p className="text-[11px] text-slate-400 font-semibold uppercase">
                      Primary Operator
                    </p>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">
                      {amb.driverName}
                    </p>
                    <p className="text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {amb.contact}
                    </p>
                  </div>

                  {/* Active Emergency Link if assigned */}
                  {activeEmergency ? (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-950">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-red-700">
                          Active Dispatch Case
                        </span>
                        <Link
                          href={`/emergencies?id=${activeEmergency.id}`}
                          className="text-[11px] font-bold text-red-600 hover:underline"
                        >
                          View Case →
                        </Link>
                      </div>
                      <p className="font-bold text-xs mt-1">
                        {activeEmergency.patient?.fullName}
                      </p>
                      <p className="text-[11px] text-red-800 line-clamp-1 mt-0.5">
                        {activeEmergency.emergencyType}
                      </p>
                      <p className="text-[10px] text-red-600 flex items-center gap-1 mt-1 truncate">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {activeEmergency.location}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-500 text-[11px] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Standby in depot • Ready for emergency dispatch</span>
                    </div>
                  )}
                </div>

                {/* Footer Controls: Status progression */}
                <div className="p-4 bg-slate-50/80 border-t border-slate-100 space-y-2">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">
                    Change Status
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => handleUpdateStatus(amb.id, "Available")}
                      disabled={amb.status === "Available"}
                      className="px-2 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 text-emerald-800 text-[11px] font-bold transition-all disabled:opacity-40 disabled:pointer-events-none"
                    >
                      ✓ Available
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(amb.id, "En Route")}
                      disabled={amb.status === "En Route"}
                      className="px-2 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-amber-50 hover:border-amber-300 text-amber-800 text-[11px] font-bold transition-all disabled:opacity-40 disabled:pointer-events-none"
                    >
                      ⚡ En Route
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(amb.id, "At Hospital")}
                      disabled={amb.status === "At Hospital"}
                      className="px-2 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-cyan-50 hover:border-cyan-300 text-cyan-800 text-[11px] font-bold transition-all disabled:opacity-40 disabled:pointer-events-none"
                    >
                      🏥 At Hospital
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(amb.id, "Assigned")}
                      disabled={amb.status === "Assigned"}
                      className="px-2 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 text-indigo-800 text-[11px] font-bold transition-all disabled:opacity-40 disabled:pointer-events-none"
                    >
                      📌 Assigned
                    </button>
                  </div>

                  {isAvailable && (
                    <button
                      onClick={() => openAssignModal(amb)}
                      className="w-full mt-2 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow flex items-center justify-center gap-1.5"
                    >
                      <AmbulanceIcon className="w-3.5 h-3.5" />
                      <span>Deploy to Emergency Case</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE AMBULANCE MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Enlist Fleet Ambulance"
        subtitle="Add a certified response vehicle and driver to dispatch"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Vehicle Registration Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.vehicleNumber}
              onChange={(e) =>
                setFormData({ ...formData, vehicleNumber: e.target.value })
              }
              placeholder="e.g. AMB-108 or NY-MED-44"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Driver Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.driverName}
                onChange={(e) =>
                  setFormData({ ...formData, driverName: e.target.value })
                }
                placeholder="e.g. Samuel Bennett"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Contact Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.contact}
                onChange={(e) =>
                  setFormData({ ...formData, contact: e.target.value })
                }
                placeholder="+1 (555) 901-0000"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Base Depot / Location
              </label>
              <input
                type="text"
                value={formData.baseLocation}
                onChange={(e) =>
                  setFormData({ ...formData, baseLocation: e.target.value })
                }
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Initial Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
              >
                <option value="Available">Available</option>
                <option value="Assigned">Assigned</option>
                <option value="En Route">En Route</option>
                <option value="At Hospital">At Hospital</option>
              </select>
            </div>
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
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md shadow-emerald-600/30"
            >
              Add to Fleet
            </button>
          </div>
        </form>
      </Modal>

      {/* ASSIGN TO EMERGENCY MODAL */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => {
          setAssignModalOpen(false);
          setSelectedAmbulance(null);
        }}
        title={`Deploy Ambulance ${selectedAmbulance?.vehicleNumber || ""}`}
        subtitle="Select an active emergency request to dispatch this vehicle"
      >
        <div className="space-y-4">
          {activeEmergencies.length > 0 ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                Unassigned Emergency Cases ({activeEmergencies.length})
              </label>
              <div className="space-y-2">
                {activeEmergencies.map((emg) => (
                  <div
                    key={emg.id}
                    onClick={() => setSelectedEmergencyId(emg.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedEmergencyId === emg.id
                        ? "bg-red-50 border-red-500 ring-2 ring-red-400"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-xs text-slate-900">
                        {emg.patient?.fullName} ({emg.patient?.bloodGroup})
                      </p>
                      <Badge variant={emg.priority.toLowerCase()}>
                        {emg.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-red-700 font-medium mt-1">
                      {emg.emergencyType}
                    </p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {emg.location}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
              No unassigned emergency cases currently pending dispatch.
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setAssignModalOpen(false);
                setSelectedAmbulance(null);
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedEmergencyId}
              onClick={handleAssignToEmergency}
              className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-md shadow-red-600/30 disabled:opacity-50"
            >
              Confirm Dispatch
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
