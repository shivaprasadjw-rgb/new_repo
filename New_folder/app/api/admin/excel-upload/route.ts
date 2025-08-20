import { NextRequest, NextResponse } from "next/server";
import { readAllTournaments } from "@/lib/tournamentStorage";
import { readAllRegistrations, appendRegistration } from "@/lib/storage";
import { appendAudit } from "@/lib/audit";
import { requireAdminAuth } from "@/lib/auth";

function requireAdmin(req: NextRequest): { ok: boolean; adminUser?: string } {
  const adminUser = req.headers.get("x-admin-user") || "";
  if (!adminUser) return { ok: false };
  return { ok: true, adminUser };
}

interface ExcelParticipant {
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

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  participants: ExcelParticipant[];
}

function validateExcelData(data: any[]): ValidationResult {
  const errors: string[] = [];
  const participants: ExcelParticipant[] = [];
  
  if (data.length === 0) {
    errors.push("Excel file contains no data");
    return { isValid: false, errors, participants };
  }
  
  // Check required columns
  const requiredColumns = ['fullName', 'gender', 'email', 'phone'];
  const firstRow = data[0];
  const missingColumns = requiredColumns.filter(col => !(col in firstRow));
  
  if (missingColumns.length > 0) {
    errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
    return { isValid: false, errors, participants };
  }
  
  // Validate each row
  data.forEach((row, index) => {
    const rowErrors: string[] = [];
    const rowNumber = index + 2; // +2 because Excel rows start at 1 and we have header
    
    // Check required fields
    if (!row.fullName || row.fullName.trim() === '') {
      rowErrors.push('Full Name is required');
    }
    
    if (!row.gender || !['Male', 'Female'].includes(row.gender)) {
      rowErrors.push('Gender must be Male or Female');
    }
    
    if (!row.email || !row.email.includes('@')) {
      rowErrors.push('Valid email is required');
    }
    
    if (!row.phone || row.phone.trim() === '') {
      rowErrors.push('Phone number is required');
    }
    
    if (rowErrors.length > 0) {
      errors.push(`Row ${rowNumber}: ${rowErrors.join(', ')}`);
    } else {
      // Convert row to participant object
      const participant: ExcelParticipant = {
        fullName: row.fullName?.trim() || '',
        dateOfBirth: row.dateOfBirth || '',
        gender: row.gender || '',
        phone: row.phone?.trim() || '',
        email: row.email?.trim() || '',
        address: row.address || '',
        schoolOrEmployer: row.schoolOrEmployer || '',
        playerPhoto: row.playerPhoto || '',
        emergencyContactName: row.emergencyContactName || '',
        emergencyContactRelationship: row.emergencyContactRelationship || '',
        emergencyContactPhone: row.emergencyContactPhone || '',
        knownAllergies: row.knownAllergies || 'None',
        priorMedicalConditions: row.priorMedicalConditions || 'None',
        currentMedications: row.currentMedications || 'None',
        playerSkillLevel: row.playerSkillLevel || 'Beginner',
        pastPerformance: row.pastPerformance || 'None',
        paymentScreenshot: row.paymentScreenshot || '',
        transactionId: row.transactionId || `EXCEL-${Date.now()}-${index}`
      };
      
      participants.push(participant);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    participants
  };
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireAdminAuth(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { tournamentId, participants } = await req.json();

    if (!tournamentId || !participants || !Array.isArray(participants)) {
      return NextResponse.json({ error: 'Tournament ID and participants array are required' }, { status: 400 });
    }

    // Validate tournament exists
    const tournaments = await readAllTournaments();
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // Validate Excel data
    const validation = validateExcelData(participants);
    if (!validation.isValid) {
      return NextResponse.json({ 
        error: 'Excel data validation failed', 
        details: validation.errors 
      }, { status: 400 });
    }

    // Check if tournament is full
    const existingRegistrations = await readAllRegistrations();
    const tournamentRegistrations = existingRegistrations.filter(r => r.tournamentId === tournamentId);
    
    if (tournamentRegistrations.length + validation.participants.length > 32) {
      return NextResponse.json({ 
        error: `Tournament can only have 32 participants. Currently has ${tournamentRegistrations.length}, trying to add ${validation.participants.length}` 
      }, { status: 400 });
    }

    // Add participants
    const addedParticipants = [] as any[];
    for (const participant of validation.participants) {
      const registration = {
        id: crypto.randomUUID(),
        tournamentId,
        fullName: participant.fullName,
        dateOfBirth: participant.dateOfBirth,
        gender: (participant.gender as 'Male' | 'Female'),
        phone: participant.phone,
        email: participant.email,
        address: participant.address,
        schoolOrEmployer: participant.schoolOrEmployer,
        playerPhoto: participant.playerPhoto,
        emergencyContactName: participant.emergencyContactName,
        emergencyContactRelationship: participant.emergencyContactRelationship,
        emergencyContactPhone: participant.emergencyContactPhone,
        knownAllergies: participant.knownAllergies,
        priorMedicalConditions: participant.priorMedicalConditions,
        currentMedications: participant.currentMedications,
        medicalReleaseConsent: true,
        playerSkillLevel: (participant.playerSkillLevel as 'Professional' | 'Advanced' | 'Intermediate' | 'Beginner'),
        pastPerformance: participant.pastPerformance,
        waiversAcknowledged: true,
        mediaConsentAcknowledged: true,
        paymentScreenshot: participant.paymentScreenshot,
        transactionId: participant.transactionId,
        assignedRound: { label: "Round A", roundNumber: 0 },
        createdAt: new Date().toISOString(),
      };

      await appendRegistration(registration as any);
      addedParticipants.push(registration);
    }

    // Log the action
    await appendAudit({
      action: 'ADD',
      resourceType: 'registration',
      resourceId: `${tournamentId}-bulk-${Date.now()}`,
      adminUser: auth.username || 'admin',
      details: { message: `Bulk uploaded ${addedParticipants.length} participants to tournament ${tournamentId}` },
      tournamentId,
      ip: null
    });

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${addedParticipants.length} participants`,
      participants: addedParticipants
    });

  } catch (error: any) {
    console.error('Error in Excel upload API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
