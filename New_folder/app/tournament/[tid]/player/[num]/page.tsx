import { notFound } from "next/navigation";
import { tournaments, playerProfilesByTournament } from "@/lib/data";
import type { PlayerProfile } from "@/lib/types";

export default function PlayerProfilePage({ params }: { params: { tid: string; num: string } }) {
  const tournament = tournaments.find(t => t.id.toUpperCase() === params.tid.toUpperCase());
  if (!tournament) return notFound();
  const profilesMap = (playerProfilesByTournament as Record<string, PlayerProfile[]> | undefined) ?? {};
  const profiles = profilesMap[tournament.id] ?? [];
  const number = parseInt(params.num, 10);
  const profile = profiles.find(p => p.number === number);

  return (
    <div className="grid gap-6 max-w-xl">
      <h1 className="text-xl font-semibold">Player Profile — #{number}</h1>
      {profile ? (
        <div className="card p-4 grid gap-2 text-sm">
          <div><span className="font-medium">Full Name:</span> {profile.fullName}</div>
          <div><span className="font-medium">Gender:</span> {profile.gender}</div>
          <div><span className="font-medium">School/Employer:</span> {profile.schoolOrEmployer}</div>
          <div><span className="font-medium">Skill Level:</span> {profile.playerSkillLevel}</div>
        </div>
      ) : (
        <div className="card p-4 text-sm text-slate-700">Profile data not found for this player.</div>
      )}
      <a href={`/tournament/${tournament.id}`} className="text-primary hover:underline text-sm">← Back to Tournament</a>
    </div>
  );
}
