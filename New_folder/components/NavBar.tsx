"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if user is admin
    const adminStatus = localStorage.getItem("adminAuthenticated");
    setIsAdmin(!!adminStatus);
  }, []);

  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
      <div className="container-responsive flex items-center justify-between py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
          <span className="inline-block h-8 w-8 rounded bg-primary" />
          <span>Sports India</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/" className="hover:text-primary">Home</Link>
          <Link href="/tournaments" className="hover:text-primary">Tournaments</Link>
          <Link href="/schedule" className="hover:text-primary">Schedule</Link>
          <Link href="/results" className="hover:text-primary">Results</Link>
          <Link href="/about" className="hover:text-primary">About</Link>
          <Link href="/contact" className="hover:text-primary">Contact</Link>
          <Link href="/register" className="rounded bg-primary px-3 py-1.5 text-white">Register</Link>
          <Link href="/test-capacity" className="text-orange-600 hover:text-orange-700 font-medium">Test Capacity</Link>
          {isAdmin && (
            <Link href="/admin/dashboard" className="text-orange-600 hover:text-orange-700 font-medium">Admin</Link>
          )}
        </nav>
        <button aria-label="Menu" className="md:hidden p-2 rounded border border-slate-200" onClick={() => setOpen(v => !v)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="container-responsive grid gap-2 py-2 text-sm">
            <Link href="/" onClick={() => setOpen(false)}>Home</Link>
            <Link href="/tournaments" onClick={() => setOpen(false)}>Tournaments</Link>
            <Link href="/schedule" onClick={() => setOpen(false)}>Schedule</Link>
            <Link href="/results" onClick={() => setOpen(false)}>Results</Link>
            <Link href="/about" onClick={() => setOpen(false)}>About</Link>
            <Link href="/contact" onClick={() => setOpen(false)}>Contact</Link>
            <Link href="/register" onClick={() => setOpen(false)} className="text-primary">Register</Link>
            <Link href="/test-capacity" onClick={() => setOpen(false)} className="text-orange-600 font-medium">Test Capacity</Link>
            {isAdmin && (
              <Link href="/admin/dashboard" onClick={() => setOpen(false)} className="text-orange-600 font-medium">Admin</Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
