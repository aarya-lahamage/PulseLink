import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const emergency = await prisma.emergencyRequest.findUnique({
      where: { id: params.id },
      include: {
        patient: true,
        ambulance: true,
        hospital: true,
        bloodRequests: true,
        timelineEvents: {
          orderBy: { timestamp: "asc" },
        },
      },
    });

    if (!emergency) {
      return NextResponse.json({ error: "Emergency case not found" }, { status: 404 });
    }

    return NextResponse.json(emergency);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch emergency case", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      status,
      priority,
      ambulanceId,
      hospitalId,
      ambulanceAction, // "ASSIGN" | "EN_ROUTE" | "PATIENT_REACHED" | "RESOLVE"
      notes,
    } = body;

    const currentEmergency = await prisma.emergencyRequest.findUnique({
      where: { id: params.id },
      include: { ambulance: true, patient: true },
    });

    if (!currentEmergency) {
      return NextResponse.json({ error: "Emergency not found" }, { status: 404 });
    }

    let newStatus = status || currentEmergency.status;
    let newAmbulanceId = ambulanceId !== undefined ? ambulanceId : currentEmergency.ambulanceId;
    let resolvedAt = currentEmergency.resolvedAt;

    // Handle Ambulance Assignment Action
    if (ambulanceId && ambulanceId !== currentEmergency.ambulanceId) {
      const assignedAmbulance = await prisma.ambulance.findUnique({
        where: { id: ambulanceId },
      });

      if (assignedAmbulance) {
        await prisma.ambulance.update({
          where: { id: ambulanceId },
          data: { status: "Assigned" },
        });

        // Add timeline event
        await prisma.emergencyTimelineEvent.create({
          data: {
            emergencyId: params.id,
            stage: "AMBULANCE_ASSIGNED",
            title: "Ambulance Assigned",
            description: `Unit ${assignedAmbulance.vehicleNumber} (Driver: ${assignedAmbulance.driverName}) assigned to dispatch.`,
          },
        });

        if (newStatus === "NEW") {
          newStatus = "ASSIGNED";
        }
      }
    }

    // Handle specific progression actions
    if (ambulanceAction === "EN_ROUTE" || (status === "IN_PROGRESS" && currentEmergency.status === "ASSIGNED")) {
      newStatus = "IN_PROGRESS";
      if (newAmbulanceId) {
        await prisma.ambulance.update({
          where: { id: newAmbulanceId },
          data: { status: "En Route" },
        });
      }
      await prisma.emergencyTimelineEvent.create({
        data: {
          emergencyId: params.id,
          stage: "EN_ROUTE",
          title: "Ambulance En Route",
          description: "Emergency response team is actively navigating to the emergency location.",
        },
      });
    } else if (ambulanceAction === "PATIENT_REACHED") {
      if (newAmbulanceId) {
        await prisma.ambulance.update({
          where: { id: newAmbulanceId },
          data: { status: "At Hospital" },
        });
      }
      await prisma.emergencyTimelineEvent.create({
        data: {
          emergencyId: params.id,
          stage: "PATIENT_REACHED",
          title: "Patient Reached / At Care Facility",
          description: "Emergency team arrived at patient and transitioned to medical transfer.",
        },
      });
    } else if (newStatus === "RESOLVED" || ambulanceAction === "RESOLVE") {
      newStatus = "RESOLVED";
      resolvedAt = new Date();

      // Free up the assigned ambulance if there was one
      if (currentEmergency.ambulanceId || newAmbulanceId) {
        const ambId = currentEmergency.ambulanceId || newAmbulanceId;
        await prisma.ambulance.update({
          where: { id: ambId! },
          data: { status: "Available" },
        });
      }

      await prisma.emergencyTimelineEvent.create({
        data: {
          emergencyId: params.id,
          stage: "RESOLVED",
          title: "Emergency Case Resolved",
          description: "Operational response completed. Ambulance returned to Available status.",
        },
      });
    }

    // Update emergency
    const updated = await prisma.emergencyRequest.update({
      where: { id: params.id },
      data: {
        status: newStatus,
        priority: priority || currentEmergency.priority,
        ambulanceId: newAmbulanceId,
        hospitalId: hospitalId !== undefined ? hospitalId : undefined,
        notes: notes !== undefined ? notes : currentEmergency.notes,
        resolvedAt,
      },
      include: {
        patient: true,
        ambulance: true,
        hospital: true,
        bloodRequests: true,
        timelineEvents: {
          orderBy: { timestamp: "asc" },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Update emergency error:", error);
    return NextResponse.json(
      { error: "Failed to update emergency case", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const emergency = await prisma.emergencyRequest.findUnique({
      where: { id: params.id },
    });
    if (emergency?.ambulanceId) {
      await prisma.ambulance.update({
        where: { id: emergency.ambulanceId },
        data: { status: "Available" },
      });
    }
    await prisma.emergencyRequest.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true, message: "Emergency case removed" });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to delete emergency case", details: error.message },
      { status: 500 }
    );
  }
}
