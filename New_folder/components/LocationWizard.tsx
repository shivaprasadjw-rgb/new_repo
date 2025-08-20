"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Tournament, Venue } from "@/lib/types";

export default function LocationWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  const selectedState = searchParams.get("state") || "";
  const selectedCity = searchParams.get("city") || "";
  const selectedSport = searchParams.get("sport") || "";

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

  const updateSearchParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    router.push(`/tournaments?${params.toString()}`);
  };

  // Extract unique values for dropdowns
  const states = Array.from(new Set(venues.map(v => v.state))).sort();
  const cities = selectedState 
    ? Array.from(new Set(venues.filter(v => v.state === selectedState).map(v => v.city))).sort()
    : [];
  const sports = Array.from(new Set(tournaments.map(t => t.sport))).sort();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading locations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter by Location & Sport</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* State Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
          <select
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={selectedState}
            onChange={(e) => {
              updateSearchParams({ 
                state: e.target.value, 
                city: "", // Reset city when state changes
                sport: selectedSport 
              });
            }}
          >
            <option value="">All States</option>
            {states.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>

        {/* City Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
          <select
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={selectedCity}
            onChange={(e) => updateSearchParams({ city: e.target.value, sport: selectedSport })}
            disabled={!selectedState}
          >
            <option value="">All Cities</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        {/* Sport Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sport</label>
          <select
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={selectedSport}
            onChange={(e) => updateSearchParams({ sport: e.target.value })}
          >
            <option value="">All Sports</option>
            {sports.map(sport => (
              <option key={sport} value={sport}>{sport}</option>
            ))}
          </select>
        </div>

        {/* Clear Filters */}
        <div className="flex items-end">
          <button
            onClick={() => router.push('/tournaments')}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Sport Filter Chips */}
      <div className="mt-4">
        <div className="flex flex-wrap gap-2">
          {sports.map(sport => (
            <button
              key={sport}
              onClick={() => updateSearchParams({ sport: selectedSport === sport ? "" : sport })}
              className={`px-3 py-1 text-sm rounded-full border ${
                selectedSport === sport
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {sport}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
