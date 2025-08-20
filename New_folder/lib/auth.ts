import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import fs from "fs";
import path from "path";

// Configuration
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex');
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

// Admin credentials (in production, use environment variables)
// Default to PBKDF2-derived hash so it matches verifyPassword implementation
const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_USERNAME || "admin",
  passwordHash: process.env.ADMIN_PASSWORD_HASH || ((): string => {
    const { hash } = hashPassword(process.env.ADMIN_PASSWORD || "admin123", '');
    return hash;
  })()
};

// Session storage (in production, use Redis or database)
const SESSIONS_FILE = path.join(process.cwd(), "data", "sessions.json");
const LOGIN_ATTEMPTS_FILE = path.join(process.cwd(), "data", "login-attempts.json");

interface Session {
  id: string;
  username: string;
  createdAt: number;
  expiresAt: number;
  ip: string;
  userAgent: string;
}

interface LoginAttempt {
  ip: string;
  attempts: number;
  lastAttempt: number;
  lockedUntil: number;
}

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.dirname(SESSIONS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Session management
function readSessions(): Record<string, Session> {
  ensureDataDir();
  if (!fs.existsSync(SESSIONS_FILE)) {
    return {};
  }
  try {
    const data = fs.readFileSync(SESSIONS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

function writeSessions(sessions: Record<string, Session>) {
  ensureDataDir();
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
}

function readLoginAttempts(): Record<string, LoginAttempt> {
  ensureDataDir();
  if (!fs.existsSync(LOGIN_ATTEMPTS_FILE)) {
    return {};
  }
  try {
    const data = fs.readFileSync(LOGIN_ATTEMPTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

function writeLoginAttempts(attempts: Record<string, LoginAttempt>) {
  ensureDataDir();
  fs.writeFileSync(LOGIN_ATTEMPTS_FILE, JSON.stringify(attempts, null, 2));
}

// Clean expired sessions
function cleanupSessions() {
  const sessions = readSessions();
  const now = Date.now();
  const activeSessions: Record<string, Session> = {};
  
  for (const [id, session] of Object.entries(sessions)) {
    if (session.expiresAt > now) {
      activeSessions[id] = session;
    }
  }
  
  if (Object.keys(activeSessions).length !== Object.keys(sessions).length) {
    writeSessions(activeSessions);
  }
}

// Generate secure session ID
function generateSessionId(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Hash password with salt
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  // Treat empty string as a valid, explicit salt to ensure deterministic hashing when desired
  const useSalt = (salt !== undefined) ? salt : crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, useSalt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt: useSalt };
}

// Verify password
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const { hash: computedHash } = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computedHash, 'hex'));
}

// Check if IP is locked out
function isIpLocked(ip: string): boolean {
  const attempts = readLoginAttempts();
  const attempt = attempts[ip];
  
  if (!attempt) return false;
  
  if (attempt.lockedUntil > Date.now()) {
    return true;
  }
  
  // Clear expired lockout
  if (attempt.attempts >= MAX_LOGIN_ATTEMPTS && attempt.lockedUntil <= Date.now()) {
    delete attempts[ip];
    writeLoginAttempts(attempts);
  }
  
  return false;
}

// Record login attempt
function recordLoginAttempt(ip: string, success: boolean) {
  const attempts = readLoginAttempts();
  const now = Date.now();
  
  if (!attempts[ip]) {
    attempts[ip] = { ip, attempts: 0, lastAttempt: now, lockedUntil: 0 };
  }
  
  if (success) {
    // Reset on successful login
    attempts[ip].attempts = 0;
    attempts[ip].lockedUntil = 0;
  } else {
    // Increment failed attempts
    attempts[ip].attempts++;
    attempts[ip].lastAttempt = now;
    
    if (attempts[ip].attempts >= MAX_LOGIN_ATTEMPTS) {
      attempts[ip].lockedUntil = now + LOCKOUT_DURATION;
    }
  }
  
  writeLoginAttempts(attempts);
}

// Create new session
export function createSession(username: string, req: NextRequest): string {
  cleanupSessions();
  
  const sessionId = generateSessionId();
  const now = Date.now();
  
  const session: Session = {
    id: sessionId,
    username,
    createdAt: now,
    expiresAt: now + SESSION_DURATION,
    ip: req.ip || req.headers.get('x-forwarded-for') || 'unknown',
    userAgent: req.headers.get('user-agent') || 'unknown'
  };
  
  const sessions = readSessions();
  sessions[sessionId] = session;
  writeSessions(sessions);
  
  return sessionId;
}

// Validate session
export function validateSession(sessionId: string, req: NextRequest): { valid: boolean; username?: string; error?: string } {
  cleanupSessions();
  
  const sessions = readSessions();
  const session = sessions[sessionId];
  
  if (!session) {
    return { valid: false, error: "Session not found" };
  }
  
  if (session.expiresAt < Date.now()) {
    // Remove expired session
    delete sessions[sessionId];
    writeSessions(sessions);
    return { valid: false, error: "Session expired" };
  }
  
  // Optional: Check IP and User-Agent for additional security
  const clientIp = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
  const clientUserAgent = req.headers.get('user-agent') || 'unknown';
  
  if (session.ip !== clientIp) {
    return { valid: false, error: "Session IP mismatch" };
  }
  
  return { valid: true, username: session.username };
}

// Invalidate session
export function invalidateSession(sessionId: string): boolean {
  const sessions = readSessions();
  if (sessions[sessionId]) {
    delete sessions[sessionId];
    writeSessions(sessions);
    return true;
  }
  return false;
}

// Admin authentication
export function authenticateAdmin(username: string, password: string, req: NextRequest): { success: boolean; sessionId?: string; error?: string } {
  const clientIp = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
  
  // Check if IP is locked out
  if (isIpLocked(clientIp)) {
    return { 
      success: false, 
      error: `Too many failed attempts. Please try again in ${Math.ceil((readLoginAttempts()[clientIp]?.lockedUntil - Date.now()) / 60000)} minutes.` 
    };
  }
  
  // Verify credentials
  if (username === ADMIN_CREDENTIALS.username && 
      verifyPassword(password, ADMIN_CREDENTIALS.passwordHash, '')) {
    
    // Record successful login
    recordLoginAttempt(clientIp, true);
    
    // Create session
    const sessionId = createSession(username, req);
    return { success: true, sessionId };
  }
  
  // Record failed login
  recordLoginAttempt(clientIp, false);
  
  return { 
    success: false, 
    error: "Invalid username or password" 
  };
}

// Middleware function to require admin authentication
export function requireAdminAuth(req: NextRequest): { ok: boolean; username?: string; error?: string } {
  // Prefer secure HttpOnly cookie; fall back to legacy header for backward compatibility
  const cookieSession = req.cookies.get('admin-session')?.value || undefined;
  const headerSession = req.headers.get('x-session-id') || undefined;
  const sessionId = cookieSession || headerSession;

  if (!sessionId) {
    return { ok: false, error: "No session provided" };
  }

  const validation = validateSession(sessionId, req);
  if (!validation.valid) {
    return { ok: false, error: validation.error };
  }

  // Enforce CSRF protection for state-changing methods
  const method = (req.method || 'GET').toUpperCase();
  const isStateChanging = !['GET', 'HEAD', 'OPTIONS'].includes(method);
  if (isStateChanging) {
    const csrfHeader = req.headers.get('x-csrf-token') || '';
    const csrfCookie = req.cookies.get('csrf-token')?.value || '';
    if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie || csrfHeader.length !== 64) {
      return { ok: false, error: "Invalid CSRF token" };
    }
  }

  return { ok: true, username: validation.username };
}

// Rate limiting
export function checkRateLimit(ip: string, action: string, limit: number, windowMs: number): boolean {
  const attempts = readLoginAttempts();
  const now = Date.now();
  const key = `${ip}:${action}`;
  
  if (!attempts[key]) {
    attempts[key] = { ip: key, attempts: 1, lastAttempt: now, lockedUntil: 0 };
    writeLoginAttempts(attempts);
    return true;
  }
  
  if (now - attempts[key].lastAttempt > windowMs) {
    // Reset window
    attempts[key].attempts = 1;
    attempts[key].lastAttempt = now;
    writeLoginAttempts(attempts);
    return true;
  }
  
  if (attempts[key].attempts >= limit) {
    return false;
  }
  
  attempts[key].attempts++;
  attempts[key].lastAttempt = now;
  writeLoginAttempts(attempts);
  return true;
}
