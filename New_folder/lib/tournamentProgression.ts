import fs from "fs";
import path from "path";
import { readAllTournaments, updateTournamentById } from "./tournamentStorage";
import { readAllRegistrations } from "./storage";
import type { Tournament, MatchSlot, TournamentProgression, TournamentRound } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const PROGRESSION_FILE = path.join(DATA_DIR, "tournament-progression.json");

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(PROGRESSION_FILE)) {
    fs.writeFileSync(PROGRESSION_FILE, JSON.stringify({}, null, 2), "utf8");
  }
}

function readProgressionData(): Record<string, TournamentProgression> {
  ensureStore();
  const raw = fs.readFileSync(PROGRESSION_FILE, "utf8");
  try {
    return JSON.parse(raw) as Record<string, TournamentProgression>;
  } catch {
    return {};
  }
}

function writeProgressionData(data: Record<string, TournamentProgression>) {
  ensureStore();
  fs.writeFileSync(PROGRESSION_FILE, JSON.stringify(data, null, 2), "utf8");
}

export function getTournamentProgression(tournamentId: string): TournamentProgression | null {
  const data = readProgressionData();
  return data[tournamentId] || null;
}

export function initializeTournamentProgression(tournamentId: string, adminUser: string): TournamentProgression {
  const data = readProgressionData();
  
  const progression: TournamentProgression = {
    tournamentId,
    currentRound: "Round of 32",
    rounds: [
      { name: "Round of 32", order: 1, maxMatches: 16, isCompleted: false },
      { name: "Round of 16", order: 2, maxMatches: 8, isCompleted: false },
      { name: "Quarterfinal", order: 3, maxMatches: 4, isCompleted: false },
      { name: "Semifinal", order: 4, maxMatches: 2, isCompleted: false },
      { name: "3rd Place Match", order: 5, maxMatches: 1, isCompleted: false },
      { name: "Final", order: 6, maxMatches: 1, isCompleted: false }
    ],
    lastUpdated: new Date().toISOString(),
    lastUpdatedBy: adminUser
  };
  
  data[tournamentId] = progression;
  writeProgressionData(data);
  return progression;
}

// Enhanced function to populate Round of 32 matches with real participants
export function populateRoundOf32Matches(tournamentId: string, adminUser: string): boolean {
  try {
    const tournaments = readAllTournaments();
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (!tournament) return false;
    
    const registrations = readAllRegistrations();
    const tournamentRegistrations = registrations.filter(r => r.tournamentId === tournamentId);
    
    if (tournamentRegistrations.length === 0) return false;
    
    // Sort registrations by player number to ensure consistent pairing
    const sortedRegistrations = tournamentRegistrations.sort((a, b) => (a.playerNumber || 0) - (b.playerNumber || 0));
    
    // Generate Round of 32 matches with real participant names
    const round32Matches: MatchSlot[] = [];
    for (let i = 0; i < 16; i++) {
      const player1Index = i;
      const player2Index = 31 - i; // Pair 1st with 32nd, 2nd with 31st, etc.
      
      const player1 = sortedRegistrations[player1Index];
      const player2 = sortedRegistrations[player2Index];
      
      if (player1 && player2) {
        const matchCode = `M${i + 1}`;
        round32Matches.push({
          code: matchCode,
          date: tournament.date || "",
          start: "",
          end: "",
          round: "Round of 32",
          players: `${player1.fullName} vs ${player2.fullName}`,
          isCompleted: false
        });
      }
    }
    
    // Clear existing Round of 32 matches and add new ones
    tournament.schedule = tournament.schedule.filter(m => m.round !== "Round of 32");
    tournament.schedule.push(...round32Matches);
    
    // Update tournament
    updateTournamentById(tournamentId, tournament);
    
    // Update progression data
    const progression = getTournamentProgression(tournamentId) || initializeTournamentProgression(tournamentId, adminUser);
    progression.lastUpdated = new Date().toISOString();
    progression.lastUpdatedBy = adminUser;
    
    const data = readProgressionData();
    data[tournamentId] = progression;
    writeProgressionData(data);
    
    return true;
  } catch (error) {
    console.error('Error populating Round of 32 matches:', error);
    return false;
  }
}

