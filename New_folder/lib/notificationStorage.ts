import fs from "fs";
import path from "path";
import type { NotificationLog, TournamentDateSchedule } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const NOTIFICATION_FILE = path.join(DATA_DIR, "notifications.json");
const SCHEDULE_FILE = path.join(DATA_DIR, "tournament-schedules.json");

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(NOTIFICATION_FILE)) fs.writeFileSync(NOTIFICATION_FILE, "[]", "utf8");
  if (!fs.existsSync(SCHEDULE_FILE)) fs.writeFileSync(SCHEDULE_FILE, "[]", "utf8");
}

// Notification Logs
export function readAllNotifications(): NotificationLog[] {
  ensureStore();
  const raw = fs.readFileSync(NOTIFICATION_FILE, "utf8");
  try {
    return JSON.parse(raw) as NotificationLog[];
  } catch {
    return [];
  }
}

export function appendNotification(notification: NotificationLog): NotificationLog {
  ensureStore();
  const notifications = readAllNotifications();
  notifications.push(notification);
  fs.writeFileSync(NOTIFICATION_FILE, JSON.stringify(notifications, null, 2), "utf8");
  return notification;
}

export function appendMultipleNotifications(notifications: NotificationLog[]): NotificationLog[] {
  ensureStore();
  const existing = readAllNotifications();
  const updated = [...existing, ...notifications];
  fs.writeFileSync(NOTIFICATION_FILE, JSON.stringify(updated, null, 2), "utf8");
  return notifications;
}

export function getNotificationsByTournament(tournamentId: string): NotificationLog[] {
  const notifications = readAllNotifications();
  return notifications.filter(n => n.tournamentId === tournamentId);
}

export function getNotificationsByParticipant(participantId: string): NotificationLog[] {
  const notifications = readAllNotifications();
  return notifications.filter(n => n.participantId === participantId);
}

// Tournament Date Schedules
export function readAllSchedules(): TournamentDateSchedule[] {
  ensureStore();
  const raw = fs.readFileSync(SCHEDULE_FILE, "utf8");
  try {
    return JSON.parse(raw) as TournamentDateSchedule[];
  } catch {
    return [];
  }
}

export function writeAllSchedules(schedules: TournamentDateSchedule[]) {
  ensureStore();
  fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(schedules, null, 2), "utf8");
}

export function addSchedule(schedule: TournamentDateSchedule): TournamentDateSchedule {
  const schedules = readAllSchedules();
  schedules.push(schedule);
  writeAllSchedules(schedules);
  return schedule;
}

export function updateSchedule(tournamentId: string, updates: Partial<TournamentDateSchedule>): TournamentDateSchedule | null {
  const schedules = readAllSchedules();
  let updated: TournamentDateSchedule | null = null;
  const next = schedules.map(item => {
    if (item.tournamentId === tournamentId) {
      updated = { ...item, ...updates } as TournamentDateSchedule;
      return updated;
    }
    return item;
  });
  if (!updated) return null;
  writeAllSchedules(next);
  return updated;
}

export function getScheduleByTournament(tournamentId: string): TournamentDateSchedule | null {
  const schedules = readAllSchedules();
  return schedules.find(s => s.tournamentId === tournamentId) || null;
}

export function deleteSchedule(tournamentId: string): boolean {
  const schedules = readAllSchedules();
  const next = schedules.filter(s => s.tournamentId !== tournamentId);
  if (next.length === schedules.length) return false;
  writeAllSchedules(next);
  return true;
}
