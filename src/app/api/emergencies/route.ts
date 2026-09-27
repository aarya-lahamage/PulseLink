import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const priority = searchParams.get("priority");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: any = {};
    if (priority && priority !== "ALL") where.priority = priority;
    if (status && status !== "ALL") where.status = status;
    if (search) {
      where.OR = [
        { patient: { fullName: { contains: search } } },
        { emergencyType: { contains: search } },
        { location: { contains: search } },
        { ambulance: { vehicleNumber: { contains: search } } },
      ];
    }

    const emergencies = await prisma.emergencyRequest.findMany({
      where,
      include: {
        patient: true,
        ambulance: true,
        hospital: true,
        bloodRequests: true,
        timelineEvents: {
          orderBy: { timestamp: "asc" },
        },
      },
      orderBy: [
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(emergencies);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch emergencies", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      patientId,
      emergencyType,
      location,
      latitude,
      longitude,
      hospitalId,
      priority = "HIGH",
      ambulanceRequired = true,
      bloodRequired = false,
      notes,
      ambulanceId,
      bloodDetails, // { unitsRequired, urgency }
    } = body;

    if (!patientId || !emergencyType || !location) {
      return NextResponse.json(
        { error: "Missing required fields: patientId, emergencyType, and location are required." },
        { status: 400 }
      );
    }

    // Verify patient
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const initialStatus = ambulanceId ? "ASSIGNED" : "NEW";

    const emergency = await prisma.emergencyRequest.create({
      data: {
        patientId,
        emergencyType,
        location,
        latitude: latitude !== undefined ? Number(latitude) : 0,
        longitude: longitude !== undefined ? Number(longitude) : 0,
        hospitalId: hospitalId || null,
        priority,
        ambulanceRequired: Boolean(ambulanceRequired),
        bloodRequired: Boolean(bloodRequired),
        status: initialStatus,
        ambulanceId: ambulanceId || null,
        notes: notes || "",
        timelineEvents: {
          create: [
            {
              stage: "CREATED",
              title: "Emergency Case Created",
              description: `Emergency call logged for ${patient.fullName}. Category: ${emergencyType}.`,
            },
            {
              stage: "PRIORITY_IDENTIFIED",
              title: `Priority Classified: ${priority}`,
              description: `Triage priority assigned as ${priority}. Location logged: ${location}.`,
            },
            ...(ambulanceId
              ? [
                  {
                    stage: "AMBULANCE_ASSIGNED",
                    title: "Ambulance Dispatched",
                    description: `Assigned dedicated response unit.`,
                  },
                ]
              : []),
          ],
        },
      },
      include: {
        patient: true,
        ambulance: true,
        bloodRequests: true,
        timelineEvents: true,
      },
    });

    // If an ambulance was selected during creation, mark it Assigned
    if (ambulanceId) {
      await prisma.ambulance.update({
        where: { id: ambulanceId },
        data: { status: "Assigned" },
      });
    }

    // If bloodRequired was flagged, automatically create the connected BloodRequest
    if (bloodRequired) {
      const units = bloodDetails?.unitsRequired ? Number(bloodDetails.unitsRequired) : 2;
      const urgency = bloodDetails?.urgency || (priority === "HIGH" ? "Critical" : "Urgent");

      await prisma.bloodRequest.create({
        data: {
          patientId: patient.id,
          emergencyId: emergency.id,
          bloodGroup: patient.bloodGroup,
          unitsRequired: units,
          urgency: urgency,
          status: "Pending",
          notes: `Automatic emergency reserve for Case #${emergency.id.slice(-6)} (${emergencyType})`,
        },
      });
    }

    // Return the fresh emergency with all relations
    const fullEmergency = await prisma.emergencyRequest.findUnique({
      where: { id: emergency.id },
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

    return NextResponse.json(fullEmergency, { status: 201 });
  } catch (error: any) {
    console.error("Create Emergency Error:", error);
    return NextResponse.json(
      { error: "Failed to create emergency request", details: error.message },
      { status: 500 }
    );
  }
}
