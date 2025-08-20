import { NextRequest, NextResponse } from "next/server";
import { readAllTournaments } from "@/lib/tournamentStorage";
import { readAllRegistrations, appendRegistration } from "@/lib/storage";
import { appendAudit } from "@/lib/audit";
import { requireAdminAuth } from "@/lib/auth";
import { SecurityValidator, FileSecurity, type ValidationRules } from "@/lib/security";

interface BulkParticipant {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  schoolOrEmployer: string;
  playerPhoto: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  knownAllergies: string;
  priorMedicalConditions: string;
  currentMedications: string;
  playerSkillLevel: string;
  pastPerformance: string;
  paymentScreenshot: string;
  transactionId: string;
}

// Validate participant data with security checks
function validateParticipantData(participant: any): { isValid: boolean; errors: string[]; sanitized?: any } {
  const errors: string[] = [];
  
  // Required fields validation with security rules
  const requiredFields: Record<string, ValidationRules> = {
    fullName: { type: 'text', minLength: 2, maxLength: 100, sanitize: 'text' },
    email: { type: 'email', minLength: 5, maxLength: 254, sanitize: 'text' },
    phone: { type: 'phone', minLength: 10, maxLength: 20, sanitize: 'text' }
  };

  for (const [field, rules] of Object.entries(requiredFields)) {
    const validation = SecurityValidator.validateInput(participant[field], rules);
    if (!validation.isValid) {
      errors.push(...validation.errors.map(e => `${field}: ${e}`));
    }
  }

  // Optional fields validation
  const optionalFields: Record<string, ValidationRules> = {
    dateOfBirth: { type: 'text', minLength: 8, maxLength: 20, sanitize: 'text' },
    address: { type: 'text', minLength: 5, maxLength: 500, sanitize: 'text' },
    schoolOrEmployer: { type: 'text', minLength: 2, maxLength: 200, sanitize: 'text' },
    emergencyContactName: { type: 'text', minLength: 2, maxLength: 100, sanitize: 'text' },
    emergencyContactRelationship: { type: 'text', minLength: 2, maxLength: 50, sanitize: 'text' },
    emergencyContactPhone: { type: 'phone', minLength: 10, maxLength: 20, sanitize: 'text' },
    knownAllergies: { type: 'text', minLength: 1, maxLength: 500, sanitize: 'text' },
    priorMedicalConditions: { type: 'text', minLength: 1, maxLength: 500, sanitize: 'text' },
    currentMedications: { type: 'text', minLength: 1, maxLength: 500, sanitize: 'text' },
    pastPerformance: { type: 'text', minLength: 1, maxLength: 500, sanitize: 'text' },
    paymentScreenshot: { type: 'url', minLength: 1, maxLength: 500, sanitize: 'text' },
    transactionId: { type: 'text', minLength: 5, maxLength: 100, sanitize: 'text' }
  };

  for (const [field, rules] of Object.entries(optionalFields)) {
    if (participant[field]) {
      const validation = SecurityValidator.validateInput(participant[field], rules);
      if (!validation.isValid) {
        errors.push(...validation.errors.map(e => `${field}: ${e}`));
      }
    }
  }

  // Validate gender
  if (participant.gender && !['Male', 'Female', 'male', 'female'].includes(participant.gender)) {
    errors.push("Gender must be 'Male' or 'Female'");
  }

  // Validate player skill level
  if (participant.playerSkillLevel && !['Professional', 'Advanced', 'Intermediate', 'Beginner'].includes(participant.playerSkillLevel)) {
    errors.push("Player skill level must be one of: Professional, Advanced, Intermediate, Beginner");
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // Sanitize and prepare data
  const sanitized = {
    fullName: SecurityValidator.sanitizeText(participant.fullName),
    dateOfBirth: participant.dateOfBirth ? SecurityValidator.sanitizeText(participant.dateOfBirth) : '',
    gender: (participant.gender === 'Male' || participant.gender === 'male') ? 'Male' : 'Female' as 'Male' | 'Female',
    phone: SecurityValidator.sanitizeText(participant.phone),
    email: SecurityValidator.sanitizeText(participant.email),
    address: participant.address ? SecurityValidator.sanitizeText(participant.address) : '',
    schoolOrEmployer: participant.schoolOrEmployer ? SecurityValidator.sanitizeText(participant.schoolOrEmployer) : '',
    playerPhoto: participant.playerPhoto ? SecurityValidator.sanitizeText(participant.playerPhoto) : '',
    emergencyContactName: participant.emergencyContactName ? SecurityValidator.sanitizeText(participant.emergencyContactName) : 'Not Provided',
    emergencyContactRelationship: participant.emergencyContactRelationship ? SecurityValidator.sanitizeText(participant.emergencyContactRelationship) : 'Not Provided',
    emergencyContactPhone: participant.emergencyContactPhone ? SecurityValidator.sanitizeText(participant.emergencyContactPhone) : 'Not Provided',
    knownAllergies: participant.knownAllergies ? SecurityValidator.sanitizeText(participant.knownAllergies) : 'None',
    priorMedicalConditions: participant.priorMedicalConditions ? SecurityValidator.sanitizeText(participant.priorMedicalConditions) : 'None',
    currentMedications: participant.currentMedications ? SecurityValidator.sanitizeText(participant.currentMedications) : 'None',
    playerSkillLevel: (participant.playerSkillLevel === 'Professional' ? 'Professional' : 
                     participant.playerSkillLevel === 'Advanced' ? 'Advanced' :
                     participant.playerSkillLevel === 'Intermediate' ? 'Intermediate' : 'Beginner') as 'Professional' | 'Advanced' | 'Intermediate' | 'Beginner',
    pastPerformance: participant.pastPerformance ? SecurityValidator.sanitizeText(participant.pastPerformance) : 'Not Provided',
    paymentScreenshot: participant.paymentScreenshot ? SecurityValidator.sanitizeText(participant.paymentScreenshot) : '',
    transactionId: SecurityValidator.sanitizeText(participant.transactionId)
  };

  return { isValid: true, errors: [], sanitized };
}

export async function POST(req: NextRequest) {
  // Verify admin authentication
  const auth = requireAdminAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    console.log('Bulk import request received for admin:', auth.username);
    const { tournamentId, participants } = await req.json();
    
    // Validate tournament ID
    const tournamentIdValidation = SecurityValidator.validateInput(tournamentId, {
      type: 'text',
      minLength: 1,
      maxLength: 50,
      sanitize: 'text'
    });
    if (!tournamentIdValidation.isValid) {
      return NextResponse.json({ success: false, error: "Invalid tournament ID" }, { status: 400 });
    }
    
    console.log('Tournament ID:', tournamentId);
    console.log('Participants count:', participants?.length);
    
    if (!tournamentId) {
      return NextResponse.json({ success: false, error: "Tournament ID is required" }, { status: 400 });
    }
    
    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return NextResponse.json({ success: false, error: "Participants data is required" }, { status: 400 });
    }

    // Validate participants array length
    if (participants.length > 100) {
      return NextResponse.json({ success: false, error: "Maximum 100 participants can be imported at once" }, { status: 400 });
    }
    
    // Check tournament exists
    const tournaments = readAllTournaments();
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (!tournament) {
      return NextResponse.json({ success: false, error: "Tournament not found" }, { status: 404 });
    }
    
    // Check current participant count
    const registrations = readAllRegistrations();
    const currentParticipants = registrations.filter(r => r.tournamentId === tournamentId).length;
    
    // Check if adding these participants would exceed the limit
    if (currentParticipants + participants.length > tournament.maxParticipants) {
      return NextResponse.json({
        success: false,
        error: `Adding ${participants.length} participants would exceed the maximum limit of ${tournament.maxParticipants}. Current: ${currentParticipants}`
      }, { status: 400 });
    }
    
    // Import participants with validation
    const importedParticipants = [];
    const validationErrors: string[] = [];
    
    for (let i = 0; i < participants.length; i++) {
      const participant = participants[i];
      
      // Validate participant data
      const validation = validateParticipantData(participant);
      if (!validation.isValid) {
        validationErrors.push(`Participant ${i + 1}: ${validation.errors.join(', ')}`);
        continue; // Skip invalid participants
      }
      
      // Generate unique player number
      const existingNumbers = registrations
        .filter(r => r.tournamentId === tournamentId)
        .map(r => r.playerNumber || 0);
      const nextPlayerNumber = Math.max(0, ...existingNumbers) + 1;
      
      const registration = {
        id: `REG-${crypto.randomUUID().substring(0, 8).toUpperCase()}`,
        tournamentId,
        playerNumber: nextPlayerNumber,
        ...validation.sanitized!,
        medicalReleaseConsent: true, // Default to true for bulk imports
        waiversAcknowledged: true, // Default to true for bulk imports
        mediaConsentAcknowledged: true, // Default to true for bulk imports
        assignedRound: { label: "Round A", roundNumber: 0 },
        createdAt: new Date().toISOString()
      };
      
      appendRegistration(registration);
      importedParticipants.push(registration);
    }
    
    // Check if all slots are now filled and auto-set tournament date
    try {
      const { autoSetTournamentDate } = await import("@/lib/deadlineManagement");
      const finalParticipantCount = currentParticipants + importedParticipants.length;
      
      if (finalParticipantCount === tournament.maxParticipants) {
        console.log(`Tournament ${tournamentId} is now full (${finalParticipantCount}/${tournament.maxParticipants}), auto-setting date`);
        const dateSet = autoSetTournamentDate(tournamentId);
        if (dateSet) {
          console.log(`Auto-set tournament date for ${tournamentId}`);
        } else {
          console.warn(`Failed to auto-set tournament date for ${tournamentId}`);
        }
      }
    } catch (error) {
      console.error(`Error auto-setting tournament date for ${tournamentId}:`, error);
    }
    
    // Log the action
    appendAudit({
      adminUser: auth.username!,
      action: "ADD",
      resourceType: "registration",
      resourceId: tournamentId,
      tournamentId: tournamentId,
      details: { 
        tournamentId, 
        participantsCount: importedParticipants.length,
        tournamentName: tournament.name,
        validationErrors: validationErrors.length > 0 ? validationErrors : undefined
      }
    });
    
    console.log(`Successfully imported ${importedParticipants.length} participants for tournament ${tournamentId}`);
    
    return NextResponse.json({
      success: true,
      message: `Successfully imported ${importedParticipants.length} participants`,
      participants: importedParticipants,
      validationErrors: validationErrors.length > 0 ? validationErrors : undefined
    });
    
  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to import participants" 
    }, { status: 500 });
  }
}
