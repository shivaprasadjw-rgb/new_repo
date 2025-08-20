"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Tournament, Venue } from "@/lib/types";

export default function SearchBar() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Array<{ type: string; id: string; name: string; display: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tourResponse, venueResponse] = await Promise.all([
        fetch('/api/tournaments'),
        fetch('/api/venues')
      ]);
      
      const tourData = await tourResponse.json();
      const venueData = await venueResponse.json();
      
      if (tourData.success) setTournaments(tourData.tournaments);
      if (venueData.success) setVenues(venueData.venues);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSuggestions = (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results: Array<{ type: string; id: string; name: string; display: string }> = [];

    // Search tournaments
    tournaments.forEach(tournament => {
      if (tournament.name.toLowerCase().includes(query) || 
          tournament.id.toLowerCase().includes(query) ||
          tournament.sport.toLowerCase().includes(query)) {
        results.push({
          type: 'tournament',
          id: tournament.id,
          name: tournament.name,
          display: `${tournament.name} (${tournament.sport}) - ${tournament.venue.city}`
        });
      }
    });

    // Search venues
    venues.forEach(venue => {
      if (venue.name.toLowerCase().includes(query) || 
          venue.city.toLowerCase().includes(query) ||
          venue.state.toLowerCase().includes(query)) {
        results.push({
          type: 'venue',
          id: venue.id,
          name: venue.name,
          display: `${venue.name}, ${venue.city}, ${venue.state}`
        });
      }
    });

    setSuggestions(results.slice(0, 8));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    generateSuggestions(value);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion: { type: string; id: string; name: string; display: string }) => {
    if (suggestion.type === 'tournament') {
      router.push(`/tournament/${suggestion.id}`);
    } else if (suggestion.type === 'venue') {
      router.push(`/tournaments?venue=${encodeURIComponent(suggestion.name)}`);
    }
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/tournaments?search=${encodeURIComponent(query)}`);
      setQuery("");
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="relative">
          <input
            type="text"
            placeholder="Search tournaments, venues, cities, or sports..."
            className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-full focus:outline-none focus:border-primary"
            disabled
          />
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto relative">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search tournaments, venues, cities, or sports..."
            className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-full focus:outline-none focus:border-primary shadow-lg"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary text-white p-3 rounded-full hover:bg-primary-dark transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.type}-${suggestion.id}-${index}`}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div className="flex items-center">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                  {suggestion.type === 'tournament' ? (
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{suggestion.name}</div>
                  <div className="text-sm text-gray-500">{suggestion.display}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Click outside to close suggestions */}
      {showSuggestions && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowSuggestions(false)}
        />
      )}
    </div>
  );
}
