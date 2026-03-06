import { NextResponse } from "next/server";
import { getAllAvailability } from "@/lib/sheets";

export const maxDuration = 30;

export async function GET() {
  const availability = await getAllAvailability();
  return NextResponse.json(availability);
}
