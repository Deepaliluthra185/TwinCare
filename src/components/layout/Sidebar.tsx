'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { useState } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Body Twin', icon: '🫀' },
  { href: '/reports', label: 'Lab Reports', icon: '📋' },
  { href: '/check-in', label: 'Check-in', icon: '✅' },
  { href: '/medicines', label: 'Medicines', icon: '💊' },
  { href: '/assistant', label: 'AI Assistant', icon: '🤖' },
  { href: '/what-if', label: 'What-if', icon: '🔬' },
  { href: '/doctor-summary', label: 'Doctor Summary', icon: '📄' },
  { href: '/emergency-card', label: 'Emergency Card', icon: '🆘' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { profile, profiles, switchProfile, logout } = useAuth();
  const [showProfiles, setShowProfiles] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="px-4 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-teal-600 rounded-md flex items-center justify-center text-white font-bold text-xs">T</div>
          <span className="font-semibold text-white text-sm">TwinCare</span>
        </div>
      </div>

      {/* Profile switcher */}
      <div className="px-3 py-3 border-b border-slate-800">
        <button
          onClick={() => setShowProfiles(!showProfiles)}
          className="w-full flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2 hover:bg-slate-700 transition-colors"
        >
          <div className="w-6 h-6 bg-teal-700 rounded-full flex items-center justify-center text-white text-xs font-semibold">
            {profile?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <span className="text-sm text-slate-200 flex-1 text-left truncate">{profile?.name || 'Profile'}</span>
          <span className="text-slate-500 text-xs">{showProfiles ? '▲' : '▼'}</span>
        </button>

        {showProfiles && (
          <div className="mt-1 bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
            {profiles.map((p) => (
              <button
                key={p.id}
                onClick={() => { switchProfile(p); setShowProfiles(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-700 transition-colors ${profile?.id === p.id ? 'text-teal-400' : 'text-slate-300'}`}
              >
                <div className="w-5 h-5 bg-slate-600 rounded-full flex items-center justify-center text-white text-xs">
                  {p.name[0]?.toUpperCase()}
                </div>
                {p.name}
                {p.isDefault && <span className="ml-auto text-slate-500">default</span>}
              </button>
            ))}
            <Link href="/settings?tab=profiles" onClick={() => setShowProfiles(false)} className="flex items-center gap-2 px-3 py-2 text-xs text-teal-400 hover:bg-slate-700 border-t border-slate-700">
              + Add profile
            </Link>
          </div>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-teal-600/20 text-teal-400 border border-teal-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-2 py-3 border-t border-slate-800">
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <span className="text-base">🚪</span>
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-56 lg:w-64 bg-slate-900 border-r border-slate-800 z-20">
        <NavContent />
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-teal-600 rounded flex items-center justify-center text-white font-bold text-xs">T</div>
          <span className="font-semibold text-white text-sm">TwinCare</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-slate-400 hover:text-white">
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-20 bg-black/60" onClick={() => setMobileOpen(false)}>
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-slate-900 border-r border-slate-800 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <NavContent />
          </aside>
        </div>
      )}

      {/* Mobile top padding */}
      <div className="md:hidden h-14" />
    </>
  );
}
