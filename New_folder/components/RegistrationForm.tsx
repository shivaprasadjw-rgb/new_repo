"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Tournament } from "@/lib/types";

export default function RegistrationForm() {
  const params = useSearchParams();
  const router = useRouter();
  const initialTid = params.get("tid") || "";
  
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const initialTournament = tournaments.find(t => t.id === initialTid);
  const initialSport = initialTournament?.sport || "";

  const sports = useMemo(() => Array.from(new Set(tournaments.map(t => t.sport))).sort(), [tournaments]);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [assignedRound, setAssignedRound] = useState<string | null>(null);
  const [currentCapacity, setCurrentCapacity] = useState(0);
  const [isCapacityFull, setIsCapacityFull] = useState(false);
  const [capacityLoading, setCapacityLoading] = useState(true);

  const [sport, setSport] = useState<string>(initialSport);
  const [form, setForm] = useState<any>({
    tournamentId: initialTid,
    fullName: "",
    dateOfBirth: "",
    gender: "",
    phone: "",
    email: "",
    address: "",
    schoolOrEmployer: "",
    playerPhoto: "",
    emergencyContactName: "",
    emergencyContactRelationship: "",
    emergencyContactPhone: "",
    knownAllergies: "",
    priorMedicalConditions: "",
    currentMedications: "",
    medicalReleaseConsent: false,
    playerSkillLevel: "",
    pastPerformance: "",
    waiversAcknowledged: false,
    mediaConsentAcknowledged: false,
    paymentScreenshot: "",
    transactionId: "",
  });

  // Fetch tournaments from API
  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/tournaments');
        if (!response.ok) {
          throw new Error('Failed to fetch tournaments');
        }
        
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch tournaments');
        }
        
        // Filter only active tournaments that are open for registration
        const activeTournaments = data.tournaments.filter((t: Tournament) => 
          t.status === 'Upcoming' || !t.date // Tournaments without dates are open for registration
        );
        
        // Sort by most recent (newest first)
        const sortedTournaments = activeTournaments.sort((a: Tournament, b: Tournament) => {
          if (a.date && b.date) {
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          }
          // Put tournaments without dates at the end
          if (!a.date && !b.date) return 0;
          if (!a.date) return 1;
          if (!b.date) return -1;
          return 0;
        });
        
        setTournaments(sortedTournaments);
        setError(null);
      } catch (err) {
        console.error('Error fetching tournaments:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch tournaments');
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
    
    // Set up periodic refresh every 30 seconds to catch newly created tournaments
    const refreshInterval = setInterval(fetchTournaments, 30000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  // Update initial tournament and sport when tournaments are loaded
  useEffect(() => {
    if (tournaments.length > 0 && initialTid) {
      const found = tournaments.find(t => t.id === initialTid);
      if (found && found.sport !== initialSport) {
        setSport(found.sport);
      }
    }
  }, [tournaments, initialTid, initialSport]);

  const tournamentsBySport = useMemo(() => {
    return tournaments.filter(t => !sport || t.sport === sport);
  }, [tournaments, sport]);

  const selectedTournament = useMemo(() => tournaments.find(t => t.id === form.tournamentId), [tournaments, form.tournamentId]);

  // Check capacity when tournament changes
  useEffect(() => {
    if (form.tournamentId) {
      checkCapacity(form.tournamentId);
    }
  }, [form.tournamentId]);

  const checkCapacity = async (tournamentId: string) => {
    setCapacityLoading(true);
    try {
      const response = await fetch(`/api/register?tournamentId=${encodeURIComponent(tournamentId)}`);
      const data = await response.json();
      const count = Array.isArray(data?.registrations) ? data.registrations.length : 0;
      setCurrentCapacity(count);
      setIsCapacityFull(count >= 32);
    } catch (error) {
      console.error('Failed to check capacity:', error);
    } finally {
      setCapacityLoading(false);
    }
  };

  function update(name: string, value: any) {
    setForm((f: any) => ({ ...f, [name]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Prevent submission if capacity is full
    if (isCapacityFull) {
      setMessage("Registration is closed. This tournament has reached its maximum capacity of 32 participants.");
      return;
    }

    setSubmitting(true);
    setMessage(null);
    setAssignedRound(null);
    try {
      const payload = { ...form, sport };
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to register");
      setAssignedRound(`${data.registration.assignedRound.label}`);
      setMessage(`Registered successfully! Your assigned round: ${data.registration.assignedRound.label}. Registration ID: ${data.registration.id}`);
      
      // Refresh capacity after successful registration
      if (form.tournamentId) {
        checkCapacity(form.tournamentId);
      }
    } catch (err: any) {
      setMessage(err.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  // Show loading state while fetching tournaments
  if (loading) {
    return (
      <div className="card p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Loading tournaments...</p>
      </div>
    );
  }

  // Show error state if tournaments failed to load
  if (error) {
    return (
      <div className="card p-4 text-center">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Failed to Load Tournaments</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card p-4 grid gap-4">
      {/* Form Header with Refresh Button */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Tournament Registration</h2>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            const fetchTournaments = async () => {
              try {
                const response = await fetch('/api/tournaments');
                if (!response.ok) throw new Error('Failed to fetch tournaments');
                const data = await response.json();
                if (!data.success) throw new Error(data.error || 'Failed to fetch tournaments');
                
                const activeTournaments = data.tournaments.filter((t: Tournament) => 
                  t.status === 'Upcoming' || !t.date // Tournaments without dates are open for registration
                );
                
                const sortedTournaments = activeTournaments.sort((a: Tournament, b: Tournament) => {
                  if (a.date && b.date) {
                    return new Date(b.date).getTime() - new Date(a.date).getTime();
                  }
                  if (!a.date && !b.date) return 0;
                  if (!a.date) return 1;
                  if (!b.date) return -1;
                  return 0;
                });
                
                setTournaments(sortedTournaments);
                setError(null);
              } catch (err) {
                console.error('Error refreshing tournaments:', err);
                setError(err instanceof Error ? err.message : 'Failed to refresh tournaments');
              } finally {
                setLoading(false);
              }
            };
            fetchTournaments();
          }}
          className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Tournaments
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Sport</label>
          <select
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            value={sport}
            onChange={e => {
              const next = e.target.value;
              setSport(next);
              // Clear tournament if it doesn't belong to the selected sport
              const t = tournaments.find(x => x.id === form.tournamentId);
              if (t && t.sport !== next) {
                update("tournamentId", "");
              }
            }}
          >
            <option value="">Select Sport</option>
            {sports.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Tournament</label>
          <select className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={form.tournamentId} onChange={e => update("tournamentId", e.target.value)} required>
            <option value="">Select Tournament</option>
            {tournamentsBySport.map(t => (
              <option key={t.id} value={t.id}>
                {t.name} - {t.venue.city} ({t.id})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Full Name</label>
          <input className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={form.fullName} onChange={e => update("fullName", e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium">Date of Birth</label>
          <input type="date" className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={form.dateOfBirth} onChange={e => update("dateOfBirth", e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium">Gender</label>
          <select className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={form.gender} onChange={e => update("gender", e.target.value)} required>
            <option value="">Select</option>
            <option>Male</option>
            <option>Female</option>
            <option>Prefer not to say</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Phone Number</label>
          <input className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={form.phone} onChange={e => update("phone", e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium">Email Address</label>
          <input type="email" className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={form.email} onChange={e => update("email", e.target.value)} required />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium">Full Residential Address</label>
          <textarea className="mt-1 w-full rounded border border-slate-300 px-3 py-2" rows={3} value={form.address} onChange={e => update("address", e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium">School or Employer</label>
          <input className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={form.schoolOrEmployer} onChange={e => update("schoolOrEmployer", e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium">Player Photograph (filename)</label>
          <input placeholder="e.g., photo.jpg" className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={form.playerPhoto} onChange={e => update("playerPhoto", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium">Emergency Contact Name</label>
          <input className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={form.emergencyContactName} onChange={e => update("emergencyContactName", e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium">Emergency Contact Relationship</label>
          <input className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={form.emergencyContactRelationship} onChange={e => update("emergencyContactRelationship", e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium">Emergency Contact Phone Number</label>
          <input className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={form.emergencyContactPhone} onChange={e => update("emergencyContactPhone", e.target.value)} required />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium">Known Allergies</label>
          <textarea className="mt-1 w-full rounded border border-slate-300 px-3 py-2" rows={2} value={form.knownAllergies} onChange={e => update("knownAllergies", e.target.value)} required />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium">Prior Medical Conditions/Injuries</label>
          <textarea className="mt-1 w-full rounded border border-slate-300 px-3 py-2" rows={2} value={form.priorMedicalConditions} onChange={e => update("priorMedicalConditions", e.target.value)} required />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium">Current Medications</label>
          <textarea className="mt-1 w-full rounded border border-slate-300 px-3 py-2" rows={2} value={form.currentMedications} onChange={e => update("currentMedications", e.target.value)} required />
        </div>
        <div className="sm:col-span-2 flex items-center gap-2">
          <input id="medical" type="checkbox" checked={form.medicalReleaseConsent} onChange={e => update("medicalReleaseConsent", e.target.checked)} required />
          <label htmlFor="medical" className="text-sm">Medical Release Form Consent</label>
        </div>
        <div>
          <label className="block text-sm font-medium">Player Skill Level</label>
          <select className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={form.playerSkillLevel} onChange={e => update("playerSkillLevel", e.target.value)} required>
            <option value="">Select</option>
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
            <option>Professional</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium">Player Past Performance/Achievements (optional)</label>
          <textarea className="mt-1 w-full rounded border border-slate-300 px-3 py-2" rows={3} value={form.pastPerformance} onChange={e => update("pastPerformance", e.target.value)} />
        </div>
        <div className="sm:col-span-2 flex items-center gap-2">
          <input id="waiver" type="checkbox" checked={form.waiversAcknowledged} onChange={e => update("waiversAcknowledged", e.target.checked)} required />
          <label htmlFor="waiver" className="text-sm">Acknowledgment of Waivers & Releases</label>
        </div>
        <div className="sm:col-span-2 flex items-center gap-2">
          <input id="media" type="checkbox" checked={form.mediaConsentAcknowledged} onChange={e => update("mediaConsentAcknowledged", e.target.checked)} required />
          <label htmlFor="media" className="text-sm">Acknowledgment of Media Consent</label>
        </div>
        <div>
          <label className="block text-sm font-medium">Payment Confirmation Screenshot (filename)</label>
          <input placeholder="e.g., payment.png" className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={form.paymentScreenshot} onChange={e => update("paymentScreenshot", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium">Transaction ID</label>
          <input className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={form.transactionId} onChange={e => update("transactionId", e.target.value)} required />
        </div>
      </div>

      {selectedTournament && (
        <div className="rounded border border-slate-200 p-3 text-sm bg-slate-50">
          <div className="font-medium">Selected: {selectedTournament.name} ({selectedTournament.id})</div>
          <div>Sport: {selectedTournament.sport} • Venue: {selectedTournament.venue.name}, {selectedTournament.venue.city}</div>
          <div>Entry Fee: ₹{selectedTournament.entryFee} • Deadline: {selectedTournament.registrationDeadline}</div>
          <div className="mt-2 font-medium">
            Capacity: {capacityLoading ? "Loading..." : `${currentCapacity} / 32 participants`}
            {isCapacityFull && (
              <span className="ml-2 text-red-600">• FULL</span>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <button 
          disabled={submitting || isCapacityFull} 
          className={`rounded px-4 py-2 text-white disabled:opacity-60 ${
            isCapacityFull ? 'bg-red-600 cursor-not-allowed' : 'bg-primary hover:bg-primary-dark'
          }`} 
          type="submit"
        >
          {submitting ? "Submitting..." : isCapacityFull ? "Registration Closed" : "Submit Registration"}
        </button>
        {assignedRound && <span className="badge badge-success">Assigned: {assignedRound}</span>}
      </div>

      {message && (
        <div className={`text-sm ${assignedRound ? 'text-green-700' : 'text-red-700'}`}>{message}</div>
      )}

      {isCapacityFull && (
        <div className="rounded bg-red-50 border border-red-200 text-red-700 px-4 py-3 font-medium">
          Registration is closed. This tournament has reached its maximum capacity of 32 participants.
        </div>
      )}
    </form>
  );
}