// Enhanced function to populate Round of 16 matches with real participants from Round of 32 winners
export function populateRoundOf16Matches(tournamentId: string, adminUser: string): boolean {
  try {
    const tournaments = readAllTournaments();
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (!tournament) return false;
    
    // Get completed Round of 32 matches with winners
    const round32Matches = tournament.schedule.filter(m => m.round === "Round of 32" && m.isCompleted && m.winner);
    if (round32Matches.length !== 16) {
      console.error(`Expected 16 Round of 32 winners, got ${round32Matches.length}`);
      return false;
    }
    
    const winners = round32Matches.map(m => m.winner!);
    
    // Clear existing Round of 16 matches
    tournament.schedule = tournament.schedule.filter(m => m.round !== "Round of 16");
    
    // Generate Round of 16 matches with real participant names
    const round16Matches: MatchSlot[] = [];
    for (let i = 0; i < 8; i++) {
      const matchCode = `M${17 + i}`; // M17 to M24
      round16Matches.push({
        code: matchCode,
        date: tournament.date || "",
        start: "",
        end: "",
        round: "Round of 16",
        players: `${winners[i * 2]} vs ${winners[i * 2 + 1]}`,
        isCompleted: false
      });
    }
    
    // Add to tournament schedule
    tournament.schedule.push(...round16Matches);
    
    // Update tournament
    updateTournamentById(tournamentId, tournament);
    
    // Update progression data
    const progression = getTournamentProgression(tournamentId) || initializeTournamentProgression(tournamentId, adminUser);
    progression.lastUpdated = new Date().toISOString();
    progression.lastUpdatedBy = adminUser;
    
    const data = readProgressionData();
    data[tournamentId] = progression;
    writeProgressionData(data);
    
    return true;
  } catch (error) {
    console.error('Error populating Round of 16 matches:', error);
    return false;
  }
}

export function updateMatchWinner(
  tournamentId: string, 
  matchCode: string, 
  winner: string, 
  adminUser: string
): boolean {
  try {
    const tournaments = readAllTournaments();
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (!tournament) return false;
    
    // Find and update the match
    const matchIndex = tournament.schedule.findIndex(m => m.code === matchCode);
    if (matchIndex === -1) return false;
    
    tournament.schedule[matchIndex].winner = winner;
    tournament.schedule[matchIndex].isCompleted = true;
    tournament.schedule[matchIndex].completedAt = new Date().toISOString();
    tournament.schedule[matchIndex].completedBy = adminUser;
    
    // Update tournament
    updateTournamentById(tournamentId, tournament);
    
    // Update progression data
    const progression = getTournamentProgression(tournamentId) || initializeTournamentProgression(tournamentId, adminUser);
    progression.lastUpdated = new Date().toISOString();
    progression.lastUpdatedBy = adminUser;
    
    const data = readProgressionData();
    data[tournamentId] = progression;
    writeProgressionData(data);
    
    // Check if tournament is now completed and update status automatically (Feature #44)
    checkAndUpdateTournamentStatus(tournamentId);
    
    return true;
  } catch (error) {
    console.error('Error updating match winner:', error);
    return false;
  }
}

// Enhanced publish round results with automatic progression
export function publishRoundResults(tournamentId: string, roundName: string, adminUser: string): boolean {
  try {
    const tournaments = readAllTournaments();
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (!tournament) return false;
    
    const progression = getTournamentProgression(tournamentId) || initializeTournamentProgression(tournamentId, adminUser);
    
    // Mark current round as completed
    const currentRound = progression.rounds.find(r => r.name === roundName);
    if (currentRound) {
      currentRound.isCompleted = true;
      currentRound.completedAt = new Date().toISOString();
      currentRound.completedBy = adminUser;
    }
    
    // Update progression
    progression.lastUpdated = new Date().toISOString();
    progression.lastUpdatedBy = adminUser;
    
    // Auto-generate next round matches based on winners
    if (roundName === "Round of 32") {
      populateRoundOf16Matches(tournamentId, adminUser); // Use the new function here
      progression.currentRound = "Round of 16";
    } else if (roundName === "Round of 16") {
      generateQuarterfinalMatches(tournament, progression);
      progression.currentRound = "Quarterfinal";
    } else if (roundName === "Quarterfinal") {
      generateSemifinalMatches(tournament, progression);
      progression.currentRound = "Semifinal";
    } else if (roundName === "Semifinal") {
      generateFinalAndThirdPlaceMatches(tournament, progression);
      progression.currentRound = "Final";
    }
    
    // Update tournament with new schedule
    updateTournamentById(tournamentId, tournament);
    
    // Save progression
    const data = readProgressionData();
    data[tournamentId] = progression;
    writeProgressionData(data);
    
    return true;
  } catch (error) {
    console.error('Error publishing round results:', error);
    return false;
  }
}

