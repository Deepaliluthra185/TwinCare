'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">T</div>
          <h1 className="text-xl font-semibold text-white">Welcome back</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to your health twin</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2 text-rose-400 text-xs">
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-sm mt-4">
          No account?{' '}
          <Link href="/register" className="text-teal-400 hover:text-teal-300">
            Create one
          </Link>
        </p>
        <p className="text-center mt-2">
          <Link href="/" className="text-slate-600 text-xs hover:text-slate-400">← Back to home</Link>
        </p>

        {/* Demo hint */}
        <div className="mt-4 card bg-slate-800/50 text-xs text-slate-500">
          <p className="font-medium text-slate-400 mb-1">Demo account</p>
          <p>Email: demo@twincare.health</p>
          <p>Password: demo1234</p>
        </div>
      </div>
    </div>
  );
}
