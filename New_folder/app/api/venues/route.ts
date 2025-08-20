import { NextResponse } from "next/server";
import { readAllVenues } from "@/lib/venueStorage";

export async function GET() {
  try {
    const venues = readAllVenues();
    return NextResponse.json({ success: true, venues });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch venues" }, { status: 500 });
  }
}
