"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import LocationWizard from "@/components/LocationWizard";
import TournamentCard from "@/components/TournamentCard";
import type { Tournament } from "@/lib/types";

export default function TournamentsClient({ initial }: { initial: Tournament[] }) {
  const [tournaments] = useState<Tournament[]>(initial);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const selectedState = searchParams.get("state") || "";
  const selectedCity = searchParams.get("city") || "";
  const selectedSport = searchParams.get("sport") || "";

  useEffect(() => {
    const warning = searchParams.get("warning");
    if (warning) {
      setWarningMessage(decodeURIComponent(warning));
      const url = new URL(window.location.href);
      url.searchParams.delete("warning");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  const filteredTournaments = tournaments.filter(tournament => {
    if (selectedState && tournament.venue.state !== selectedState) return false;
    if (selectedCity && tournament.venue.city !== selectedCity) return false;
    if (selectedSport && tournament.sport !== selectedSport) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Tournaments</h1>
            <p className="text-lg text-gray-600">Find and join tournaments across India</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {warningMessage && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Notice</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>{warningMessage}</p>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    className="bg-yellow-50 px-2 py-1.5 rounded-md text-sm font-medium text-yellow-800 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:ring-yellow-600"
                    onClick={() => setWarningMessage(null)}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <LocationWizard />

        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              {filteredTournaments.length} Tournament{filteredTournaments.length !== 1 ? 's' : ''} Found
            </h2>
            {(selectedState || selectedCity || selectedSport) ? (
              <Link href="/tournaments" className="text-primary hover:text-primary-dark">
                Clear Filters
              </Link>
            ) : null}
          </div>

          {filteredTournaments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-4">No tournaments found</div>
              <p className="text-gray-400">
                {(selectedState || selectedCity || selectedSport)
                  ? "Try adjusting your filters or check back later for new tournaments."
                  : "Check back later for upcoming tournaments."}
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Tournament Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {filteredTournaments.filter(t => t.status === "Upcoming").length}
                    </div>
                    <div className="text-sm text-green-700">Upcoming</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {filteredTournaments.filter(t => t.status === "Completed").length}
                    </div>
                    <div className="text-sm text-gray-700">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {filteredTournaments.filter(t => t.status !== "Upcoming" && t.status !== "Completed").length}
                    </div>
                    <div className="text-sm text-blue-700">Other</div>
                  </div>
                </div>
              </div>

              {(() => {
                const upcomingTournaments = filteredTournaments.filter(t => t.status === "Upcoming");
                if (upcomingTournaments.length > 0) {
                  return (
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                      <div className="flex items-center mb-6">
                        <div className="w-3 h-8 bg-green-500 rounded-l-full mr-4"></div>
                        <h3 className="text-xl font-semibold text-gray-900">Upcoming Tournaments</h3>
                        <span className="ml-3 px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                          {upcomingTournaments.length}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {upcomingTournaments.map((tournament) => (
                          <TournamentCard key={tournament.id} tournament={tournament} />
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {(() => {
                const completedTournaments = filteredTournaments.filter(t => t.status === "Completed");
                if (completedTournaments.length > 0) {
                  return (
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                      <div className="flex items-center mb-6">
                        <div className="w-3 h-8 bg-gray-500 rounded-l-full mr-4"></div>
                        <h3 className="text-xl font-semibold text-gray-900">Completed Tournaments</h3>
                        <span className="ml-3 px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-full">
                          {completedTournaments.length}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {completedTournaments.map((tournament) => (
                          <TournamentCard key={tournament.id} tournament={tournament} />
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {(() => {
                const otherTournaments = filteredTournaments.filter(t => t.status !== "Upcoming" && t.status !== "Completed");
                if (otherTournaments.length > 0) {
                  return (
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                      <div className="flex items-center mb-6">
                        <div className="w-3 h-8 bg-blue-500 rounded-l-full mr-4"></div>
                        <h3 className="text-xl font-semibold text-gray-900">Other Tournaments</h3>
                        <span className="ml-3 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                          {otherTournaments.length}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {otherTournaments.map((tournament) => (
                          <TournamentCard key={tournament.id} tournament={tournament} />
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


