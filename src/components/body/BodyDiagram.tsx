'use client';

import { SystemName, SystemStatus, SystemStatusMap } from '@/types';

interface Props {
  statuses: Partial<SystemStatusMap>;
  onSelectSystem?: (system: SystemName) => void;
  selectedSystem?: SystemName | null;
  highlightedSystems?: SystemName[];
}

const STATUS_COLOR: Record<SystemStatus, string> = {
  normal:    '#3FB68B',
  mild:      '#E0A93B',
  attention: '#E5534B',
};
const MUTED    = '#2A323D';
const SELECTED_STROKE = '#E8ECF1';

type SystemDef = {
  label: string;
  shortLabel: string;
  /* leader line endpoint on diagram + label anchor */
  leaderX: number; leaderY: number;
  labelSide: 'left' | 'right';
};

const SYSTEMS: Record<SystemName, SystemDef> = {
  nervous:        { label: 'Brain & nervous',  shortLabel: 'Brain',      leaderX: 100, leaderY: 42,  labelSide: 'right' },
  circulatory:    { label: 'Heart & blood',    shortLabel: 'Heart',      leaderX: 100, leaderY: 118, labelSide: 'left'  },
  respiratory:    { label: 'Lungs',            shortLabel: 'Lungs',      leaderX: 100, leaderY: 108, labelSide: 'right' },
  endocrine:      { label: 'Endocrine',        shortLabel: 'Thyroid',    leaderX: 100, leaderY: 78,  labelSide: 'left'  },
  immune:         { label: 'Immune system',    shortLabel: 'Immune',     leaderX: 71,  leaderY: 128, labelSide: 'left'  },
  digestive:      { label: 'Digestive',        shortLabel: 'Stomach',    leaderX: 100, leaderY: 155, labelSide: 'right' },
  urinary:        { label: 'Kidneys',          shortLabel: 'Kidneys',    leaderX: 120, leaderY: 170, labelSide: 'right' },
  musculoskeletal:{ label: 'Muscles & bones',  shortLabel: 'Muscles',    leaderX: 42,  leaderY: 140, labelSide: 'left'  },
  skin:           { label: 'Skin',             shortLabel: 'Skin',       leaderX: 148, leaderY: 195, labelSide: 'right' },
};

function systemColor(sys: SystemName, statuses: Partial<SystemStatusMap>, selected: SystemName | null, highlighted: SystemName[]): { fill: string; opacity: number; pulse: boolean } {
  if (highlighted.includes(sys)) return { fill: '#6366f1', opacity: 0.75, pulse: false };
  const s = statuses[sys];
  if (!s || s === 'normal') {
    if (selected === sys) return { fill: STATUS_COLOR.normal, opacity: 0.70, pulse: false };
    return { fill: MUTED, opacity: selected ? 0.25 : 0.55, pulse: false };
  }
  if (selected && selected !== sys) return { fill: STATUS_COLOR[s], opacity: 0.20, pulse: false };
  return { fill: STATUS_COLOR[s], opacity: 0.80, pulse: s === 'attention' };
}

