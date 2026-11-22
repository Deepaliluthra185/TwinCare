'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import { AuthContext } from '@/lib/useAuth';
import { useRouter } from 'next/navigation';

interface AuthUser {
  id: string;
  email: string;
}

interface Profile {
  id: string;
  name: string;
  age?: number | null;
  sex?: string | null;
  bloodGroup?: string | null;
  isDefault: boolean;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('tc_auth');
    if (stored) {
      try {
        const { user: u, token: t, profile: p, profiles: ps } = JSON.parse(stored);
        setUser(u);
        setToken(t);
        setProfile(p);
        setProfiles(ps || []);
      } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  const persist = (u: AuthUser, t: string, p: Profile, ps: Profile[]) => {
    setUser(u);
    setToken(t);
    setProfile(p);
    setProfiles(ps);
    localStorage.setItem('tc_auth', JSON.stringify({ user: u, token: t, profile: p, profiles: ps }));
  };

  const refreshProfiles = useCallback(async () => {
    if (!token) return;
    const res = await fetch('/api/profiles', {
      headers: { authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (json.data) {
      setProfiles(json.data);
      const stored = localStorage.getItem('tc_auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        localStorage.setItem('tc_auth', JSON.stringify({ ...parsed, profiles: json.data }));
      }
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Login failed');
    const { user: u, token: t, profile: p } = json.data;
    // Fetch all profiles
    const pRes = await fetch('/api/profiles', { headers: { authorization: `Bearer ${t}` } });
    const pJson = await pRes.json();
    const allProfiles = pJson.data || [p];
    persist(u, t, p || allProfiles[0], allProfiles);
  };

  const register = async (email: string, password: string, name?: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Registration failed');
    const { user: u, token: t, profile: p } = json.data;
    persist(u, t, p, [p]);
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setToken(null);
    setProfile(null);
    setProfiles([]);
    localStorage.removeItem('tc_auth');
    router.push('/');
  };

  const switchProfile = (p: Profile) => {
    setProfile(p);
    const stored = localStorage.getItem('tc_auth');
    if (stored) {
      const parsed = JSON.parse(stored);
      localStorage.setItem('tc_auth', JSON.stringify({ ...parsed, profile: p }));
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, profiles, token, loading, login, register, logout, switchProfile, refreshProfiles }}>
      {children}
    </AuthContext.Provider>
  );
}
