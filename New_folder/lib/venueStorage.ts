import fs from "fs";
import path from "path";
import type { Venue } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const VENUE_FILE = path.join(DATA_DIR, "venues.json");

function isReadOnlyFs(): boolean {
  return Boolean(process.env.VERCEL);
}

function ensureStore() {
  if (isReadOnlyFs()) return;
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(VENUE_FILE)) {
    try {
      const { venues: defaultVenues } = require("./data");
      fs.writeFileSync(VENUE_FILE, JSON.stringify(defaultVenues, null, 2), "utf8");
    } catch {}
  }
}

export function readAllVenues(): Venue[] {
  ensureStore();
  try {
    const raw = fs.readFileSync(VENUE_FILE, "utf8");
    return JSON.parse(raw) as Venue[];
  } catch {
    try {
      const { venues: defaultVenues } = require("./data");
      return defaultVenues as Venue[];
    } catch {
      return [];
    }
  }
}

export function writeAllVenues(venues: Venue[]) {
  if (isReadOnlyFs()) return;
  ensureStore();
  fs.writeFileSync(VENUE_FILE, JSON.stringify(venues, null, 2), "utf8");
}

export function addVenue(venue: Venue): Venue {
  const venues = readAllVenues();
  
  // Check for duplicates by name + city combination
  const existingVenue = venues.find(v => 
    v.name.toLowerCase() === venue.name.toLowerCase() && 
    v.city.toLowerCase() === venue.city.toLowerCase()
  );
  
  if (existingVenue) {
    throw new Error(`A venue with the name "${venue.name}" already exists in ${venue.city}`);
  }
  
  venues.push(venue);
  writeAllVenues(venues);
  return venue;
}

export function updateVenueById(id: string, update: Partial<Venue>): Venue | null {
  const venues = readAllVenues();
  let updated: Venue | null = null;
  const next = venues.map(item => {
    if (item.id === id) {
      updated = { ...item, ...update } as Venue;
      return updated;
    }
    return item;
  });
  if (!updated) return null;
  writeAllVenues(next);
  return updated;
}

export function deleteVenueById(id: string): boolean {
  const venues = readAllVenues();
  const next = venues.filter(v => v.id !== id);
  if (next.length === venues.length) return false;
  writeAllVenues(next);
  return true;
}

export function getVenueById(id: string): Venue | null {
  const venues = readAllVenues();
  return venues.find(v => v.id === id) || null;
}

export function generateVenueId(city: string): string {
  const venues = readAllVenues();
  const existingIds = venues.map(v => v.id);
  
  // Extract numeric parts from existing IDs and find the highest
  let highestNumber = 0;
  existingIds.forEach(id => {
    const match = id.match(/V-([A-Z]+)-(\d+)/);
    if (match) {
      const num = parseInt(match[2], 10);
      if (num > highestNumber) {
        highestNumber = num;
      }
    }
  });
  
  // Start from the next number after the highest existing
  let counter = highestNumber + 1;
  let newId: string;
  
  do {
    // Generate a city code from the venue city (first 3 letters)
    const cityCode = city.substring(0, 3).toUpperCase();
    newId = `V-${cityCode}-${String(counter).padStart(3, '0')}`;
    counter++;
  } while (existingIds.includes(newId));
  
  return newId;
}
