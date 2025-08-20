import { readAllTournaments, updateTournamentById } from "./tournamentStorage";
import { readAllRegistrations } from "./storage";

/**
 * Automatically resets registration deadline to "TBD" when all participants are deleted
 */
export function resetRegistrationDeadline(tournamentId: string): boolean {
  try {
    const tournaments = readAllTournaments();
    const tournament = tournaments.find(t => t.id === tournamentId);
    
    if (!tournament) {
      console.warn(`Tournament ${tournamentId} not found for deadline reset`);
      return false;
    }

    // Reset deadline to TBD
    const updated = updateTournamentById(tournamentId, {
      registrationDeadline: "TBD"
    });

    if (updated) {
      console.log(`Registration deadline reset to TBD for tournament ${tournamentId}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error resetting registration deadline for ${tournamentId}:`, error);
    return false;
  }
}

/**
 * Automatically sets tournament date to nearest upcoming Saturday/Sunday when all slots are filled
 */
export function autoSetTournamentDate(tournamentId: string): boolean {
  try {
    const tournaments = readAllTournaments();
    const tournament = tournaments.find(t => t.id === tournamentId);
    
    if (!tournament) {
      console.warn(`Tournament ${tournamentId} not found for auto date setting`);
      return false;
    }

    const registrations = readAllRegistrations();
    const participantCount = registrations.filter(r => r.tournamentId === tournamentId).length;
    
    // Only auto-set date if all slots are filled
    if (participantCount < tournament.maxParticipants) {
      console.log(`Tournament ${tournamentId} not full (${participantCount}/${tournament.maxParticipants}), skipping auto date`);
      return false;
    }

    // Calculate nearest upcoming Saturday or Sunday
    const today = new Date();
    const daysUntilSaturday = (6 - today.getDay() + 7) % 7; // Days until next Saturday
    const daysUntilSunday = (0 - today.getDay() + 7) % 7; // Days until next Sunday
    
    let targetDate: Date;
    if (daysUntilSaturday <= daysUntilSunday) {
      targetDate = new Date(today.getTime() + daysUntilSaturday * 24 * 60 * 60 * 1000);
    } else {
      targetDate = new Date(today.getTime() + daysUntilSunday * 24 * 60 * 60 * 1000);
    }

    // Format date as YYYY-MM-DD
    const formattedDate = targetDate.toISOString().split('T')[0];
    
    // Set registration deadline to 1 day before tournament (Feature #43 requirement)
    const deadlineDate = new Date(targetDate.getTime() - 1 * 24 * 60 * 60 * 1000);
    const formattedDeadline = deadlineDate.toISOString().split('T')[0];

    const updated = updateTournamentById(tournamentId, {
      date: formattedDate,
      registrationDeadline: formattedDeadline,
      isDateScheduled: true,
      scheduledBy: "system",
      scheduledAt: new Date().toISOString()
    });

    if (updated) {
      console.log(`Auto-set tournament date to ${formattedDate} and deadline to ${formattedDeadline} for ${tournamentId}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error auto-setting tournament date for ${tournamentId}:`, error);
    return false;
  }
}

/**
 * Manually updates registration deadline and tournament date
 */
export function updateTournamentDeadline(
  tournamentId: string, 
  newDeadline: string, 
  newDate?: string,
  adminUser: string = "admin"
): boolean {
  try {
    const tournaments = readAllTournaments();
    const tournament = tournaments.find(t => t.id === tournamentId);
    
    if (!tournament) {
      console.warn(`Tournament ${tournamentId} not found for deadline update`);
      return false;
    }

    const updateData: Partial<typeof tournament> = {
      registrationDeadline: newDeadline,
      scheduledBy: adminUser,
      scheduledAt: new Date().toISOString()
    };

    // If new date is provided, update it as well
    if (newDate) {
      updateData.date = newDate;
      updateData.isDateScheduled = true;
    }

    const updated = updateTournamentById(tournamentId, updateData);

    if (updated) {
      console.log(`Tournament ${tournamentId} deadline updated to ${newDeadline} by ${adminUser}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error updating tournament deadline for ${tournamentId}:`, error);
    return false;
  }
}

/**
 * Checks if a tournament needs deadline reset (no participants)
 */
export function shouldResetDeadline(tournamentId: string): boolean {
  try {
    const registrations = readAllRegistrations();
    const participantCount = registrations.filter(r => r.tournamentId === tournamentId).length;
    return participantCount === 0;
  } catch (error) {
    console.error(`Error checking deadline reset for ${tournamentId}:`, error);
    return false;
  }
}

/**
 * Checks if a tournament needs auto date setting (all slots filled)
 */
export function shouldAutoSetDate(tournamentId: string): boolean {
  try {
    const tournaments = readAllTournaments();
    const tournament = tournaments.find(t => t.id === tournamentId);
    
    if (!tournament) return false;
    
    const registrations = readAllRegistrations();
    const participantCount = registrations.filter(r => r.tournamentId === tournamentId).length;
    
    return participantCount === tournament.maxParticipants;
  } catch (error) {
    console.error(`Error checking auto date setting for ${tournamentId}:`, error);
    return false;
  }
}

