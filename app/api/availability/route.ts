import { NextResponse } from "next/server";
import { getAllAvailability } from "@/lib/sheets";

export const maxDuration = 30;

export async function GET() {
  try {
    const availability = await getAllAvailability();
    return NextResponse.json(availability);
  } catch (e) {
    console.error("Failed to fetch availability:", e);
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
