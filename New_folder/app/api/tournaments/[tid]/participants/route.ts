import { NextRequest, NextResponse } from "next/server";
import { readAllRegistrations } from "@/lib/storage";

export async function GET(
  req: NextRequest,
  { params }: { params: { tid: string } }
) {
  try {
    const tournamentId = params.tid;
    
    // Get all registrations for this tournament
    const allRegistrations = readAllRegistrations();
    const tournamentRegistrations = allRegistrations.filter(
      reg => reg.tournamentId === tournamentId
    );

    // Transform registrations to participant format with player profile
    const participants = tournamentRegistrations.map(reg => ({
      participant_id: reg.id,
      slot: reg.playerNumber,
      player: {
        id: reg.id,
        full_name: reg.fullName,
        gender: reg.gender,
        school_or_employer: reg.schoolOrEmployer,
        skill_level: reg.playerSkillLevel,
        profile_url: `/tournament/${tournamentId}/player/${reg.playerNumber}`
      },
      registered_at: reg.createdAt
    })).filter(p => p.slot !== undefined); // Only include participants with assigned slots

    return NextResponse.json(participants);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch participants" },
      { status: 500 }
    );
  }
}
