import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: any = {};
    if (date) where.date = date;
    if (status && status !== "ALL") where.status = status;
    if (search) {
      where.OR = [
        { patient: { fullName: { contains: search } } },
        { doctor: { name: { contains: search } } },
        { reason: { contains: search } },
      ];
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: true,
        doctor: true,
      },
      orderBy: [{ date: "desc" }, { time: "asc" }],
    });

    return NextResponse.json(appointments);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch appointments", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientId, doctorId, date, time, reason, status, notes } = body;

    if (!patientId || !doctorId || !date || !time || !reason) {
      return NextResponse.json(
        { error: "Missing required fields: patient, doctor, date, time, and reason are required." },
        { status: 400 }
      );
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        date,
        time,
        reason,
        status: status || "Pending",
        notes: notes || "",
      },
      include: {
        patient: true,
        doctor: true,
      },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to create appointment", details: error.message },
      { status: 500 }
    );
  }
}
