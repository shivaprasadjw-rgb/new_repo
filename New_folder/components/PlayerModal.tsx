"use client";

import type { PlayerProfile } from "@/lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
  profile?: PlayerProfile | null;
};

export default function PlayerModal({ open, onClose, profile }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white shadow-xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h3 className="text-base font-semibold">Player Profile {profile ? `— #${profile.number}` : ''}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100" aria-label="Close">✕</button>
        </div>
        {profile && profile.fullName && profile.gender && profile.schoolOrEmployer && profile.playerSkillLevel ? (
          <div className="p-4 text-sm grid gap-2">
            <div><span className="font-medium">Full Name:</span> {profile.fullName}</div>
            <div><span className="font-medium">Gender:</span> {profile.gender}</div>
            <div><span className="font-medium">School/Employer:</span> {profile.schoolOrEmployer}</div>
            <div><span className="font-medium">Skill Level:</span> {profile.playerSkillLevel}</div>
          </div>
        ) : (
          <div className="p-4 text-sm text-slate-700">
            Player information is not available at the moment.
          </div>
        )}
        <div className="border-t border-slate-200 px-4 py-3 flex justify-end">
          <button onClick={onClose} className="rounded bg-primary px-4 py-2 text-white">Close</button>
        </div>
      </div>
    </div>
  );
}
