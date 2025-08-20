export type Venue = {
  id: string;
  name: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  lat?: number;
  lng?: number;
};

export type Organizer = {
  name: string;
  phone: string;
  email: string;
};

export type MatchSlot = {
  code: string;
  date: string;
  start: string;
  end: string;
  round: string;
  players: string;
  winner?: string; // Winner's name or ID
  isCompleted?: boolean; // Whether the match has been completed
  completedAt?: string; // When the match was completed
  completedBy?: string; // Admin who completed the match
};

export type TournamentRound = {
  name: string;
  order: number;
  maxMatches: number;
  isCompleted: boolean;
  completedAt?: string;
  completedBy?: string;
};

export type TournamentProgression = {
  tournamentId: string;
  currentRound: string;
  rounds: TournamentRound[];
  lastUpdated: string;
  lastUpdatedBy: string;
};

export type Tournament = {
  id: string;
  name: string;
  date?: string; // Made optional for tournaments without dates
  status: "Upcoming" | "Ongoing" | "Completed" | "Cancelled";
  sport: string;
  format: string;
  category: string;
  entryFee: number;
  registrationDeadline?: string;
  maxParticipants: number;
  organizer: Organizer;
  venue: Venue;
  scheduleNote?: string;
  schedule: MatchSlot[];
  prizes: string[];
  isDateScheduled?: boolean; // Track if date has been manually set
  scheduledBy?: string; // Admin who scheduled the date
  scheduledAt?: string; // When the date was scheduled
  completedAt?: string; // When the tournament was completed
  completedBy?: string; // Who completed the tournament (system or admin)
};

export type AssignedRound = {
  label: string;
  roundNumber: number;
};

export type Registration = {
  id: string;
  tournamentId: string;
  fullName: string;
  dateOfBirth: string;
  gender: "Male" | "Female";
  phone: string;
  email: string;
  address: string;
  schoolOrEmployer: string;
  playerPhoto?: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  knownAllergies?: string;
  priorMedicalConditions?: string;
  currentMedications?: string;
  medicalReleaseConsent: boolean;
  playerSkillLevel: "Beginner" | "Intermediate" | "Advanced" | "Professional";
  pastPerformance?: string;
  waiversAcknowledged: boolean;
  mediaConsentAcknowledged: boolean;
  paymentScreenshot?: string;
  transactionId: string;
  assignedRound: AssignedRound;
  playerNumber?: number;
  createdAt: string;
};

export type PlayerProfile = {
  number: number;
  fullName: string;
  gender: "Male" | "Female";
  schoolOrEmployer: string;
  playerSkillLevel: "Beginner" | "Intermediate" | "Advanced" | "Professional";
};

// New types for notification tracking
export type NotificationStatus = "pending" | "sent" | "failed" | "delivered";

export type NotificationLog = {
  id: string;
  tournamentId: string;
  participantId: string;
  participantPhone: string;
  participantEmail: string;
  notificationType: "whatsapp" | "email";
  status: NotificationStatus;
  message: string;
  sentAt: string;
  deliveredAt?: string;
  failureReason?: string;
  retryCount: number;
  adminUserId: string;
};

export type TournamentDateSchedule = {
  tournamentId: string;
  date: string;
  scheduledBy: string;
  scheduledAt: string;
  notificationsSent: boolean;
  notificationLogIds: string[];
};

// Judges feature types
export type JudgeStatus = "pending" | "approved" | "rejected";

export type Judge = {
  id: string;
  fullName: string;
  gender: "Male" | "Female" | "Other";
  email: string;
  phone: string; // used for WhatsApp
  judgeType: string; // Carrom, Chess, Singing, Hackathon, etc.
  schoolOrEmployer?: string;
  experience?: string;
  tournaments?: string[]; // optional: tournament IDs judge is tied to
  status: JudgeStatus;
  createdAt: string;
  updatedAt?: string;
};
