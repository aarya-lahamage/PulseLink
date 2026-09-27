import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, date, time, reason, notes, doctorId } = body;

    const data: any = {};
    if (status !== undefined) data.status = status;
    if (date !== undefined) data.date = date;
    if (time !== undefined) data.time = time;
    if (reason !== undefined) data.reason = reason;
    if (notes !== undefined) data.notes = notes;
    if (doctorId !== undefined) data.doctorId = doctorId;

    const updated = await prisma.appointment.update({
      where: { id: params.id },
      data,
      include: {
        patient: true,
        doctor: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to update appointment", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.appointment.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true, message: "Appointment deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to delete appointment", details: error.message },
      { status: 500 }
    );
  }
}
