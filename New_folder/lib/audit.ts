import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const AUDIT_FILE = path.join(DATA_DIR, "audit.json");

function ensureAudit() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(AUDIT_FILE)) fs.writeFileSync(AUDIT_FILE, "[]", "utf8");
}

export type AuditEntry = {
  id: string;
  timestamp: string;
  adminUser: string;
  action: "ADD" | "UPDATE" | "DELETE";
  resourceType: "registration" | "tournament";
  resourceId: string;
  tournamentId: string;
  ip?: string | null;
  details?: Record<string, any>;
};

export function appendAudit(entry: Omit<AuditEntry, "id" | "timestamp">) {
  ensureAudit();
  const raw = fs.readFileSync(AUDIT_FILE, "utf8");
  let list: AuditEntry[] = [];
  try {
    list = JSON.parse(raw) as AuditEntry[];
  } catch {
    list = [];
  }
  const full: AuditEntry = {
    ...entry,
    id: `AUD-${Math.random().toString(36).slice(2, 10)}`,
    timestamp: new Date().toISOString(),
  };
  list.push(full);
  fs.writeFileSync(AUDIT_FILE, JSON.stringify(list, null, 2), "utf8");
  return full;
}

export function readAuditLog(): AuditEntry[] {
  ensureAudit();
  const raw = fs.readFileSync(AUDIT_FILE, "utf8");
  try {
    return JSON.parse(raw) as AuditEntry[];
  } catch {
    return [];
  }
}

export function getAuditLogByTournament(tournamentId: string): AuditEntry[] {
  const allLogs = readAuditLog();
  return allLogs.filter(log => log.tournamentId === tournamentId);
}

export function getAuditLogByAdmin(adminUser: string): AuditEntry[] {
  const allLogs = readAuditLog();
  return allLogs.filter(log => log.adminUser === adminUser);
}