export default function BodyDiagram({ statuses, onSelectSystem, selectedSystem, highlightedSystems = [] }: Props) {
  const col = (sys: SystemName) => systemColor(sys, statuses, selectedSystem ?? null, highlightedSystems);
  const sel = (sys: SystemName) => selectedSystem === sys;

  const click = (sys: SystemName) => onSelectSystem?.(sys);

  /* Status dot color for leader labels */
  const dotColor = (sys: SystemName) => {
    const s = statuses[sys];
    if (!s || s === 'normal') return STATUS_COLOR.normal;
    return STATUS_COLOR[s];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', userSelect: 'none', width: '100%' }}>
      <svg
        viewBox="0 0 320 460"
        style={{ width: '100%', maxWidth: 320, overflow: 'visible' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Subtle selection glow */}
          <filter id="tc-sel" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <style>{`
            .tc-sys { cursor: pointer; transition: opacity 220ms ease; }
            @keyframes tcpulse { 0%,100%{opacity:0.80} 50%{opacity:0.38} }
            .tc-pulse-anim { animation: tcpulse 2.4s ease-in-out infinite; }
          `}</style>
        </defs>

        {/* ── Body outline – thin 1.5px anatomical strokes ── */}

        {/* Head */}
        <ellipse cx="160" cy="52" rx="34" ry="40"
          fill="var(--raised)" stroke="var(--border)" strokeWidth="1.5" />

        {/* Neck */}
        <path d="M148,90 L148,108 Q160,114 172,108 L172,90 Q160,86 148,90Z"
          fill="var(--raised)" stroke="var(--border)" strokeWidth="1.5" />

        {/* Shoulders & upper arms */}
        <path d="M108,118 Q88,114 72,122 L62,210 Q68,216 76,210 L88,148 Q108,140 120,140"
          fill="var(--raised)" stroke="var(--border)" strokeWidth="1.5" />
        <path d="M212,118 Q232,114 248,122 L258,210 Q252,216 244,210 L232,148 Q212,140 200,140"
          fill="var(--raised)" stroke="var(--border)" strokeWidth="1.5" />

        {/* Forearms */}
        <path d="M62,210 Q58,228 60,250 L68,268 Q76,268 80,250 L76,210"
          fill="var(--raised)" stroke="var(--border)" strokeWidth="1.5" />
        <path d="M258,210 Q262,228 260,250 L252,268 Q244,268 240,250 L244,210"
          fill="var(--raised)" stroke="var(--border)" strokeWidth="1.5" />

        {/* Torso */}
        <path d="M108,118 Q102,116 100,120 L100,290 Q108,300 160,302 Q212,300 220,290 L220,120 Q218,116 212,118 Q186,124 160,124 Q134,124 108,118Z"
          fill="var(--raised)" stroke="var(--border)" strokeWidth="1.5" />

        {/* Hips */}
        <path d="M100,290 Q94,308 96,320 L132,322 L132,290"
          fill="var(--raised)" stroke="var(--border)" strokeWidth="1" />
        <path d="M220,290 Q226,308 224,320 L188,322 L188,290"
          fill="var(--raised)" stroke="var(--border)" strokeWidth="1" />

        {/* Thighs */}
        <path d="M96,320 L96,400 Q108,408 128,406 L132,320"
          fill="var(--raised)" stroke="var(--border)" strokeWidth="1.5" />
        <path d="M224,320 L224,400 Q212,408 192,406 L188,320"
          fill="var(--raised)" stroke="var(--border)" strokeWidth="1.5" />

        {/* Lower legs */}
        <path d="M96,400 Q94,436 98,452 L118,454 Q130,454 132,440 L128,406"
          fill="var(--raised)" stroke="var(--border)" strokeWidth="1.5" />
        <path d="M224,400 Q226,436 222,452 L202,454 Q190,454 188,440 L192,406"
          fill="var(--raised)" stroke="var(--border)" strokeWidth="1.5" />

        {/* Spine dots */}
        {[138,150,162,174,186,198,210,222,234,246,258,270].map((y, i) => (
          <circle key={i} cx="160" cy={y} r="2" fill="var(--border)" opacity="0.8" />
        ))}

        {/* Clavicles */}
        <path d="M120,122 Q140,118 160,120 Q180,118 200,122" fill="none" stroke="var(--border)" strokeWidth="1" />

        {/* Rib cage outline */}
        <ellipse cx="160" cy="168" rx="46" ry="38" fill="none" stroke="var(--border)" strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />

        {/* Pelvis outline */}
        <ellipse cx="160" cy="288" rx="52" ry="20" fill="none" stroke="var(--border)" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />

        {/* ── System overlays ── */}

        {/* Nervous – brain ellipse */}
        {(() => { const c = col('nervous'); return (
          <ellipse cx="160" cy="50" rx="24" ry="28"
            className={`tc-sys${c.pulse ? ' tc-pulse-anim' : ''}`}
            fill={c.fill} fillOpacity={c.opacity}
            stroke={sel('nervous') ? SELECTED_STROKE : 'none'} strokeWidth={sel('nervous') ? 1.5 : 0}
            style={sel('nervous') ? { filter: 'url(#tc-sel)' } : undefined}
            onClick={() => click('nervous')} />
        ); })()}

        {/* Endocrine – thyroid at neck */}
        {(() => { const c = col('endocrine'); return (<>
          <ellipse cx="160" cy="98" rx="8" ry="6"
            className={`tc-sys${c.pulse ? ' tc-pulse-anim' : ''}`}
            fill={c.fill} fillOpacity={c.opacity}
            stroke={sel('endocrine') ? SELECTED_STROKE : 'none'} strokeWidth={sel('endocrine') ? 1.5 : 0}
            onClick={() => click('endocrine')} />
          {/* Pancreas */}
          <ellipse cx="148" cy="232" rx="14" ry="6"
            className="tc-sys" fill={c.fill} fillOpacity={c.opacity * 0.8}
            onClick={() => click('endocrine')} />
        </>); })()}

        {/* Respiratory – lungs */}
        {(() => { const c = col('respiratory'); return (<>
          <path d="M118,138 Q110,148 110,172 Q112,192 124,196 Q138,196 142,180 Q144,160 140,138Z"
            className={`tc-sys${c.pulse ? ' tc-pulse-anim' : ''}`}
            fill={c.fill} fillOpacity={c.opacity}
            stroke={sel('respiratory') ? SELECTED_STROKE : 'none'} strokeWidth={sel('respiratory') ? 1.5 : 0}
            style={sel('respiratory') ? { filter: 'url(#tc-sel)' } : undefined}
            onClick={() => click('respiratory')} />
          <path d="M202,138 Q210,148 210,172 Q208,192 196,196 Q182,196 178,180 Q176,160 180,138Z"
            className="tc-sys" fill={c.fill} fillOpacity={c.opacity}
            stroke={sel('respiratory') ? SELECTED_STROKE : 'none'} strokeWidth={sel('respiratory') ? 1.5 : 0}
            onClick={() => click('respiratory')} />
        </>); })()}

        {/* Circulatory – heart */}
        {(() => { const c = col('circulatory'); return (
          <path d="M160,172 C158,160 146,156 146,166 C146,176 160,186 160,186 C160,186 174,176 174,166 C174,156 162,160 160,172Z"
            className={`tc-sys${c.pulse ? ' tc-pulse-anim' : ''}`}
            fill={c.fill} fillOpacity={c.opacity}
            stroke={sel('circulatory') ? SELECTED_STROKE : 'none'} strokeWidth={sel('circulatory') ? 1.5 : 0}
            style={sel('circulatory') ? { filter: 'url(#tc-sel)' } : undefined}
            onClick={() => click('circulatory')} />
        ); })()}

        {/* Digestive – stomach + intestines */}
        {(() => { const c = col('digestive'); return (<>
          <ellipse cx="160" cy="218" rx="28" ry="22"
            className={`tc-sys${c.pulse ? ' tc-pulse-anim' : ''}`}
            fill={c.fill} fillOpacity={c.opacity}
            stroke={sel('digestive') ? SELECTED_STROKE : 'none'} strokeWidth={sel('digestive') ? 1.5 : 0}
            style={sel('digestive') ? { filter: 'url(#tc-sel)' } : undefined}
            onClick={() => click('digestive')} />
          {/* Intestines */}
          <path d="M134,244 Q128,264 138,278 Q152,284 160,280 Q168,284 182,278 Q192,264 186,244"
            className="tc-sys" fill={c.fill} fillOpacity={c.opacity * 0.65}
            stroke="none" onClick={() => click('digestive')} />
        </>); })()}

        {/* Immune – lymph nodes */}
        {(() => { const c = col('immune'); return (<>
          {[[112,148],[112,180],[112,210],[208,148],[208,180],[208,210]].map(([x,y], i) => (
            <circle key={i} cx={x} cy={y} r={5}
              className={`tc-sys${c.pulse ? ' tc-pulse-anim' : ''}`}
              fill={c.fill} fillOpacity={c.opacity}
              stroke={sel('immune') ? SELECTED_STROKE : 'none'} strokeWidth={sel('immune') ? 1 : 0}
              onClick={() => click('immune')} />
          ))}
        </>); })()}

        {/* Urinary – kidneys */}
        {(() => { const c = col('urinary'); return (<>
          <path d="M130,254 Q120,252 118,264 Q118,278 128,280 Q138,278 140,266 Q140,254 130,254Z"
            className={`tc-sys${c.pulse ? ' tc-pulse-anim' : ''}`}
            fill={c.fill} fillOpacity={c.opacity}
            stroke={sel('urinary') ? SELECTED_STROKE : 'none'} strokeWidth={sel('urinary') ? 1.5 : 0}
            style={sel('urinary') ? { filter: 'url(#tc-sel)' } : undefined}
            onClick={() => click('urinary')} />
          <path d="M190,254 Q200,252 202,264 Q202,278 192,280 Q182,278 180,266 Q180,254 190,254Z"
            className="tc-sys" fill={c.fill} fillOpacity={c.opacity}
            stroke={sel('urinary') ? SELECTED_STROKE : 'none'} strokeWidth={sel('urinary') ? 1.5 : 0}
            onClick={() => click('urinary')} />
        </>); })()}

        {/* Musculoskeletal – arm + leg muscle overlays */}
        {(() => { const c = col('musculoskeletal'); return (<>
          <path d="M66,128 Q60,160 62,210 L76,210 Q78,160 80,128Z"
            className={`tc-sys${c.pulse ? ' tc-pulse-anim' : ''}`}
            fill={c.fill} fillOpacity={c.opacity * 0.7}
            stroke={sel('musculoskeletal') ? SELECTED_STROKE : 'none'} strokeWidth={sel('musculoskeletal') ? 1 : 0}
            onClick={() => click('musculoskeletal')} />
          <path d="M254,128 Q260,160 258,210 L244,210 Q242,160 240,128Z"
            className="tc-sys" fill={c.fill} fillOpacity={c.opacity * 0.7}
            onClick={() => click('musculoskeletal')} />
          <path d="M98,326 L98,400 L130,406 L130,326Z"
            className="tc-sys" fill={c.fill} fillOpacity={c.opacity * 0.55}
            onClick={() => click('musculoskeletal')} />
          <path d="M222,326 L222,400 L190,406 L190,326Z"
            className="tc-sys" fill={c.fill} fillOpacity={c.opacity * 0.55}
            onClick={() => click('musculoskeletal')} />
        </>); })()}

        {/* Skin – thin outline overlay on torso */}
        {(() => { const c = col('skin'); return (
          <path d="M108,118 Q102,116 100,120 L100,290 Q108,300 160,302 Q212,300 220,290 L220,120 Q218,116 212,118 Q186,124 160,124 Q134,124 108,118Z"
            className={`tc-sys${c.pulse ? ' tc-pulse-anim' : ''}`}
            fill={c.fill} fillOpacity={c.opacity * 0.12}
            stroke={sel('skin') ? c.fill : c.fill} strokeWidth={sel('skin') ? 2 : 0.5} strokeOpacity={sel('skin') ? 0.9 : 0.35}
            onClick={() => click('skin')} />
        ); })()}

        {/* ── Leader lines + labels ── */}
        {(Object.entries(SYSTEMS) as [SystemName, SystemDef][]).map(([sys, def]) => {
          const isLeft = def.labelSide === 'left';
          const lx1 = def.leaderX;
          const ly1 = def.leaderY;
          const lx2 = isLeft ? lx1 - 32 : lx1 + 32;
          const ly2 = ly1;
          const textX = isLeft ? lx2 - 4 : lx2 + 4;
          const isSel = sel(sys);
          const dc = dotColor(sys);
          const hasFlag = statuses[sys] && statuses[sys] !== 'normal';
          return (
            <g key={sys} className="tc-sys" onClick={() => click(sys)} style={{ opacity: selectedSystem && !isSel ? 0.45 : 1, transition: 'opacity 180ms' }}>
              <line x1={lx1} y1={ly1} x2={lx2} y2={ly2}
                stroke={isSel ? 'var(--accent)' : 'var(--border)'} strokeWidth="1" />
              <circle cx={lx1} cy={ly1} r="2.5" fill={isSel ? 'var(--accent)' : dc} />
              <text x={textX} y={ly1 + 1}
                textAnchor={isLeft ? 'end' : 'start'}
                fontSize="8.5" fontWeight={isSel ? 600 : 400}
                fill={isSel ? 'var(--text-primary)' : 'var(--text-secondary)'}
                dominantBaseline="middle"
                style={{ fontFamily: 'var(--font-inter, Inter, sans-serif)', pointerEvents: 'none' }}
              >
                {def.shortLabel}
                {hasFlag && ' ●'}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        {(['normal', 'mild', 'attention'] as SystemStatus[]).map(s => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS_COLOR[s], flexShrink: 0 }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {s === 'normal' ? 'Normal' : s === 'mild' ? 'Mild concern' : 'Needs attention'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
