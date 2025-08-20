import { Suspense } from "react";
import { readAllTournaments } from "@/lib/tournamentStorage";
import TournamentsClient from "@/components/TournamentsClient";

export const revalidate = 300; // ISR every 5 minutes

export default function TournamentsPage() {
  const initial = readAllTournaments();
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 py-8"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div><p className="mt-4 text-gray-600">Loading tournaments...</p></div></div></div>}>
      <TournamentsClient initial={initial} />
    </Suspense>
  );
}


