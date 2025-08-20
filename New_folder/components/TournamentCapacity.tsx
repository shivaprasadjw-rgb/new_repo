"use client";

import { useEffect, useState } from "react";

import { upcomingWeekendAtLeastOneWeekOut, endOfDay } from "@/lib/utils";

type Props = { tournamentId: string; tournamentStatus?: string; maxSlots?: number };

export default function TournamentCapacity({ tournamentId, tournamentStatus = "Upcoming", maxSlots = 32 }: Props) {
  const [count, setCount] = useState(0);
  const [deadline, setDeadline] = useState<{ saturday: string; sunday: string } | null>(null);
  const [closed, setClosed] = useState(false);

  async function load() {
    try {
      const res = await fetch(`/api/register?tournamentId=${encodeURIComponent(tournamentId)}`, { cache: "no-store" });
      const data = await res.json();
      const c = Array.isArray(data?.registrations) ? data.registrations.length : 0;
      setCount(c);
      // Compute dynamic deadlines when full
      if (c >= maxSlots) {
        const now = new Date();
        const wknd = upcomingWeekendAtLeastOneWeekOut(now);
        setDeadline({ saturday: wknd.saturday.toISOString(), sunday: wknd.sunday.toISOString() });
        // Close once Sunday has passed
        const nowMs = now.getTime();
        const closeMs = endOfDay(wknd.sunday).getTime();
        setClosed(nowMs > closeMs);
      } else {
        setDeadline(null);
        setClosed(false);
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [tournamentId]);

  const openSlots = Math.max(0, maxSlots - count);
  const isCapacityFull = openSlots === 0;
  // When capacity is full, registration should be closed regardless of other conditions
  const isClosedForRegistration = isCapacityFull || closed || tournamentStatus === "Completed";

  return (
    <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium">Participants Registered: {count}</div>
          <div>Open Slots: {openSlots} / {maxSlots}</div>
        </div>
        <span className={`badge ${isClosedForRegistration ? 'badge-danger' : 'badge-success'}`}>
          {isClosedForRegistration ? 'Closed for Registration' : 'Open for Booking'}
        </span>
      </div>
      
      {/* Show the exact message when capacity is reached */}
      {isCapacityFull && (
        <div className="mt-2 rounded bg-red-50 border border-red-200 text-red-700 px-3 py-2 font-medium">
          Booking for this tournament is closed. Maximum of {maxSlots} participants reached.
        </div>
      )}
      
      {deadline && (
        <div className="mt-2 rounded bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2">
          <div className="font-medium">Registration Deadline</div>
          <div>Saturday: {deadline.saturday.split('T')[0]} • Sunday: {deadline.sunday.split('T')[0]}</div>
        </div>
      )}
    </div>
  );
}
