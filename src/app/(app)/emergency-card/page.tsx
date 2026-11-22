'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/useAuth';
import QRCode from 'qrcode';

export default function EmergencyCardPage() {
  const { profile, token } = useAuth();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const knownConditions = (() => { try { return JSON.parse((profile as unknown as Record<string, string>)?.knownConditions || '[]'); } catch { return []; } })();
  const allergies = (() => { try { return JSON.parse((profile as unknown as Record<string, string>)?.allergies || '[]'); } catch { return []; } })();
  const currentMedicines = (() => { try { return JSON.parse((profile as unknown as Record<string, string>)?.currentMedicines || '[]'); } catch { return []; } })();
  const emergencyContact = (() => { try { const ec = (profile as unknown as Record<string, string>)?.emergencyContact; return ec ? JSON.parse(ec) : null; } catch { return null; } })();

  useEffect(() => {
    if (!profile) return;
    const data = JSON.stringify({
      name: profile.name,
      bloodGroup: (profile as unknown as Record<string, string>)?.bloodGroup || 'Unknown',
      allergies,
      conditions: knownConditions,
      medicines: currentMedicines,
      emergency: emergencyContact,
    });
    QRCode.toDataURL(data, { width: 128, margin: 1 }, (err, url) => {
      if (!err) setQrDataUrl(url);
    });
  }, [profile]);

  if (!profile) return null;

  const bloodGroup = (profile as unknown as Record<string, string>)?.bloodGroup;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Emergency Card</h1>
          <p className="text-slate-400 text-sm mt-0.5">Show this card in an emergency. Keep it accessible.</p>
        </div>
        <button onClick={() => window.print()} className="btn-primary text-sm">
          🖨️ Print Card
        </button>
      </div>

      {/* Emergency card */}
      <div className="bg-gradient-to-br from-rose-950 to-slate-900 border-2 border-rose-500/40 rounded-2xl p-6 max-w-sm mx-auto print:border-rose-500 print:shadow-none">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-rose-400 text-xs font-semibold uppercase tracking-widest mb-0.5">🆘 Emergency Medical Card</div>
            <h2 className="text-xl font-bold text-white">{profile.name}</h2>
            {profile.age && <p className="text-slate-400 text-sm">{profile.age} years{profile.sex ? ` · ${profile.sex}` : ''}</p>}
          </div>
          {qrDataUrl && (
            <div className="bg-white rounded-lg p-1">
              <img src={qrDataUrl} alt="Emergency QR" className="w-20 h-20" />
            </div>
          )}
        </div>

        {/* Blood group */}
        {bloodGroup && (
          <div className="bg-rose-600/30 border border-rose-500/40 rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
            <span className="text-2xl">🩸</span>
            <div>
              <p className="text-xs text-rose-300">Blood Group</p>
              <p className="text-2xl font-bold text-white">{bloodGroup}</p>
            </div>
          </div>
        )}

        {/* Allergies */}
        {allergies.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-rose-300 uppercase tracking-wide mb-1">⚠️ Allergies</p>
            <div className="flex flex-wrap gap-1">
              {allergies.map((a: string, i: number) => (
                <span key={i} className="bg-rose-500/30 text-rose-200 px-2 py-0.5 rounded-full text-xs font-medium">{a}</span>
              ))}
            </div>
          </div>
        )}

        {/* Conditions */}
        {knownConditions.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-amber-300 uppercase tracking-wide mb-1">📋 Conditions</p>
            <div className="flex flex-wrap gap-1">
              {knownConditions.map((c: string, i: number) => (
                <span key={i} className="bg-amber-500/20 text-amber-200 px-2 py-0.5 rounded-full text-xs">{c}</span>
              ))}
            </div>
          </div>
        )}

        {/* Medicines */}
        {currentMedicines.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-sky-300 uppercase tracking-wide mb-1">💊 Medicines</p>
            <div className="flex flex-wrap gap-1">
              {currentMedicines.map((m: string, i: number) => (
                <span key={i} className="bg-sky-500/20 text-sky-200 px-2 py-0.5 rounded-full text-xs">{m}</span>
              ))}
            </div>
          </div>
        )}

        {/* Emergency contact */}
        {emergencyContact && (
          <div className="bg-slate-800/60 rounded-xl px-4 py-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">📞 Emergency Contact</p>
            <p className="text-white font-medium">{emergencyContact.name}</p>
            <p className="text-slate-300 text-sm">{emergencyContact.relation}</p>
            <a href={`tel:${emergencyContact.phone}`} className="text-teal-400 font-bold">{emergencyContact.phone}</a>
          </div>
        )}

        {/* India emergency numbers */}
        <div className="mt-4 border-t border-slate-700/50 pt-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">🇮🇳 Emergency Numbers</p>
          <div className="flex gap-3 text-sm">
            <span className="text-rose-400 font-bold">112</span> <span className="text-slate-500">National</span>
            <span className="text-rose-400 font-bold">108</span> <span className="text-slate-500">Ambulance</span>
          </div>
        </div>
      </div>

      {/* Edit profile prompt */}
      <div className="mt-5 card">
        <p className="text-sm text-slate-400 mb-2">
          {!bloodGroup || allergies.length === 0 ? (
            <>Complete your profile to populate all card fields. Missing: {!bloodGroup && 'blood group'}{!bloodGroup && allergies.length === 0 ? ', ' : ''}{allergies.length === 0 && 'allergies'}</>
          ) : '✅ Emergency card is fully populated.'}
        </p>
        <a href="/settings" className="text-teal-400 text-sm hover:underline">Edit profile →</a>
      </div>
    </div>
  );
}
