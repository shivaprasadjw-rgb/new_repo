import fs from "fs";
import path from "path";
import type { Tournament } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const TOURNAMENT_FILE = path.join(DATA_DIR, "tournaments.json");
const ARCHIVE_FILE = path.join(DATA_DIR, "tournaments-archive.json");

function isReadOnlyFs(): boolean {
  // Vercel/serverless environments have a read-only filesystem at runtime
  return Boolean(process.env.VERCEL);
}

function ensureStore() {
  if (isReadOnlyFs()) {
    // Do not attempt to create or write files on read-only FS
    return;
  }
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(TOURNAMENT_FILE)) {
    try {
      const defaultTournaments = require("./data").tournaments;
      fs.writeFileSync(TOURNAMENT_FILE, JSON.stringify(defaultTournaments, null, 2), "utf8");
    } catch {
      // ignore init errors in non-critical paths
    }
  }
  if (!fs.existsSync(ARCHIVE_FILE)) {
    try { fs.writeFileSync(ARCHIVE_FILE, "[]", "utf8"); } catch {}
  }
}

export function readAllTournaments(): Tournament[] {
  ensureStore();
  try {
    const raw = fs.readFileSync(TOURNAMENT_FILE, "utf8");
    return JSON.parse(raw) as Tournament[];
  } catch {
    // Fallback to bundled data when file access fails (e.g., on Vercel)
    try {
      const fallback = require("./data").tournaments as Tournament[];
      return fallback;
    } catch {
      return [];
    }
  }
}

export function writeAllTournaments(tournaments: Tournament[]) {
  if (isReadOnlyFs()) return; // no-op on read-only FS
  ensureStore();
  fs.writeFileSync(TOURNAMENT_FILE, JSON.stringify(tournaments, null, 2), "utf8");
}

export function addTournament(tournament: Tournament): Tournament {
  const tournaments = readAllTournaments();
  tournaments.push(tournament);
  writeAllTournaments(tournaments);
  return tournament;
}

export function updateTournamentById(id: string, update: Partial<Tournament>): Tournament | null {
  const tournaments = readAllTournaments();
  let updated: Tournament | null = null;
  const next = tournaments.map(item => {
    if (item.id === id) {
      updated = { ...item, ...update } as Tournament;
      return updated;
    }
    return item;
  });
  if (!updated) return null;
  writeAllTournaments(next);
  return updated;
}

export function deleteTournamentById(id: string): boolean {
  const tournaments = readAllTournaments();
  const target = tournaments.find(t => t.id === id);
  if (!target) return false;
  
  // Archive the tournament instead of permanent deletion
  const archived = {
    ...target,
    archivedAt: new Date().toISOString(),
    archivedBy: "admin", // This will be updated by the API with actual admin user
  };
  
  const archiveList = readArchivedTournaments();
  archiveList.push(archived);
  writeArchivedTournaments(archiveList);
  
  // Remove from active tournaments
  const next = tournaments.filter(t => t.id !== id);
  writeAllTournaments(next);
  
  return true;
}

export function readArchivedTournaments(): any[] {
  ensureStore();
  try {
    const raw = fs.readFileSync(ARCHIVE_FILE, "utf8");
    return JSON.parse(raw) as any[];
  } catch {
    return [];
  }
}

function writeArchivedTournaments(archived: any[]) {
  if (isReadOnlyFs()) return;
  ensureStore();
  fs.writeFileSync(ARCHIVE_FILE, JSON.stringify(archived, null, 2), "utf8");
}

export function generateTournamentId(): string {
  const tournaments = readAllTournaments();
  const existingIds = tournaments.map(t => t.id);
  
  // Extract numeric parts from existing IDs and find the highest
  let highestNumber = 0;
  existingIds.forEach(id => {
    const match = id.match(/TID-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > highestNumber) {
        highestNumber = num;
      }
    }
  });
  
  // Start from the next number after the highest existing
  let counter = highestNumber + 1;
  let newId: string;
  
  do {
    newId = `TID-${String(counter).padStart(4, '0')}`;
    counter++;
  } while (existingIds.includes(newId));
  
  return newId;
}

export function getTournamentById(id: string): Tournament | null {
  const tournaments = readAllTournaments();
  return tournaments.find(t => t.id === id) || null;
}

// New function to check if tournament is ready for date scheduling
export function isTournamentReadyForScheduling(tournamentId: string, currentRegistrations: number): boolean {
  const tournament = getTournamentById(tournamentId);
  if (!tournament) return false;
  
  // Tournament must be full (32 participants) and not have a date set
  return currentRegistrations >= tournament.maxParticipants && !tournament.date;
}

// New function to schedule tournament date
export function scheduleTournamentDate(
  tournamentId: string, 
  date: string, 
  adminUserId: string
): Tournament | null {
  const tournament = getTournamentById(tournamentId);
  if (!tournament) return null;
  
  // Validate date is not in the past
  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (selectedDate < today) {
    throw new Error("Tournament date cannot be in the past");
  }
  
  const updated = updateTournamentById(tournamentId, {
    date,
    isDateScheduled: true,
    scheduledBy: adminUserId,
    scheduledAt: new Date().toISOString()
  });
  
  return updated;
}
