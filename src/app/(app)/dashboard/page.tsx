'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/useAuth';
import BodyDiagram from '@/components/body/BodyDiagram';
import { SystemName, SystemStatus, SystemStatusMap, SystemReasons } from '@/types';
import Link from 'next/link';

const systemTips: Record<SystemName, { icon: string; tips: string[] }> = {
  circulatory: {
    icon: '🫀',
    tips: [
      '30 minutes of brisk walking daily lowers resting heart rate over 4-6 weeks',
      'Reduce sodium to <2g/day to help manage blood pressure',
      'Omega-3 rich foods (fish, flaxseed) support healthy cholesterol',
    ],
  },
  respiratory: {
    icon: '🫁',
    tips: [
      'Practice diaphragmatic breathing for 5 minutes daily to strengthen lung capacity',
      'Stay in well-ventilated spaces and avoid air pollution when possible',
      'Staying hydrated keeps airways moist and clear',
    ],
  },
  digestive: {
    icon: '🫃',
    tips: [
      'Eat slowly and chew thoroughly to reduce digestive stress',
      'High-fiber foods (whole grains, vegetables) support gut microbiome',
      'Probiotics (yogurt, fermented foods) can improve gut flora',
    ],
  },
  nervous: {
    icon: '🧠',
    tips: [
      '7-9 hours of sleep is essential for neural repair and memory consolidation',
      'Mindfulness or meditation for 10 minutes daily reduces cortisol',
      'Omega-3s, B vitamins, and magnesium support neural health',
    ],
  },
  endocrine: {
    icon: '⚗️',
    tips: [
      'Consistent meal times help regulate blood sugar and hormone cycles',
      'Reduce refined sugar and processed carbs to ease pancreatic load',
      'Regular thyroid and HbA1c checks catch issues early',
    ],
  },
  immune: {
    icon: '🛡️',
    tips: [
      'Adequate sleep (7-9h) is the single most important immune booster',
      'Vitamin C, D, and zinc support immune response',
      'Regular moderate exercise improves immune surveillance',
    ],
  },
  urinary: {
    icon: '💧',
    tips: [
      'Drink 2-3 liters of water daily to flush kidneys',
      'Reduce sodium and protein excess to lower kidney filtration load',
      'Annual creatinine and urine tests catch kidney issues early',
    ],
  },
  musculoskeletal: {
    icon: '🦴',
    tips: [
      'Weight-bearing exercise (walking, light weights) maintains bone density',
      'Adequate calcium (dairy, leafy greens) and Vitamin D are essential',
      'Stretching daily reduces joint stiffness and injury risk',
    ],
  },
  skin: {
    icon: '✨',
    tips: [
      'SPF 30+ sunscreen daily prevents UV damage and premature aging',
      'Hydration from within (water) and without (moisturizer) maintains barrier function',
      'Sleep repairs skin; chronic sleep loss accelerates skin aging',
    ],
  },
};

const systemNames: Record<SystemName, string> = {
  circulatory: 'Circulatory',
  respiratory: 'Respiratory',
  digestive: 'Digestive',
  nervous: 'Nervous',
  endocrine: 'Endocrine',
  immune: 'Immune',
  urinary: 'Urinary',
  musculoskeletal: 'Musculoskeletal',
  skin: 'Skin',
};

const statusLabel: Record<SystemStatus, string> = {
  normal: 'Normal',
  mild: 'Mild Concern',
  attention: 'Needs Attention',
};

const statusBadge: Record<SystemStatus, string> = {
  normal: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  mild: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  attention: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
};

