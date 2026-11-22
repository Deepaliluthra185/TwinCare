'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) return null;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Nav */}
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">T</div>
          <span className="font-semibold text-white">TwinCare</span>
        </div>
        <div className="flex gap-3">
          <Link href="/login" className="btn-secondary text-xs">Sign In</Link>
          <Link href="/register" className="btn-primary text-xs">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 rounded-full px-3 py-1 text-teal-400 text-xs mb-6">
          <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse"></span>
          Your Personal Health Digital Twin
        </div>

        <h1 className="text-4xl md:text-6xl font-bold text-white mb-5 leading-tight">
          Know your body before{' '}
          <span className="text-teal-400">it tells you</span>
        </h1>

        <p className="text-slate-400 text-lg md:text-xl mb-8 max-w-2xl leading-relaxed">
          TwinCare models your major body systems in real time — circulatory, endocrine, nervous and more — from your lab reports, daily check-ins, and health data. The goal is early prevention, not reactive treatment.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mb-16">
          <Link href="/register" className="btn-primary px-8 py-3 text-base">
            Create my health twin →
          </Link>
          <Link href="/login" className="btn-secondary px-8 py-3 text-base">
            Sign in
          </Link>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full text-left">
          {[
            { icon: '🫀', title: 'Body System Dashboard', desc: 'Visual twin with 9 systems, each color-coded green/yellow/red from your actual health data.' },
            { icon: '📋', title: 'Lab Report Analysis', desc: 'Upload PDF or photo lab reports. AI extracts values, flags abnormals, and shows trends over time.' },
            { icon: '🤖', title: 'AI Health Assistant', desc: 'Ask about symptoms, medicines, and trends. Grounded in your data, never guessing. Emergency detection built in.' },
            { icon: '📅', title: 'Daily Check-ins', desc: '30-second daily log for sleep, mood, energy, and vitals. Trend detection catches early warning signs.' },
            { icon: '💊', title: 'Medicine Tracker', desc: 'Track medications, schedules, and adherence. See which body systems each medicine affects.' },
            { icon: '🔬', title: 'What-if Simulator', desc: "Explore scenarios like 'what if I sleep 5 hours for a month?' and see projected system impacts." },
          ].map((f) => (
            <div key={f.title} className="card">
              <div className="text-2xl mb-2">{f.icon}</div>
              <h3 className="font-semibold text-white mb-1 text-sm">{f.title}</h3>
              <p className="text-slate-400 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <p className="text-slate-600 text-xs mt-10 max-w-xl">
          ⚕️ TwinCare is a health information tool, not a medical device or diagnostic service. Always consult a qualified healthcare professional for medical advice.
        </p>
      </main>
    </div>
  );
}
