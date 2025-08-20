import type { Tournament, Venue, PlayerProfile } from "@/lib/types";

export const venues: Venue[] = [
  { id: "V-BLR-ABC", name: "ABC Sports Arena", locality: "Indiranagar", city: "Bengaluru", state: "Karnataka", pincode: "560038", lat: 12.9719, lng: 77.6412 },
  { id: "V-BLR-XYZ", name: "XYZ Badminton Hub", locality: "Whitefield", city: "Bengaluru", state: "Karnataka", pincode: "560066" },
  { id: "V-MUM-PRM", name: "Premier Smash Court", locality: "Andheri East", city: "Mumbai", state: "Maharashtra", pincode: "400069" },
  { id: "V-DEL-NCR", name: "NCR Sports Center", locality: "Dwarka", city: "New Delhi", state: "Delhi", pincode: "110075" },
  { id: "V-HYD-HIT", name: "Hitech Sports Club", locality: "Madhapur", city: "Hyderabad", state: "Telangana", pincode: "500081" },
  { id: "V-PUN-KAL", name: "Kalyani Sports Arena", locality: "Kalyani Nagar", city: "Pune", state: "Maharashtra", pincode: "411006" },
  { id: "V-CHE-OMR", name: "OMR Multi-Sport Hall", locality: "Sholinganallur", city: "Chennai", state: "Tamil Nadu", pincode: "600119" }
];

// Seeded player profiles by tournament for popups and player pages
export const playerProfilesByTournament: Record<string, PlayerProfile[]> = {
  "TID-1024": Array.from({ length: 32 }, (_, i) => {
    const n = i + 1;
    const genders = ["Male", "Female"] as const;
    const skills = ["Beginner", "Intermediate", "Advanced", "Professional"] as const;
    return {
      number: n,
      fullName: `Player ${n}`,
      gender: genders[n % 2],
      schoolOrEmployer: n % 2 === 0 ? "ABC College" : "XYZ Tech Pvt Ltd",
      playerSkillLevel: skills[n % skills.length],
    } as PlayerProfile;
  })
};

