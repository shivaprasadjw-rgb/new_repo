import { NextRequest, NextResponse } from "next/server";
import { readAllRegistrations, updateRegistrationById, deleteRegistrationById } from "@/lib/storage";
import { appendAudit } from "@/lib/audit";
import { requireAdminAuth } from "@/lib/auth";
import { SecurityValidator } from "@/lib/security";
import { clearTournamentSchedule } from "@/lib/tournamentProgression";
import type { Registration } from "@/lib/types";

export async function GET(req: NextRequest, { params }: { params: { tid: string } }) {
  try {
    // Validate tournament ID from params
    const tidValidation = SecurityValidator.validateInput(params.tid, {
      type: 'text',
      minLength: 1,
      maxLength: 50,
      sanitize: 'text'
    });
    if (!tidValidation.isValid) {
      return NextResponse.json({ success: false, error: "Invalid tournament ID" }, { status: 400 });
    }

    const registrations = readAllRegistrations().filter(r => r.tournamentId === params.tid);
    return NextResponse.json({ success: true, registrations });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return NextResponse.json({ success: false, error: "Failed to fetch registrations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { tid: string } }) {
  // Verify admin authentication
  const auth = requireAdminAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Validate tournament ID from params
    const tidValidation = SecurityValidator.validateInput(params.tid, {
      type: 'text',
      minLength: 1,
      maxLength: 50,
      sanitize: 'text'
    });
    if (!tidValidation.isValid) {
      return NextResponse.json({ success: false, error: "Invalid tournament ID" }, { status: 400 });
    }

    const data = await req.json();
    
    // Validate registration data with security checks
    const validation = validateRegistrationData(data);
    if (!validation.isValid) {
      return NextResponse.json({ 
        success: false, 
        error: "Validation failed", 
        details: validation.errors 
      }, { status: 400 });
    }

    const sanitizedData = validation.sanitized!;
    
    // Check if tournament is full
    const existingRegistrations = readAllRegistrations().filter(r => r.tournamentId === params.tid);
    if (existingRegistrations.length >= 32) {
      return NextResponse.json({ 
        success: false, 
        error: "Tournament is already full (32 participants)" 
      }, { status: 400 });
    }

    // Generate unique player number
    const existingNumbers = existingRegistrations.map(r => r.playerNumber || 0);
    const nextPlayerNumber = Math.max(0, ...existingNumbers) + 1;

    const registration: Registration = {
      id: `REG-${crypto.randomUUID().substring(0, 8).toUpperCase()}`,
      tournamentId: params.tid,
      playerNumber: nextPlayerNumber,
      ...sanitizedData,
      assignedRound: { label: "Round A", roundNumber: 0 },
      createdAt: new Date().toISOString(),
    };

    // Add registration (this would need to be implemented in storage.ts)
    const registrations = readAllRegistrations();
    registrations.push(registration);
    // Note: This is a simplified approach - in production, use proper database operations

    appendAudit({
      adminUser: auth.username!,
      action: "ADD",
      resourceType: "registration",
      resourceId: registration.id,
      tournamentId: params.tid,
      details: { 
        fullName: registration.fullName,
        email: registration.email,
        playerNumber: registration.playerNumber
      }
    });

    return NextResponse.json({ success: true, registration });
  } catch (error) {
    console.error('Error creating registration:', error);
    return NextResponse.json({ success: false, error: "Failed to create registration" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { tid: string } }) {
  // Verify admin authentication
  const auth = requireAdminAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Validate tournament ID from params
    const tidValidation = SecurityValidator.validateInput(params.tid, {
      type: 'text',
      minLength: 1,
      maxLength: 50,
      sanitize: 'text'
    });
    if (!tidValidation.isValid) {
      return NextResponse.json({ success: false, error: "Invalid tournament ID" }, { status: 400 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "Missing registration id" }, { status: 400 });

    // Validate registration ID
    const idValidation = SecurityValidator.validateInput(id, {
      type: 'text',
      minLength: 1,
      maxLength: 50,
      sanitize: 'text'
    });
    if (!idValidation.isValid) {
      return NextResponse.json({ success: false, error: "Invalid registration ID" }, { status: 400 });
    }

    const data = await req.json();
    
    // Validate update data with security checks
    const validation = validateRegistrationUpdateData(data);
    if (!validation.isValid) {
      return NextResponse.json({ 
        success: false, 
        error: "Validation failed", 
        details: validation.errors 
      }, { status: 400 });
    }

    const sanitizedData = validation.sanitized!;
    
    // Update registration
    const updated = updateRegistrationById(id, sanitizedData);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Registration not found" }, { status: 404 });
    }

    appendAudit({
      adminUser: auth.username!,
      action: "UPDATE",
      resourceType: "registration",
      resourceId: id,
      tournamentId: params.tid,
      details: { 
        fullName: updated.fullName,
        email: updated.email,
        updatedFields: Object.keys(sanitizedData)
      }
    });

    return NextResponse.json({ success: true, registration: updated });
  } catch (error) {
    console.error('Error updating registration:', error);
    return NextResponse.json({ success: false, error: "Failed to update registration" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { tid: string } }) {
  // Verify admin authentication
  const auth = requireAdminAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Validate tournament ID from params
    const tidValidation = SecurityValidator.validateInput(params.tid, {
      type: 'text',
      minLength: 1,
      maxLength: 50,
      sanitize: 'text'
    });
    if (!tidValidation.isValid) {
      return NextResponse.json({ success: false, error: "Invalid tournament ID" }, { status: 400 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "Missing registration id" }, { status: 400 });

    // Validate registration ID
    const idValidation = SecurityValidator.validateInput(id, {
      type: 'text',
      minLength: 1,
      maxLength: 50,
      sanitize: 'text'
    });
    if (!idValidation.isValid) {
      return NextResponse.json({ success: false, error: "Invalid registration ID" }, { status: 400 });
    }

    // Delete registration
    const ok = deleteRegistrationById(id);
    if (!ok) return NextResponse.json({ success: false, error: "Registration not found" }, { status: 404 });

    // Check if this was the last participant and clear schedule if needed
    const remainingRegistrations = readAllRegistrations().filter(r => r.tournamentId === params.tid);
    if (remainingRegistrations.length === 0) {
      clearTournamentSchedule(params.tid, auth.username!);
    }

    appendAudit({
      adminUser: auth.username!,
      action: "DELETE",
      resourceType: "registration",
      resourceId: id,
      tournamentId: params.tid,
      details: { 
        action: "deleted_participant",
        remainingParticipants: remainingRegistrations.length
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting registration:', error);
    return NextResponse.json({ success: false, error: "Failed to delete registration" }, { status: 500 });
  }
}

// Validate registration data with security checks
function validateRegistrationData(data: any): { isValid: boolean; errors: string[]; sanitized?: any } {
  const errors: string[] = [];
  
  // Required fields validation with security rules
  const requiredFields: Record<string, import("@/lib/security").ValidationRules> = {
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

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // Sanitize and prepare data
  const sanitized = {
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

// Validate registration update data (allows partial updates)
function validateRegistrationUpdateData(data: any): { isValid: boolean; errors: string[]; sanitized?: any } {
  const errors: string[] = [];
  const sanitized: any = {};

  // Only validate fields that are provided
  for (const [field, value] of Object.entries(data)) {
    if (value !== undefined && value !== null) {
      switch (field) {
        case 'fullName':
        case 'address':
        case 'schoolOrEmployer':
        case 'emergencyContactName':
        case 'emergencyContactRelationship':
        case 'knownAllergies':
        case 'priorMedicalConditions':
        case 'currentMedications':
        case 'pastPerformance':
          const textValidation = SecurityValidator.validateInput(value, {
            type: 'text',
            minLength: 1,
            maxLength: 500,
            sanitize: 'text'
          });
          if (textValidation.isValid) {
            sanitized[field] = textValidation.sanitized;
          } else {
            errors.push(...textValidation.errors.map(e => `${field}: ${e}`));
          }
          break;

        case 'phone':
        case 'emergencyContactPhone':
          const phoneValidation = SecurityValidator.validateInput(value, {
            type: 'phone',
            minLength: 10,
            maxLength: 20,
            sanitize: 'text'
          });
          if (phoneValidation.isValid) {
            sanitized[field] = phoneValidation.sanitized;
          } else {
            errors.push(...phoneValidation.errors.map(e => `${field}: ${e}`));
          }
          break;

        case 'email':
          const emailValidation = SecurityValidator.validateInput(value, {
            type: 'email',
            minLength: 5,
            maxLength: 254,
            sanitize: 'text'
          });
          if (emailValidation.isValid) {
            sanitized[field] = emailValidation.sanitized;
          } else {
            errors.push(...emailValidation.errors.map(e => `${field}: ${e}`));
          }
          break;

        case 'gender':
          if (typeof value === 'string' && ['Male', 'Female'].includes(value)) {
            sanitized[field] = value;
          } else {
            errors.push("Gender must be 'Male' or 'Female'");
          }
          break;

        case 'playerSkillLevel':
          if (typeof value === 'string' && ['Professional', 'Advanced', 'Intermediate', 'Beginner'].includes(value)) {
            sanitized[field] = value;
          } else {
            errors.push("Player skill level must be one of: Professional, Advanced, Intermediate, Beginner");
          }
          break;

        case 'medicalReleaseConsent':
        case 'waiversAcknowledged':
        case 'mediaConsentAcknowledged':
          if (typeof value === 'boolean') {
            sanitized[field] = value;
          } else {
            errors.push(`${field} must be true or false`);
          }
          break;

        default:
          // Skip unknown fields
          break;
      }
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [], sanitized };
}
