export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function googleMapsLink(venue: { name: string; locality: string; city: string; state: string; pincode?: string }) {
  const q = encodeURIComponent(`${venue.name}, ${venue.locality}, ${venue.city}, ${venue.state} ${venue.pincode ?? ''}`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

// Returns the upcoming Saturday/Sunday such that Saturday is at least 7 days from 'now'.
export function upcomingWeekendAtLeastOneWeekOut(now: Date): { saturday: Date; sunday: Date } {
  const day = now.getDay(); // 0 Sun .. 6 Sat
  const daysUntilSaturday = (6 - day + 7) % 7; // 0..6
  let saturday = new Date(now);
  saturday.setHours(0, 0, 0, 0);
  saturday.setDate(saturday.getDate() + daysUntilSaturday);
  // Ensure at least 7 days lead time
  const msInDay = 24 * 60 * 60 * 1000;
  if (saturday.getTime() - now.getTime() < 7 * msInDay) {
    saturday = new Date(saturday.getTime() + 7 * msInDay);
  }
  const sunday = new Date(saturday);
  sunday.setDate(sunday.getDate() + 1);
  return { saturday, sunday };
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}
