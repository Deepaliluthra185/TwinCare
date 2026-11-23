'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/useAuth';
import BodyDiagram from '@/components/body/BodyDiagram';
import { SystemName, SystemStatus, SystemStatusMap, SystemReasons } from '@/types';
import Link from 'next/link';
import { RefreshCw, MessageSquare, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { SparklineChart } from '@/components/charts/SparklineChart';

/* ── Static config ──────────────────────────────────────────────────────────── */

const SYSTEM_INFO: Record<SystemName, {
  label: string;
  keyMetric: string;
  recs: string[];
  sources: string[];
}> = {
  circulatory: {
    label: 'Heart & blood',
    keyMetric: 'Resting heart rate',
    recs: [
      '30 minutes of brisk walking daily lowers resting heart rate within 4–6 weeks.',
      'Reduce sodium intake to under 2 g/day to support blood pressure management.',
      'Omega-3 rich foods such as oily fish and flaxseed support healthy cholesterol.',
    ],
    sources: ['ACC/AHA Guidelines', 'WHO Cardiovascular fact sheet'],
  },
  respiratory: {
    label: 'Respiratory',
    keyMetric: 'Breathing rate',
    recs: [
      'Diaphragmatic breathing for 5 minutes daily strengthens lung capacity over time.',
      'Avoid prolonged exposure to indoor air pollutants — keep spaces ventilated.',
      'Adequate hydration keeps airways moist and supports mucociliary clearance.',
    ],
    sources: ['BTS Pulmonary Guidelines', 'MedlinePlus – Lung health'],
  },
  digestive: {
    label: 'Digestive',
    keyMetric: 'Liver enzymes (ALT)',
    recs: [
      'High-fibre foods — wholegrains, legumes, vegetables — support gut microbiome diversity.',
      'Eating slowly and chewing thoroughly reduces digestive load.',
      'Fermented foods such as yoghurt and kefir introduce beneficial gut flora.',
    ],
    sources: ['ACG Clinical Guidelines', 'NHS Digestive health'],
  },
  nervous: {
    label: 'Brain & nervous',
    keyMetric: 'Sleep duration',
    recs: [
      'Seven to nine hours of sleep per night is essential for neural repair and memory consolidation.',
      'Ten minutes of daily mindfulness or breathing exercises measurably reduces cortisol.',
      'Vitamins B12, B6, and omega-3 fatty acids support neurological function.',
    ],
    sources: ['Sleep Foundation', 'AAN Neurology Guidelines'],
  },
  endocrine: {
    label: 'Endocrine',
    keyMetric: 'HbA1c',
    recs: [
      'Consistent meal timing helps regulate the cortisol cycle and insulin sensitivity.',
      'Reducing refined carbohydrates eases pancreatic load and stabilises blood glucose.',
      'Annual TSH and HbA1c tests catch thyroid and glycaemic drift early.',
    ],
    sources: ['ADA Standards of Care 2024', 'BTA Thyroid Guidelines'],
  },
  immune: {
    label: 'Immune system',
    keyMetric: 'WBC count',
    recs: [
      'Sleep is the single most evidence-based immune booster — prioritise seven or more hours.',
      'Adequate vitamin D (20–50 ng/mL) is associated with lower infection susceptibility.',
      'Moderate-intensity aerobic exercise three times a week improves immune surveillance.',
    ],
    sources: ['NIH Immune health overview', 'WHO Immunisation guidance'],
  },
  urinary: {
    label: 'Kidneys & urinary',
    keyMetric: 'Creatinine',
    recs: [
      'Drink two to three litres of water daily to support kidney filtration.',
      'Limit excess protein and sodium to reduce filtration burden on the kidneys.',
      'Annual creatinine and urine albumin tests detect early kidney decline.',
    ],
    sources: ['KDIGO Clinical Guidelines', 'NKF Kidney health'],
  },
  musculoskeletal: {
    label: 'Muscles & bones',
    keyMetric: 'Vitamin D level',
    recs: [
      'Weight-bearing activity such as walking or resistance training maintains bone density.',
      'Calcium (1000–1200 mg/day from diet) and vitamin D work together for bone strength.',
      'Stretching for ten minutes daily reduces joint stiffness and injury risk.',
    ],
    sources: ['ACSM Exercise Guidelines', 'NOF Bone health'],
  },
  skin: {
    label: 'Skin',
    keyMetric: 'Hydration & sleep',
    recs: [
      'SPF 30+ sunscreen applied daily prevents UV-related damage and premature ageing.',
      'Consistent seven-to-nine-hour sleep supports overnight skin repair processes.',
      'Systemic hydration from water intake visibly affects skin barrier function.',
    ],
    sources: ['AAD Skin care guidelines', 'BDF Dermatology foundation'],
  },
};

const STATUS_COLOR: Record<SystemStatus, string> = {
  normal:    'var(--status-normal)',
  mild:      'var(--status-mild)',
  attention: 'var(--status-attention)',
};

const STATUS_LABEL: Record<SystemStatus, string> = {
  normal:    'Normal',
  mild:      'Mild concern',
  attention: 'Needs attention',
};

/* ── Component ──────────────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const { profile, token } = useAuth();
  const [twinStatus,    setTwinStatus]    = useState<SystemStatusMap | null>(null);
  const [reasons,       setReasons]       = useState<SystemReasons>({});
  const [selectedSys,   setSelectedSys]   = useState<SystemName | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [lastUpdated,   setLastUpdated]   = useState<Date | null>(null);
  const [trendAlerts,   setTrendAlerts]   = useState<{ metric: string; message: string; severity: string; system: SystemName }[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<number[]>([]);
  const [checkInSpark,  setCheckInSpark]  = useState<number[]>([]);

  const fetchTwin = useCallback(async () => {
    if (!profile || !token) return;
    setLoading(true);
    try {
      const res  = await fetch(`/api/twin/${profile.id}`, { headers: { authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.data) {
        const { reasons: r, updatedAt, id, profileId, ...statuses } = json.data;
        setTwinStatus(statuses as SystemStatusMap);
        setReasons(r || {});
        setLastUpdated(updatedAt ? new Date(updatedAt) : null);
      }
    } catch {}
    finally { setLoading(false); }
  }, [profile, token]);

  const fetchTrends = useCallback(async () => {
    if (!profile || !token) return;
    try {
      const res  = await fetch(`/api/check-ins?profileId=${profile.id}&limit=14`, { headers: { authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.data?.length >= 5) {
        const { detectTrends } = await import('@/lib/rulesEngine');
        setTrendAlerts(detectTrends(json.data) as typeof trendAlerts);
        // Build sparkline for sleep
        const sleepVals = [...json.data].reverse().map((c: { sleepHours: number | null }) => c.sleepHours ?? 0).filter((v: number) => v > 0);
        setCheckInSpark(sleepVals.slice(-14));
      }
    } catch {}
  }, [profile, token]);

  useEffect(() => { fetchTwin(); fetchTrends(); }, [fetchTwin, fetchTrends]);

  const countBy = (s: SystemStatus) =>
    twinStatus ? Object.values(twinStatus).filter(v => v === s).length : 0;

  const flaggedSystems = twinStatus
    ? (Object.entries(twinStatus) as [SystemName, SystemStatus][])
        .filter(([, v]) => v === 'attention' || v === 'mild')
        .sort((a, b) => (a[1] === 'attention' ? -1 : 1))
    : [];

  const selectedInfo = selectedSys ? SYSTEM_INFO[selectedSys] : null;
  const selectedStatus: SystemStatus = twinStatus?.[selectedSys!] || 'normal';
  const selectedReasons = selectedSys ? (reasons[selectedSys] || []) : [];

  const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ', ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  const activeTrends = trendAlerts.filter((_, i) => !dismissedAlerts.includes(i));

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 24px 48px' }}>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 className="tc-page-title">
            {profile?.name ? `${profile.name}'s health twin` : 'Health twin'}
          </h1>
          <p className="tc-caption" style={{ marginTop: 4 }}>
            {lastUpdated ? `Last updated ${fmt(lastUpdated)}` : 'Loading health data…'}
          </p>

          {/* Compact summary row */}
          {!loading && twinStatus && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
              {flaggedSystems.length === 0 ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  <span className="tc-status-dot normal" />
                  All 9 systems within normal range
                </span>
              ) : (
                <>
                  {flaggedSystems.map(([sys, st]) => (
                    <button key={sys} onClick={() => setSelectedSys(sys)}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      <span className={`tc-status-dot ${st}`} />
                      <span style={{ fontSize: '0.8125rem', color: STATUS_COLOR[st] }}>
                        {SYSTEM_INFO[sys].label}
                      </span>
                    </button>
                  ))}
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    · {countBy('normal')} system{countBy('normal') !== 1 ? 's' : ''} normal
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        <button onClick={fetchTwin} className="tc-btn-secondary" disabled={loading} style={{ marginTop: 4 }}>
          <RefreshCw size={14} style={{ ...(loading ? { animation: 'spin 1s linear infinite' } : {}) }} />
          {loading ? 'Refreshing…' : 'Refresh data'}
        </button>
      </div>

      {/* ── Trend insight cards (dismissible) ── */}
      {activeTrends.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {activeTrends.map((alert, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
              padding: '12px 16px', borderRadius: 'var(--radius)',
              background: alert.severity === 'warning' ? 'var(--status-mild-bg)' : 'var(--accent-subtle)',
              border: `1px solid ${alert.severity === 'warning' ? 'rgba(224,169,59,0.25)' : 'var(--accent-border)'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                {alert.severity === 'warning'
                  ? <TrendingUp size={15} style={{ color: 'var(--status-mild)', marginTop: 1, flexShrink: 0 }} />
                  : <TrendingDown size={15} style={{ color: 'var(--accent)', marginTop: 1, flexShrink: 0 }} />}
                <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0 }}>
                  <strong style={{ fontWeight: 500 }}>{alert.metric}:</strong> {alert.message}
                </p>
              </div>
              <button onClick={() => setDismissedAlerts(d => [...d, i])}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-disabled)', fontSize: '1rem', lineHeight: 1, flexShrink: 0, padding: '0 2px' }}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Main two-column layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '55% 1fr', gap: 24, alignItems: 'start' }}>

        {/* Left – body diagram + system list */}
        <div className="tc-card" style={{ padding: '24px 16px' }}>
          {loading ? (
            <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="tc-caption">Computing twin status…</span>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 148px', gap: 16, alignItems: 'start' }}>
              {/* SVG diagram */}
              <BodyDiagram
                statuses={twinStatus || {}}
                onSelectSystem={setSelectedSys}
                selectedSystem={selectedSys}
              />

              {/* System switcher list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 8 }}>
                <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-disabled)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                  Body systems
                </p>
                {(Object.entries(SYSTEM_INFO) as [SystemName, typeof SYSTEM_INFO[SystemName]][]).map(([sys, info]) => {
                  const st: SystemStatus = twinStatus?.[sys] || 'normal';
                  const active = selectedSys === sys;
                  return (
                    <button key={sys} onClick={() => setSelectedSys(active ? null : sys)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 7,
                        padding: '6px 8px', borderRadius: 6,
                        background: active ? 'var(--raised)' : 'transparent',
                        borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
                        paddingLeft: active ? 6 : 8,
                        border: 'none', cursor: 'pointer',
                        textAlign: 'left', transition: 'background 100ms',
                      }}
                      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'var(--raised)'; }}
                      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                    >
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS_COLOR[st], flexShrink: 0 }} />
                      <span style={{ fontSize: '0.8125rem', color: active ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: active ? 500 : 400 }}>
                        {info.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right – detail panel */}
        <div className="tc-card" style={{ minHeight: 480 }}>
          {!selectedSys ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 420, textAlign: 'center', gap: 8 }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                Select a body system to see its status, data, and recommendations.
              </p>
              {!loading && flaggedSystems.length > 0 && (
                <p style={{ fontSize: '0.8125rem', color: 'var(--status-attention)', marginTop: 4 }}>
                  {flaggedSystems.filter(([,v]) => v === 'attention').length > 0
                    ? `${flaggedSystems.filter(([,v]) => v === 'attention').length} system${flaggedSystems.filter(([,v]) => v === 'attention').length > 1 ? 's' : ''} need${flaggedSystems.filter(([,v]) => v === 'attention').length === 1 ? 's' : ''} attention.`
                    : ''}
                </p>
              )}
            </div>
          ) : selectedInfo ? (
            <div className="tc-fadein" key={selectedSys}>
              {/* Panel header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h2 className="tc-section-title">{selectedInfo.label}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLOR[selectedStatus], display: 'inline-block' }} />
                    <span style={{ fontSize: '0.875rem', color: STATUS_COLOR[selectedStatus], fontWeight: 500 }}>
                      {STATUS_LABEL[selectedStatus]}
                    </span>
                  </div>
                </div>
                <button onClick={() => setSelectedSys(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-disabled)', fontSize: '1.1rem', padding: '0 2px', lineHeight: 1 }}>
                  ×
                </button>
              </div>

              {/* Sparkline for key metric */}
              {checkInSpark.length >= 5 && selectedSys === 'nervous' && (
                <div style={{ marginBottom: 20 }}>
                  <p className="tc-caption" style={{ marginBottom: 6 }}>Sleep over last {checkInSpark.length} days (hours)</p>
                  <SparklineChart values={checkInSpark} normalMin={7} normalMax={9} />
                </div>
              )}

              {/* Why this status */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Why this status
                </p>
                {selectedReasons.length === 0 ? (
                  <div style={{ padding: '12px 14px', background: 'var(--raised)', borderRadius: 'var(--radius)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    All measured values for this system are within your age and sex reference range.{' '}
                    <Link href="/reports" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                      View your lab values
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {selectedReasons.map((r, i) => (
                      <div key={i} style={{
                        padding: '10px 14px', background: 'var(--raised)', borderRadius: 'var(--radius)',
                        borderLeft: `3px solid ${STATUS_COLOR[selectedStatus]}`,
                        fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.5,
                      }}>
                        {r}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recommendations — only show if flagged */}
              {selectedStatus !== 'normal' && (
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                    Recommendations
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {selectedInfo.recs.map((rec, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                        <ChevronRight size={14} style={{ color: 'var(--accent)', marginTop: 3, flexShrink: 0 }} />
                        {rec}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sources */}
              <p className="tc-caption" style={{ marginBottom: 16 }}>
                Sources: {selectedInfo.sources.join(' · ')}
              </p>

              {/* CTA */}
              <Link href={`/assistant`}
                style={{ textDecoration: 'none' }}
                onClick={() => typeof window !== 'undefined' && sessionStorage.setItem('tc_assistant_prefill', `Tell me about my ${selectedInfo.label.toLowerCase()} system status`)}>
                <button className="tc-btn-secondary" style={{ width: '100%', justifyContent: 'center', gap: 8 }}>
                  <MessageSquare size={15} strokeWidth={1.5} />
                  Ask the assistant about this system
                </button>
              </Link>
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Quick actions row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 24 }}>
        {[
          { href: '/check-in',  label: 'Log today\'s check-in',  sub: 'Sleep, mood, vitals' },
          { href: '/reports',   label: 'Upload a lab report',    sub: 'PDF or photo' },
          { href: '/medicines', label: 'Review medicines',       sub: 'Active prescriptions' },
          { href: '/assistant', label: 'Ask the assistant',      sub: 'Health questions' },
        ].map(a => (
          <Link key={a.href} href={a.href} style={{ textDecoration: 'none' }}>
            <div className="tc-card card-hover" style={{ padding: '16px 20px' }}>
              <p style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>
                {a.label}
              </p>
              <p className="tc-caption">{a.sub}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