export default function DashboardPage() {
  const { profile, token } = useAuth();
  const [twinStatus, setTwinStatus] = useState<SystemStatusMap | null>(null);
  const [reasons, setReasons] = useState<SystemReasons>({});
  const [selectedSystem, setSelectedSystem] = useState<SystemName | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [trendAlerts, setTrendAlerts] = useState<{ metric: string; message: string; severity: string }[]>([]);

  const fetchTwin = useCallback(async () => {
    if (!profile || !token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/twin/${profile.id}`, {
        headers: { authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.data) {
        const { reasons: r, updatedAt, ...statuses } = json.data;
        setTwinStatus(statuses as SystemStatusMap);
        setReasons(r || {});
        setLastUpdated(updatedAt ? new Date(updatedAt) : null);
      }
    } catch (err) {
      console.error('Failed to fetch twin status', err);
    } finally {
      setLoading(false);
    }
  }, [profile, token]);

  const fetchTrends = useCallback(async () => {
    if (!profile || !token) return;
    try {
      const res = await fetch(`/api/check-ins?profileId=${profile.id}&limit=14`, {
        headers: { authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.data && json.data.length >= 5) {
        const { detectTrends } = await import('@/lib/rulesEngine');
        const alerts = detectTrends(json.data);
        setTrendAlerts(alerts);
      }
    } catch { /* ignore */ }
  }, [profile, token]);

  useEffect(() => {
    fetchTwin();
    fetchTrends();
  }, [fetchTwin, fetchTrends]);

  const selectedData = selectedSystem ? {
    status: twinStatus?.[selectedSystem] || 'normal',
    reasons: reasons[selectedSystem] || [],
    tips: systemTips[selectedSystem],
    name: systemNames[selectedSystem],
  } : null;

  const countByStatus = (s: SystemStatus) =>
    twinStatus ? Object.values(twinStatus).filter((v) => v === s).length : 0;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">
            {profile?.name ? `${profile.name}'s Health Twin` : 'Health Twin'}
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {lastUpdated
              ? `Updated ${lastUpdated.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
              : 'Click a system to explore'}
          </p>
        </div>
        <button onClick={fetchTwin} className="btn-secondary text-xs px-3 py-1.5" disabled={loading}>
          {loading ? '…' : '↻ Refresh'}
        </button>
      </div>

      {/* Status summary */}
      {!loading && twinStatus && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {(['normal', 'mild', 'attention'] as SystemStatus[]).map((s) => (
            <div key={s} className={`card text-center py-3 ${s === 'attention' && countByStatus(s) > 0 ? 'border-rose-500/40' : ''}`}>
              <div className="text-2xl font-bold" style={{ color: s === 'normal' ? '#10b981' : s === 'mild' ? '#f59e0b' : '#f43f5e' }}>
                {countByStatus(s)}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">{statusLabel[s]}</div>
            </div>
          ))}
        </div>
      )}

      {/* Trend alerts */}
      {trendAlerts.length > 0 && (
        <div className="mb-5 space-y-2">
          {trendAlerts.map((alert, i) => (
            <div key={i} className={`flex items-start gap-3 rounded-lg px-4 py-3 text-sm ${alert.severity === 'warning' ? 'bg-amber-500/10 border border-amber-500/20 text-amber-300' : 'bg-sky-500/10 border border-sky-500/20 text-sky-300'}`}>
              <span>{alert.severity === 'warning' ? '📈' : 'ℹ️'}</span>
              <div>
                <span className="font-medium">{alert.metric} trend: </span>
                {alert.message}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Body diagram */}
        <div className="card">
          {loading ? (
            <div className="flex items-center justify-center h-80">
              <div className="text-slate-500 text-sm animate-pulse">Computing twin status…</div>
            </div>
          ) : (
            <BodyDiagram
              statuses={twinStatus || {}}
              onSelectSystem={setSelectedSystem}
              selectedSystem={selectedSystem}
            />
          )}
        </div>

        {/* Detail panel */}
        <div className="card">
          {!selectedSystem ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center">
              <div className="text-4xl mb-3">👆</div>
              <p className="text-slate-400 text-sm">Click any system on the diagram or the grid below to see its status, reasons, and tips</p>
              {!loading && twinStatus && countByStatus('attention') > 0 && (
                <div className="mt-4 bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-2 text-rose-400 text-xs">
                  {countByStatus('attention')} system{countByStatus('attention') > 1 ? 's' : ''} need{countByStatus('attention') === 1 ? 's' : ''} attention
                </div>
              )}
            </div>
          ) : selectedData ? (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{systemTips[selectedSystem].icon}</span>
                <div>
                  <h2 className="font-semibold text-white">{selectedData.name} System</h2>
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-0.5 ${statusBadge[selectedData.status]}`}>
                    {statusLabel[selectedData.status]}
                  </span>
                </div>
              </div>

              {/* Why this status */}
              <div className="mb-4">
                <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Why this status</h3>
                {selectedData.reasons.length === 0 ? (
                  <p className="text-slate-500 text-sm">No flags detected – within normal range</p>
                ) : (
                  <ul className="space-y-1.5">
                    {selectedData.reasons.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <span className="text-amber-400 mt-0.5">•</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Tips */}
              <div>
                <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Actionable tips</h3>
                <ul className="space-y-2">
                  {selectedData.tips.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-teal-400 mt-0.5">✓</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              <Link href="/assistant" className="mt-4 block text-center bg-teal-600/20 border border-teal-600/30 rounded-lg px-4 py-2 text-teal-400 text-sm hover:bg-teal-600/30 transition-colors">
                Ask AI about {selectedData.name.toLowerCase()} system →
              </Link>
            </div>
          ) : null}
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: '/check-in', label: 'Daily Check-in', icon: '✅', desc: 'Log today' },
          { href: '/reports', label: 'Upload Labs', icon: '📋', desc: 'PDF or photo' },
          { href: '/medicines', label: 'Medicines', icon: '💊', desc: 'Track doses' },
          { href: '/assistant', label: 'Ask AI', icon: '🤖', desc: 'Health questions' },
        ].map((a) => (
          <Link key={a.href} href={a.href} className="card card-hover text-center py-4">
            <div className="text-2xl mb-1">{a.icon}</div>
            <div className="text-sm font-medium text-slate-200">{a.label}</div>
            <div className="text-xs text-slate-500">{a.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
