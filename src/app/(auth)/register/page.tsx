'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', confirm: '', name: '' });
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match');
    if (!consent) return setError('Please accept the data consent to continue');
    setLoading(true);
    try {
      await register(form.email, form.password, form.name);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">T</div>
          <h1 className="text-xl font-semibold text-white">Create your health twin</h1>
          <p className="text-slate-400 text-sm mt-1">Free, private, and local</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Your name (optional)</label>
              <input type="text" className="input" placeholder="Priya Sharma" value={form.name} onChange={set('name')} />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" className="input" placeholder="At least 8 characters" value={form.password} onChange={set('password')} required minLength={8} />
            </div>
            <div>
              <label className="label">Confirm password</label>
              <input type="password" className="input" placeholder="••••••••" value={form.confirm} onChange={set('confirm')} required />
            </div>

            {/* Data consent */}
            <div className="bg-slate-800/60 rounded-lg p-3 text-xs text-slate-400">
              <p className="font-medium text-slate-300 mb-1">📋 Data consent</p>
              <p>TwinCare stores your health data locally in a SQLite database on this server. Your data is never sold or shared with third parties. You can export or delete all your data at any time from Settings.</p>
              <label className="flex items-start gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                <span>I understand and consent to this data storage</span>
              </label>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2 text-rose-400 text-xs">
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-sm mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-teal-400 hover:text-teal-300">Sign in</Link>
        </p>
        <p className="text-center mt-2">
          <Link href="/" className="text-slate-600 text-xs hover:text-slate-400">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
