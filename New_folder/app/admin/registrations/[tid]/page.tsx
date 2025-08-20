"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Registration, Tournament } from "@/lib/types";
import ExcelUpload from "@/components/ExcelUpload";

export default function AdminRegistrations({ params }: { params: { tid: string } }) {
  const tid = decodeURIComponent(params.tid);
  const [mounted, setMounted] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    gender: "",
    schoolOrEmployer: "",
    playerSkillLevel: "",
    email: "",
    phone: "",
    address: "",
  });
  const [notice, setNotice] = useState<string | null>(null);
  const router = useRouter();
  
  const list = useMemo(() => registrations.filter(r => r.tournamentId === tid), [registrations, tid]);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("adminAuthenticated");
    const username = localStorage.getItem("adminUsername");
    if (!isAuthenticated || !username) {
      router.push("/admin/login");
      return;
    }
    setAdminUsername(username);
    setMounted(true);
  }, [router]);

  useEffect(() => {
    if (mounted) {
      fetchTournament();
      fetchRegistrations();
    }
  }, [mounted]);

  const fetchTournament = async () => {
    try {
      const response = await fetch('/api/tournaments');
      const data = await response.json();
      if (data.success) {
        const foundTournament = data.tournaments.find((t: Tournament) => t.id === tid);
        if (foundTournament) {
          setTournament(foundTournament);
        } else {
          setNotice(`Tournament ${tid} not found`);
        }
      }
    } catch (error) {
      console.error('Failed to fetch tournament:', error);
      setNotice('Failed to fetch tournament data');
    }
  };

  const fetchRegistrations = async () => {
    try {
      const response = await fetch(`/api/admin/registrations/${encodeURIComponent(tid)}`);
      const data = await response.json();
      if (data.success) setRegistrations(data.registrations);
    } catch (error) {
      console.error('Failed to fetch registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const setField = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const resetForm = () => setForm({ fullName: "", gender: "", schoolOrEmployer: "", playerSkillLevel: "", email: "", phone: "", address: "" });

  const submitAdd = async () => {
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/registrations/${encodeURIComponent(tid)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-user': adminUsername,
        },
        body: JSON.stringify({
          fullName: form.fullName,
          gender: form.gender,
          schoolOrEmployer: form.schoolOrEmployer,
          playerSkillLevel: form.playerSkillLevel,
          email: form.email,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to add');
      setNotice('Participant added successfully.');
      setShowAdd(false);
      resetForm();
      fetchRegistrations();
    } catch (e: any) {
      setNotice(e.message || 'Failed to add participant');
    }
  };

  const beginEdit = (r: Registration) => {
    setEditingId(r.id);
    setForm({
      fullName: r.fullName,
      gender: r.gender,
      schoolOrEmployer: r.schoolOrEmployer,
      playerSkillLevel: r.playerSkillLevel,
      email: r.email,
      phone: r.phone,
      address: r.address,
    });
  };

  const submitEdit = async () => {
    if (!editingId) return;
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/registrations/${encodeURIComponent(tid)}?id=${encodeURIComponent(editingId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-user': adminUsername,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update');
      setNotice('Participant updated successfully.');
      setEditingId(null);
      resetForm();
      fetchRegistrations();
    } catch (e: any) {
      setNotice(e.message || 'Failed to update participant');
    }
  };

  const submitDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this participant? This will free up their slot.')) return;
    setNotice(null);
    try {
      const sessionId = localStorage.getItem("adminSessionId");
      if (!sessionId) {
        alert('No active session found. Please log in again.');
        return;
      }
      const res = await fetch(`/api/admin/registrations/${encodeURIComponent(tid)}?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          'x-session-id': sessionId,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete');
      setNotice('Participant deleted successfully.');
      fetchRegistrations();
    } catch (e: any) {
      setNotice(e.message || 'Failed to delete participant');
    }
  };

  const handleExcelUploadSuccess = () => {
    fetchRegistrations();
    setNotice('Excel upload completed successfully!');
  };

  const handleClearSchedule = async () => {
    if (!confirm('Are you sure you want to clear the tournament schedule? This will reset all rounds and player progression.')) return;
    setNotice(null);
    try {
      const sessionId = localStorage.getItem("adminSessionId");
      if (!sessionId) {
        alert('No active session found. Please log in again.');
        return;
      }
      const res = await fetch(`/api/admin/tournaments/${encodeURIComponent(tid)}/clear-schedule`, {
        method: 'POST',
        headers: {
          'x-session-id': sessionId,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to clear schedule');
      setNotice('Tournament schedule cleared successfully.');
      fetchRegistrations(); // Refresh registrations to reflect cleared schedule
    } catch (e: any) {
      setNotice(e.message || 'Failed to clear tournament schedule');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminAuthenticated");
    localStorage.removeItem("adminUsername");
    router.push("/admin/login");
  };

  if (!mounted) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tournament Registrations</h1>
              <p className="text-sm text-gray-600">
                {tournament?.name ?? tid} • Welcome, {adminUsername}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard" className="text-sm text-gray-600 hover:text-gray-900">← Back to Dashboard</Link>
              <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">← Back to Site</Link>
              <button onClick={handleLogout} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Logout</button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Registrations — {tournament?.name ?? tid}</h2>
              <p className="text-sm text-gray-600 mt-1">Total: {loading ? "..." : list.length} participants</p>
            </div>
            <div className="flex items-center gap-3">
              <ExcelUpload 
                tournamentId={tid}
                onUploadSuccess={handleExcelUploadSuccess}
              />
              <button onClick={() => { setShowAdd(true); resetForm(); }} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 text-sm">Add Participant</button>
              <button 
                onClick={handleClearSchedule} 
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm"
                title="Clear tournament schedule and reset progression"
              >
                🗑️ Clear Schedule
              </button>
            </div>
          </div>

          {notice && (
            <div className="mx-6 mt-3 mb-0 p-3 rounded bg-slate-50 border border-slate-200 text-slate-800 text-sm">{notice}</div>
          )}

          {showAdd && (
            <div className="mx-6 my-4 p-4 border rounded-md bg-slate-50">
              <h3 className="font-semibold mb-3">Add Participant</h3>
              <div className="grid sm:grid-cols-3 gap-3">
                <input placeholder="Full Name" className="border rounded px-3 py-2" value={form.fullName} onChange={e => setField('fullName', e.target.value)} />
                <select className="border rounded px-3 py-2" value={form.gender} onChange={e => setField('gender', e.target.value)}>
                  <option value="">Gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Prefer not to say</option>
                </select>
                <input placeholder="School/Employer" className="border rounded px-3 py-2" value={form.schoolOrEmployer} onChange={e => setField('schoolOrEmployer', e.target.value)} />
                <select className="border rounded px-3 py-2" value={form.playerSkillLevel} onChange={e => setField('playerSkillLevel', e.target.value)}>
                  <option value="">Skill Level</option>
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                  <option>Professional</option>
                </select>
                <input placeholder="Email" className="border rounded px-3 py-2" value={form.email} onChange={e => setField('email', e.target.value)} />
              </div>
              <div className="mt-3 flex gap-3">
                <button onClick={submitAdd} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm">Save</button>
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-gray-200 rounded-md text-sm">Cancel</button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading registrations...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reg ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skill</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Round</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slot</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {list.map(r => (
                    <tr key={r.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{r.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.fullName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.playerSkillLevel}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.assignedRound.label}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.playerNumber ?? '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => beginEdit(r)} className="px-3 py-1 rounded bg-sky-600 text-white hover:bg-sky-700">Edit</button>
                          <button onClick={() => submitDelete(r.id)} className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {list.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-sm text-gray-500">No registrations yet for this tournament.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {editingId && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6">
              <h3 className="font-semibold mb-3">Edit Participant</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <input placeholder="Full Name" className="border rounded px-3 py-2" value={form.fullName} onChange={e => setField('fullName', e.target.value)} />
                <select className="border rounded px-3 py-2" value={form.gender} onChange={e => setField('gender', e.target.value)}>
                  <option value="">Gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Prefer not to say</option>
                </select>
                <input placeholder="School/Employer" className="border rounded px-3 py-2" value={form.schoolOrEmployer} onChange={e => setField('schoolOrEmployer', e.target.value)} />
                <select className="border rounded px-3 py-2" value={form.playerSkillLevel} onChange={e => setField('playerSkillLevel', e.target.value)}>
                  <option value="">Skill Level</option>
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                  <option>Professional</option>
                </select>
                <input placeholder="Email" className="border rounded px-3 py-2" value={form.email} onChange={e => setField('email', e.target.value)} />
                <input placeholder="Phone" className="border rounded px-3 py-2" value={form.phone} onChange={e => setField('phone', e.target.value)} />
                <input placeholder="Address" className="border rounded px-3 py-2 sm:col-span-2" value={form.address} onChange={e => setField('address', e.target.value)} />
              </div>
              <div className="mt-4 flex justify-end gap-3">
                <button onClick={() => setEditingId(null)} className="px-4 py-2 bg-gray-200 rounded-md text-sm">Cancel</button>
                <button onClick={submitEdit} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm">Save Changes</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
