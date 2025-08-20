type RoundState = { nextIndex: number };

const rotationLabels = ["Round A", "Round B", "Round C", "Round D"]; // simple round-robin buckets

const perTournamentState = new Map<string, RoundState>();
const takenSlots = new Map<string, Set<number>>(); // tournamentId -> Set of taken slot numbers

export function assignRoundForTournament(tournamentId: string) {
  const state = perTournamentState.get(tournamentId) ?? { nextIndex: 0 };
  const index = state.nextIndex % rotationLabels.length;
  const label = rotationLabels[index];
  state.nextIndex = index + 1;
  perTournamentState.set(tournamentId, state);
  return { label, index };
}

export function assignRandomAvailableSlot(tournamentId: string, maxSlots: number = 32): number {
  const taken = takenSlots.get(tournamentId) ?? new Set();
  
  // If all slots are taken, return -1 to indicate no slots available
  if (taken.size >= maxSlots) {
    return -1;
  }
  
  // Find available slots
  const availableSlots: number[] = [];
  for (let i = 1; i <= maxSlots; i++) {
    if (!taken.has(i)) {
      availableSlots.push(i);
    }
  }
  
  // Randomly select an available slot
  const randomIndex = Math.floor(Math.random() * availableSlots.length);
  const selectedSlot = availableSlots[randomIndex];
  
  // Mark the slot as taken
  taken.add(selectedSlot);
  takenSlots.set(tournamentId, taken);
  
  return selectedSlot;
}

export function setTakenSlots(tournamentId: string, slots: number[]) {
  takenSlots.set(tournamentId, new Set(slots));
}

export function getTakenSlots(tournamentId: string): Set<number> {
  return takenSlots.get(tournamentId) ?? new Set();
}
