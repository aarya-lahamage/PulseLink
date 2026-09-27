import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: any = {};
    if (status && status !== "ALL") where.status = status;

    const ambulances = await prisma.ambulance.findMany({
      where,
      include: {
        emergencies: {
          where: {
            status: { in: ["NEW", "ASSIGNED", "IN_PROGRESS"] },
          },
          include: {
            patient: true,
          },
        },
      },
      orderBy: { vehicleNumber: "asc" },
    });

    return NextResponse.json(ambulances);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch ambulances", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vehicleNumber, driverName, contact, baseLocation, status } = body;

    if (!vehicleNumber || !driverName || !contact) {
      return NextResponse.json(
        { error: "Vehicle number, driver name, and contact are required." },
        { status: 400 }
      );
    }

    const ambulance = await prisma.ambulance.create({
      data: {
        vehicleNumber,
        driverName,
        contact,
        baseLocation: baseLocation || "Central Station",
        status: status || "Available",
      },
    });

    return NextResponse.json(ambulance, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to create ambulance", details: error.message },
      { status: 500 }
    );
  }
}
