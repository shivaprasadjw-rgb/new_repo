"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Tournament } from "@/lib/types";

export default function FeaturedTournaments({ tournaments }: { tournaments: Tournament[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get upcoming tournaments and sort by date
  const upcomingTournaments = tournaments
    .filter(t => t.status === "Upcoming" && t.date) // Only include tournaments with dates
    .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime())
    .slice(0, 3);

  if (upcomingTournaments.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No upcoming tournaments at the moment. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {upcomingTournaments.map((tournament) => (
        <div key={tournament.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                {tournament.status}
              </span>
              <span className="text-sm text-gray-500">{tournament.sport}</span>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{tournament.name}</h3>
            
            <div className="text-sm text-gray-600 mb-4 space-y-1">
              <p>📍 {tournament.venue.city}, {tournament.venue.state}</p>
              <p>📅 {mounted ? new Date(tournament.date!).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }) : tournament.date}</p>
              <p>💰 Entry Fee: ₹{tournament.entryFee}</p>
              <p>👥 Max Participants: {tournament.maxParticipants}</p>
            </div>
            
            <Link
              href={`/tournament/${tournament.id}`}
              className="block w-full text-center bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark transition-colors"
            >
              View Details
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
