"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { googleMapsLink } from "@/lib/utils";
import { getDisplayRegistrationDeadline, getDeadlineCountdown } from "@/lib/clientUtils";
import TournamentCapacity from "@/components/TournamentCapacity";
import TournamentScheduleTable from "@/components/TournamentScheduleTable";
import ShareButtons from "@/components/ShareButtons";
import type { Tournament } from "@/lib/types";

export default function TournamentPage({ params }: { params: { tid: string } }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateLabel, setDateLabel] = useState("");
  const [registrationDeadlineLabel, setRegistrationDeadlineLabel] = useState("");
  const [relatedTournaments, setRelatedTournaments] = useState<Array<{ id: string; name: string; date?: string; formattedDate: string }>>([]);
  const [currentCapacity, setCurrentCapacity] = useState(0);
  const [isCapacityFull, setIsCapacityFull] = useState(false);

  // Fetch tournament data from API
  useEffect(() => {
    const fetchTournament = async () => {
      try {
        setLoading(true);
        console.log('Fetching tournament with ID:', params.tid);
        
        const response = await fetch(`/api/tournaments`);
        if (!response.ok) {
          throw new Error('Failed to fetch tournaments');
        }
        
        const data = await response.json();
        console.log('API response:', data);
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch tournaments');
        }
        
        const foundTournament = data.tournaments.find((t: Tournament) => {
          const match = t.id.toUpperCase() === params.tid.toUpperCase();
          console.log(`Comparing ${t.id} with ${params.tid}: ${match}`);
          return match;
        });
        
        console.log('Found tournament:', foundTournament);
        
        if (!foundTournament) {
          // Fallback: try to find in static data
          console.log('Tournament not found in API, trying static data...');
          const { tournaments: staticTournaments } = await import('@/lib/data');
          const staticTournament = staticTournaments.find(t => 
            t.id.toUpperCase() === params.tid.toUpperCase()
          );
          
          if (staticTournament) {
            console.log('Found tournament in static data:', staticTournament);
            setTournament(staticTournament);
            
            // Set related tournaments from static data
            const related = staticTournaments
              .filter(t => 
                (t.venue.city === staticTournament.venue.city || t.sport === staticTournament.sport) && 
                t.id !== staticTournament.id
              )
              .slice(0, 4)
              .map(t => ({
                ...t,
                formattedDate: t.date ? format(new Date(t.date), 'd MMMM, yyyy') : 'Date TBD'
              }));
            setRelatedTournaments(related);
            setLoading(false);
            return;
          }
          
          setError('Tournament not found');
          setLoading(false);
          return;
        }
        
        setTournament(foundTournament);
        
        // Set related tournaments
        const related = data.tournaments
          .filter((t: Tournament) => 
            (t.venue.city === foundTournament.venue.city || t.sport === foundTournament.sport) && 
            t.id !== foundTournament.id
          )
          .slice(0, 4)
          .map((t: Tournament) => ({
            ...t,
            formattedDate: t.date ? format(new Date(t.date), 'd MMMM, yyyy') : 'Date TBD'
          }));
        setRelatedTournaments(related);
        
        // Automatically check and update tournament completion status (Feature #44)
        if (foundTournament.schedule.length > 0) {
          try {
            // Only check completion if user is admin (has session)
            const sessionId = localStorage.getItem('adminSessionId');
            if (sessionId) {
              await fetch(`/api/admin/tournaments/${foundTournament.id}/status`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-session-id': sessionId
                },
                body: JSON.stringify({ action: 'checkCompletion' })
              });
            }
          } catch (error) {
            console.error('Error auto-checking tournament completion:', error);
          }
        }
        
      } catch (err) {
        console.error('Error fetching tournament:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch tournament');
      } finally {
        setLoading(false);
      }
    };

    fetchTournament();
  }, [params.tid]);

  // Real-time polling to sync with admin changes
  useEffect(() => {
    if (!tournament) return;
    
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/tournaments`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const updatedTournament = data.tournaments.find((t: Tournament) => 
              t.id.toUpperCase() === params.tid.toUpperCase()
            );
            
            if (updatedTournament) {
              // Check if schedule has changed (participants deleted)
              const scheduleChanged = JSON.stringify(updatedTournament.schedule) !== JSON.stringify(tournament.schedule);
              const capacityChanged = updatedTournament.schedule.length !== tournament.schedule.length;
              
              if (scheduleChanged || capacityChanged) {
                console.log('Tournament data updated, refreshing...', {
                  oldScheduleLength: tournament.schedule.length,
                  newScheduleLength: updatedTournament.schedule.length,
                  scheduleChanged,
                  capacityChanged,
                  oldSchedule: tournament.schedule,
                  newSchedule: updatedTournament.schedule
                });
                setTournament(updatedTournament);
                
                // Update related tournaments
                const related = data.tournaments
                  .filter((t: Tournament) => 
                    (t.venue.city === updatedTournament.venue.city || t.sport === updatedTournament.sport) && 
                    t.id !== updatedTournament.id
                  )
                  .slice(0, 4)
                  .map((t: Tournament) => ({
                    ...t,
                    formattedDate: t.date ? format(new Date(t.date), 'd MMMM, yyyy') : 'Date TBD'
                  }));
                setRelatedTournaments(related);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error during polling:', error);
      }
    }, 1000); // Poll every 1 second for faster updates

    return () => clearInterval(pollInterval);
  }, [tournament, params.tid]);

  useEffect(() => {
    setMounted(true);
    if (tournament?.date) {
      setDateLabel(format(new Date(tournament.date), "d MMMM, yyyy"));
    }
    if (tournament) {
      // Use dynamic deadline calculation (Feature #43)
      const displayDeadline = getDisplayRegistrationDeadline(tournament);
      if (displayDeadline && displayDeadline !== "TBD") {
        setRegistrationDeadlineLabel(format(new Date(displayDeadline), 'd MMM, yyyy'));
      } else {
        setRegistrationDeadlineLabel("TBD");
      }
    }
  }, [tournament]);

  useEffect(() => {
    if (mounted && tournament) {
      checkCapacity();
    }
  }, [mounted, tournament]);

  const checkCapacity = async () => {
    if (!tournament) return;
    
    try {
      const response = await fetch(`/api/register?tournamentId=${encodeURIComponent(tournament.id)}`);
      const data = await response.json();
      const count = Array.isArray(data?.registrations) ? data.registrations.length : 0;
      setCurrentCapacity(count);
      setIsCapacityFull(count >= 32);
    } catch (error) {
      console.error('Failed to check capacity:', error);
    }
  };

  // Handle redirect fallback for missing tournaments
  useEffect(() => {
    if (error && !loading) {
      // Redirect to tournaments page with warning message
      router.push('/tournaments?warning=Tournament not found. Please try again later.');
    }
  }, [error, loading, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tournament details...</p>
        </div>
      </div>
    );
  }

  // Show error state (will redirect)
  if (error || !tournament) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Tournament Not Found</h2>
          <p className="text-gray-600 mb-4">Redirecting you to the tournaments page...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  const maps = googleMapsLink(tournament.venue);

  const handleCheckCompletion = async () => {
    try {
      const sessionId = localStorage.getItem('adminSessionId');
      if (!sessionId) {
        alert('Admin access required');
        return;
      }

      const response = await fetch(`/api/admin/tournaments/${tournament?.id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId
        },
        body: JSON.stringify({ action: 'checkCompletion' })
      });

      if (response.ok) {
        alert('Tournament completion status checked and updated');
        // Refresh tournament data
        window.location.reload();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to check completion status');
      }
    } catch (error: any) {
      console.error('Error checking completion:', error);
      alert('Failed to check completion status');
    }
  };

  return (
    <div className="grid gap-8">
      {/* Tournament Header */}
      <section className="card p-4 grid gap-1">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">{tournament.name}</h1>
            <p className="text-xs uppercase tracking-wide text-slate-500">{tournament.sport}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                try {
                  const response = await fetch(`/api/tournaments`);
                  if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                      const updatedTournament = data.tournaments.find((t: Tournament) => 
                        t.id.toUpperCase() === params.tid.toUpperCase()
                      );
                      if (updatedTournament) {
                        setTournament(updatedTournament);
                        console.log('Tournament data manually refreshed');
                      }
                    }
                  }
                } catch (error) {
                  console.error('Error refreshing tournament:', error);
                }
              }}
              className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              title="Refresh tournament data"
            >
              🔄 Refresh
            </button>
            {/* Admin-only: Check Tournament Completion Status */}
            {tournament.schedule.length > 0 && (
              <button
                onClick={handleCheckCompletion}
                className="px-3 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                title="Check and update tournament completion status"
              >
                🏆 Check Completion
              </button>
            )}
            <span className={`badge ${tournament.status === 'Upcoming' ? 'badge-success' : tournament.status === 'Ongoing' ? 'badge-warning' : tournament.status === 'Completed' ? 'badge-gray' : 'badge-danger'}`}>{tournament.status}</span>
          </div>
        </div>
        <p className="text-sm text-slate-600">Tournament ID: {tournament.id}</p>
        <p className="text-sm">
          Date: {tournament.date ? (mounted ? dateLabel : tournament.date) : "Date will be announced upon completion of registration."}
        </p>
      </section>

      {/* Venue & Location */}
      <section className="card p-4 grid gap-2">
        <h2 className="font-semibold">Venue & Location</h2>
        <div className="grid sm:grid-cols-2 gap-2 text-sm">
          <p><span className="font-medium">Venue:</span> {tournament.venue.name}</p>
          <p><span className="font-medium">Location:</span> {tournament.venue.locality}, {tournament.venue.city}, {tournament.venue.state}</p>
          <p><span className="font-medium">Pincode:</span> {tournament.venue.pincode}</p>
          <p><a className="text-primary hover:underline" target="_blank" rel="noopener noreferrer" href={maps}>Google Maps</a></p>
        </div>
      </section>

      {/* Tournament Details */}
      <section className="card p-4 grid gap-2">
        <h2 className="font-semibold">Tournament Details</h2>
        <div className="grid sm:grid-cols-2 gap-2 text-sm">
          <p><span className="font-medium">Sport:</span> {tournament.sport}</p>
          <p><span className="font-medium">Format:</span> {tournament.format}</p>
          <p><span className="font-medium">Category:</span> {tournament.category}</p>
          <p><span className="font-medium">Entry Fee:</span> ₹{tournament.entryFee}</p>
          <p className="flex items-center gap-2">
            <span className="font-medium">Registration Deadline:</span> 
            {tournament.date ? (
              <>
                {mounted ? registrationDeadlineLabel : getDisplayRegistrationDeadline(tournament)} 
                <span className="text-sm text-gray-600">
                  ({getDeadlineCountdown(getDisplayRegistrationDeadline(tournament))})
                </span>
              </>
            ) : (
              "Date TBD - Deadline will be set when tournament date is confirmed"
            )}
          </p>
          <p><span className="font-medium">Maximum Participants:</span> 32</p>
          <p><span className="font-medium">Organizer:</span> {tournament.organizer.name} ({tournament.organizer.phone}, {tournament.organizer.email})</p>
        </div>
        <div className="mt-3">
          <TournamentCapacity tournamentId={tournament.id} tournamentStatus={tournament.status} maxSlots={32} />
        </div>
      </section>

      {/* Match Schedule */}
      <section className="card p-4 grid gap-3">
        <h2 className="font-semibold">Schedule</h2>
        {tournament.scheduleNote && (
          <p className="text-sm text-slate-600">{tournament.scheduleNote}</p>
        )}
        
        {/* Debug Info */}
        <div className="p-2 bg-gray-100 rounded text-xs text-gray-600">
          <strong>Debug:</strong> Schedule length: {tournament.schedule.length} | 
          Last updated: {new Date().toLocaleTimeString()}
        </div>
        
        {tournament.schedule.length === 0 ? (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
            <div className="text-blue-600 text-lg mb-2">📋</div>
            <p className="text-blue-800 font-medium">No participants registered yet</p>
            <p className="text-blue-600 text-sm mt-1">The tournament schedule will appear here once participants register.</p>
          </div>
        ) : (
          <TournamentScheduleTable schedule={tournament.schedule} tournamentId={tournament.id} tournamentStatus={tournament.status} />
        )}
      </section>

      {/* Prizes & Awards */}
      <section className="card p-4 grid gap-2">
        <h2 className="font-semibold">Prizes & Awards</h2>
        <ul className="list-disc pl-5 text-sm">
          {(tournament.prizes ?? ["Winner Trophy", "Runner-up Trophy"]).map((p, i) => <li key={i}>{p}</li>)}
        </ul>
      </section>

      {/* Registration */}
      <section id="register" className="card p-4 grid gap-3">
        <h2 className="font-semibold">Registration</h2>
        <div className="text-sm text-gray-600 mb-3">
          Use the capacity information above to check registration status. The "Open for Booking" or "Closed for Registration" badge indicates current availability.
        </div>
        {!isCapacityFull && (
          <div className="flex flex-wrap items-center gap-3">
            <a href={`/register?tid=${tournament.id}`} className="rounded bg-primary px-4 py-2 text-white hover:bg-primary-dark">
              Register Now
            </a>
            <ShareButtons url={`https://example.com/tournament/${tournament.id}`} title={tournament.name} />
          </div>
        )}
      </section>

      {/* Additional Information */}
      <section className="card p-4 grid gap-2">
        <h2 className="font-semibold">Additional Information</h2>
        <div className="grid sm:grid-cols-2 gap-2 text-sm">
          <div>
            <h3 className="font-medium">Rules & Regulations</h3>
            <p className="text-slate-700">Tournament rules vary by sport; see event description or contact organizer for details.</p>
          </div>
          <div>
            <h3 className="font-medium">Cancellation / Refund Policy</h3>
            <p className="text-slate-700">Refunds permitted up to 48 hours before registration deadline.</p>
          </div>
        </div>
      </section>

      {/* Related Tournaments */}
      <section className="card p-4 grid gap-2">
        <h2 className="font-semibold">Related Tournaments</h2>
        <ul className="list-disc pl-5 text-sm">
          {relatedTournaments.map(t => (
            <li key={t.id}>
              <a className="text-primary hover:underline" href={`/tournament/${t.id}`}>{t.name} — {mounted ? t.formattedDate : t.date}</a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
