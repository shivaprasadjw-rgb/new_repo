import fs from "fs";
import path from "path";
import crypto from "crypto";
import type { Registration } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const REG_FILE = path.join(DATA_DIR, "registrations.json");

function isReadOnlyFs(): boolean {
  return Boolean(process.env.VERCEL);
}

// Optional AES-256-GCM encryption for sensitive fields at rest
const DATA_ENCRYPTION_KEY = process.env.DATA_ENCRYPTION_KEY || ""; // hex or base64 (32 bytes)

function getAesKey(): Buffer | null {
  if (!DATA_ENCRYPTION_KEY) return null;
  try {
    // Accept hex or base64
    if (/^[0-9a-fA-F]{64}$/.test(DATA_ENCRYPTION_KEY)) {
      return Buffer.from(DATA_ENCRYPTION_KEY, 'hex');
    }
    const buf = Buffer.from(DATA_ENCRYPTION_KEY, 'base64');
    return buf.length === 32 ? buf : null;
  } catch {
    return null;
  }
}

function encryptJsonString(plaintext: string): string {
  const key = getAesKey();
  if (!key) return plaintext;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(Buffer.from(plaintext, 'utf8')), cipher.final()]);
  const tag = cipher.getAuthTag();
  return JSON.stringify({ __enc: 1, alg: 'aes-256-gcm', iv: iv.toString('hex'), tag: tag.toString('hex'), data: encrypted.toString('hex') });
}

function decryptJsonString(ciphertext: string): string {
  const key = getAesKey();
  if (!key) return ciphertext;
  try {
    const payload = JSON.parse(ciphertext);
    if (!payload || payload.__enc !== 1) return ciphertext;
    const iv = Buffer.from(payload.iv, 'hex');
    const tag = Buffer.from(payload.tag, 'hex');
    const data = Buffer.from(payload.data, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    // On failure, assume file is plain JSON
    return ciphertext;
  }
}

function ensureStore() {
  if (isReadOnlyFs()) return;
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(REG_FILE)) fs.writeFileSync(REG_FILE, "[]", "utf8");
}

export function readAllRegistrations(): Registration[] {
  ensureStore();
  try {
    const raw = fs.readFileSync(REG_FILE, "utf8");
    const maybeDecrypted = decryptJsonString(raw);
    return JSON.parse(maybeDecrypted) as Registration[];
  } catch {
    return [];
  }
}

export function writeAllRegistrations(list: Registration[]) {
  if (isReadOnlyFs()) return;
  ensureStore();
  const json = JSON.stringify(list, null, 2);
  const payload = encryptJsonString(json);
  fs.writeFileSync(REG_FILE, payload, "utf8");
}

export function appendRegistration(reg: Registration) {
  if (isReadOnlyFs()) return;
  ensureStore();
  const list = readAllRegistrations();
  list.push(reg);
  const json = JSON.stringify(list, null, 2);
  const payload = encryptJsonString(json);
  fs.writeFileSync(REG_FILE, payload, "utf8");
}

export function updateRegistrationById(id: string, update: Partial<Registration>): Registration | null {
  const list = readAllRegistrations();
  let updated: Registration | null = null;
  const next = list.map(item => {
    if (item.id === id) {
      updated = { ...item, ...update } as Registration;
      return updated;
    }
    return item;
  });
  if (!updated) return null;
  writeAllRegistrations(next);
  return updated;
}

export function deleteRegistrationById(id: string): boolean {
  const list = readAllRegistrations();
  const next = list.filter(item => item.id !== id);
  const changed = next.length !== list.length;
  if (changed) writeAllRegistrations(next);
  return changed;
}
