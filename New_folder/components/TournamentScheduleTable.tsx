"use client";

import { format } from "date-fns";
import type { MatchSlot, PlayerProfile } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";
import { playerProfilesByTournament } from "@/lib/data";
import PlayerModal from "@/components/PlayerModal";

type Props = { schedule: MatchSlot[]; tournamentId: string; tournamentStatus: string };

export default function TournamentScheduleTable({ schedule, tournamentId, tournamentStatus }: Props) {
  const [open, setOpen] = useState(false);
  const [playerNum, setPlayerNum] = useState<number | null>(null);
  const profilesMap = (playerProfilesByTournament ?? {}) as Record<string, { number: number }[]>;
  const profiles = profilesMap[tournamentId] ?? [];
  const [participantCount, setParticipantCount] = useState(0);
  const [selectedProfile, setSelectedProfile] = useState<PlayerProfile | null>(null);

  // Map Player N -> Registered name by polling participants API
  const [nameMap, setNameMap] = useState<Record<number, string>>({});
  const [participantsMap, setParticipantsMap] = useState<Record<number, PlayerProfile>>({});

  // Poll participants to decide winner visibility
  useEffect(() => {
    let canceled = false;
    async function load() {
      try {
        const res = await fetch(`/api/register?tournamentId=${encodeURIComponent(tournamentId)}`, { cache: 'no-store' });
        const data = await res.json();
        if (!canceled) setParticipantCount(Array.isArray(data?.registrations) ? data.registrations.length : 0);
      } catch {}
    }
    load();
    const id = setInterval(load, 5000);
    return () => { canceled = true; clearInterval(id); };
  }, [tournamentId]);

  // Fetch participant data to map slot numbers to real names
  useEffect(() => {
    let canceled = false;
    async function loadNames() {
      try {
        const res = await fetch(`/api/tournaments/${encodeURIComponent(tournamentId)}/participants`, { cache: 'no-store' });
        const list = await res.json();
        const nm: Record<number, string> = {};
        const pm: Record<number, PlayerProfile> = {};
        
        for (const p of (Array.isArray(list) ? list : [])) {
          if (typeof p?.slot === 'number') {
            const slotNum = p.slot as number;
            if (p?.player?.full_name) {
              nm[slotNum] = p.player.full_name as string;
              pm[slotNum] = {
                number: slotNum,
                fullName: p.player.full_name as string,
                gender: p.player.gender ?? "",
                schoolOrEmployer: p.player.school_or_employer ?? "",
                playerSkillLevel: p.player.skill_level ?? "",
              };
            }
          }
        }
        
        if (!canceled) {
          setNameMap(nm);
          setParticipantsMap(pm);
        }
      } catch {}
    }
    
    loadNames();
    const id = setInterval(loadNames, 5000);
    return () => { canceled = true; clearInterval(id); };
  }, [tournamentId]);

  const profile = useMemo(() => {
    if (selectedProfile) return selectedProfile;
    return null;
  }, [selectedProfile]);

  // Sort schedule by Match # field in ascending order
  const sortedSchedule = useMemo(() => {
    return [...schedule].sort((a, b) => {
      // Extract match numbers from codes like "M1", "M2", "M25", etc.
      const aMatch = a.code.match(/M\s*(\d+)/i);
      const bMatch = b.code.match(/M\s*(\d+)/i);
      
      if (aMatch && bMatch) {
        const aNum = parseInt(aMatch[1], 10);
        const bNum = parseInt(bMatch[1], 10);
        return aNum - bNum; // Sort in ascending order
      }
      
      // Fallback to string comparison if no match numbers found
      return a.code.localeCompare(b.code);
    });
  }, [schedule]);

  // Build a map of match number -> players text (e.g., 1 => "Player 1 vs Player 32", 17 => "W1 vs W2")
  const matchPlayersByNumber = new Map<number, string>();
  for (const m of schedule) {
    const numMatch = m.code.match(/M\s*(\d+)/i);
    if (numMatch) {
      const n = parseInt(numMatch[1], 10);
      matchPlayersByNumber.set(n, m.players);
    }
  }

  // Function to resolve placeholder winners (W1, W2, etc.) to meaningful descriptions
  function resolvePlaceholderWinner(placeholder: string): string {
    const match = placeholder.match(/^W(\d+)/i);
    if (match) {
      const matchNum = parseInt(match[1], 10);
      const matchData = schedule.find(m => {
        const numMatch = m.code.match(/M\s*(\d+)/i);
        return numMatch && parseInt(numMatch[1], 10) === matchNum;
      });
      
      if (matchData) {
        if (matchData.isCompleted && matchData.winner) {
          return matchData.winner; // Show actual winner if match is completed
        } else if (matchData.players && !matchData.players.includes('W')) {
          return `Winner of ${matchData.code}`; // Show meaningful description
        } else {
          return `Winner of ${matchData.code}`; // Show match code for placeholder matches
        }
      }
      return `Winner of Match ${matchNum}`;
    }
    return placeholder;
  }

  function renderPlayersCellForMatch(m: MatchSlot) {
    // Use the actual players data from the database
    if (m.players) {
      // Check if this contains placeholder winners (W1, W2, etc.)
      if (m.players.includes('W') && !m.players.includes(' vs ')) {
        // Handle single placeholder (e.g., "W1")
        return (
          <span className="text-gray-600 italic">
            {resolvePlaceholderWinner(m.players)}
          </span>
        );
      }
      
      const [left, right] = m.players.split(/\s+vs\s+/i).map(s => s.trim());
      
      // If both sides are placeholders, resolve them
      if (left?.startsWith('W') && right?.startsWith('W')) {
        return (
          <div className="flex flex-col leading-tight text-gray-600">
            <span className="italic">{resolvePlaceholderWinner(left)}</span>
            <span className="text-xs text-slate-500">vs</span>
            <span className="italic">{resolvePlaceholderWinner(right)}</span>
          </div>
        );
      }
      
      const renderName = (label: string, key: string) => {
        // Check if this is a real player name (not a placeholder)
        const rev = Object.entries(nameMap).find(([, v]) => v === label);
        if (rev) {
          const num = parseInt(rev[0], 10);
          return (
            <button
              key={key}
              type="button"
              className="text-primary underline decoration-dotted underline-offset-2"
              onClick={() => { 
                setPlayerNum(num); 
                setSelectedProfile(participantsMap[num] ?? null); 
                setOpen(true); 
              }}
            >
              {label}
            </button>
          );
        }
        
        // If it's a placeholder, resolve it
        if (label.startsWith('W')) {
          return <span key={key} className="text-gray-600 italic">{resolvePlaceholderWinner(label)}</span>;
        }
        
        return <span key={key}>{label}</span>;
      };

      return (
        <div className="flex flex-col leading-tight">
          {renderName(left, "l")}
          <span className="text-xs text-slate-500">vs</span>
          {renderName(right, "r")}
        </div>
      );
    }
    
    // Fallback if no players data
    return <span className="text-gray-400">No players data</span>;
  }

  function renderWinnerCell(m: MatchSlot) {
    // Show winner if the match has been completed and has a winner
    if (m.isCompleted && m.winner) {
      return (
        <span className="text-green-600 font-medium">
          {m.winner}
        </span>
      );
    }
    
    // For matches that are not completed, show appropriate status
    if (m.players && m.players.includes('W')) {
      // This is a placeholder match (e.g., W1 vs W2)
      return (
        <span className="text-gray-500 italic text-sm">
          Waiting for previous round
        </span>
      );
    }
    
    // For regular matches that are not completed
    return <span className="text-gray-400">Not decided</span>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="table min-w-[900px]">
        <thead>
          <tr>
            <th>Date</th>
            <th>Match #</th>
            <th>Time (Start–End)</th>
            <th>Round</th>
            <th>Players</th>
            <th>Winner</th>
          </tr>
        </thead>
        <tbody>
          {sortedSchedule.map((m) => (
            <tr key={m.code}>
              <td className="whitespace-nowrap">{m.date}</td>
              <td className="whitespace-nowrap">{m.code}</td>
              <td className="whitespace-nowrap">{m.start} – {m.end}</td>
              <td>{m.round}</td>
              <td>{renderPlayersCellForMatch(m)}</td>
              <td>{renderWinnerCell(m)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <PlayerModal open={open} onClose={() => setOpen(false)} profile={profile} />
    </div>
  );
}
