import { NextResponse } from "next/server";
import { readAllTournaments } from "@/lib/tournamentStorage";

export async function GET() {
  try {
    const tournaments = readAllTournaments();
    return NextResponse.json({ success: true, tournaments });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch tournaments" }, { status: 500 });
  }
}
