'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { useTheme } from '@/components/ThemeProvider';
import { useState } from 'react';
import {
  Activity, FileText, ClipboardCheck, Pill,
  MessageSquare, FlaskConical, Stethoscope,
  ShieldAlert, Settings, LogOut, ChevronDown,
  Plus, Sun, Moon, Menu, X,
} from 'lucide-react';

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard',  label: 'Body twin',       Icon: Activity },
      { href: '/reports',    label: 'Lab reports',     Icon: FileText },
      { href: '/check-in',   label: 'Check-in',        Icon: ClipboardCheck },
      { href: '/medicines',  label: 'Medicines',       Icon: Pill },
    ],
  },
  {
    label: 'Tools',
    items: [
      { href: '/assistant',       label: 'Assistant',       Icon: MessageSquare },
      { href: '/what-if',         label: 'What-if',         Icon: FlaskConical },
      { href: '/doctor-summary',  label: 'Doctor summary',  Icon: Stethoscope },
    ],
  },
  {
    label: 'Account',
    items: [
      { href: '/emergency-card', label: 'Emergency card', Icon: ShieldAlert },
      { href: '/settings',       label: 'Settings',       Icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const pathname  = usePathname();
  const { profile, profiles, switchProfile, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [showProfiles, setShowProfiles] = useState(false);
  const [mobileOpen,   setMobileOpen]   = useState(false);

  const initials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const NavContent = () => (
    <div className="flex flex-col h-full" style={{ background: 'var(--surface)' }}>

      {/* Logo + theme toggle */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={15} color="#fff" strokeWidth={2} />
          </div>
          <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>TwinCare</span>
        </div>
        <button onClick={toggle} className="tc-btn-ghost" style={{ padding: '4px 6px' }} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
          {theme === 'dark'
            ? <Sun size={16} style={{ color: 'var(--text-secondary)' }} />
            : <Moon size={16} style={{ color: 'var(--text-secondary)' }} />}
        </button>
      </div>

      {/* Profile switcher */}
      <div className="px-3 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <button
          onClick={() => setShowProfiles(s => !s)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            width: '100%', padding: '8px 10px', borderRadius: 'var(--radius)',
            background: 'var(--raised)', border: '1px solid var(--border)',
            cursor: 'pointer', transition: 'background 120ms',
          }}
        >
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'var(--accent)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: '0.75rem', fontWeight: 600, color: '#fff', flexShrink: 0,
          }}>
            {profile?.name ? initials(profile.name) : '?'}
          </div>
          <span style={{ flex: 1, textAlign: 'left', fontSize: '0.875rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {profile?.name || 'Profile'}
          </span>
          <ChevronDown size={14} style={{ color: 'var(--text-secondary)', transform: showProfiles ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
        </button>

        {showProfiles && (
          <div style={{ marginTop: 4, background: 'var(--raised)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            {profiles.map(p => (
              <button key={p.id} onClick={() => { switchProfile(p); setShowProfiles(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                  padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer',
                  color: p.id === profile?.id ? 'var(--accent)' : 'var(--text-primary)',
                  fontSize: '0.875rem', transition: 'background 100ms',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--border)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', flexShrink: 0 }}>
                  {initials(p.name)}
                </div>
                {p.name}
                {p.isDefault && <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-disabled)' }}>default</span>}
              </button>
            ))}
            <div style={{ borderTop: '1px solid var(--border)' }}>
              <Link href="/settings?tab=profiles" onClick={() => setShowProfiles(false)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', fontSize: '0.875rem', color: 'var(--accent)', textDecoration: 'none' }}>
                <Plus size={13} /> Add profile
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Nav groups */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
        {NAV_GROUPS.map(group => (
          <div key={group.label} style={{ marginBottom: 4 }}>
            <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-disabled)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '10px 8px 4px' }}>
              {group.label}
            </p>
            {group.items.map(({ href, label, Icon }) => {
              const active = pathname === href || pathname.startsWith(href + '/');
              return (
                <Link key={href} href={href} onClick={() => setMobileOpen(false)} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 'var(--radius)',
                    marginBottom: 2,
                    background: active ? 'var(--raised)' : 'transparent',
                    borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
                    paddingLeft: active ? 8 : 10,
                    cursor: 'pointer', transition: 'background 100ms',
                    color: active ? 'var(--accent)' : 'var(--text-secondary)',
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = 'var(--raised)'; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                  >
                    <Icon size={18} strokeWidth={1.5} color={active ? 'var(--accent)' : 'var(--text-secondary)'} />
                    <span style={{ fontSize: '0.9375rem', fontWeight: active ? 500 : 400, color: active ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Sign out */}
      <div style={{ padding: '8px 12px 12px', borderTop: '1px solid var(--border)' }}>
        <button onClick={logout} className="tc-btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', gap: 10, padding: '8px 10px' }}>
          <LogOut size={18} strokeWidth={1.5} />
          <span style={{ fontSize: '0.9375rem' }}>Sign out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar — fixed 240px */}
      <aside className="hidden md:block" style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 240, zIndex: 20, borderRight: '1px solid var(--border)' }}>
        <NavContent />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 30, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: 5, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={13} color="#fff" strokeWidth={2} />
          </div>
          <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>TwinCare</span>
        </div>
        <button onClick={() => setMobileOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden" style={{ position: 'fixed', inset: 0, zIndex: 25, background: 'rgba(0,0,0,0.6)' }} onClick={() => setMobileOpen(false)}>
          <aside style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 240, zIndex: 26 }} onClick={e => e.stopPropagation()}>
            <NavContent />
          </aside>
        </div>
      )}

      {/* Mobile spacer */}
      <div className="md:hidden" style={{ height: 52 }} />
    </>
  );
}
