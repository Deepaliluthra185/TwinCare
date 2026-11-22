'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/useAuth';

interface TwinStatus {
  circulatory: string; respiratory: string; digestive: string;
  nervous: string; endocrine: string; immune: string;
  urinary: string; musculoskeletal: string; skin: string;
  reasons: Record<string, string[]>;
}

interface LabReport { fileName: string | null; reportDate: string | null; labValues: { testName: string; valueText: string | null; value: number | null; unit: string | null; flag: string | null }[] }
interface Medicine { name: string; dosage: string | null; frequency: string | null; isActive: boolean }

export default function DoctorSummaryPage() {
  const { profile, token } = useAuth();
  const [twinStatus, setTwinStatus] = useState<TwinStatus | null>(null);
  const [reports, setReports] = useState<LabReport[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!profile || !token) return;
    setLoading(true);
    try {
      const [twinRes, reportsRes, medsRes] = await Promise.all([
        fetch(`/api/twin/${profile.id}`, { headers: { authorization: `Bearer ${token}` } }),
        fetch(`/api/lab-reports?profileId=${profile.id}`, { headers: { authorization: `Bearer ${token}` } }),
        fetch(`/api/medicines?profileId=${profile.id}`, { headers: { authorization: `Bearer ${token}` } }),
      ]);
      const [twinJson, reportsJson, medsJson] = await Promise.all([twinRes.json(), reportsRes.json(), medsRes.json()]);
      if (twinJson.data) setTwinStatus(twinJson.data);
      if (reportsJson.data) setReports(reportsJson.data.slice(0, 3));
      if (medsJson.data) setMedicines(medsJson.data.filter((m: Medicine) => m.isActive));
    } finally { setLoading(false); }
  }, [profile, token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePrint = () => window.print();

  const knownConditions = profile ? (() => {
    try { return JSON.parse((profile as unknown as Record<string, string>).knownConditions || '[]'); } catch { return []; }
  })() : [];
  const allergies = profile ? (() => {
    try { return JSON.parse((profile as unknown as Record<string, string>).allergies || '[]'); } catch { return []; }
  })() : [];

  const flaggedSystems = twinStatus
    ? Object.entries(twinStatus)
        .filter(([k, v]) => typeof v === 'string' && (v === 'mild' || v === 'attention') && k !== 'reasons')
        .map(([k, v]) => ({ system: k, status: v as string }))
    : [];

  const recentAbnormalLabs = reports
    .flatMap((r) => r.labValues.filter((lv) => lv.flag && lv.flag !== 'normal'))
    .slice(0, 10);

  if (loading) return <div className="p-6 text-slate-500">Loading summary…</div>;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div>
          <h1 className="text-xl font-semibold text-white">Doctor Summary</h1>
          <p className="text-slate-400 text-sm mt-0.5">One-page printable health summary for your doctor visit</p>
        </div>
        <button onClick={handlePrint} className="btn-primary">
          🖨️ Print / Save PDF
        </button>
      </div>

      {/* Printable summary */}
      <div id="summary" className="bg-white text-gray-900 rounded-xl p-8 print:p-0 print:rounded-none">
        {/* Header */}
        <div className="border-b-2 border-teal-600 pb-4 mb-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-teal-700">TwinCare Health Summary</h2>
              <p className="text-gray-500 text-sm">Generated {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-800">{profile?.name}</p>
              <p className="text-gray-500 text-sm">{profile?.age ? `Age: ${profile.age}` : ''} {profile?.sex ? `· ${profile.sex}` : ''}</p>
              <p className="text-gray-500 text-sm">{(profile as unknown as Record<string, string>)?.bloodGroup ? `Blood Group: ${(profile as unknown as Record<string, string>).bloodGroup}` : ''}</p>
            </div>
          </div>
        </div>

        {/* Conditions & Allergies */}
        <div className="grid grid-cols-2 gap-5 mb-5">
          <div>
            <h3 className="font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wide">Known Conditions</h3>
            {knownConditions.length ? (
              <ul className="space-y-1">{knownConditions.map((c: string, i: number) => <li key={i} className="text-sm text-gray-700">• {c}</li>)}</ul>
            ) : <p className="text-sm text-gray-400">None reported</p>}
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wide">Allergies</h3>
            {allergies.length ? (
              <ul className="space-y-1">{allergies.map((a: string, i: number) => <li key={i} className="text-sm text-red-600 font-medium">⚠️ {a}</li>)}</ul>
            ) : <p className="text-sm text-gray-400">None reported</p>}
          </div>
        </div>

        {/* Current medicines */}
        <div className="mb-5">
          <h3 className="font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wide">Current Medications</h3>
          {medicines.length ? (
            <table className="w-full text-sm border-collapse">
              <thead><tr className="bg-gray-100"><th className="text-left p-2 font-medium">Medication</th><th className="text-left p-2 font-medium">Dosage</th><th className="text-left p-2 font-medium">Frequency</th></tr></thead>
              <tbody>{medicines.map((m, i) => (
                <tr key={i} className="border-t border-gray-200">
                  <td className="p-2">{m.name}</td>
                  <td className="p-2">{m.dosage || '—'}</td>
                  <td className="p-2">{m.frequency || '—'}</td>
                </tr>
              ))}</tbody>
            </table>
          ) : <p className="text-sm text-gray-400">No medications listed</p>}
        </div>

        {/* Flagged systems */}
        {flaggedSystems.length > 0 && (
          <div className="mb-5">
            <h3 className="font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wide">Flagged Body Systems</h3>
            <div className="space-y-2">
              {flaggedSystems.map(({ system, status }) => (
                <div key={system} className={`rounded p-3 text-sm ${status === 'attention' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                  <div className="flex items-center gap-2 font-medium capitalize">
                    <span className={status === 'attention' ? 'text-red-600' : 'text-yellow-600'}>
                      {status === 'attention' ? '🔴' : '🟡'} {system}
                    </span>
                    <span className={`text-xs ${status === 'attention' ? 'text-red-500' : 'text-yellow-500'}`}>
                      {status === 'attention' ? 'Needs Attention' : 'Mild Concern'}
                    </span>
                  </div>
                  {twinStatus?.reasons?.[system]?.map((r, i) => (
                    <p key={i} className="text-xs text-gray-600 mt-1 ml-5">• {r}</p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Abnormal labs */}
        {recentAbnormalLabs.length > 0 && (
          <div className="mb-5">
            <h3 className="font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wide">Recent Abnormal Lab Values</h3>
            <table className="w-full text-sm border-collapse">
              <thead><tr className="bg-gray-100"><th className="text-left p-2 font-medium">Test</th><th className="text-left p-2 font-medium">Result</th><th className="text-left p-2 font-medium">Flag</th></tr></thead>
              <tbody>{recentAbnormalLabs.map((lv, i) => (
                <tr key={i} className="border-t border-gray-200">
                  <td className="p-2">{lv.testName}</td>
                  <td className="p-2">{lv.valueText || lv.value} {lv.unit || ''}</td>
                  <td className="p-2">
                    <span className={`font-medium ${lv.flag === 'high' ? 'text-red-600' : lv.flag === 'low' ? 'text-orange-500' : 'text-gray-600'}`}>
                      {lv.flag?.toUpperCase() || '—'}
                    </span>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 pt-3 mt-5 text-xs text-gray-400">
          <p>⚕️ This summary was generated by TwinCare, a personal health tracking application. It is not a clinical record and should not replace professional medical advice.</p>
        </div>
      </div>
    </div>
  );
}
