import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, urgency, unitsRequired, notes } = body;

    const current = await prisma.bloodRequest.findUnique({
      where: { id: params.id },
    });

    if (!current) {
      return NextResponse.json({ error: "Blood request not found" }, { status: 404 });
    }

    // If moving to "Fulfilled" from a non-fulfilled state, deduct units from inventory
    if (status === "Fulfilled" && current.status !== "Fulfilled") {
      const inventory = await prisma.bloodInventory.findUnique({
        where: { bloodGroup: current.bloodGroup },
      });

      if (inventory && inventory.unitsAvailable >= current.unitsRequired) {
        await prisma.bloodInventory.update({
          where: { bloodGroup: current.bloodGroup },
          data: {
            unitsAvailable: Math.max(0, inventory.unitsAvailable - current.unitsRequired),
          },
        });
      }
    }

    const data: any = {};
    if (status !== undefined) data.status = status;
    if (urgency !== undefined) data.urgency = urgency;
    if (unitsRequired !== undefined) data.unitsRequired = Number(unitsRequired);
    if (notes !== undefined) data.notes = notes;

    const updated = await prisma.bloodRequest.update({
      where: { id: params.id },
      data,
      include: {
        patient: true,
        emergency: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to update blood request", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.bloodRequest.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true, message: "Blood request deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to delete blood request", details: error.message },
      { status: 500 }
    );
  }
}