export const tournaments: Tournament[] = [
  {
    id: "TID-1024",
    name: "Bengaluru Open 2025",
    date: "2025-08-16",
    status: "Upcoming",
    sport: "Badminton",
    format: "Singles",
    category: "Open Category",
    entryFee: 600,
    registrationDeadline: "2025-08-14",
    maxParticipants: 32,
    organizer: { name: "Kiran Kumar", phone: "+91-9876543210", email: "kiran@example.com" },
    venue: venues[0],
    scheduleNote: "32-player knockout across two weekends. 30-min matches with 10-min breaks (40-min slots).",
    schedule: [
      { code: "M1",  date: "2025-08-16", start: "04:00 PM", end: "04:30 PM", round: "Round of 32", players: "Player 1 vs Player 32" },
      { code: "M2",  date: "2025-08-16", start: "04:40 PM", end: "05:10 PM", round: "Round of 32", players: "Player 16 vs Player 17" },
      { code: "M3",  date: "2025-08-16", start: "05:20 PM", end: "05:50 PM", round: "Round of 32", players: "Player 8 vs Player 25" },
      { code: "M4",  date: "2025-08-16", start: "06:00 PM", end: "06:30 PM", round: "Round of 32", players: "Player 9 vs Player 24" },
      { code: "M5",  date: "2025-08-16", start: "06:40 PM", end: "07:10 PM", round: "Round of 32", players: "Player 4 vs Player 29" },
      { code: "M6",  date: "2025-08-16", start: "07:20 PM", end: "07:50 PM", round: "Round of 32", players: "Player 13 vs Player 20" },
      { code: "M7",  date: "2025-08-16", start: "08:00 PM", end: "08:30 PM", round: "Round of 32", players: "Player 5 vs Player 28" },
      { code: "M8",  date: "2025-08-16", start: "08:40 PM", end: "09:10 PM", round: "Round of 32", players: "Player 12 vs Player 21" },
      { code: "M9",  date: "2025-08-17", start: "04:00 PM", end: "04:30 PM", round: "Round of 32", players: "Player 3 vs Player 30" },
      { code: "M10", date: "2025-08-17", start: "04:40 PM", end: "05:10 PM", round: "Round of 32", players: "Player 14 vs Player 19" },
      { code: "M11", date: "2025-08-17", start: "05:20 PM", end: "05:50 PM", round: "Round of 32", players: "Player 6 vs Player 27" },
      { code: "M12", date: "2025-08-17", start: "06:00 PM", end: "06:30 PM", round: "Round of 32", players: "Player 11 vs Player 22" },
      { code: "M13", date: "2025-08-17", start: "06:40 PM", end: "07:10 PM", round: "Round of 32", players: "Player 7 vs Player 26" },
      { code: "M14", date: "2025-08-17", start: "07:20 PM", end: "07:50 PM", round: "Round of 32", players: "Player 10 vs Player 23" },
      { code: "M15", date: "2025-08-17", start: "08:00 PM", end: "08:30 PM", round: "Round of 32", players: "Player 2 vs Player 31" },
      { code: "M16", date: "2025-08-17", start: "08:40 PM", end: "09:10 PM", round: "Round of 32", players: "Player 15 vs Player 18" },
      { code: "M17", date: "2025-08-23", start: "04:00 PM", end: "04:30 PM", round: "Round of 16", players: "W1 vs W2" },
      { code: "M18", date: "2025-08-23", start: "04:40 PM", end: "05:10 PM", round: "Round of 16", players: "W3 vs W4" },
      { code: "M19", date: "2025-08-23", start: "05:20 PM", end: "05:50 PM", round: "Round of 16", players: "W5 vs W6" },
      { code: "M20", date: "2025-08-23", start: "06:00 PM", end: "06:30 PM", round: "Round of 16", players: "W7 vs W8" },
      { code: "M21", date: "2025-08-23", start: "06:40 PM", end: "07:10 PM", round: "Round of 16", players: "W9 vs W10" },
      { code: "M22", date: "2025-08-23", start: "07:20 PM", end: "07:50 PM", round: "Round of 16", players: "W11 vs W12" },
      { code: "M23", date: "2025-08-23", start: "08:00 PM", end: "08:30 PM", round: "Round of 16", players: "W13 vs W14" },
      { code: "M24", date: "2025-08-23", start: "08:40 PM", end: "09:10 PM", round: "Round of 16", players: "W15 vs W16" },
      { code: "M25", date: "2025-08-24", start: "09:00 AM", end: "09:30 AM", round: "Quarterfinal", players: "W17 vs W18" },
      { code: "M26", date: "2025-08-24", start: "09:40 AM", end: "10:10 AM", round: "Quarterfinal", players: "W19 vs W20" },
      { code: "M27", date: "2025-08-24", start: "10:20 AM", end: "10:50 AM", round: "Quarterfinal", players: "W21 vs W22" },
      { code: "M28", date: "2025-08-24", start: "11:00 AM", end: "11:30 AM", round: "Quarterfinal", players: "W23 vs W24" },
      { code: "M29", date: "2025-08-24", start: "04:00 PM", end: "04:30 PM", round: "Semifinal", players: "W25 vs W26" },
      { code: "M30", date: "2025-08-24", start: "04:40 PM", end: "05:10 PM", round: "Semifinal", players: "W27 vs W28" },
      { code: "M31 (Final)", date: "2025-08-24", start: "07:00 PM", end: "07:40 PM", round: "Final", players: "W29 vs W30" }
    ],
    prizes: ["Winner Trophy", "Runner-up Trophy"]
  },
  {
    id: "TID-2101",
    name: "Mumbai Classic Chess 2025",
    date: "2025-09-07",
    status: "Upcoming",
    sport: "Chess",
    format: "Swiss 7 Rounds",
    category: "Open",
    entryFee: 500,
    registrationDeadline: "2025-09-01",
    maxParticipants: 32,
    organizer: { name: "Priya Sharma", phone: "+91-9000000001", email: "priya@example.com" },
    venue: venues[2],
    schedule: [],
    prizes: ["Trophies", "Cash Prizes"]
  },
  {
    id: "TID-3102",
    name: "Delhi Invitational Carrom Cup",
    date: "2025-08-24",
    status: "Upcoming",
    sport: "Carrom",
    format: "Singles",
    category: "Open",
    entryFee: 300,
    registrationDeadline: "2025-08-20",
    maxParticipants: 32,
    organizer: { name: "Aman Verma", phone: "+91-9811111111", email: "aman@example.com" },
    venue: venues[3],
    schedule: [],
    prizes: ["Winner Trophy", "Runner-up Trophy"]
  },
  {
    id: "TID-4103",
    name: "Hyderabad Chess Rapid",
    date: "2025-08-23",
    status: "Upcoming",
    sport: "Chess",
    format: "Rapid 9 Rounds",
    category: "Open",
    entryFee: 400,
    registrationDeadline: "2025-08-19",
    maxParticipants: 32,
    organizer: { name: "Sravani R", phone: "+91-9848000000", email: "sravani@example.com" },
    venue: venues[4],
    schedule: [],
    prizes: ["Winner Trophy", "Runner-up Trophy"]
  },
  {
    id: "TID-5104",
    name: "Chennai Carrom League",
    date: "2025-08-30",
    status: "Upcoming",
    sport: "Carrom",
    format: "Doubles",
    category: "U-17",
    entryFee: 250,
    registrationDeadline: "2025-08-25",
    maxParticipants: 32,
    organizer: { name: "Vignesh", phone: "+91-9003000000", email: "vignesh@example.com" },
    venue: venues[6],
    schedule: [],
    prizes: ["Winner Trophy", "Runner-up Trophy"]
  }
];
