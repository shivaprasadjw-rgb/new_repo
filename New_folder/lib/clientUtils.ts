/**
 * Client-safe utility functions for deadline calculations
 * These functions can be used in client components without importing Node.js modules
 */

/**
 * Dynamically calculates the registration deadline for display purposes
 * If a manual deadline is set, it takes priority; otherwise calculates as 1 day before tournament date
 */
export function getDisplayRegistrationDeadline(tournament: { date?: string; registrationDeadline?: string }): string {
  try {
    // If manual deadline is set and not "TBD", use it (admin override takes priority)
    if (tournament.registrationDeadline && tournament.registrationDeadline !== "TBD") {
      return tournament.registrationDeadline;
    }
    
    // If no tournament date, return "TBD"
    if (!tournament.date) {
      return "TBD";
    }
    
    // Calculate deadline as 1 day before tournament date (Feature #43 requirement)
    const tournamentDate = new Date(tournament.date);
    const deadlineDate = new Date(tournamentDate.getTime() - 1 * 24 * 60 * 60 * 1000);
    return deadlineDate.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error calculating display registration deadline:', error);
    return tournament.registrationDeadline || "TBD";
  }
}

/**
 * Gets the countdown text for a registration deadline
 */
export function getDeadlineCountdown(deadline: string): string {
  try {
    if (!deadline || deadline === "TBD") {
      return "No deadline set";
    }
    
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const daysLeft = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) {
      return "Registration closed";
    } else if (daysLeft === 0) {
      return "Deadline today";
    } else if (daysLeft === 1) {
      return "1 day left";
    } else {
      return `${daysLeft} days left`;
    }
  } catch (error) {
    console.error('Error calculating deadline countdown:', error);
    return "Error calculating deadline";
  }
}

/**
 * Client-safe function to check if a tournament is completed
 * A tournament is considered completed when the Final and 3rd Place Match have winners declared
 */
export function isTournamentCompleted(tournament: { schedule: Array<{ round: string; isCompleted?: boolean; winner?: string }> }): boolean {
  try {
    if (!tournament.schedule || tournament.schedule.length === 0) {
      return false;
    }
    
    // Check if Final and 3rd Place Match have winners declared
    const finalMatch = tournament.schedule.find(m => m.round === "Final");
    const thirdPlaceMatch = tournament.schedule.find(m => m.round === "3rd Place Match");
    
    return !!(finalMatch?.isCompleted && finalMatch?.winner && 
              thirdPlaceMatch?.isCompleted && thirdPlaceMatch?.winner);
  } catch (error) {
    console.error('Error checking tournament completion status:', error);
    return false;
  }
}
