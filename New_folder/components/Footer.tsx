"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Footer() {
  const [year, setYear] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setYear(new Date().getFullYear().toString());
    
    // Check if user is admin using the correct session key
    const sessionId = localStorage.getItem("adminSessionId");
    setIsAdmin(!!sessionId);
  }, []);

  return (
    <footer className="border-t border-slate-200 bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-600">© {year} Sports India. All rights reserved.</p>
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <Link href="/about" className="hover:text-slate-900">About</Link>
            <Link href="/contact" className="hover:text-slate-900">Contact</Link>
            {isAdmin && (
              <Link href="/admin/dashboard" className="text-orange-600 hover:text-orange-700 font-medium">Admin</Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
