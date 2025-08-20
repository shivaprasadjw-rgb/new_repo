import type { Tournament, Registration } from "@/lib/types";

/**
 * Validates tournament data to ensure it meets the 32-participant limit requirement
 */
export function validateTournament(tournament: Partial<Tournament>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check maxParticipants limit
  if (tournament.maxParticipants && tournament.maxParticipants > 32) {
    errors.push("Maximum participants cannot exceed 32");
  }

  // Ensure maxParticipants is set to 32 for all tournaments
  if (tournament.maxParticipants !== 32) {
    errors.push("All tournaments must have exactly 32 maximum participants");
  }

  // Check required fields
  if (!tournament.id) errors.push("Tournament ID is required");
  if (!tournament.name) errors.push("Tournament name is required");
  if (!tournament.date) errors.push("Tournament date is required");
  if (!tournament.sport) errors.push("Sport is required");
  if (!tournament.venue) errors.push("Venue is required");
  if (!tournament.organizer) errors.push("Organizer is required");

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates registration data to ensure it doesn't exceed tournament capacity
 */
export function validateRegistration(
  registration: Partial<Registration>, 
  existingRegistrations: Registration[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check if tournament exists
  if (!registration.tournamentId) {
    errors.push("Tournament ID is required");
    return { isValid: false, errors };
  }

  // Count existing registrations for this tournament
  const tournamentRegistrations = existingRegistrations.filter(
    r => r.tournamentId === registration.tournamentId
  );

  // Check capacity limit
  if (tournamentRegistrations.length >= 32) {
    errors.push("Tournament has reached maximum capacity of 32 participants");
  }

  // Check required fields
  if (!registration.fullName) errors.push("Full name is required");
  if (!registration.dateOfBirth) errors.push("Date of birth is required");
  if (!registration.gender) errors.push("Gender is required");
  if (!registration.phone) errors.push("Phone number is required");
  if (!registration.email) errors.push("Email is required");
  if (!registration.address) errors.push("Address is required");
  if (!registration.schoolOrEmployer) errors.push("School or employer is required");
  if (!registration.emergencyContactName) errors.push("Emergency contact name is required");
  if (!registration.emergencyContactRelationship) errors.push("Emergency contact relationship is required");
  if (!registration.emergencyContactPhone) errors.push("Emergency contact phone is required");
  if (!registration.knownAllergies) errors.push("Known allergies information is required");
  if (!registration.priorMedicalConditions) errors.push("Prior medical conditions information is required");
  if (!registration.currentMedications) errors.push("Current medications information is required");
  if (!registration.playerSkillLevel) errors.push("Player skill level is required");
  if (!registration.transactionId) errors.push("Transaction ID is required");

  // Check boolean fields
  if (!registration.medicalReleaseConsent) errors.push("Medical release consent is required");
  if (!registration.waiversAcknowledged) errors.push("Waivers acknowledgment is required");
  if (!registration.mediaConsentAcknowledged) errors.push("Media consent acknowledgment is required");

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Checks if a tournament is at full capacity
 */
export function isTournamentFull(existingRegistrations: Registration[], tournamentId: string): boolean {
  const tournamentRegistrations = existingRegistrations.filter(
    r => r.tournamentId === tournamentId
  );
  return tournamentRegistrations.length >= 32;
}

/**
 * Gets the current participant count for a tournament
 */
export function getTournamentParticipantCount(existingRegistrations: Registration[], tournamentId: string): number {
  return existingRegistrations.filter(r => r.tournamentId === tournamentId).length;
}

/**
 * Gets the remaining slots for a tournament
 */
export function getRemainingSlots(existingRegistrations: Registration[], tournamentId: string): number {
  const currentCount = getTournamentParticipantCount(existingRegistrations, tournamentId);
  return Math.max(0, 32 - currentCount);
}
