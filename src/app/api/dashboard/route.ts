import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const todayStr = new Date().toISOString().split("T")[0];

    const [
      totalPatients,
      todayAppointmentsCount,
      activeEmergenciesCount,
      availableAmbulancesCount,
      pendingBloodRequestsCount,
      activeEmergencies,
      pendingActionsHighEmergencies,
      pendingActionsBloodRequests,
      pendingActionsAppointments,
      todayAppointmentsList,
      recentTimelineEvents,
    ] = await Promise.all([
      // Total patients
      prisma.patient.count(),

      // Today's appointments count
      prisma.appointment.count({
        where: { date: todayStr },
      }),

      // Active emergencies count (not resolved)
      prisma.emergencyRequest.count({
        where: {
          status: { in: ["NEW", "ASSIGNED", "IN_PROGRESS"] },
        },
      }),

      // Available ambulances count
      prisma.ambulance.count({
        where: { status: "Available" },
      }),

      // Pending blood requests count
      prisma.bloodRequest.count({
        where: {
          status: { in: ["Pending", "Matching"] },
        },
      }),

      // Main section: Active emergencies list with details
      prisma.emergencyRequest.findMany({
        where: {
          status: { in: ["NEW", "ASSIGNED", "IN_PROGRESS"] },
        },
        include: {
          patient: true,
          ambulance: true,
          bloodRequests: true,
          timelineEvents: {
            orderBy: { timestamp: "desc" },
            take: 3,
          },
        },
        orderBy: [
          { priority: "asc" }, // In our scheme, HIGH priority first
          { createdAt: "desc" },
        ],
      }),

      // Pending actions: High priority emergencies without ambulance or unassigned
      prisma.emergencyRequest.findMany({
        where: {
          status: "NEW",
          ambulanceRequired: true,
          ambulanceId: null,
        },
        include: {
          patient: true,
        },
        orderBy: { createdAt: "desc" },
      }),

      // Pending actions: Urgent / Critical blood requests
      prisma.bloodRequest.findMany({
        where: {
          status: { in: ["Pending", "Matching"] },
          urgency: { in: ["Critical", "Urgent"] },
        },
        include: {
          patient: true,
          emergency: true,
        },
        orderBy: { createdAt: "desc" },
      }),

      // Pending actions: Appointments awaiting confirmation
      prisma.appointment.findMany({
        where: {
          status: "Pending",
        },
        include: {
          patient: true,
          doctor: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),

      // Today's appointments list
      prisma.appointment.findMany({
        where: { date: todayStr },
        include: {
          patient: true,
          doctor: true,
        },
        orderBy: { time: "asc" },
      }),

      // Recent timeline events across system
      prisma.emergencyTimelineEvent.findMany({
        take: 6,
        orderBy: { timestamp: "desc" },
        include: {
          emergency: {
            include: {
              patient: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      stats: {
        totalPatients,
        todayAppointments: todayAppointmentsCount,
        activeEmergencies: activeEmergenciesCount,
        availableAmbulances: availableAmbulancesCount,
        pendingBloodRequests: pendingBloodRequestsCount,
      },
      activeEmergencies,
      pendingActions: {
        urgentEmergenciesWithoutAmbulance: pendingActionsHighEmergencies,
        urgentBloodRequests: pendingActionsBloodRequests,
        appointmentsAwaitingConfirmation: pendingActionsAppointments,
      },
      todayAppointments: todayAppointmentsList,
      recentActivity: recentTimelineEvents,
    });
  } catch (error: any) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard metrics", details: error.message },
      { status: 500 }
    );
  }
}
