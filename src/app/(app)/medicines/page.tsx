'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/useAuth';
import medicinesDB from '@/config/medicines.json';

interface Medicine {
  id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
  isActive: boolean;
}

export default function MedicinesPage() {
  const { profile, token } = useAuth();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', dosage: '', frequency: '', startDate: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [suggestions, setSuggestions] = useState<typeof medicinesDB>([]);
  const [selectedMed, setSelectedMed] = useState<typeof medicinesDB[number] | null>(null);

  const fetchMeds = useCallback(async () => {
    if (!profile || !token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/medicines?profileId=${profile.id}`, {
        headers: { authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setMedicines(json.data || []);
    } finally { setLoading(false); }
  }, [profile, token]);

  useEffect(() => { fetchMeds(); }, [fetchMeds]);

  const handleNameChange = (val: string) => {
    setForm((f) => ({ ...f, name: val }));
    if (val.length >= 2) {
      const matches = medicinesDB.filter((m) =>
        m.name.toLowerCase().includes(val.toLowerCase()) ||
        m.genericName.toLowerCase().includes(val.toLowerCase())
      ).slice(0, 5);
      setSuggestions(matches);
    } else {
      setSuggestions([]);
    }
    setSelectedMed(null);
  };

  const selectSuggestion = (m: typeof medicinesDB[number]) => {
    setForm((f) => ({ ...f, name: m.name }));
    setSuggestions([]);
    setSelectedMed(m);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !token) return;
    setSaving(true);
    try {
      const res = await fetch('/api/medicines', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({
          profileId: profile.id,
          name: form.name,
          dosage: form.dosage || null,
          frequency: form.frequency ? { label: form.frequency } : null,
          startDate: form.startDate || null,
          notes: form.notes || null,
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ name: '', dosage: '', frequency: '', startDate: '', notes: '' });
        setSelectedMed(null);
        await fetchMeds();
      }
    } finally { setSaving(false); }
  };

  const toggleActive = async (med: Medicine) => {
    if (!token) return;
    await fetch(`/api/medicines/${med.id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ isActive: !med.isActive }),
    });
    setMedicines((prev) => prev.map((m) => m.id === med.id ? { ...m, isActive: !m.isActive } : m));
  };

  const deleteMed = async (id: string) => {
    if (!token || !confirm('Remove this medicine?')) return;
    await fetch(`/api/medicines/${id}`, { method: 'DELETE', headers: { authorization: `Bearer ${token}` } });
    setMedicines((prev) => prev.filter((m) => m.id !== id));
  };

  const active = medicines.filter((m) => m.isActive);
  const inactive = medicines.filter((m) => !m.isActive);

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Medicines</h1>
          <p className="text-slate-400 text-sm mt-0.5">Track your medications and see affected body systems</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancel' : '+ Add Medicine'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card mb-5">
          <h2 className="font-semibold text-white mb-4">Add Medicine</h2>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="relative">
              <label className="label">Medicine name *</label>
              <input className="input" placeholder="Paracetamol, Metformin…" value={form.name} onChange={(e) => handleNameChange(e.target.value)} required />
              {suggestions.length > 0 && (
                <div className="absolute z-10 left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                  {suggestions.map((s) => (
                    <button key={s.name} type="button" onClick={() => selectSuggestion(s)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-slate-700 flex justify-between">
                      <span className="text-slate-200">{s.name}</span>
                      <span className="text-slate-500 text-xs">{s.category}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedMed && (
              <div className="bg-teal-500/10 border border-teal-500/20 rounded-lg p-3 text-xs text-teal-300">
                <p className="font-medium">{selectedMed.name} – {selectedMed.category}</p>
                <p className="text-slate-400 mt-1">Affects: {selectedMed.systems.join(', ')} | {selectedMed.warnings[0]}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Dosage</label>
                <input className="input" placeholder="500mg" value={form.dosage} onChange={(e) => setForm((f) => ({ ...f, dosage: e.target.value }))} />
              </div>
              <div>
                <label className="label">Frequency</label>
                <select className="input" value={form.frequency} onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}>
                  <option value="">Select…</option>
                  <option>Once daily</option>
                  <option>Twice daily</option>
                  <option>Three times daily</option>
                  <option>With meals</option>
                  <option>At bedtime</option>
                  <option>As needed</option>
                </select>
              </div>
              <div>
                <label className="label">Start date</label>
                <input type="date" className="input" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div>
                <label className="label">Notes</label>
                <input className="input" placeholder="Optional notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Adding…' : 'Add Medicine'}</button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading…</div>
      ) : medicines.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">💊</div>
          <p className="text-slate-400 text-sm">No medicines added yet</p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div className="mb-5">
              <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Active ({active.length})</h2>
              <div className="space-y-2">
                {active.map((med) => {
                  const info = medicinesDB.find((m) => m.name.toLowerCase() === med.name.toLowerCase());
                  return (
                    <div key={med.id} className="card">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-200">{med.name}</span>
                            {med.dosage && <span className="text-xs text-slate-500">{med.dosage}</span>}
                          </div>
                          {med.frequency && <p className="text-xs text-slate-500 mt-0.5">{med.frequency}</p>}
                          {info && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {info.systems.map((s) => (
                                <span key={s} className="text-xs bg-slate-800 text-teal-400 px-2 py-0.5 rounded-full">{s}</span>
                              ))}
                            </div>
                          )}
                          {info?.warnings[0] && <p className="text-xs text-amber-500/80 mt-1">⚠️ {info.warnings[0]}</p>}
                        </div>
                        <div className="flex gap-2 ml-3">
                          <button onClick={() => toggleActive(med)} className="text-xs text-slate-500 hover:text-amber-400">Stop</button>
                          <button onClick={() => deleteMed(med.id)} className="text-xs text-slate-500 hover:text-rose-400">✕</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {inactive.length > 0 && (
            <div>
              <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Past ({inactive.length})</h2>
              <div className="space-y-2">
                {inactive.map((med) => (
                  <div key={med.id} className="card opacity-60">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-slate-400 line-through">{med.name}</span>
                        {med.dosage && <span className="text-xs text-slate-600 ml-2">{med.dosage}</span>}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => toggleActive(med)} className="text-xs text-slate-600 hover:text-teal-400">Restart</button>
                        <button onClick={() => deleteMed(med.id)} className="text-xs text-slate-600 hover:text-rose-400">✕</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