// Enhanced Round of 16 generation with winner-based pairing
function generateRoundOf16Matches(tournament: Tournament, progression: TournamentProgression) {
  const round32Matches = tournament.schedule.filter(m => m.round === "Round of 32" && m.isCompleted);
  const winners = round32Matches.map(m => m.winner).filter(Boolean);
  
  if (winners.length !== 16) return;
  
  // Clear existing Round of 16 matches
  tournament.schedule = tournament.schedule.filter(m => m.round !== "Round of 16");
  
  // Generate 8 matches for Round of 16
  const round16Matches: MatchSlot[] = [];
  for (let i = 0; i < 8; i++) {
    const matchCode = `M${17 + i}`; // M17 to M24
    round16Matches.push({
      code: matchCode,
      date: tournament.date || "",
      start: "",
      end: "",
      round: "Round of 16",
      players: `${winners[i * 2]} vs ${winners[i * 2 + 1]}`,
      isCompleted: false
    });
  }
  
  // Add to tournament schedule
  tournament.schedule.push(...round16Matches);
}

// Enhanced Quarterfinal generation with winner-based pairing
function generateQuarterfinalMatches(tournament: Tournament, progression: TournamentProgression) {
  const round16Matches = tournament.schedule.filter(m => m.round === "Round of 16" && m.isCompleted);
  const winners = round16Matches.map(m => m.winner).filter(Boolean);
  
  if (winners.length !== 8) return;
  
  // Clear existing Quarterfinal matches
  tournament.schedule = tournament.schedule.filter(m => m.round !== "Quarterfinal");
  
  // Generate 4 matches for Quarterfinals
  const quarterfinalMatches: MatchSlot[] = [];
  for (let i = 0; i < 4; i++) {
    const matchCode = `M${25 + i}`; // M25 to M28
    quarterfinalMatches.push({
      code: matchCode,
      date: tournament.date || "",
      start: "",
      end: "",
      round: "Quarterfinal",
      players: `${winners[i * 2]} vs ${winners[i * 2 + 1]}`,
      isCompleted: false
    });
  }
  
  // Add to tournament schedule
  tournament.schedule.push(...quarterfinalMatches);
}

// Enhanced Semifinal generation with winner-based pairing
function generateSemifinalMatches(tournament: Tournament, progression: TournamentProgression) {
  const quarterfinalMatches = tournament.schedule.filter(m => m.round === "Quarterfinal" && m.isCompleted);
  const winners = quarterfinalMatches.map(m => m.winner).filter(Boolean);
  
  if (winners.length !== 4) return;
  
  // Clear existing Semifinal matches
  tournament.schedule = tournament.schedule.filter(m => m.round !== "Semifinal");
  
  // Generate 2 matches for Semifinals
  const semifinalMatches: MatchSlot[] = [];
  for (let i = 0; i < 2; i++) {
    const matchCode = `M${29 + i}`; // M29 to M30
    semifinalMatches.push({
      code: matchCode,
      date: tournament.date || "",
      start: "",
      end: "",
      round: "Semifinal",
      players: `${winners[i * 2]} vs ${winners[i * 2 + 1]}`,
      isCompleted: false
    });
  }
  
  // Add to tournament schedule
  tournament.schedule.push(...semifinalMatches);
}

