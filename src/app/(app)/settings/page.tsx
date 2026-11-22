'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';

type Tab = 'profile' | 'profiles' | 'data';

export default function SettingsPage() {
  const { profile, token, refreshProfiles, profiles } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'profile');
  const [form, setForm] = useState({
    name: '', age: '', sex: '', heightCm: '', weightKg: '',
    bloodGroup: '', knownConditions: '', currentMedicines: '',
    allergies: '', emergencyName: '', emergencyPhone: '', emergencyRelation: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newProfile, setNewProfile] = useState({ name: '', age: '', sex: '' });
  const [addingProfile, setAddingProfile] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const p = profile as unknown as Record<string, string>;
    const ec = (() => { try { return p.emergencyContact ? JSON.parse(p.emergencyContact) : null; } catch { return null; } })();
    const cond = (() => { try { return p.knownConditions ? JSON.parse(p.knownConditions).join(', ') : ''; } catch { return ''; } })();
    const meds = (() => { try { return p.currentMedicines ? JSON.parse(p.currentMedicines).join(', ') : ''; } catch { return ''; } })();
    const allerg = (() => { try { return p.allergies ? JSON.parse(p.allergies).join(', ') : ''; } catch { return ''; } })();
    setForm({
      name: profile.name || '',
      age: profile.age?.toString() || '',
      sex: profile.sex || '',
      heightCm: p.heightCm?.toString() || '',
      weightKg: p.weightKg?.toString() || '',
      bloodGroup: p.bloodGroup || '',
      knownConditions: cond,
      currentMedicines: meds,
      allergies: allerg,
      emergencyName: ec?.name || '',
      emergencyPhone: ec?.phone || '',
      emergencyRelation: ec?.relation || '',
    });
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !token) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/profiles/${profile.id}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: form.name,
          age: form.age || null,
          sex: form.sex || null,
          heightCm: form.heightCm || null,
          weightKg: form.weightKg || null,
          bloodGroup: form.bloodGroup || null,
          knownConditions: form.knownConditions ? form.knownConditions.split(',').map((s) => s.trim()).filter(Boolean) : [],
          currentMedicines: form.currentMedicines ? form.currentMedicines.split(',').map((s) => s.trim()).filter(Boolean) : [],
          allergies: form.allergies ? form.allergies.split(',').map((s) => s.trim()).filter(Boolean) : [],
          emergencyContact: form.emergencyName ? { name: form.emergencyName, phone: form.emergencyPhone, relation: form.emergencyRelation } : null,
        }),
      });
      if (res.ok) {
        setSaved(true);
        await refreshProfiles();
        setTimeout(() => setSaved(false), 2000);
      }
    } finally { setSaving(false); }
  };

  const handleAddProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setAddingProfile(true);
    try {
      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newProfile.name, age: newProfile.age || null, sex: newProfile.sex || null }),
      });
      if (res.ok) {
        await refreshProfiles();
        setNewProfile({ name: '', age: '', sex: '' });
      }
    } finally { setAddingProfile(false); }
  };

  const handleExport = async () => {
    if (!profile || !token) return;
    const res = await fetch(`/api/export?profileId=${profile.id}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    const blob = new Blob([JSON.stringify(json.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `twincare-export-${profile.name}.json`; a.click();
  };

  const handleDelete = async () => {
    if (!confirm('This will permanently delete ALL your data. This cannot be undone. Continue?')) return;
    if (!token) return;
    await fetch('/api/export', { method: 'DELETE', headers: { authorization: `Bearer ${token}` } });
    router.push('/');
  };

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold text-white mb-5">Settings</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-slate-800 p-1 rounded-lg w-fit">
        {(['profile', 'profiles', 'data'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            {t === 'profile' ? 'My Profile' : t === 'profiles' ? 'Family Profiles' : 'Data & Privacy'}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <form onSubmit={handleSave} className="space-y-4">
          <div className="card space-y-4">
            <h2 className="font-semibold text-white">Personal Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Name</label>
                <input className="input" value={form.name} onChange={f('name')} placeholder="Your name" />
              </div>
              <div>
                <label className="label">Age</label>
                <input type="number" className="input" value={form.age} onChange={f('age')} placeholder="30" min="0" max="150" />
              </div>
              <div>
                <label className="label">Sex</label>
                <select className="input" value={form.sex} onChange={f('sex')}>
                  <option value="">Select…</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Height (cm)</label>
                <input type="number" className="input" value={form.heightCm} onChange={f('heightCm')} placeholder="170" />
              </div>
              <div>
                <label className="label">Weight (kg)</label>
                <input type="number" className="input" value={form.weightKg} onChange={f('weightKg')} placeholder="70" step="0.1" />
              </div>
              <div>
                <label className="label">Blood Group</label>
                <select className="input" value={form.bloodGroup} onChange={f('bloodGroup')}>
                  <option value="">Unknown</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => <option key={bg}>{bg}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="card space-y-4">
            <h2 className="font-semibold text-white">Medical History</h2>
            <div>
              <label className="label">Known conditions (comma-separated)</label>
              <textarea className="input min-h-[70px]" value={form.knownConditions} onChange={f('knownConditions')} placeholder="Type 2 diabetes, Hypertension…" />
            </div>
            <div>
              <label className="label">Current medicines (comma-separated)</label>
              <textarea className="input min-h-[70px]" value={form.currentMedicines} onChange={f('currentMedicines')} placeholder="Metformin 500mg, Aspirin 75mg…" />
            </div>
            <div>
              <label className="label">Allergies (comma-separated)</label>
              <input className="input" value={form.allergies} onChange={f('allergies')} placeholder="Penicillin, Shellfish…" />
            </div>
          </div>

          <div className="card space-y-4">
            <h2 className="font-semibold text-white">Emergency Contact</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Name</label>
                <input className="input" value={form.emergencyName} onChange={f('emergencyName')} placeholder="Contact name" />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" value={form.emergencyPhone} onChange={f('emergencyPhone')} placeholder="+91 98765 43210" />
              </div>
              <div>
                <label className="label">Relation</label>
                <input className="input" value={form.emergencyRelation} onChange={f('emergencyRelation')} placeholder="Spouse, Parent…" />
              </div>
            </div>
          </div>

          <button type="submit" className="btn-primary w-full py-2.5" disabled={saving}>
            {saved ? '✓ Saved!' : saving ? 'Saving…' : 'Save Profile'}
          </button>
        </form>
      )}

      {tab === 'profiles' && (
        <div className="space-y-4">
          <div className="card">
            <h2 className="font-semibold text-white mb-3">Family Profiles ({profiles.length})</h2>
            <div className="space-y-2">
              {profiles.map((p) => (
                <div key={p.id} className="flex items-center justify-between bg-slate-800 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-teal-700 rounded-full flex items-center justify-center text-white text-xs">{p.name[0]?.toUpperCase()}</div>
                    <div>
                      <p className="text-sm text-slate-200">{p.name}</p>
                      {p.isDefault && <p className="text-xs text-slate-500">Default</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="font-semibold text-white mb-3">Add Family Member</h2>
            <form onSubmit={handleAddProfile} className="space-y-3">
              <div>
                <label className="label">Name *</label>
                <input className="input" value={newProfile.name} onChange={(e) => setNewProfile((p) => ({ ...p, name: e.target.value }))} placeholder="Family member name" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Age</label>
                  <input type="number" className="input" value={newProfile.age} onChange={(e) => setNewProfile((p) => ({ ...p, age: e.target.value }))} placeholder="25" />
                </div>
                <div>
                  <label className="label">Sex</label>
                  <select className="input" value={newProfile.sex} onChange={(e) => setNewProfile((p) => ({ ...p, sex: e.target.value }))}>
                    <option value="">Select…</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn-primary" disabled={addingProfile}>{addingProfile ? 'Adding…' : 'Add Profile'}</button>
            </form>
          </div>
        </div>
      )}

      {tab === 'data' && (
        <div className="space-y-4">
          <div className="card">
            <h2 className="font-semibold text-white mb-1">Export Your Data</h2>
            <p className="text-slate-400 text-sm mb-3">Download all your health data as a JSON file. Includes profile, lab reports, check-ins, and medicines.</p>
            <button onClick={handleExport} className="btn-secondary">📥 Export Data (JSON)</button>
          </div>

          <div className="card border-rose-500/20">
            <h2 className="font-semibold text-rose-400 mb-1">Delete All Data</h2>
            <p className="text-slate-400 text-sm mb-3">Permanently delete your account and all associated health data. This cannot be undone.</p>
            <button onClick={handleDelete} className="btn-danger">🗑️ Delete All My Data</button>
          </div>
        </div>
      )}
    </div>
  );
}
