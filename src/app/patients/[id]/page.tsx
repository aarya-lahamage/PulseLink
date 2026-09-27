"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Users,
  CalendarDays,
  Activity,
  Droplet,
  Phone,
  MapPin,
  ArrowLeft,
  Clock,
  PlusCircle,
  AlertTriangle,
  FileText,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ToastProvider";
import { formatDateTime, formatDate } from "@/lib/utils";

export default function PatientDetailPage() {
  const params = useParams();
  const patientId = params.id as string;
  const [patient, setPatient] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const fetchPatient = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/patients/${patientId}`);
      if (!res.ok) throw new Error("Failed to load patient profile");
      const data = await res.json();
      setPatient(data);
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Error",
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  }, [patientId, addToast]);

  useEffect(() => {
    fetchPatient();
  }, [fetchPatient]);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <Activity className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-500">Loading patient medical dossier...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-lg font-bold text-slate-800">Patient not found</h2>
        <Link
          href="/patients"
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Patients
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb */}
      <div>
        <Link
          href="/patients"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Patient Directory</span>
        </Link>
      </div>

      {/* Main Patient Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-md">
            {patient.fullName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {patient.fullName}
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-200">
                Blood: {patient.bloodGroup}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {patient.age} years old • {patient.gender} • Patient ID:{" "}
              <span className="font-mono text-slate-700">{patient.id}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/emergencies?action=new`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 shadow-md shadow-red-600/20 transition-all"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Trigger Emergency Case</span>
          </Link>
          <Link
            href={`/appointments`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all"
          >
            <CalendarDays className="w-4 h-4" />
            <span>Book Appointment</span>
          </Link>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact & Residential info */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            Contact & Identification
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <p className="text-[11px] text-slate-400 font-semibold uppercase">
                Primary Phone
              </p>
              <p className="font-bold text-slate-800 mt-0.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {patient.phone}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-semibold uppercase">
                Emergency Contact (ICE)
              </p>
              <p className="font-medium text-slate-800 mt-0.5">
                {patient.emergencyContact || "No contact specified"}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-semibold uppercase">
                Address
              </p>
              <p className="font-medium text-slate-800 mt-0.5 flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>{patient.address || "Unspecified"}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Medical & Allergy Notes */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 md:col-span-2">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            Clinical Notes & Responder Awareness
          </h3>
          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900 leading-relaxed">
            {patient.medicalNotes || "No recorded chronic conditions or drug allergies on file."}
          </div>
          <p className="text-[11px] text-slate-400 italic">
            * Operational context for paramedic triage dispatch. Diagnoses and prescriptions are managed through licensed clinical protocols.
          </p>
        </div>
      </div>

      {/* Emergency Request History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-red-600" />
            <h3 className="font-bold text-slate-900">
              Emergency Case History ({patient.emergencies?.length || 0})
            </h3>
          </div>
        </div>

        <div className="mt-4 divide-y divide-slate-100">
          {patient.emergencies?.length ? (
            patient.emergencies.map((emg: any) => (
              <div
                key={emg.id}
                className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">
                      {emg.emergencyType}
                    </span>
                    <Badge variant={emg.priority.toLowerCase()}>{emg.priority}</Badge>
                    <Badge variant={emg.status.toLowerCase()}>{emg.status}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{emg.location}</span>
                  </p>
                  {emg.ambulance && (
                    <p className="text-xs text-slate-600 mt-1">
                      Ambulance:{" "}
                      <span className="font-bold text-slate-800">
                        {emg.ambulance.vehicleNumber}
                      </span>{" "}
                      (Driver: {emg.ambulance.driverName})
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 font-mono">
                    {formatDateTime(emg.createdAt)}
                  </span>
                  <Link
                    href={`/emergencies?id=${emg.id}`}
                    className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    View in Center →
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">
              No emergency cases logged for this patient.
            </p>
          )}
        </div>
      </div>

      {/* Appointment History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900">
              Appointment History ({patient.appointments?.length || 0})
            </h3>
          </div>
        </div>

        <div className="mt-4 divide-y divide-slate-100">
          {patient.appointments?.length ? (
            patient.appointments.map((appt: any) => (
              <div
                key={appt.id}
                className="py-3 flex items-center justify-between gap-4 text-xs"
              >
                <div>
                  <p className="font-bold text-sm text-slate-800">
                    Dr. {appt.doctor?.name} ({appt.doctor?.specialty})
                  </p>
                  <p className="text-slate-500 mt-0.5">Reason: {appt.reason}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-slate-700 bg-slate-100 px-2 py-1 rounded">
                    {formatDate(appt.date)} • {appt.time}
                  </span>
                  <Badge variant={appt.status.toLowerCase()}>{appt.status}</Badge>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">
              No appointments scheduled for this patient.
            </p>
          )}
        </div>
      </div>

      {/* Blood Requests */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Droplet className="w-5 h-5 text-rose-600" />
            <h3 className="font-bold text-slate-900">
              Blood Requests ({patient.bloodRequests?.length || 0})
            </h3>
          </div>
        </div>

        <div className="mt-4 divide-y divide-slate-100">
          {patient.bloodRequests?.length ? (
            patient.bloodRequests.map((req: any) => (
              <div
                key={req.id}
                className="py-3 flex items-center justify-between gap-4 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-rose-700">
                      {req.unitsRequired} Units ({req.bloodGroup})
                    </span>
                    <Badge variant={req.urgency.toLowerCase()}>{req.urgency}</Badge>
                  </div>
                  <p className="text-slate-500 mt-0.5">{req.notes || "Standard request"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-slate-400">
                    {formatDate(req.createdAt)}
                  </span>
                  <Badge variant={req.status.toLowerCase()}>{req.status}</Badge>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">
              No blood requests recorded for this patient.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
