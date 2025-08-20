import { NextRequest, NextResponse } from "next/server";
import { 
  getTournamentProgression, 
  populateRoundOf32Matches, 
  populateRoundOf16Matches,
  fixTournamentProgression,
  clearTournamentSchedule,
  validateTournamentProgressionIntegrity,
  regenerateTournamentProgression,
  getTournamentProgressionStatus
} from "@/lib/tournamentProgression";
import { appendAudit } from "@/lib/audit";
import { requireAdminAuth } from "@/lib/auth";
import { SecurityValidator } from "@/lib/security";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const tournamentId = url.searchParams.get("tournamentId");
    const action = url.searchParams.get("action");

    if (action === "status" && tournamentId) {
      // Validate tournament ID
      const idValidation = SecurityValidator.validateInput(tournamentId, {
        type: 'text',
        minLength: 1,
        maxLength: 50,
        sanitize: 'text'
      });
      if (!idValidation.isValid) {
        return NextResponse.json({ success: false, error: "Invalid tournament ID" }, { status: 400 });
      }

      const status = getTournamentProgressionStatus(tournamentId);
      return NextResponse.json({ success: true, status });
    }

    if (tournamentId) {
      // Validate tournament ID
      const idValidation = SecurityValidator.validateInput(tournamentId, {
        type: 'text',
        minLength: 1,
        maxLength: 50,
        sanitize: 'text'
      });
      if (!idValidation.isValid) {
        return NextResponse.json({ success: false, error: "Invalid tournament ID" }, { status: 400 });
      }

      const progression = getTournamentProgression(tournamentId);
      return NextResponse.json({ success: true, progression });
    }

    return NextResponse.json({ success: false, error: "Tournament ID required" }, { status: 400 });
  } catch (error) {
    console.error('Error fetching tournament progression:', error);
    return NextResponse.json({ success: false, error: "Failed to fetch progression" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Verify admin authentication
  const auth = requireAdminAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { action, tournamentId } = await req.json();

    // Validate tournament ID
    const idValidation = SecurityValidator.validateInput(tournamentId, {
      type: 'text',
      minLength: 1,
      maxLength: 50,
      sanitize: 'text'
    });
    if (!idValidation.isValid) {
      return NextResponse.json({ success: false, error: "Invalid tournament ID" }, { status: 400 });
    }

    // Validate action
    const actionValidation = SecurityValidator.validateInput(action, {
      type: 'text',
      minLength: 1,
      maxLength: 50,
      sanitize: 'text'
    });
    if (!actionValidation.isValid) {
      return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
    }

    let success = false;
    let message = "";
    let details: any = {};

    switch (action) {
      case "populateRound32":
        success = populateRoundOf32Matches(tournamentId, auth.username!);
        message = success ? "Round of 32 matches populated successfully" : "Failed to populate Round of 32 matches";
        details = { action: "populate_round_32", tournamentId };
        break;

      case "populateRound16":
        success = populateRoundOf16Matches(tournamentId, auth.username!);
        message = success ? "Round of 16 matches populated successfully" : "Failed to populate Round of 16 matches";
        details = { action: "populate_round_16", tournamentId };
        break;

      case "fixProgression":
        success = fixTournamentProgression(tournamentId, auth.username!);
        message = success ? "Tournament progression fixed successfully" : "Failed to fix tournament progression";
        details = { action: "fix_progression", tournamentId };
        break;

      case "clearSchedule":
        success = clearTournamentSchedule(tournamentId, auth.username!);
        message = success ? "Tournament schedule cleared successfully" : "Failed to clear tournament schedule";
        details = { action: "clear_schedule", tournamentId };
        break;

      case "validateIntegrity":
        const integrityResult = validateTournamentProgressionIntegrity(tournamentId);
        success = integrityResult.isValid;
        message = success ? "Tournament progression integrity validated successfully" : "Tournament progression integrity issues found";
        details = { 
          action: "validate_integrity", 
          tournamentId, 
          isValid: integrityResult.isValid,
          errors: integrityResult.errors,
          warnings: integrityResult.warnings
        };
        break;

      case "regenerateProgression":
        const regenerateResult = regenerateTournamentProgression(tournamentId, auth.username!);
        success = regenerateResult.success;
        message = regenerateResult.message;
        details = { 
          action: "regenerate_progression", 
          tournamentId, 
          success: regenerateResult.success,
          details: regenerateResult.details
        };
        break;

      default:
        return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
    }

    // Log the action
    appendAudit({
      adminUser: auth.username!,
      action: "UPDATE",
      resourceType: "tournament",
      resourceId: tournamentId,
      tournamentId: tournamentId,
      details: details
    });

    return NextResponse.json({ 
      success, 
      message,
      details: details
    });

  } catch (error) {
    console.error('Error in tournament progression operation:', error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to perform tournament progression operation" 
    }, { status: 500 });
  }
}
