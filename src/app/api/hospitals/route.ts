import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const emergencyReady = searchParams.get("emergencyReady");

    const where: any = {};
    if (emergencyReady === "true") where.emergencyReady = true;

    const hospitals = await prisma.hospital.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return NextResponse.json(hospitals);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch hospitals", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      address,
      latitude,
      longitude,
      phone,
      emergencyReady,
      totalBeds,
      availableBeds,
      departmentStatus,
    } = body;

    if (
      !name ||
      !address ||
      latitude === undefined ||
      longitude === undefined ||
      !phone
    ) {
      return NextResponse.json(
        { error: "Name, address, coordinates, and phone are required." },
        { status: 400 }
      );
    }

    const hospital = await prisma.hospital.create({
      data: {
        name,
        address,
        latitude: Number(latitude),
        longitude: Number(longitude),
        phone,
        emergencyReady: emergencyReady ?? true,
        totalBeds: totalBeds ?? 0,
        availableBeds: availableBeds ?? 0,
        departmentStatus: departmentStatus || "Operational",
      },
    });

    return NextResponse.json(hospital, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to create hospital", details: error.message },
      { status: 500 }
    );
  }
}
