import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const inventory = await prisma.bloodInventory.findMany({
      orderBy: { bloodGroup: "asc" },
    });
    return NextResponse.json(inventory);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch blood inventory", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { bloodGroup, unitsAvailable, adjustment } = body;

    if (!bloodGroup) {
      return NextResponse.json({ error: "Blood group is required" }, { status: 400 });
    }

    let updated;
    if (unitsAvailable !== undefined) {
      updated = await prisma.bloodInventory.upsert({
        where: { bloodGroup },
        update: { unitsAvailable: Math.max(0, Number(unitsAvailable)) },
        create: { bloodGroup, unitsAvailable: Math.max(0, Number(unitsAvailable)) },
      });
    } else if (adjustment !== undefined) {
      const current = await prisma.bloodInventory.findUnique({
        where: { bloodGroup },
      });
      const newCount = Math.max(0, (current?.unitsAvailable || 0) + Number(adjustment));
      updated = await prisma.bloodInventory.upsert({
        where: { bloodGroup },
        update: { unitsAvailable: newCount },
        create: { bloodGroup, unitsAvailable: newCount },
      });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to update blood inventory", details: error.message },
      { status: 500 }
    );
  }
}
