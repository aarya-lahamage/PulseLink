import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: params.id },
      include: {
        appointments: {
          include: { doctor: true },
          orderBy: { date: "desc" },
        },
        emergencies: {
          include: {
            ambulance: true,
            bloodRequests: true,
            timelineEvents: {
              orderBy: { timestamp: "desc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        bloodRequests: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    return NextResponse.json(patient);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch patient details", details: error.message },
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
    const { fullName, age, gender, phone, bloodGroup, address, emergencyContact, medicalNotes } = body;

    const updated = await prisma.patient.update({
      where: { id: params.id },
      data: {
        fullName,
        age: Number(age) || 0,
        gender,
        phone,
        bloodGroup,
        address,
        emergencyContact,
        medicalNotes,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to update patient", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.patient.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true, message: "Patient deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to delete patient", details: error.message },
      { status: 500 }
    );
  }
}
