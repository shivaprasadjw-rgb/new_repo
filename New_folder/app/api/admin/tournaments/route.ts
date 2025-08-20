import { NextRequest, NextResponse } from "next/server";
import { addTournament, readAllTournaments, updateTournamentById, deleteTournamentById, generateTournamentId } from "@/lib/tournamentStorage";
import { readAllVenues } from "@/lib/venueStorage";
import { appendAudit } from "@/lib/audit";
import { requireAdminAuth } from "@/lib/auth";
import { SecurityValidator, type ValidationRules } from "@/lib/security";
import type { Tournament } from "@/lib/types";

function validateTournamentData(data: any): { isValid: boolean; errors: string[]; sanitized?: any } {
  const errors: string[] = [];
  
  // Required fields validation
  const requiredFields: Record<string, ValidationRules> = {
    name: { type: 'text', minLength: 3, maxLength: 100, sanitize: 'text' },
    sport: { type: 'text', minLength: 2, maxLength: 50, sanitize: 'text' },
    venueId: { type: 'text', minLength: 1, maxLength: 50, sanitize: 'text' },
    organizerName: { type: 'text', minLength: 2, maxLength: 100, sanitize: 'text' },
    organizerEmail: { type: 'email', minLength: 5, maxLength: 254, sanitize: 'text' },
    organizerPhone: { type: 'phone', minLength: 10, maxLength: 20, sanitize: 'text' }
  };

  for (const [field, rules] of Object.entries(requiredFields)) {
    const validation = SecurityValidator.validateInput(data[field], rules);
    if (!validation.isValid) {
      errors.push(...validation.errors.map(e => `${field}: ${e}`));
    }
  }

  // Validate venue exists
  const venue = readAllVenues().find(v => v.id === data.venueId);
  if (!venue) errors.push("Selected venue does not exist");
  
  // Validate max participants (must be 32)
  if (data.maxParticipants !== 32) {
    errors.push("Maximum participants must be exactly 32");
  }

  // Validate entry fee
  const entryFee = parseInt(data.entryFee);
  if (isNaN(entryFee) || entryFee < 0 || entryFee > 10000) {
    errors.push("Entry fee must be a valid number between 0 and 10000");
  }
  
  if (errors.length > 0) {
    return { isValid: false, errors };
  }
  
  // Sanitize and prepare data
  const sanitized = {
    name: SecurityValidator.sanitizeText(data.name),
    date: data.date ? SecurityValidator.sanitizeText(data.date) : undefined,
    sport: SecurityValidator.sanitizeText(data.sport),
    format: SecurityValidator.sanitizeText(data.format || "Singles"),
    category: SecurityValidator.sanitizeText(data.category || "Open"),
    entryFee: entryFee,
    registrationDeadline: SecurityValidator.sanitizeText(data.registrationDeadline || ""),
    maxParticipants: 32, // Always 32 as per requirements
    status: data.status || "Upcoming",
    venue: venue!,
    organizer: {
      name: SecurityValidator.sanitizeText(data.organizerName),
      phone: SecurityValidator.sanitizeText(data.organizerPhone),
      email: SecurityValidator.sanitizeText(data.organizerEmail),
    },
    schedule: [],
    prizes: Array.isArray(data.prizes) ? data.prizes.map((p: any) => SecurityValidator.sanitizeText(p)) : ["Winner Trophy", "Runner-up Trophy"],
  };
  
  return { isValid: true, errors: [], sanitized };
}

export async function GET(req: NextRequest) {
  // Restrict admin endpoint: require authentication even for GET
  const auth = requireAdminAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const tournaments = readAllTournaments();
    return NextResponse.json({ success: true, tournaments });
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return NextResponse.json({ success: false, error: "Failed to fetch tournaments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Verify admin authentication
  const auth = requireAdminAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const payload = await req.json();
    const validation = validateTournamentData(payload);
    
    if (!validation.isValid) {
      return NextResponse.json({ 
        success: false, 
        error: "Validation failed", 
        details: validation.errors 
      }, { status: 400 });
    }
    
    const tournamentData = validation.sanitized!;
    const tournamentId = generateTournamentId();
    
    const tournament: Tournament = {
      id: tournamentId,
      ...tournamentData,
    };
    
    addTournament(tournament);
    
    appendAudit({
      adminUser: auth.username!,
      action: "ADD",
      resourceType: "tournament",
      resourceId: tournamentId,
      tournamentId: tournamentId,
      details: { name: tournament.name, sport: tournament.sport }
    });
    
    return NextResponse.json({ success: true, tournament });
  } catch (error) {
    console.error('Error creating tournament:', error);
    return NextResponse.json({ success: false, error: "Failed to create tournament" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  // Verify admin authentication
  const auth = requireAdminAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "Missing tournament id" }, { status: 400 });
    
    // Validate tournament ID
    const idValidation = SecurityValidator.validateInput(id, { 
      type: 'text', 
      minLength: 1, 
      maxLength: 50, 
      sanitize: 'text' 
    });
    if (!idValidation.isValid) {
      return NextResponse.json({ success: false, error: "Invalid tournament ID" }, { status: 400 });
    }
    
    const payload = await req.json();
    const validation = validateTournamentData(payload);
    
    if (!validation.isValid) {
      return NextResponse.json({ 
        success: false, 
        error: "Validation failed", 
        details: validation.errors 
      }, { status: 400 });
    }
    
    const tournamentData = validation.sanitized!;
    const updated = updateTournamentById(id, tournamentData);
    
    if (!updated) {
      return NextResponse.json({ success: false, error: "Tournament not found" }, { status: 404 });
    }
    
    appendAudit({
      adminUser: auth.username!,
      action: "UPDATE",
      resourceType: "tournament",
      resourceId: id,
      tournamentId: id,
      details: { name: updated.name, sport: updated.sport }
    });
    
    return NextResponse.json({ success: true, tournament: updated });
  } catch (error) {
    console.error('Error updating tournament:', error);
    return NextResponse.json({ success: false, error: "Failed to update tournament" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  // Verify admin authentication
  const auth = requireAdminAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "Missing tournament id" }, { status: 400 });
    
    // Validate tournament ID
    const idValidation = SecurityValidator.validateInput(id, { 
      type: 'text', 
      minLength: 1, 
      maxLength: 50, 
      sanitize: 'text' 
    });
    if (!idValidation.isValid) {
      return NextResponse.json({ success: false, error: "Invalid tournament ID" }, { status: 400 });
    }
    
    const ok = deleteTournamentById(id);
    if (!ok) return NextResponse.json({ success: false, error: "Tournament not found" }, { status: 404 });
    
    appendAudit({
      adminUser: auth.username!,
      action: "DELETE",
      resourceType: "tournament",
      resourceId: id,
      tournamentId: id,
      details: { archived: true }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tournament:', error);
    return NextResponse.json({ success: false, error: "Failed to delete tournament" }, { status: 500 });
  }
}
