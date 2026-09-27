import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const doctors = await prisma.doctor.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(doctors);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch doctors", details: error.message },
      { status: 500 }
    );
  }
}
