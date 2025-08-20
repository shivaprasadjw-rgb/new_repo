# Badminton Tournament Website

A responsive, mobile-friendly site for browsing and registering for badminton tournaments across India.

## Tech Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- date-fns, fuse.js

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

3. Open `http://localhost:3000` in your browser.

## Features
- Homepage with search by Tournament ID or Location (autocomplete)
- Browse by state → city → locality → venue, with sorting
- Tournament detail page with schedule, venue, prizes, registration, and share buttons
- Schedule page with calendar-like grouped list
- Results, About/Rules, and Contact pages
- Register page at `/register` (supports `?tid=TID-XXXX`)

## Registration API
- POST `/api/register` body fields (JSON):
  - tournamentId, fullName, dateOfBirth, gender, phone, email, address, schoolOrEmployer,
    playerPhoto?, emergencyContactName, emergencyContactRelationship, emergencyContactPhone,
    knownAllergies, priorMedicalConditions, currentMedications, medicalReleaseConsent (bool),
    playerSkillLevel, pastPerformance?, waiversAcknowledged (bool), mediaConsentAcknowledged (bool),
    paymentScreenshot?, transactionId
- Returns: `registration` with `assignedRound` (Round-robin: Round A/B/C/D)

## Data
Mock data is located in `lib/data.ts`. Replace with your backend or CMS as needed.
