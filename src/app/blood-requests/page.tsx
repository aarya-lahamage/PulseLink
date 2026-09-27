"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Droplet,
  PlusCircle,
  Search,
  Filter,
  Activity,
  CheckCircle2,
  Clock,
  User,
  AlertTriangle,
  RefreshCw,
  Plus,
  Minus,
  Edit2,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ToastProvider";
import { formatDate } from "@/lib/utils";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const URGENCIES = ["ALL", "Critical", "Urgent", "Normal"];
const STATUSES = ["ALL", "Pending", "Matching", "Fulfilled"];

export default function BloodRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [emergencies, setEmergencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [urgencyFilter, setUrgencyFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [bloodGroupFilter, setBloodGroupFilter] = useState("ALL");

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [selectedStockGroup, setSelectedStockGroup] = useState<any | null>(null);
  const [newStockUnits, setNewStockUnits] = useState(0);

  // Create Request Form
  const [formData, setFormData] = useState({
    patientId: "",
    emergencyId: "",
    bloodGroup: "O+",
    unitsRequired: 2,
    urgency: "Urgent",
    notes: "",
  });

  const { addToast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (urgencyFilter !== "ALL") params.append("urgency", urgencyFilter);
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (bloodGroupFilter !== "ALL") params.append("bloodGroup", bloodGroupFilter);

      const [reqRes, invRes] = await Promise.all([
        fetch(`/api/blood-requests?${params.toString()}`),
        fetch("/api/blood-inventory"),
      ]);

      const reqData = await reqRes.json();
      const invData = await invRes.json();

      setRequests(reqData);
      setInventory(invData);
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Load Error",
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  }, [urgencyFilter, statusFilter, bloodGroupFilter, addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreateModal = async () => {
    try {
      const [patRes, emgRes] = await Promise.all([
        fetch("/api/patients"),
        fetch("/api/emergencies"),
      ]);
      const pats = await patRes.json();
      const emgs = await emgRes.json();
      setPatients(pats);
      setEmergencies(emgs);

      if (pats.length > 0) {
        setFormData((prev) => ({
          ...prev,
          patientId: pats[0].id,
          bloodGroup: pats[0].bloodGroup || "O+",
        }));
      }
      setCreateModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId || !formData.bloodGroup || !formData.unitsRequired) {
      addToast({
        type: "warning",
        title: "Missing Fields",
        message: "Patient, blood group, and units required.",
      });
      return;
    }

    try {
      const res = await fetch("/api/blood-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to create blood request");

      addToast({
        type: "success",
        title: "Blood Request Logged",
        message: `Request for ${formData.unitsRequired} units of ${formData.bloodGroup} registered.`,
      });

      setCreateModalOpen(false);
      fetchData();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Error",
        message: err.message,
      });
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/blood-requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      addToast({
        type: "success",
        title: "Status Updated",
        message: `Blood request marked as ${newStatus}.`,
      });

      fetchData();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Error",
        message: err.message,
      });
    }
  };

  const openStockModal = (item: any) => {
    setSelectedStockGroup(item);
    setNewStockUnits(item.unitsAvailable);
    setStockModalOpen(true);
  };

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStockGroup) return;

    try {
      const res = await fetch("/api/blood-inventory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bloodGroup: selectedStockGroup.bloodGroup,
          unitsAvailable: Number(newStockUnits),
        }),
      });

      if (!res.ok) throw new Error("Failed to update stock");

      addToast({
        type: "success",
        title: "Inventory Adjusted",
        message: `${selectedStockGroup.bloodGroup} stock updated to ${newStockUnits} units.`,
      });

      setStockModalOpen(false);
      setSelectedStockGroup(null);
      fetchData();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Stock Update Failed",
        message: err.message,
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this blood request?")) return;

    try {
      const res = await fetch(`/api/blood-requests/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");

      addToast({
        type: "info",
        title: "Request Deleted",
        message: "Blood request removed.",
      });

      fetchData();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Error",
        message: err.message,
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-600 text-white shadow-md shadow-rose-600/30">
              <Droplet className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Blood Bank & Request Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time blood bank inventory reserve, clinical urgency matching, and emergency crossmatch requests.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchData()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Live</span>
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 shadow-md shadow-rose-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Blood Request</span>
          </button>
        </div>
      </div>

      {/* BLOOD INVENTORY OVERVIEW CARDS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Droplet className="w-4 h-4 text-rose-600 fill-rose-600" />
            Blood Reserve Inventory
          </h2>
          <span className="text-[11px] text-slate-400">
            Click any group to modify stock levels
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {inventory.map((item) => {
            const isLow = item.unitsAvailable < 5;
            const isCritical = item.unitsAvailable <= 2;

            return (
              <div
                key={item.bloodGroup}
                onClick={() => openStockModal(item)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${
                  isCritical
                    ? "bg-rose-100/70 border-rose-400 text-rose-950 ring-1 ring-rose-400"
                    : isLow
                    ? "bg-amber-50/70 border-amber-300 text-amber-950"
                    : "bg-white border-slate-200 text-slate-900 shadow-sm"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-lg">{item.bloodGroup}</span>
                  {isCritical ? (
                    <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping"></span>
                  ) : isLow ? (
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  )}
                </div>

                <div className="mt-2">
                  <span className="text-2xl font-black">{item.unitsAvailable}</span>
                  <span className="text-[10px] text-slate-500 block uppercase font-medium">
                    Units In Stock
                  </span>
                </div>

                <div className="mt-2 pt-2 border-t border-black/5 text-[10px] flex items-center justify-between text-slate-500">
                  <span>{isCritical ? "CRITICAL" : isLow ? "LOW" : "OPTIMAL"}</span>
                  <Edit2 className="w-3 h-3" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FILTER BAR FOR REQUESTS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Urgency Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Urgency:</span>
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-rose-500"
            >
              {URGENCIES.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-rose-500"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Blood Group Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Group:</span>
            <select
              value={bloodGroupFilter}
              onChange={(e) => setBloodGroupFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="ALL">All Groups</option>
              {BLOOD_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* BLOOD REQUESTS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-100/70 text-slate-700 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Patient</th>
                <th className="px-6 py-3.5">Blood Group & Units</th>
                <th className="px-6 py-3.5">Urgency</th>
                <th className="px-6 py-3.5">Connected Case</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Date Logged</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    Loading blood requests...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No blood requests found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Patient */}
                    <td className="px-6 py-4">
                      <Link
                        href={`/patients/${req.patient?.id}`}
                        className="font-bold text-slate-900 hover:text-blue-600 transition-colors"
                      >
                        {req.patient?.fullName}
                      </Link>
                      <p className="text-xs text-slate-400">
                        {req.patient?.phone}
                      </p>
                    </td>

                    {/* Blood Group & Units */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
                          {req.bloodGroup}
                        </span>
                        <span className="font-extrabold text-sm text-slate-900">
                          {req.unitsRequired} Units
                        </span>
                      </div>
                    </td>

                    {/* Urgency */}
                    <td className="px-6 py-4">
                      <Badge
                        variant={req.urgency.toLowerCase()}
                        pulse={req.urgency === "Critical" && req.status !== "Fulfilled"}
                      >
                        {req.urgency}
                      </Badge>
                    </td>

                    {/* Connected Emergency */}
                    <td className="px-6 py-4 text-xs">
                      {req.emergency ? (
                        <div>
                          <Link
                            href={`/emergencies?id=${req.emergency.id}`}
                            className="font-bold text-red-600 hover:underline flex items-center gap-1"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Case #{req.emergency.id.slice(-6).toUpperCase()}</span>
                          </Link>
                          <p className="text-[11px] text-slate-500 truncate max-w-[180px]">
                            {req.emergency.emergencyType}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Clinical Procedure</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <Badge variant={req.status.toLowerCase()}>{req.status}</Badge>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                      {formatDate(req.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {req.status === "Pending" && (
                          <button
                            onClick={() => handleStatusChange(req.id, "Matching")}
                            className="px-2.5 py-1 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-800 text-xs font-bold transition-colors"
                          >
                            Match
                          </button>
                        )}

                        {req.status !== "Fulfilled" && (
                          <button
                            onClick={() => handleStatusChange(req.id, "Fulfilled")}
                            className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold transition-colors"
                          >
                            Fulfill & Deduct
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(req.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Request"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE BLOOD REQUEST MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Blood Crossmatch Request"
        subtitle="Reserve blood supply units for patient or emergency operation"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Patient <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.patientId}
              onChange={(e) => {
                const patId = e.target.value;
                const p = patients.find((x) => x.id === patId);
                setFormData((prev) => ({
                  ...prev,
                  patientId: patId,
                  bloodGroup: p?.bloodGroup || prev.bloodGroup,
                }));
              }}
              required
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} ({p.bloodGroup})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Blood Group <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.bloodGroup}
                onChange={(e) =>
                  setFormData({ ...formData, bloodGroup: e.target.value })
                }
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none font-bold"
              >
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Units Required <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={20}
                required
                value={formData.unitsRequired}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    unitsRequired: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Urgency Level <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.urgency}
                onChange={(e) =>
                  setFormData({ ...formData, urgency: e.target.value })
                }
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none font-bold"
              >
                <option value="Critical">Critical (Immediate Life-Threat)</option>
                <option value="Urgent">Urgent (Within 1-2 hours)</option>
                <option value="Normal">Normal Reserve</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Attach Emergency Case (Optional)
              </label>
              <select
                value={formData.emergencyId}
                onChange={(e) =>
                  setFormData({ ...formData, emergencyId: e.target.value })
                }
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
              >
                <option value="">-- No Emergency Attachment --</option>
                {emergencies
                  .filter((e) => e.status !== "RESOLVED")
                  .map((emg) => (
                    <option key={emg.id} value={emg.id}>
                      #{emg.id.slice(-6).toUpperCase()} — {emg.patient?.fullName} ({emg.emergencyType})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Clinical Context / Requisition Notes
            </label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="e.g. Pre-surgical allocation for planned trauma procedure"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
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
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-md shadow-rose-600/30"
            >
              Submit Blood Request
            </button>
          </div>
        </form>
      </Modal>

      {/* ADJUST INVENTORY MODAL */}
      <Modal
        isOpen={stockModalOpen}
        onClose={() => {
          setStockModalOpen(false);
          setSelectedStockGroup(null);
        }}
        title={`Adjust Blood Stock: ${selectedStockGroup?.bloodGroup || ""}`}
        subtitle="Update certified shelf reserve units"
      >
        <form onSubmit={handleUpdateStock} className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase">
                Current Units on Shelf
              </p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">
                {selectedStockGroup?.unitsAvailable} Units
              </p>
            </div>
            <div className="text-right">
              <span className="font-black text-xl text-rose-700">
                {selectedStockGroup?.bloodGroup}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              New Certified Total Units
            </label>
            <input
              type="number"
              min={0}
              max={500}
              required
              value={newStockUnits}
              onChange={(e) => setNewStockUnits(Number(e.target.value))}
              className="w-full px-3 py-2 text-base font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setStockModalOpen(false);
                setSelectedStockGroup(null);
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-md shadow-rose-600/30"
            >
              Save Stock Level
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