// Enhanced Final and 3rd Place Match generation
function generateFinalAndThirdPlaceMatches(tournament: Tournament, progression: TournamentProgression) {
  const semifinalMatches = tournament.schedule.filter(m => m.round === "Semifinal" && m.isCompleted);
  const winners = semifinalMatches.map(m => m.winner).filter(Boolean);
  const losers = semifinalMatches.map(m => {
    const match = tournament.schedule.find(s => s.code === m.code);
    if (match) {
      const [player1, player2] = match.players.split(" vs ");
      return match.winner === player1 ? player2 : player1;
    }
    return null;
  }).filter(Boolean);
  
  if (winners.length !== 2 || losers.length !== 2) return;
  
  // Clear existing Final and 3rd Place matches
  tournament.schedule = tournament.schedule.filter(m => m.round !== "Final" && m.round !== "3rd Place Match");
  
  // Generate Final match
  const finalMatch: MatchSlot = {
    code: "M31 (Final)",
    date: tournament.date || "",
    start: "",
    end: "",
    round: "Final",
    players: `${winners[0]} vs ${winners[1]}`,
    isCompleted: false
  };
  
  // Generate 3rd Place match
  const thirdPlaceMatch: MatchSlot = {
    code: "M32 (3rd Place)",
    date: tournament.date || "",
    start: "",
    end: "",
    round: "3rd Place Match",
    players: `${losers[0]} vs ${losers[1]}`,
    isCompleted: false
  };
  
  // Add to tournament schedule
  tournament.schedule.push(finalMatch, thirdPlaceMatch);
}

export function getTournamentMatchesByRound(tournamentId: string, roundName: string): MatchSlot[] {
  const tournaments = readAllTournaments();
  const tournament = tournaments.find(t => t.id === tournamentId);
  if (!tournament) return [];
  
  return tournament.schedule.filter(m => m.round === roundName);
}

export function canPublishRound(tournamentId: string, roundName: string): boolean {
  const matches = getTournamentMatchesByRound(tournamentId, roundName);
  if (matches.length === 0) return false;
  
  // Check if all matches in the round have winners
  return matches.every(m => m.isCompleted && m.winner);
}

// New function to get tournament progression status
export function getTournamentProgressionStatus(tournamentId: string): {
  currentRound: string;
  nextRound: string | null;
  completedRounds: string[];
  pendingRounds: string[];
} | null {
  const progression = getTournamentProgression(tournamentId);
  if (!progression) return null;
  
  const completedRounds = progression.rounds.filter(r => r.isCompleted).map(r => r.name);
  const pendingRounds = progression.rounds.filter(r => !r.isCompleted).map(r => r.name);
  const nextRound = pendingRounds.length > 0 ? pendingRounds[0] : null;
  
  return {
    currentRound: progression.currentRound,
    nextRound,
    completedRounds,
    pendingRounds
  };
}

// Function to fix tournament progression by removing incorrect rounds and regenerating them properly
export function fixTournamentProgression(tournamentId: string, adminUser: string): boolean {
  try {
    const tournaments = readAllTournaments();
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (!tournament) return false;
    
    // Get completed Round of 32 matches with winners
    const round32Matches = tournament.schedule.filter(m => m.round === "Round of 32" && m.isCompleted && m.winner);
    if (round32Matches.length !== 16) {
      console.error(`Expected 16 Round of 32 winners, got ${round32Matches.length}`);
      return false;
    }
    
    // Remove all rounds after Round of 32 (Round of 16, Quarterfinal, Semifinal, Final, 3rd Place)
    tournament.schedule = tournament.schedule.filter(m => m.round === "Round of 32");
    
    // Update tournament
    updateTournamentById(tournamentId, tournament);
    
    // Now populate Round of 16 properly
    const success = populateRoundOf16Matches(tournamentId, adminUser);
    
    // Update progression data
    const progression = getTournamentProgression(tournamentId) || initializeTournamentProgression(tournamentId, adminUser);
    progression.currentRound = "Round of 16";
    progression.lastUpdated = new Date().toISOString();
    progression.lastUpdatedBy = adminUser;
    
    const data = readProgressionData();
    data[tournamentId] = progression;
    writeProgressionData(data);
    
    return success;
  } catch (error) {
    console.error('Error fixing tournament progression:', error);
    return false;
  }
}

// Function to clear tournament schedule when all participants are deleted
export function clearTournamentSchedule(tournamentId: string, adminUser: string): boolean {
  try {
    const tournaments = readAllTournaments();
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (!tournament) return false;
    
    // Clear all schedule matches
    tournament.schedule = [];
    
    // Update tournament
    updateTournamentById(tournamentId, tournament);
    
    // Update progression data to reset to initial state
    const progression = getTournamentProgression(tournamentId) || initializeTournamentProgression(tournamentId, adminUser);
    progression.currentRound = "Round of 32";
    progression.lastUpdated = new Date().toISOString();
    progression.lastUpdatedBy = adminUser;
    
    // Mark all rounds as not completed
    progression.rounds.forEach(round => {
      round.isCompleted = false;
      delete round.completedAt;
      delete round.completedBy;
    });
    
    const data = readProgressionData();
    data[tournamentId] = progression;
    writeProgressionData(data);
    
    return true;
  } catch (error) {
    console.error('Error clearing tournament schedule:', error);
    return false;
  }
}

