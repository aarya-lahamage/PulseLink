import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const urgency = searchParams.get("urgency");
    const status = searchParams.get("status");
    const bloodGroup = searchParams.get("bloodGroup");

    const where: any = {};
    if (urgency && urgency !== "ALL") where.urgency = urgency;
    if (status && status !== "ALL") where.status = status;
    if (bloodGroup && bloodGroup !== "ALL") where.bloodGroup = bloodGroup;

    const bloodRequests = await prisma.bloodRequest.findMany({
      where,
      include: {
        patient: true,
        emergency: true,
      },
      orderBy: [
        { urgency: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(bloodRequests);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch blood requests", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientId, emergencyId, bloodGroup, unitsRequired, urgency = "Normal", notes } = body;

    if (!patientId || !bloodGroup || !unitsRequired) {
      return NextResponse.json(
        { error: "Patient, blood group, and units required are required." },
        { status: 400 }
      );
    }

    const bloodRequest = await prisma.bloodRequest.create({
      data: {
        patientId,
        emergencyId: emergencyId || null,
        bloodGroup,
        unitsRequired: Number(unitsRequired),
        urgency,
        status: "Pending",
        notes: notes || "",
      },
      include: {
        patient: true,
        emergency: true,
      },
    });

    return NextResponse.json(bloodRequest, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to create blood request", details: error.message },
      { status: 500 }
    );
  }
}
