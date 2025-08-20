"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import type { Tournament } from "@/lib/types";
import Link from "next/link";

export default function CalendarList({ tournaments }: { tournaments: Tournament[] }) {
  const [mounted, setMounted] = useState(false);
  const [byDate, setByDate] = useState<Map<string, Tournament[]>>(new Map());

  useEffect(() => {
    setMounted(true);
    const dateMap = new Map<string, Tournament[]>();
    tournaments
      .slice()
      .filter(t => t.date) // Only include tournaments with dates
      .sort((a, b) => +new Date(a.date!) - +new Date(b.date!))
      .forEach(t => {
        const key = format(new Date(t.date!), "yyyy-MM-dd");
        const list = dateMap.get(key) || [];
        list.push(t);
        dateMap.set(key, list);
      });
    setByDate(dateMap);
  }, [tournaments]);

  if (!mounted) {
    return (
      <div className="grid gap-6">
        {tournaments.map(t => (
          <div key={t.id} className="card p-4">
            <div className="font-medium">{t.name}</div>
            <div className="text-xs text-slate-600">{t.venue.name}, {t.venue.city}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {Array.from(byDate.entries()).map(([key, list]) => (
        <section key={key} className="card">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold">{format(parseISO(key), "EEEE, d MMMM yyyy")}</div>
          <div className="p-4 grid gap-3">
            {list.map(t => (
              <div key={t.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t.name}</p>
                  <p className="text-xs text-slate-600">{t.venue.name}, {t.venue.city}</p>
                </div>
                <Link className="text-sm text-primary hover:underline" href={`/tournament/${t.id}`}>Details</Link>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
