"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Tournament } from "@/lib/types";

export default function TournamentCard({ tournament }: { tournament: Tournament }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Upcoming': return 'bg-green-100 text-green-800';
      case 'Ongoing': return 'bg-yellow-100 text-yellow-800';
      case 'Completed': return 'bg-gray-100 text-gray-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    if (!mounted) return dateString;
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(tournament.status)}`}>
            {tournament.date ? tournament.status : "Open for Registration"}
          </span>
          <span className="text-sm text-gray-500">{tournament.sport}</span>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{tournament.name}</h3>
        
        <div className="text-sm text-gray-600 mb-4 space-y-1">
          <p>📍 {tournament.venue.city}, {tournament.venue.state}</p>
          <p>📅 {tournament.date ? formatDate(tournament.date) : "Date will be announced upon completion of registration."}</p>
          <p>💰 Entry Fee: ₹{tournament.entryFee}</p>
          <p>👥 Max Participants: {tournament.maxParticipants}</p>
          {tournament.registrationDeadline && (
            <p>⏰ Registration Deadline: {formatDate(tournament.registrationDeadline)}</p>
          )}
        </div>
        
        <Link
          href={`/tournament/${tournament.id}`}
          className="block w-full text-center bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark transition-colors"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
