import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const patients = await prisma.patient.findMany({
      where: search
        ? {
            OR: [
              { fullName: { contains: search } },
              { phone: { contains: search } },
              { bloodGroup: { contains: search } },
              { address: { contains: search } },
            ],
          }
        : undefined,
      include: {
        _count: {
          select: {
            appointments: true,
            emergencies: true,
            bloodRequests: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(patients);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch patients", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, age, gender, phone, bloodGroup, address, emergencyContact, medicalNotes } = body;

    if (!fullName || !phone || !bloodGroup) {
      return NextResponse.json(
        { error: "Missing required fields: fullName, phone, and bloodGroup are required." },
        { status: 400 }
      );
    }

    const patient = await prisma.patient.create({
      data: {
        fullName,
        age: Number(age) || 0,
        gender: gender || "Unspecified",
        phone,
        bloodGroup,
        address: address || "",
        emergencyContact: emergencyContact || "",
        medicalNotes: medicalNotes || "",
      },
    });

    return NextResponse.json(patient, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to create patient", details: error.message },
      { status: 500 }
    );
  }
}
