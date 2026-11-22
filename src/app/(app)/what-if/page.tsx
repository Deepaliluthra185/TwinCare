'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/useAuth';
import BodyDiagram from '@/components/body/BodyDiagram';
import { SystemStatusMap } from '@/types';

interface Scenario {
  id: string;
  name: string;
  description: string;
  icon: string;
  projectedChanges: Partial<Record<keyof SystemStatusMap, { status: 'normal' | 'mild' | 'attention'; reason: string }>>;
  tips: string[];
}

const SCENARIOS: Scenario[] = [
  {
    id: 'poor_sleep',
    name: 'Sleep only 5 hours/night',
    description: 'Simulates 1 month of chronic sleep deprivation (5h/night)',
    icon: '😴',
    projectedChanges: {
      nervous: { status: 'attention', reason: 'Chronic sleep deprivation impairs cognitive function and increases cortisol' },
      immune: { status: 'mild', reason: 'Sleep loss reduces immune cell production by 30-40%' },
      circulatory: { status: 'mild', reason: 'Elevated blood pressure from cortisol spikes' },
      endocrine: { status: 'mild', reason: 'Disrupted cortisol and insulin sensitivity' },
    },
    tips: ['Even 1 extra hour of sleep reduces cortisol significantly', 'Sleep hygiene: dark room, no screens 1h before bed'],
  },
  {
    id: 'quit_smoking',
    name: 'Quit smoking',
    description: 'Projected improvements after quitting smoking for 1 month',
    icon: '🚭',
    projectedChanges: {
      respiratory: { status: 'mild', reason: 'Lung cilia start recovering; reduced inflammation (improves to normal in 3-6 months)' },
      circulatory: { status: 'normal', reason: 'Carbon monoxide clears; heart rate and BP normalize within days' },
      immune: { status: 'normal', reason: 'Immune function begins recovering immediately' },
    },
    tips: ['Most ex-smokers notice improved breathing within 2 weeks', 'Cardiovascular risk halves within 1 year of quitting'],
  },
  {
    id: 'skip_meals',
    name: 'Skip meals regularly',
    description: 'Skipping breakfast and sometimes lunch for 2 weeks',
    icon: '🍽️',
    projectedChanges: {
      endocrine: { status: 'mild', reason: 'Blood sugar swings; cortisol spikes from fasting stress' },
      digestive: { status: 'mild', reason: 'Irregular meal times disrupt gut motility and acid secretion' },
      nervous: { status: 'mild', reason: 'Energy dips and poor concentration from low blood glucose' },
    },
    tips: ['Even small regular meals stabilize blood sugar better than large infrequent ones', 'High-protein breakfast reduces cravings throughout the day'],
  },
  {
    id: 'daily_exercise',
    name: 'Exercise 30 min daily',
    description: 'Adding 30 minutes of brisk walking daily for 1 month',
    icon: '🏃',
    projectedChanges: {
      circulatory: { status: 'normal', reason: 'Resting heart rate decreases; blood pressure improves' },
      musculoskeletal: { status: 'normal', reason: 'Muscle tone and bone density improve with regular load' },
      nervous: { status: 'normal', reason: 'Endorphins and BDNF increase; mood and sleep quality improve' },
      endocrine: { status: 'normal', reason: 'Insulin sensitivity improves; better blood sugar regulation' },
    },
    tips: ['30 min brisk walk daily lowers cardiovascular risk by 35%', 'Consistency matters more than intensity for long-term health'],
  },
  {
    id: 'high_stress',
    name: 'High stress for 1 month',
    description: 'Prolonged work/life stress with poor coping for 30 days',
    icon: '😰',
    projectedChanges: {
      nervous: { status: 'attention', reason: 'Chronic cortisol elevation damages hippocampal neurons over time' },
      immune: { status: 'mild', reason: 'Cortisol suppresses immune response; increased infection susceptibility' },
      digestive: { status: 'mild', reason: 'Stress disrupts gut-brain axis; IBS-like symptoms common' },
      circulatory: { status: 'mild', reason: 'Elevated cortisol raises BP and heart rate chronically' },
      skin: { status: 'mild', reason: 'Stress hormones trigger skin flares (acne, eczema, psoriasis)' },
    },
    tips: ['10 minutes of daily mindfulness reduces cortisol by 15-20%', 'Social support is the strongest buffer against stress health impacts'],
  },
  {
    id: 'hydration',
    name: 'Drink 3L water daily',
    description: 'Increasing daily water intake to 3 liters for 2 weeks',
    icon: '💧',
    projectedChanges: {
      urinary: { status: 'normal', reason: 'Kidney filtration efficiency improves; reduces stone risk' },
      skin: { status: 'normal', reason: 'Skin elasticity and barrier function improve' },
      digestive: { status: 'normal', reason: 'Better bowel regularity and digestion' },
    },
    tips: ['Most people are chronically slightly dehydrated', 'Urine color should be pale yellow – the simplest hydration check'],
  },
];

export default function WhatIfPage() {
  const { } = useAuth();
  const [selected, setSelected] = useState<Scenario | null>(null);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">What-if Simulator</h1>
        <p className="text-slate-400 text-sm mt-0.5">Explore how lifestyle changes could affect your body systems</p>
        <div className="mt-2 inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5 text-amber-400 text-xs">
          ⚠️ These are estimates based on population research, not personalized predictions.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Scenarios */}
        <div>
          <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Choose a scenario</h2>
          <div className="space-y-2">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelected(selected?.id === s.id ? null : s)}
                className={`w-full text-left card card-hover transition-all ${selected?.id === s.id ? 'border-teal-500/50 bg-teal-500/5' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{s.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{s.name}</p>
                    <p className="text-xs text-slate-500">{s.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Projection */}
        <div>
          {!selected ? (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <div className="text-4xl mb-3">🔮</div>
              <p className="text-slate-400 text-sm">Select a scenario to see projected body system changes</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">{selected.icon}</span>
                  <div>
                    <h2 className="font-semibold text-white">{selected.name}</h2>
                    <p className="text-xs text-slate-500">Projected changes</p>
                  </div>
                </div>

                <BodyDiagram
                  statuses={Object.fromEntries(
                    Object.entries(selected.projectedChanges).map(([k, v]) => [k, v.status])
                  ) as Partial<SystemStatusMap>}
                />
              </div>

              <div className="card">
                <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">Projected impacts</h3>
                <div className="space-y-2">
                  {Object.entries(selected.projectedChanges).map(([system, change]) => (
                    <div key={system} className="flex items-start gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full mt-0.5 capitalize ${change.status === 'normal' ? 'bg-emerald-500/20 text-emerald-400' : change.status === 'mild' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        {system}
                      </span>
                      <p className="text-xs text-slate-400">{change.reason}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">What you can do instead</h3>
                {selected.tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-300 mt-1.5">
                    <span className="text-teal-400 mt-0.5">→</span>
                    {tip}
                  </div>
                ))}
              </div>

              <p className="text-xs text-slate-600 text-center">
                📊 Estimates based on population research. Individual results vary. Consult a doctor for personalized guidance.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
