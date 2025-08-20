"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Registration, Tournament, Venue } from "@/lib/types";
import TournamentProgression from "@/components/TournamentProgression";

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTournament, setShowAddTournament] = useState(false);
  const [showAddVenue, setShowAddVenue] = useState(false);
  const [showTournamentProgression, setShowTournamentProgression] = useState(false);
  const [selectedTournamentForProgression, setSelectedTournamentForProgression] = useState<Tournament | null>(null);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [showScheduleDate, setShowScheduleDate] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [editingDeadline, setEditingDeadline] = useState<Tournament | null>(null);
  const [deadlineForm, setDeadlineForm] = useState({
    deadline: "",
    date: ""
  });
  const [form, setForm] = useState({
    name: "",
    date: "",
    sport: "",
    format: "Singles",
    category: "Open",
    entryFee: "",
    registrationDeadline: "",
    status: "Upcoming",
    venueId: "",
    organizerName: "",
    organizerEmail: "",
    organizerPhone: "",
    prizes: ["Winner Trophy", "Runner-up Trophy"]
  });
  const [venueForm, setVenueForm] = useState({
    name: "",
    locality: "",
    city: "",
    state: "",
    pincode: "",
    lat: "",
    lng: ""
  });
  const [notice, setNotice] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const sessionId = localStorage.getItem("adminSessionId");
    const username = localStorage.getItem("adminUsername");
    
    if (!sessionId || !username) {
      router.push("/admin/login");
      return;
    }

    // Validate session with server
    validateSession(sessionId, username);
  }, [router]);

  const validateSession = async (sessionId: string, username: string) => {
    try {
      const response = await fetch('/api/admin/auth/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId
        },
        body: JSON.stringify({ username })
      });

      if (response.ok) {
        setAdminUsername(username);
        setMounted(true);
      } else {
        // Session invalid, redirect to login
        localStorage.removeItem("adminSessionId");
        localStorage.removeItem("adminUsername");
        router.push("/admin/login");
      }
    } catch (error) {
      console.error('Session validation failed:', error);
      router.push("/admin/login");
    }
  };

  useEffect(() => {
    if (mounted) {
      fetchData();
    }
  }, [mounted]);

  const fetchData = async () => {
    try {
      const [regResponse, tourResponse, venueResponse] = await Promise.all([
        fetch('/api/admin/registrations'),
        fetch('/api/admin/tournaments'),
        fetch('/api/admin/venues')
      ]);
      
      const regData = await regResponse.json();
      const tourData = await tourResponse.json();
      const venueData = await venueResponse.json();
      
      if (regData.success) setRegistrations(regData.registrations);
      if (tourData.success) setTournaments(tourData.tournaments);
      if (venueData.success) setVenues(venueData.venues);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setField = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const setVenueField = (k: string, v: any) => setVenueForm(f => ({ ...f, [k]: v }));
  
  const resetForm = () => setForm({
    name: "", date: "", sport: "", format: "Singles", category: "Open", entryFee: "",
    registrationDeadline: "", status: "Upcoming", venueId: "", organizerName: "",
    organizerEmail: "", organizerPhone: "", prizes: ["Winner Trophy", "Runner-up Trophy"]
  });
  
  const resetVenueForm = () => setVenueForm({
    name: "", locality: "", city: "", state: "", pincode: "", lat: "", lng: ""
  });

  const submitAddVenue = async () => {
    setNotice(null);
    try {
      const sessionId = localStorage.getItem("adminSessionId");
      if (!sessionId) {
        setNotice('No active session found. Please log in again.');
        return;
      }

      const res = await fetch('/api/admin/venues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
          'x-csrf-token': (document.cookie.match(/(?:^|; )csrf-token=([^;]+)/)?.[1] || '')
        },
        body: JSON.stringify(venueForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to add venue');
      setNotice('Venue added successfully.');
      setShowAddVenue(false);
      resetVenueForm();
      fetchData();
    } catch (e: any) {
      setNotice(e.message || 'Failed to add venue');
    }
  };

  const openTournamentProgression = (tournament: Tournament) => {
    setSelectedTournamentForProgression(tournament);
    setShowTournamentProgression(true);
  };

  const submitAddTournament = async () => {
    setNotice(null);
    try {
      const sessionId = localStorage.getItem("adminSessionId");
      if (!sessionId) {
        setNotice('No active session found. Please log in again.');
        return;
      }

      const res = await fetch('/api/admin/tournaments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
          'x-csrf-token': (document.cookie.match(/(?:^|; )csrf-token=([^;]+)/)?.[1] || '')
        },
        body: JSON.stringify({
          ...form,
          maxParticipants: 32,
          // Don't send date if empty - allow tournaments without dates
          ...(form.date && { date: form.date })
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to add tournament');
      setNotice('Tournament added successfully.');
      setShowAddTournament(false);
      resetForm();
      fetchData();
    } catch (e: any) {
      setNotice(e.message || 'Failed to add tournament');
    }
  };

  const beginEditTournament = (tournament: Tournament) => {
    setEditingTournament(tournament);
    setForm({
      name: tournament.name,
      date: tournament.date || "",
      sport: tournament.sport,
      format: tournament.format,
      category: tournament.category,
      entryFee: tournament.entryFee.toString(),
      registrationDeadline: tournament.registrationDeadline || "",
      status: tournament.status,
      venueId: tournament.venue.id,
      organizerName: tournament.organizer.name,
      organizerEmail: tournament.organizer.email,
      organizerPhone: tournament.organizer.phone,
      prizes: tournament.prizes || ["Winner Trophy", "Runner-up Trophy"]
    });
  };

  const submitEditTournament = async () => {
    if (!editingTournament) return;
    setNotice(null);
    try {
      const sessionId = localStorage.getItem("adminSessionId");
      if (!sessionId) {
        setNotice('No active session found. Please log in again.');
        return;
      }

      const res = await fetch(`/api/admin/tournaments?id=${encodeURIComponent(editingTournament.id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
          'x-csrf-token': (document.cookie.match(/(?:^|; )csrf-token=([^;]+)/)?.[1] || '')
        },
        body: JSON.stringify({
          ...form,
          maxParticipants: 32,
          // Don't send date if empty - allow tournaments without dates
          ...(form.date && { date: form.date })
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update tournament');
      setNotice('Tournament updated successfully.');
      setEditingTournament(null);
      resetForm();
      fetchData();
    } catch (e: any) {
      setNotice(e.message || 'Failed to update tournament');
    }
  };

  const submitDeleteTournament = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tournament? This will archive all associated data.')) return;
    setNotice(null);
    try {
      const sessionId = localStorage.getItem("adminSessionId");
      if (!sessionId) {
        setNotice('No active session found. Please log in again.');
        return;
      }

      const res = await fetch(`/api/admin/tournaments?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          'x-session-id': sessionId,
          'x-csrf-token': (document.cookie.match(/(?:^|; )csrf-token=([^;]+)/)?.[1] || '')
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete tournament');
      setNotice('Tournament deleted successfully.');
      fetchData();
    } catch (e: any) {
      setNotice(e.message || 'Failed to delete tournament');
    }
  };

  const submitScheduleDate = async (tournamentId: string) => {
    if (!scheduleDate) {
      setNotice('Please select a date');
      return;
    }
    
    setNotice(null);
    try {
      const sessionId = localStorage.getItem("adminSessionId");
      if (!sessionId) {
        setNotice('No active session found. Please log in again.');
        return;
      }

      const res = await fetch('/api/admin/tournaments/schedule-date', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
          'x-csrf-token': (document.cookie.match(/(?:^|; )csrf-token=([^;]+)/)?.[1] || '')
        },
        body: JSON.stringify({
          tournamentId,
          date: scheduleDate
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to schedule date');
      setNotice(`Date scheduled successfully! ${data.notificationsSent} notifications sent to ${data.participantsNotified} participants.`);
      setShowScheduleDate(null);
      setScheduleDate("");
      fetchData();
    } catch (e: any) {
      setNotice(e.message || 'Failed to schedule date');
    }
  };

  const handleLogout = async () => {
    try {
      const sessionId = localStorage.getItem("adminSessionId");
      if (sessionId) {
        await fetch('/api/admin/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-session-id': sessionId
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem("adminSessionId");
      localStorage.removeItem("adminUsername");
      router.push("/admin/login");
    }
  };

  if (!mounted) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const totalRegistrations = registrations.length;
  const totalTournaments = tournaments.length;

  // Group registrations by tournament
  const registrationsByTournament = tournaments.map(t => ({
    ...t,
    registrations: registrations.filter(r => r.tournamentId === t.id),
    registrationCount: registrations.filter(r => r.tournamentId === t.id).length
  }));

  // Helper function to get tournament status
  const getTournamentStatus = (tournament: any) => {
    if (!tournament.date) {
      if (tournament.registrationCount >= 32) {
        return { status: "Pending Date", color: "bg-yellow-100 text-yellow-800" };
      } else {
        return { status: "Open for Registration", color: "bg-blue-100 text-blue-800" };
      }
    }
    
    switch (tournament.status) {
      case 'Upcoming': return { status: "Upcoming", color: "bg-green-100 text-green-800" };
      case 'Ongoing': return { status: "Ongoing", color: "bg-yellow-100 text-yellow-800" };
      case 'Completed': return { status: "Completed", color: "bg-gray-100 text-gray-800" };
      case 'Cancelled': return { status: "Cancelled", color: "bg-gray-100 text-gray-800" };
      default: return { status: "Unknown", color: "bg-gray-100 text-gray-800" };
    }
  };

  // Helper function to check if tournament can have date scheduled
  const canScheduleDate = (tournament: any) => {
    return !tournament.date && tournament.registrationCount >= 32;
  };

  // Deadline management functions
  const openDeadlineEditor = (tournament: Tournament) => {
    setEditingDeadline(tournament);
    setDeadlineForm({
      deadline: tournament.registrationDeadline || "",
      date: tournament.date || ""
    });
  };

  const submitDeadlineUpdate = async () => {
    if (!editingDeadline) return;
    
    try {
      const sessionId = localStorage.getItem("adminSessionId");
      if (!sessionId) {
        setNotice('No active session found. Please log in again.');
        return;
      }

      const response = await fetch(`/api/admin/tournaments/${editingDeadline.id}/deadline`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
          'x-csrf-token': (document.cookie.match(/(?:^|; )csrf-token=([^;]+)/)?.[1] || '')
        },
        body: JSON.stringify({
          newDeadline: deadlineForm.deadline,
          newDate: deadlineForm.date || undefined
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setNotice(`Deadline updated successfully for ${editingDeadline.name}`);
        setEditingDeadline(null);
        setDeadlineForm({ deadline: "", date: "" });
        fetchData();
      } else {
        setNotice(`Failed to update deadline: ${data.error}`);
      }
    } catch (error) {
      setNotice('Failed to update deadline');
      console.error('Error updating deadline:', error);
    }
  };

  const autoSetDate = async (tournamentId: string) => {
    try {
      const sessionId = localStorage.getItem("adminSessionId");
      if (!sessionId) {
        setNotice('No active session found. Please log in again.');
        return;
      }

      const response = await fetch(`/api/admin/tournaments/${tournamentId}/deadline`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
          'x-csrf-token': (document.cookie.match(/(?:^|; )csrf-token=([^;]+)/)?.[1] || '')
        },
        body: JSON.stringify({
          newDeadline: "auto",
          newDate: "auto"
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setNotice(`Tournament date auto-set successfully`);
        fetchData();
      } else {
        setNotice(`Failed to auto-set date: ${data.error}`);
      }
    } catch (error) {
      setNotice('Failed to auto-set tournament date');
      console.error('Error auto-setting date:', error);
    }
  };



  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {adminUsername}</p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">← Back to Site</Link>
              <button onClick={handleLogout} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Logout</button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Tournaments</p>
                <p className="text-2xl font-semibold text-gray-900">{totalTournaments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Registrations</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {loading ? "..." : totalRegistrations}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Date</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {tournaments.filter(t => !t.date && registrations.filter(r => r.tournamentId === t.id).length >= 32).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tournaments List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Tournament Overview</h2>
            <button 
              onClick={() => { setShowAddTournament(true); resetForm(); }} 
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 text-sm"
            >
              Add Tournament
            </button>
          </div>

          {notice && (
            <div className="mx-6 mt-3 mb-0 p-3 rounded bg-slate-50 border border-slate-200 text-slate-800 text-sm">{notice}</div>
          )}

          {showAddTournament && (
            <div className="mx-6 my-4 p-4 border rounded-md bg-slate-50">
              <h3 className="font-semibold mb-3">Add New Tournament</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <input placeholder="Tournament Name" className="border rounded px-3 py-2" value={form.name} onChange={e => setField('name', e.target.value)} />
                <input type="date" placeholder="Start Date (Optional)" className="border rounded px-3 py-2" value={form.date} onChange={e => setField('date', e.target.value)} />
                <select className="border rounded px-3 py-2" value={form.sport} onChange={e => setField('sport', e.target.value)}>
                  <option value="">Select Sport</option>
                  <option>Badminton</option>
                  <option>Chess</option>
                  <option>Carrom</option>
                  <option>Tennis</option>
                  <option>Table Tennis</option>
                </select>
                <select className="border rounded px-3 py-2" value={form.venueId} onChange={e => {
                  if (e.target.value === "__add_new__") {
                    setShowAddVenue(true);
                    setField('venueId', '');
                  } else {
                    setField('venueId', e.target.value);
                  }
                }}>
                  <option value="">Select Venue</option>
                  {venues.map(v => (
                    <option key={v.id} value={v.id}>{v.name}, {v.city}</option>
                  ))}
                  <option value="__add_new__" className="font-semibold text-blue-600">+ Add New Venue</option>
                </select>
                <input placeholder="Entry Fee" className="border rounded px-3 py-2" value={form.entryFee} onChange={e => setField('entryFee', e.target.value)} />
                <input type="date" placeholder="Registration Deadline (Optional)" className="border rounded px-3 py-2" value={form.registrationDeadline} onChange={e => setField('registrationDeadline', e.target.value)} />
                <input placeholder="Organizer Name" className="border rounded px-3 py-2" value={form.organizerName} onChange={e => setField('organizerName', e.target.value)} />
                <input placeholder="Organizer Email" className="border rounded px-3 py-2" value={form.organizerEmail} onChange={e => setField('organizerEmail', e.target.value)} />
                <input placeholder="Organizer Phone" className="border rounded px-3 py-2" value={form.organizerPhone} onChange={e => setField('organizerPhone', e.target.value)} />
              </div>
              <div className="mt-3 flex gap-3">
                <button onClick={submitAddTournament} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm">Save Tournament</button>
                <button onClick={() => setShowAddTournament(false)} className="px-4 py-2 bg-gray-200 rounded-md text-sm">Cancel</button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tournament</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sport</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registrations</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {registrationsByTournament.map((tournament) => {
                  const statusInfo = getTournamentStatus(tournament);
                  const canSchedule = canScheduleDate(tournament);
                  
                  return (
                    <tr key={tournament.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{tournament.name}</div>
                          <div className="text-sm text-gray-500">{tournament.id}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{tournament.sport}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
                          {statusInfo.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tournament.date ? (
                          new Date(tournament.date).toLocaleDateString()
                        ) : (
                          <span className="text-gray-400 italic">Not set</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {loading ? "..." : `${tournament.registrationCount} / ${tournament.maxParticipants}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <Link href={`/admin/registrations/${tournament.id}`} className="text-primary hover:text-primary-dark">View Registrations</Link>
                          <button onClick={() => beginEditTournament(tournament)} className="text-sky-600 hover:text-sky-700">Edit</button>
                          <button onClick={() => openTournamentProgression(tournament)} className="text-purple-600 hover:text-purple-700">Manage Progression</button>
                          {canSchedule && (
                            <button 
                              onClick={() => setShowScheduleDate(tournament.id)} 
                              className="text-orange-600 hover:text-orange-700"
                            >
                              Set Date
                            </button>
                          )}
                          <button onClick={() => submitDeleteTournament(tournament.id)} className="text-red-600 hover:text-red-700">Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {registrationsByTournament.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">No tournaments found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Deadline Management Section */}
        <div className="bg-white rounded-lg shadow mt-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Deadline Management</h2>
            <p className="text-sm text-gray-600 mt-1">Manage registration deadlines and tournament dates for all tournaments</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tournament</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Deadline</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tournament Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participants</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tournaments.map((tournament) => {
                  const participantCount = registrations.filter(r => r.tournamentId === tournament.id).length;
                  const isFull = participantCount >= tournament.maxParticipants;
                  const needsDate = isFull && !tournament.date;
                  
                  return (
                    <tr key={tournament.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{tournament.name}</div>
                          <div className="text-sm text-gray-500">{tournament.id}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm ${tournament.registrationDeadline === 'TBD' ? 'text-orange-600 font-medium' : 'text-gray-900'}`}>
                          {tournament.registrationDeadline === 'TBD' ? 'TBD' : 
                           tournament.registrationDeadline ? new Date(tournament.registrationDeadline).toLocaleDateString() : 'Not set'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm ${needsDate ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                          {tournament.date ? new Date(tournament.date).toLocaleDateString() : 
                           needsDate ? 'Needs date' : 'Not set'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`${isFull ? 'text-green-600 font-medium' : 'text-gray-900'}`}>
                          {participantCount} / {tournament.maxParticipants}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => openDeadlineEditor(tournament)}
                          className="text-blue-600 hover:text-blue-700 mr-3"
                        >
                          Edit Deadline
                        </button>
                        {needsDate && (
                          <button 
                            onClick={() => autoSetDate(tournament.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            Auto-Set Date
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Edit Tournament Modal */}
      {editingTournament && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6">
            <h3 className="font-semibold mb-3">Edit Tournament: {editingTournament.name}</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <input placeholder="Tournament Name" className="border rounded px-3 py-2" value={form.name} onChange={e => setField('name', e.target.value)} />
              <input type="date" placeholder="Start Date (Optional)" className="border rounded px-3 py-2" value={form.date} onChange={e => setField('date', e.target.value)} />
              <select className="border rounded px-3 py-2" value={form.sport} onChange={e => setField('sport', e.target.value)}>
                <option value="">Select Sport</option>
                <option>Badminton</option>
                <option>Chess</option>
                <option>Carrom</option>
                <option>Tennis</option>
                <option>Table Tennis</option>
              </select>
              <select className="border rounded px-3 py-2" value={form.venueId} onChange={e => setField('venueId', e.target.value)}>
                <option value="">Select Venue</option>
                {venues.map(v => (
                  <option key={v.id} value={v.id}>{v.name}, {v.city}</option>
                ))}
              </select>
              <input placeholder="Entry Fee" className="border rounded px-3 py-2" value={form.entryFee} onChange={e => setField('entryFee', e.target.value)} />
              <input type="date" placeholder="Registration Deadline (Optional)" className="border rounded px-3 py-2" value={form.registrationDeadline} onChange={e => setField('registrationDeadline', e.target.value)} />
              <input placeholder="Organizer Name" className="border rounded px-3 py-2" value={form.organizerName} onChange={e => setField('organizerName', e.target.value)} />
              <input placeholder="Organizer Email" className="border rounded px-3 py-2" value={form.organizerEmail} onChange={e => setField('organizerEmail', e.target.value)} />
              <input placeholder="Organizer Phone" className="border rounded px-3 py-2" value={form.organizerPhone} onChange={e => setField('organizerPhone', e.target.value)} />
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => setEditingTournament(null)} className="px-4 py-2 bg-gray-200 rounded-md text-sm">Cancel</button>
              <button onClick={submitEditTournament} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Date Modal */}
      {showScheduleDate && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="font-semibold mb-4">Schedule Tournament Date</h3>
            <p className="text-sm text-gray-600 mb-4">
              This tournament has 32 participants and is ready for date scheduling. 
              All participants will be notified via WhatsApp and email.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tournament Date</label>
              <input 
                type="date" 
                className="w-full border rounded px-3 py-2" 
                value={scheduleDate} 
                onChange={e => setScheduleDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => { setShowScheduleDate(null); setScheduleDate(""); }} 
                className="px-4 py-2 bg-gray-200 rounded-md text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={() => submitScheduleDate(showScheduleDate)} 
                className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm"
                disabled={!scheduleDate}
              >
                Schedule Date
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Venue Modal */}
      {showAddVenue && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6">
            <h3 className="font-semibold mb-4">Add New Venue</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <input 
                placeholder="Venue Name" 
                className="border rounded px-3 py-2" 
                value={venueForm.name} 
                onChange={e => setVenueField('name', e.target.value)} 
              />
              <input 
                placeholder="Locality/Area" 
                className="border rounded px-3 py-2" 
                value={venueForm.locality} 
                onChange={e => setVenueField('locality', e.target.value)} 
              />
              <input 
                placeholder="City" 
                className="border rounded px-3 py-2" 
                value={venueForm.city} 
                onChange={e => setVenueField('city', e.target.value)} 
                required
              />
              <input 
                placeholder="State" 
                className="border rounded px-3 py-2" 
                value={venueForm.state} 
                onChange={e => setVenueField('state', e.target.value)} 
                required
              />
              <input 
                placeholder="Pincode" 
                className="border rounded px-3 py-2" 
                value={venueForm.pincode} 
                onChange={e => setVenueField('pincode', e.target.value)} 
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <input 
                  placeholder="Latitude" 
                  className="border rounded px-3 py-2" 
                  value={venueForm.lat} 
                  onChange={e => setVenueField('lat', e.target.value)} 
                  type="number"
                  step="any"
                />
                <input 
                  placeholder="Longitude" 
                  className="border rounded px-3 py-2" 
                  value={venueForm.lng} 
                  onChange={e => setVenueField('lng', e.target.value)} 
                  type="number"
                  step="any"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button 
                onClick={() => { setShowAddVenue(false); resetVenueForm(); }} 
                className="px-4 py-2 bg-gray-200 rounded-md text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={submitAddVenue} 
                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm"
                disabled={!venueForm.name || !venueForm.city || !venueForm.state || !venueForm.pincode}
              >
                Add Venue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deadline Editor Modal */}
      {editingDeadline && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Edit Deadline: {editingDeadline.name}
              </h3>
              <button 
                onClick={() => setEditingDeadline(null)} 
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registration Deadline
                </label>
                <div className="flex gap-2">
                  <input 
                    type="date" 
                    className="flex-1 border rounded px-3 py-2" 
                    value={deadlineForm.deadline} 
                    onChange={e => setDeadlineForm(f => ({ ...f, deadline: e.target.value }))}
                  />
                  <button 
                    onClick={() => setDeadlineForm(f => ({ ...f, deadline: 'TBD' }))}
                    className="px-3 py-2 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
                  >
                    Set TBD
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tournament Date (Optional)
                </label>
                <input 
                  type="date" 
                  className="w-full border rounded px-3 py-2" 
                  value={deadlineForm.date} 
                  onChange={e => setDeadlineForm(f => ({ ...f, date: e.target.value }))}
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button 
                  onClick={() => setEditingDeadline(null)} 
                  className="px-4 py-2 bg-gray-200 rounded-md text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={submitDeadlineUpdate} 
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                  disabled={!deadlineForm.deadline}
                >
                  Update Deadline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tournament Progression Modal */}
      {showTournamentProgression && selectedTournamentForProgression && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  Tournament Progression: {selectedTournamentForProgression.name}
                </h3>
                <button 
                  onClick={() => { 
                    setShowTournamentProgression(false); 
                    setSelectedTournamentForProgression(null); 
                  }} 
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <TournamentProgression 
                tournamentId={selectedTournamentForProgression.id}
                onClose={() => { setShowTournamentProgression(false); setSelectedTournamentForProgression(null); }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