// Function to validate tournament progression data integrity
export function validateTournamentProgressionIntegrity(tournamentId: string): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  details: {
    roundOf32: { count: number; completed: number; winners: string[] };
    roundOf16: { count: number; completed: number; winners: string[] };
    quarterfinal: { count: number; completed: number; winners: string[] };
    semifinal: { count: number; completed: number; winners: string[] };
    final: { count: number; completed: number; winners: string[] };
  };
} {
  try {
    const tournaments = readAllTournaments();
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (!tournament) {
      return {
        isValid: false,
        errors: [`Tournament ${tournamentId} not found`],
        warnings: [],
        details: {
          roundOf32: { count: 0, completed: 0, winners: [] },
          roundOf16: { count: 0, completed: 0, winners: [] },
          quarterfinal: { count: 0, completed: 0, winners: [] },
          semifinal: { count: 0, completed: 0, winners: [] },
          final: { count: 0, completed: 0, winners: [] }
        }
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Analyze each round
    const roundOf32 = tournament.schedule.filter(m => m.round === "Round of 32");
    const roundOf16 = tournament.schedule.filter(m => m.round === "Round of 16");
    const quarterfinal = tournament.schedule.filter(m => m.round === "Quarterfinal");
    const semifinal = tournament.schedule.filter(m => m.round === "Semifinal");
    const final = tournament.schedule.filter(m => m.round === "Final");

    const roundOf32Winners = roundOf32.filter(m => m.isCompleted && m.winner).map(m => m.winner!);
    const roundOf16Winners = roundOf16.filter(m => m.isCompleted && m.winner).map(m => m.winner!);
    const quarterfinalWinners = quarterfinal.filter(m => m.isCompleted && m.winner).map(m => m.winner!);
    const semifinalWinners = semifinal.filter(m => m.isCompleted && m.winner).map(m => m.winner!);
    const finalWinners = final.filter(m => m.isCompleted && m.winner).map(m => m.winner!);

    // Validation checks
    if (roundOf32.length !== 16) {
      errors.push(`Round of 32 should have 16 matches, found ${roundOf32.length}`);
    }

    if (roundOf32Winners.length !== 16 && roundOf32.length === 16) {
      errors.push(`Round of 32 should have 16 winners, found ${roundOf32Winners.length}`);
    }

    if (roundOf16.length > 0 && roundOf32Winners.length === 16) {
      // Check if Round of 16 winners match Round of 32 winners
      const expectedRound16Winners = roundOf32Winners;
      const actualRound16Winners = roundOf16.map(m => m.players.split(" vs ")[0].trim());
      
      const mismatchedWinners = actualRound16Winners.filter(w => !expectedRound16Winners.includes(w));
      if (mismatchedWinners.length > 0) {
        errors.push(`Round of 16 has mismatched winners: ${mismatchedWinners.join(", ")}`);
      }
    }

    if (quarterfinal.length > 0 && roundOf16Winners.length === 8) {
      // Check if Quarterfinal winners match Round of 16 winners
      const expectedQuarterfinalWinners = roundOf16Winners;
      const actualQuarterfinalWinners = quarterfinal.map(m => m.players.split(" vs ")[0].trim());
      
      const mismatchedWinners = actualQuarterfinalWinners.filter(w => !expectedQuarterfinalWinners.includes(w));
      if (mismatchedWinners.length > 0) {
        errors.push(`Quarterfinal has mismatched winners: ${mismatchedWinners.join(", ")}`);
      }
    }

    // Check for progression order issues
    if (quarterfinal.length > 0 && roundOf16.length === 0) {
      errors.push("Quarterfinal matches exist but Round of 16 is missing - progression order is corrupted");
    }

    if (semifinal.length > 0 && quarterfinal.length === 0) {
      errors.push("Semifinal matches exist but Quarterfinal is missing - progression order is corrupted");
    }

    if (final.length > 0 && semifinal.length === 0) {
      errors.push("Final matches exist but Semifinal is missing - progression order is corrupted");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      details: {
        roundOf32: { count: roundOf32.length, completed: roundOf32Winners.length, winners: roundOf32Winners },
        roundOf16: { count: roundOf16.length, completed: roundOf16Winners.length, winners: roundOf16Winners },
        quarterfinal: { count: quarterfinal.length, completed: quarterfinalWinners.length, winners: quarterfinalWinners },
        semifinal: { count: semifinal.length, completed: semifinalWinners.length, winners: semifinalWinners },
        final: { count: final.length, completed: finalWinners.length, winners: finalWinners }
      }
    };
  } catch (error) {
    console.error('Error validating tournament progression integrity:', error);
    return {
      isValid: false,
      errors: [`Validation error: ${error}`],
      warnings: [],
      details: {
        roundOf32: { count: 0, completed: 0, winners: [] },
        roundOf16: { count: 0, completed: 0, winners: [] },
        quarterfinal: { count: 0, completed: 0, winners: [] },
        semifinal: { count: 0, completed: 0, winners: [] },
        final: { count: 0, completed: 0, winners: [] }
      }
    };
  }
}

// Function to completely reset and regenerate tournament progression with correct data flow
export function regenerateTournamentProgression(tournamentId: string, adminUser: string): {
  success: boolean;
  message: string;
  details: string[];
} {
  try {
    const tournaments = readAllTournaments();
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (!tournament) {
      return {
        success: false,
        message: "Tournament not found",
        details: []
      };
    }

    const details: string[] = [];
    
    // Step 1: Clear all existing progression data
    tournament.schedule = [];
    details.push("Cleared all existing tournament matches");
    
    // Step 2: Reset progression data
    const progression = initializeTournamentProgression(tournamentId, adminUser);
    progression.currentRound = "Round of 32";
    progression.lastUpdated = new Date().toISOString();
    progression.lastUpdatedBy = adminUser;
    details.push("Reset progression data to initial state");
    
    // Step 3: Get current registrations to populate Round of 32
    const registrations = readAllRegistrations();
    const tournamentRegistrations = registrations.filter(r => r.tournamentId === tournamentId);
    
    if (tournamentRegistrations.length === 0) {
      details.push("No participants found - tournament schedule will remain empty");
    } else {
      // Step 4: Populate Round of 32 with real participants
      const success = populateRoundOf32Matches(tournamentId, adminUser);
      if (success) {
        details.push(`Populated Round of 32 with ${tournamentRegistrations.length} participants`);
      } else {
        details.push("Failed to populate Round of 32 matches");
      }
    }
    
    // Step 5: Update tournament and progression
    updateTournamentById(tournamentId, tournament);
    
    const data = readProgressionData();
    data[tournamentId] = progression;
    writeProgressionData(data);
    
    details.push("Tournament progression has been completely reset and regenerated");
    
    return {
      success: true,
      message: "Tournament progression successfully reset and regenerated",
      details
    };
  } catch (error) {
    console.error('Error regenerating tournament progression:', error);
    return {
      success: false,
      message: `Failed to regenerate tournament progression: ${error}`,
      details: []
    };
  }
}

/**
 * Checks if a tournament is completed and automatically updates its status
 * A tournament is considered completed when the Final and 3rd Place Match have winners declared
 */
export function checkAndUpdateTournamentStatus(tournamentId: string): boolean {
  try {
    const tournaments = readAllTournaments();
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (!tournament) return false;
    
    // Check if tournament is already completed
    if (tournament.status === "Completed") return true;
    
    // Check if Final and 3rd Place Match have winners declared
    const finalMatch = tournament.schedule.find(m => m.round === "Final");
    const thirdPlaceMatch = tournament.schedule.find(m => m.round === "3rd Place Match");
    
    if (finalMatch?.isCompleted && finalMatch?.winner && 
        thirdPlaceMatch?.isCompleted && thirdPlaceMatch?.winner) {
      
      // Tournament is completed - update status
      const updated = updateTournamentById(tournamentId, {
        status: "Completed",
        completedAt: new Date().toISOString(),
        completedBy: "system"
      });
      
      if (updated) {
        console.log(`Tournament ${tournamentId} status automatically updated to Completed`);
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error(`Error checking tournament completion status for ${tournamentId}:`, error);
    return false;
  }
}
