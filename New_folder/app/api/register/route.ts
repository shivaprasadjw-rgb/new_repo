import { NextRequest, NextResponse } from "next/server";
import { assignRoundForTournament, assignRandomAvailableSlot, setTakenSlots, getTakenSlots } from "@/lib/registrationStore";
import { validateRegistration, isTournamentFull } from "@/lib/validation";
import type { Registration } from "@/lib/types";
import { appendRegistration, readAllRegistrations } from "@/lib/storage";
import { SecurityValidator, type ValidationRules } from "@/lib/security";

// Enhanced validation with security checks
function validateRegistrationData(data: any): { isValid: boolean; errors: string[]; sanitized?: any } {
  const errors: string[] = [];
  
  // Required fields validation with security rules
  const requiredFields: Record<string, ValidationRules> = {
    tournamentId: { type: 'text', minLength: 1, maxLength: 50, sanitize: 'text' },
    fullName: { type: 'text', minLength: 2, maxLength: 100, sanitize: 'text' },
    dateOfBirth: { type: 'text', minLength: 8, maxLength: 20, sanitize: 'text' },
    gender: { type: 'text', minLength: 4, maxLength: 6, sanitize: 'text' },
    phone: { type: 'phone', minLength: 10, maxLength: 20, sanitize: 'text' },
    email: { type: 'email', minLength: 5, maxLength: 254, sanitize: 'text' },
    address: { type: 'text', minLength: 5, maxLength: 500, sanitize: 'text' },
    schoolOrEmployer: { type: 'text', minLength: 2, maxLength: 200, sanitize: 'text' },
    emergencyContactName: { type: 'text', minLength: 2, maxLength: 100, sanitize: 'text' },
    emergencyContactRelationship: { type: 'text', minLength: 2, maxLength: 50, sanitize: 'text' },
    emergencyContactPhone: { type: 'phone', minLength: 10, maxLength: 20, sanitize: 'text' },
    knownAllergies: { type: 'text', minLength: 1, maxLength: 500, sanitize: 'text' },
    priorMedicalConditions: { type: 'text', minLength: 1, maxLength: 500, sanitize: 'text' },
    currentMedications: { type: 'text', minLength: 1, maxLength: 500, sanitize: 'text' },
    playerSkillLevel: { type: 'text', minLength: 8, maxLength: 12, sanitize: 'text' },
    transactionId: { type: 'text', minLength: 5, maxLength: 100, sanitize: 'text' }
  };

  for (const [field, rules] of Object.entries(requiredFields)) {
    const validation = SecurityValidator.validateInput(data[field], rules);
    if (!validation.isValid) {
      errors.push(...validation.errors.map(e => `${field}: ${e}`));
    }
  }

  // Validate boolean fields
  if (typeof data.medicalReleaseConsent !== 'boolean') {
    errors.push("Medical release consent must be true or false");
  }
  if (typeof data.waiversAcknowledged !== 'boolean') {
    errors.push("Waivers acknowledgment must be true or false");
  }
  if (typeof data.mediaConsentAcknowledged !== 'boolean') {
    errors.push("Media consent acknowledgment must be true or false");
  }

  // Validate gender value
  if (data.gender && !['Male', 'Female'].includes(data.gender)) {
    errors.push("Gender must be 'Male' or 'Female'");
  }

  // Validate player skill level
  if (data.playerSkillLevel && !['Professional', 'Advanced', 'Intermediate', 'Beginner'].includes(data.playerSkillLevel)) {
    errors.push("Player skill level must be one of: Professional, Advanced, Intermediate, Beginner");
  }

  // Validate optional fields if provided
  if (data.playerPhoto) {
    const photoValidation = SecurityValidator.validateInput(data.playerPhoto, {
      type: 'url',
      minLength: 1,
      maxLength: 500,
      sanitize: 'text'
    });
    if (!photoValidation.isValid) {
      errors.push(...photoValidation.errors.map(e => `playerPhoto: ${e}`));
    }
  }

  if (data.paymentScreenshot) {
    const screenshotValidation = SecurityValidator.validateInput(data.paymentScreenshot, {
      type: 'url',
      minLength: 1,
      maxLength: 500,
      sanitize: 'text'
    });
    if (!screenshotValidation.isValid) {
      errors.push(...screenshotValidation.errors.map(e => `paymentScreenshot: ${e}`));
    }
  }

  if (data.pastPerformance) {
    const performanceValidation = SecurityValidator.validateInput(data.pastPerformance, {
      type: 'text',
      minLength: 1,
      maxLength: 500,
      sanitize: 'text'
    });
    if (!performanceValidation.isValid) {
      errors.push(...performanceValidation.errors.map(e => `pastPerformance: ${e}`));
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // Sanitize and prepare data
  const sanitized = {
    tournamentId: SecurityValidator.sanitizeText(data.tournamentId),
    fullName: SecurityValidator.sanitizeText(data.fullName),
    dateOfBirth: SecurityValidator.sanitizeText(data.dateOfBirth),
    gender: data.gender as 'Male' | 'Female',
    phone: SecurityValidator.sanitizeText(data.phone),
    email: SecurityValidator.sanitizeText(data.email),
    address: SecurityValidator.sanitizeText(data.address),
    schoolOrEmployer: SecurityValidator.sanitizeText(data.schoolOrEmployer),
    playerPhoto: data.playerPhoto ? SecurityValidator.sanitizeText(data.playerPhoto) : '',
    emergencyContactName: SecurityValidator.sanitizeText(data.emergencyContactName),
    emergencyContactRelationship: SecurityValidator.sanitizeText(data.emergencyContactRelationship),
    emergencyContactPhone: SecurityValidator.sanitizeText(data.emergencyContactPhone),
    knownAllergies: SecurityValidator.sanitizeText(data.knownAllergies),
    priorMedicalConditions: SecurityValidator.sanitizeText(data.priorMedicalConditions),
    currentMedications: SecurityValidator.sanitizeText(data.currentMedications),
    medicalReleaseConsent: !!data.medicalReleaseConsent,
    playerSkillLevel: data.playerSkillLevel as 'Professional' | 'Advanced' | 'Intermediate' | 'Beginner',
    pastPerformance: data.pastPerformance ? SecurityValidator.sanitizeText(data.pastPerformance) : '',
    waiversAcknowledged: !!data.waiversAcknowledged,
    mediaConsentAcknowledged: !!data.mediaConsentAcknowledged,
    paymentScreenshot: data.paymentScreenshot ? SecurityValidator.sanitizeText(data.paymentScreenshot) : '',
    transactionId: SecurityValidator.sanitizeText(data.transactionId)
  };

  return { isValid: true, errors: [], sanitized };
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Enhanced validation with security checks
    const validation = validateRegistrationData(data);
    if (!validation.isValid) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: validation.errors 
      }, { status: 400 });
    }

    const sanitizedData = validation.sanitized!;

    // Get existing registrations for validation
    const existingRegistrations = readAllRegistrations();
    
    // Validate registration data using existing validation
    const existingValidation = validateRegistration(sanitizedData, existingRegistrations);
    if (!existingValidation.isValid) {
      return NextResponse.json({ 
        error: "Registration validation failed", 
        details: existingValidation.errors 
      }, { status: 400 });
    }

    // Double-check capacity: cap at 32 participants per tournament
    if (isTournamentFull(existingRegistrations, sanitizedData.tournamentId)) {
      return NextResponse.json({ 
        error: "Tournament is fully booked — maximum of 32 participants reached." 
      }, { status: 409 });
    }

    // Initialize taken slots from existing registrations for this tournament
    const currentRegistrations = existingRegistrations.filter((r) => r.tournamentId === sanitizedData.tournamentId);
    const existingSlots = currentRegistrations
      .map(r => r.playerNumber)
      .filter((slot): slot is number => slot !== undefined);
    setTakenSlots(sanitizedData.tournamentId, existingSlots);

    // Assign a random available slot
    const playerNumber = assignRandomAvailableSlot(sanitizedData.tournamentId, 32);
    if (playerNumber === -1) {
      return NextResponse.json({ 
        error: "Tournament is fully booked — no slots available." 
      }, { status: 409 });
    }

    const assignedRoundData = assignRoundForTournament(sanitizedData.tournamentId);
    const registration: Registration = {
      id: `REG-${crypto.randomUUID().substring(0, 8).toUpperCase()}`,
      ...sanitizedData,
      assignedRound: { label: assignedRoundData.label, roundNumber: assignedRoundData.index },
      playerNumber,
      createdAt: new Date().toISOString(),
    };

    appendRegistration(registration);

    // TODO: Send email confirmation to player with their slot number and tournament details

    return NextResponse.json({ ok: true, registration });
  } catch (e) {
    console.error("Registration error:", e);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const tid = url.searchParams.get("tournamentId");
    
    // Validate tournament ID if provided
    if (tid) {
      const idValidation = SecurityValidator.validateInput(tid, {
        type: 'text',
        minLength: 1,
        maxLength: 50,
        sanitize: 'text'
      });
      if (!idValidation.isValid) {
        return NextResponse.json({ error: "Invalid tournament ID" }, { status: 400 });
      }
    }
    
    const list = readAllRegistrations().filter(r => !tid || r.tournamentId === tid);
    return NextResponse.json({ registrations: list });
  } catch (error) {
    console.error("Error fetching registrations:", error);
    return NextResponse.json({ error: "Failed to fetch registrations" }, { status: 500 });
  }
}
