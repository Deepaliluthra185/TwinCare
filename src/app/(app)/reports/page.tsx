'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/useAuth';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface LabValue {
  id?: string;
  testName: string;
  value: number | null;
  valueText: string | null;
  unit: string | null;
  reportDate: string | null;
  flag: string | null;
}

interface LabReport {
  id: string;
  fileName: string | null;
  reportDate: string | null;
  status: string;
  labValues: LabValue[];
  createdAt: string;
}

const flagColor: Record<string, string> = {
  normal: 'text-emerald-400',
  high: 'text-rose-400',
  low: 'text-amber-400',
  borderline: 'text-orange-400',
};

const flagBadge: Record<string, string> = {
  normal: 'bg-emerald-500/20 text-emerald-400',
  high: 'bg-rose-500/20 text-rose-400',
  low: 'bg-amber-500/20 text-amber-400',
  borderline: 'bg-orange-500/20 text-orange-400',
};

const TREND_TESTS = ['Hemoglobin', 'HbA1c', 'Fasting Glucose', 'TSH', 'Creatinine', 'Total Cholesterol', 'Vitamin D', 'Vitamin B12'];

export default function ReportsPage() {
  const { profile, token } = useAuth();
  const [reports, setReports] = useState<LabReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [pendingReport, setPendingReport] = useState<string | null>(null);
  const [extractedValues, setExtractedValues] = useState<LabValue[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchReports = useCallback(async () => {
    if (!profile || !token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/lab-reports?profileId=${profile.id}`, {
        headers: { authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setReports(json.data || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [profile, token]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile || !token) return;
    setError('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('profileId', profile.id);
      fd.append('file', file);
      const res = await fetch('/api/lab-reports', {
        method: 'POST',
        headers: { authorization: `Bearer ${token}` },
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      const reportId = json.data.id;
      setPendingReport(reportId);

      // Auto-extract if PDF with text
      setExtracting(true);
      const extRes = await fetch(`/api/lab-reports/${reportId}/extract`, {
        method: 'POST',
        headers: { authorization: `Bearer ${token}` },
      });
      const extJson = await extRes.json();
      if (extRes.ok && extJson.data?.values) {
        setExtractedValues(extJson.data.values);
      } else {
        setError(extJson.error || 'Extraction failed');
        setExtractedValues([]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      setExtracting(false);
    }
  };

  const handleSave = async () => {
    if (!pendingReport || !token) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/lab-reports/${pendingReport}/save`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ values: extractedValues }),
      });
      if (!res.ok) throw new Error('Save failed');
      setPendingReport(null);
      setExtractedValues([]);
      await fetchReports();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const updateValue = (i: number, field: keyof LabValue, val: string | number | null) => {
    setExtractedValues((prev) => prev.map((v, idx) => idx === i ? { ...v, [field]: val } : v));
  };

  // Build trend data
  const trendData = (() => {
    if (!selectedTest) return [];
    const all = reports
      .flatMap((r) =>
        r.labValues
          .filter((lv) => lv.testName.toLowerCase().includes(selectedTest.toLowerCase()) && lv.value != null)
          .map((lv) => ({
            date: r.reportDate ? new Date(r.reportDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'Unknown',
            value: lv.value,
          }))
      )
      .reverse();
    return all;
  })();

  // Get tests available for trends
  const availableTests = [...new Set(
    reports.flatMap((r) => r.labValues.map((lv) => lv.testName)).filter(Boolean)
  )].sort();

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Lab Reports</h1>
          <p className="text-slate-400 text-sm mt-0.5">Upload PDF or photo; AI extracts values</p>
        </div>
        <button onClick={() => fileRef.current?.click()} className="btn-primary" disabled={uploading}>
          {uploading ? 'Uploading…' : '+ Upload Report'}
        </button>
        <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={handleUpload} />
      </div>

      {error && (
        <div className="mb-4 bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-3 text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Extraction panel */}
      {extracting && (
        <div className="card mb-5 text-center py-8">
          <div className="text-3xl mb-2 animate-pulse">🔬</div>
          <p className="text-slate-300 text-sm">AI is extracting values from your report…</p>
          <p className="text-slate-500 text-xs mt-1">This takes about 10-15 seconds</p>
        </div>
      )}

      {pendingReport && extractedValues.length > 0 && !extracting && (
        <div className="card mb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Review Extracted Values</h2>
            <span className="text-xs text-slate-500">Correct any mistakes before saving</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-800">
                  <th className="pb-2 pr-4">Test</th>
                  <th className="pb-2 pr-4">Value</th>
                  <th className="pb-2 pr-4">Unit</th>
                  <th className="pb-2 pr-4">Flag</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {extractedValues.map((v, i) => (
                  <tr key={i}>
                    <td className="py-2 pr-4">
                      <input className="input py-1" value={v.testName} onChange={(e) => updateValue(i, 'testName', e.target.value)} />
                    </td>
                    <td className="py-2 pr-4">
                      <input className="input py-1 w-24" value={v.valueText || ''} onChange={(e) => updateValue(i, 'valueText', e.target.value)} />
                    </td>
                    <td className="py-2 pr-4">
                      <input className="input py-1 w-20" value={v.unit || ''} onChange={(e) => updateValue(i, 'unit', e.target.value)} />
                    </td>
                    <td className="py-2 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${flagBadge[v.flag || 'normal'] || ''}`}>
                        {v.flag || 'normal'}
                      </span>
                    </td>
                    <td className="py-2">
                      <input type="date" className="input py-1 w-36"
                        value={v.reportDate ? new Date(v.reportDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => updateValue(i, 'reportDate', e.target.value ? new Date(e.target.value).toISOString() : null)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleSave} className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save & Update Twin'}
            </button>
            <button onClick={() => { setPendingReport(null); setExtractedValues([]); }} className="btn-secondary">
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Trend chart */}
      {availableTests.length > 0 && (
        <div className="card mb-5">
          <h2 className="font-semibold text-white mb-3">Trend Chart</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {availableTests.map((t) => (
              <button key={t} onClick={() => setSelectedTest(selectedTest === t ? null : t)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${selectedTest === t ? 'bg-teal-600/30 border-teal-500/50 text-teal-300' : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}>
                {t}
              </button>
            ))}
          </div>
          {selectedTest && trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 8 }}
                  labelStyle={{ color: '#94a3b8' }}
                  itemStyle={{ color: '#14b8a6' }}
                />
                <Line type="monotone" dataKey="value" stroke="#14b8a6" strokeWidth={2} dot={{ fill: '#14b8a6' }} name={selectedTest} />
              </LineChart>
            </ResponsiveContainer>
          ) : selectedTest ? (
            <p className="text-slate-500 text-sm text-center py-6">Not enough data points for a trend chart yet</p>
          ) : null}
        </div>
      )}

      {/* Reports list */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading reports…</div>
      ) : reports.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-slate-400 text-sm">No lab reports yet</p>
          <p className="text-slate-600 text-xs mt-1">Upload a PDF or photo of your blood work</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div key={report.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-medium text-slate-200">{report.fileName || 'Lab Report'}</p>
                  <p className="text-xs text-slate-500">
                    {report.reportDate
                      ? new Date(report.reportDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
                      : `Uploaded ${new Date(report.createdAt).toLocaleDateString('en-IN')}`}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${report.status === 'saved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {report.status}
                </span>
              </div>
              {report.labValues.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {report.labValues.map((lv) => (
                    <div key={lv.id} className="bg-slate-800 rounded-lg px-3 py-2">
                      <p className="text-xs text-slate-500 truncate">{lv.testName}</p>
                      <p className={`font-medium text-sm ${flagColor[lv.flag || 'normal'] || 'text-slate-200'}`}>
                        {lv.valueText || lv.value}
                        {lv.unit && <span className="text-slate-500 text-xs ml-1">{lv.unit}</span>}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
