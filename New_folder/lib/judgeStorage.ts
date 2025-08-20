import fs from "fs";
import path from "path";
import type { Judge } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const JUDGES_FILE = path.join(DATA_DIR, "judges.json");

function isReadOnlyFs(): boolean {
  return Boolean(process.env.VERCEL);
}

function ensureStore() {
  if (isReadOnlyFs()) return;
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(JUDGES_FILE)) {
    try { fs.writeFileSync(JUDGES_FILE, "[]", "utf8"); } catch {}
  }
}

export function readAllJudges(): Judge[] {
  try {
    const raw = fs.readFileSync(JUDGES_FILE, "utf8");
    return JSON.parse(raw) as Judge[];
  } catch {
    // Return empty on Vercel or missing file
    return [];
  }
}

export function writeAllJudges(judges: Judge[]) {
  if (isReadOnlyFs()) return;
  ensureStore();
  fs.writeFileSync(JUDGES_FILE, JSON.stringify(judges, null, 2), "utf8");
}

export function addJudge(judge: Judge): Judge {
  const judges = readAllJudges();
  judges.push(judge);
  writeAllJudges(judges);
  return judge;
}

export function updateJudgeById(id: string, update: Partial<Judge>): Judge | null {
  const judges = readAllJudges();
  let updated: Judge | null = null;
  const next = judges.map(j => {
    if (j.id === id) {
      updated = { ...j, ...update, updatedAt: new Date().toISOString() } as Judge;
      return updated;
    }
    return j;
  });
  if (!updated) return null;
  writeAllJudges(next);
  return updated;
}

export function deleteJudgeById(id: string): boolean {
  const judges = readAllJudges();
  const next = judges.filter(j => j.id !== id);
  if (next.length === judges.length) return false;
  writeAllJudges(next);
  return true;
}

export function getJudgeById(id: string): Judge | null {
  const judges = readAllJudges();
  return judges.find(j => j.id === id) || null;
}


