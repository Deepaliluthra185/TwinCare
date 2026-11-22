'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/useAuth';
import { useRouter } from 'next/navigation';

const SYMPTOMS = ['Headache', 'Fatigue', 'Nausea', 'Dizziness', 'Chest pain', 'Shortness of breath', 'Joint pain', 'Stomach ache', 'Fever', 'Cough', 'Sore throat', 'Back pain'];

export default function CheckInPage() {
  const { profile, token } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    sleepHours: '',
    mood: 0,
    energy: 0,
    waterLiters: '',
    symptoms: [] as string[],
    restingHR: '',
    steps: '',
    systolicBP: '',
    diastolicBP: '',
    bloodSugar: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const toggleSymptom = (s: string) =>
    setForm((f) => ({
      ...f,
      symptoms: f.symptoms.includes(s)
        ? f.symptoms.filter((x) => x !== s)
        : [...f.symptoms, s],
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !token) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/check-ins', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({
          profileId: profile.id,
          sleepHours: form.sleepHours ? parseFloat(form.sleepHours) : null,
          mood: form.mood || null,
          energy: form.energy || null,
          waterLiters: form.waterLiters ? parseFloat(form.waterLiters) : null,
          symptoms: form.symptoms,
          restingHR: form.restingHR ? parseInt(form.restingHR) : null,
          steps: form.steps ? parseInt(form.steps) : null,
          systolicBP: form.systolicBP ? parseInt(form.systolicBP) : null,
          diastolicBP: form.diastolicBP ? parseInt(form.diastolicBP) : null,
          bloodSugar: form.bloodSugar ? parseFloat(form.bloodSugar) : null,
          notes: form.notes || null,
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch {
      setError('Failed to save check-in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-3">✅</div>
          <h2 className="text-xl font-semibold text-white">Check-in saved!</h2>
          <p className="text-slate-400 text-sm mt-1">Your twin is being updated…</p>
        </div>
      </div>
    );
  }

  const EmojiRating = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
    <div>
      <label className="label">{label}</label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${value === v ? 'bg-teal-600 text-white scale-110' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
          >
            {v}
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-600 mt-1">
        {value === 0 ? 'Not rated' : value === 1 ? 'Very low' : value === 2 ? 'Low' : value === 3 ? 'Moderate' : value === 4 ? 'Good' : 'Excellent'}
      </p>
    </div>
  );

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold text-white mb-1">Daily Check-in</h1>
      <p className="text-slate-400 text-sm mb-6">30 seconds to update your twin. All fields optional.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Sleep + Water */}
        <div className="card">
          <h2 className="text-sm font-medium text-slate-300 mb-4">Sleep & Hydration</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Sleep (hours)</label>
              <input type="number" className="input" placeholder="7.5" min="0" max="24" step="0.5"
                value={form.sleepHours} onChange={(e) => setForm((f) => ({ ...f, sleepHours: e.target.value }))} />
            </div>
            <div>
              <label className="label">Water (liters)</label>
              <input type="number" className="input" placeholder="2.5" min="0" max="10" step="0.25"
                value={form.waterLiters} onChange={(e) => setForm((f) => ({ ...f, waterLiters: e.target.value }))} />
            </div>
          </div>
        </div>

        {/* Mood & Energy */}
        <div className="card">
          <h2 className="text-sm font-medium text-slate-300 mb-4">How are you feeling?</h2>
          <div className="grid grid-cols-2 gap-6">
            <EmojiRating label="Mood" value={form.mood} onChange={(v) => setForm((f) => ({ ...f, mood: v }))} />
            <EmojiRating label="Energy" value={form.energy} onChange={(v) => setForm((f) => ({ ...f, energy: v }))} />
          </div>
        </div>

        {/* Symptoms */}
        <div className="card">
          <h2 className="text-sm font-medium text-slate-300 mb-3">Symptoms today (if any)</h2>
          <div className="flex flex-wrap gap-2">
            {SYMPTOMS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleSymptom(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${form.symptoms.includes(s) ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Vitals */}
        <div className="card">
          <h2 className="text-sm font-medium text-slate-300 mb-4">Vitals (optional)</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Resting HR (bpm)</label>
              <input type="number" className="input" placeholder="72" min="30" max="200"
                value={form.restingHR} onChange={(e) => setForm((f) => ({ ...f, restingHR: e.target.value }))} />
            </div>
            <div>
              <label className="label">Steps</label>
              <input type="number" className="input" placeholder="8000" min="0"
                value={form.steps} onChange={(e) => setForm((f) => ({ ...f, steps: e.target.value }))} />
            </div>
            <div>
              <label className="label">BP Systolic (mmHg)</label>
              <input type="number" className="input" placeholder="120" min="60" max="250"
                value={form.systolicBP} onChange={(e) => setForm((f) => ({ ...f, systolicBP: e.target.value }))} />
            </div>
            <div>
              <label className="label">BP Diastolic (mmHg)</label>
              <input type="number" className="input" placeholder="80" min="40" max="150"
                value={form.diastolicBP} onChange={(e) => setForm((f) => ({ ...f, diastolicBP: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="label">Blood Sugar (mg/dL)</label>
              <input type="number" className="input" placeholder="90" min="30" max="600" step="0.1"
                value={form.bloodSugar} onChange={(e) => setForm((f) => ({ ...f, bloodSugar: e.target.value }))} />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card">
          <label className="label">Notes (optional)</label>
          <textarea className="input min-h-[80px] resize-none" placeholder="Anything else you want to remember…"
            value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
        </div>

        {error && <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2 text-rose-400 text-sm">{error}</div>}

        <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
          {loading ? 'Saving…' : 'Save Check-in & Update Twin'}
        </button>
      </form>
    </div>
  );
}
