import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, driverName, contact, baseLocation, vehicleNumber } = body;

    const current = await prisma.ambulance.findUnique({
      where: { id: params.id },
      include: {
        emergencies: {
          where: {
            status: { in: ["NEW", "ASSIGNED", "IN_PROGRESS"] },
          },
        },
      },
    });

    if (!current) {
      return NextResponse.json({ error: "Ambulance not found" }, { status: 404 });
    }

    const data: any = {};
    if (status !== undefined) data.status = status;
    if (driverName !== undefined) data.driverName = driverName;
    if (contact !== undefined) data.contact = contact;
    if (baseLocation !== undefined) data.baseLocation = baseLocation;
    if (vehicleNumber !== undefined) data.vehicleNumber = vehicleNumber;

    const updated = await prisma.ambulance.update({
      where: { id: params.id },
      data,
    });

    // Check if status changed and update active emergencies if appropriate
    if (status && status !== current.status && current.emergencies.length > 0) {
      const activeEmergency = current.emergencies[0];

      if (status === "En Route" && activeEmergency.status !== "IN_PROGRESS") {
        await prisma.emergencyRequest.update({
          where: { id: activeEmergency.id },
          data: { status: "IN_PROGRESS" },
        });
        await prisma.emergencyTimelineEvent.create({
          data: {
            emergencyId: activeEmergency.id,
            stage: "EN_ROUTE",
            title: "Ambulance Status: En Route",
            description: `Ambulance ${current.vehicleNumber} marked En Route.`,
          },
        });
      } else if (status === "At Hospital") {
        await prisma.emergencyTimelineEvent.create({
          data: {
            emergencyId: activeEmergency.id,
            stage: "PATIENT_REACHED",
            title: "Ambulance Arrived at Hospital",
            description: `Ambulance ${current.vehicleNumber} delivered patient to care team.`,
          },
        });
      } else if (status === "Available") {
        // Detach emergency if it wasn't already resolved
        await prisma.emergencyRequest.update({
          where: { id: activeEmergency.id },
          data: { ambulanceId: null },
        });
      }
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to update ambulance", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.ambulance.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true, message: "Ambulance deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to delete ambulance", details: error.message },
      { status: 500 }
    );
  }
}
