'use client';

import { SystemName, SystemStatus, SystemStatusMap } from '@/types';

interface Props {
  statuses: Partial<SystemStatusMap>;
  onSelectSystem?: (system: SystemName) => void;
  selectedSystem?: SystemName | null;
  highlightedSystems?: SystemName[];
}

const statusColor: Record<SystemStatus, string> = {
  normal: '#10b981',   // emerald
  mild: '#f59e0b',     // amber
  attention: '#f43f5e', // rose
};

const defaultColor = '#334155'; // slate-700

function getColor(system: SystemName, statuses: Partial<SystemStatusMap>, highlighted: SystemName[]): string {
  if (highlighted.includes(system)) return '#6366f1'; // indigo for highlighted
  const s = statuses[system];
  if (!s) return defaultColor;
  return statusColor[s];
}

export default function BodyDiagram({ statuses, onSelectSystem, selectedSystem, highlightedSystems = [] }: Props) {
  const color = (s: SystemName) => getColor(s, statuses, highlightedSystems);
  const isSelected = (s: SystemName) => selectedSystem === s;

  const handleClick = (s: SystemName) => {
    onSelectSystem?.(s);
  };

  const systemLabel: Record<SystemName, string> = {
    circulatory: 'Heart & Blood',
    respiratory: 'Lungs',
    digestive: 'Digestive',
    nervous: 'Brain & Nerves',
    endocrine: 'Hormones',
    immune: 'Immune',
    urinary: 'Kidneys',
    musculoskeletal: 'Muscles & Bones',
    skin: 'Skin',
  };

  return (
    <div className="flex flex-col items-center select-none">
      <svg viewBox="0 0 200 400" className="w-full max-w-xs" xmlns="http://www.w3.org/2000/svg">
        {/* Body outline */}
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Head */}
        <ellipse cx="100" cy="40" rx="28" ry="32" fill="#1e293b" stroke="#475569" strokeWidth="1.5"/>

        {/* Brain / Nervous (head) */}
        <ellipse
          cx="100" cy="38" rx="20" ry="22"
          fill={color('nervous')} fillOpacity="0.7"
          stroke={isSelected('nervous') ? '#fff' : 'none'} strokeWidth={isSelected('nervous') ? 2 : 0}
          className="cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => handleClick('nervous')}
          style={{ filter: isSelected('nervous') ? 'url(#glow)' : undefined }}
        />

        {/* Neck */}
        <rect x="90" y="70" width="20" height="20" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1"/>

        {/* Torso */}
        <rect x="62" y="88" width="76" height="130" rx="12" fill="#1e293b" stroke="#475569" strokeWidth="1.5"/>

        {/* Skin (outer layer of torso + limbs) */}
        <rect
          x="62" y="88" width="76" height="130" rx="12"
          fill={color('skin')} fillOpacity="0.08"
          stroke={isSelected('skin') ? '#fff' : color('skin')} strokeWidth={isSelected('skin') ? 2 : 0.5} strokeOpacity="0.4"
          className="cursor-pointer hover:opacity-90"
          onClick={() => handleClick('skin')}
          style={{ filter: isSelected('skin') ? 'url(#glow)' : undefined }}
        />

        {/* Respiratory (lungs – upper torso) */}
        <ellipse
          cx="88" cy="112" rx="16" ry="20"
          fill={color('respiratory')} fillOpacity="0.75"
          stroke={isSelected('respiratory') ? '#fff' : 'none'} strokeWidth={isSelected('respiratory') ? 2 : 0}
          className="cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => handleClick('respiratory')}
          style={{ filter: isSelected('respiratory') ? 'url(#glow)' : undefined }}
        />
        <ellipse
          cx="112" cy="112" rx="16" ry="20"
          fill={color('respiratory')} fillOpacity="0.75"
          stroke={isSelected('respiratory') ? '#fff' : 'none'} strokeWidth={isSelected('respiratory') ? 2 : 0}
          className="cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => handleClick('respiratory')}
          style={{ filter: isSelected('respiratory') ? 'url(#glow)' : undefined }}
        />

        {/* Circulatory (heart – center upper) */}
        <path
          d="M100 118 C98 110, 90 108, 90 116 C90 122 100 128 100 128 C100 128 110 122 110 116 C110 108 102 110 100 118Z"
          fill={color('circulatory')} fillOpacity="0.9"
          stroke={isSelected('circulatory') ? '#fff' : 'none'} strokeWidth={isSelected('circulatory') ? 1.5 : 0}
          className="cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => handleClick('circulatory')}
          style={{ filter: isSelected('circulatory') ? 'url(#glow)' : undefined }}
        />

        {/* Digestive (stomach + intestines – mid torso) */}
        <ellipse
          cx="100" cy="150" rx="22" ry="20"
          fill={color('digestive')} fillOpacity="0.7"
          stroke={isSelected('digestive') ? '#fff' : 'none'} strokeWidth={isSelected('digestive') ? 2 : 0}
          className="cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => handleClick('digestive')}
          style={{ filter: isSelected('digestive') ? 'url(#glow)' : undefined }}
        />

        {/* Endocrine (thyroid neck + pancreas center – small circles) */}
        <circle
          cx="100" cy="78" r="6"
          fill={color('endocrine')} fillOpacity="0.85"
          stroke={isSelected('endocrine') ? '#fff' : 'none'} strokeWidth={isSelected('endocrine') ? 1.5 : 0}
          className="cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => handleClick('endocrine')}
          style={{ filter: isSelected('endocrine') ? 'url(#glow)' : undefined }}
        />
        <ellipse
          cx="100" cy="145" rx="8" ry="6"
          fill={color('endocrine')} fillOpacity="0.75"
          stroke={isSelected('endocrine') ? '#fff' : 'none'} strokeWidth={isSelected('endocrine') ? 1.5 : 0}
          className="cursor-pointer hover:opacity-90"
          onClick={() => handleClick('endocrine')}
        />

        {/* Immune (lymph nodes – sides of torso) */}
        <circle cx="70" cy="118" r="5" fill={color('immune')} fillOpacity="0.75" className="cursor-pointer" onClick={() => handleClick('immune')} stroke={isSelected('immune') ? '#fff' : 'none'} strokeWidth={isSelected('immune') ? 1.5 : 0} style={{ filter: isSelected('immune') ? 'url(#glow)' : undefined }} />
        <circle cx="130" cy="118" r="5" fill={color('immune')} fillOpacity="0.75" className="cursor-pointer" onClick={() => handleClick('immune')} stroke={isSelected('immune') ? '#fff' : 'none'} strokeWidth={isSelected('immune') ? 1.5 : 0} />
        <circle cx="68" cy="140" r="4" fill={color('immune')} fillOpacity="0.6" className="cursor-pointer" onClick={() => handleClick('immune')} />
        <circle cx="132" cy="140" r="4" fill={color('immune')} fillOpacity="0.6" className="cursor-pointer" onClick={() => handleClick('immune')} />

        {/* Urinary (kidneys – lower torso sides) */}
        <ellipse
          cx="80" cy="168" rx="9" ry="13"
          fill={color('urinary')} fillOpacity="0.75"
          stroke={isSelected('urinary') ? '#fff' : 'none'} strokeWidth={isSelected('urinary') ? 2 : 0}
          className="cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => handleClick('urinary')}
          style={{ filter: isSelected('urinary') ? 'url(#glow)' : undefined }}
        />
        <ellipse
          cx="120" cy="168" rx="9" ry="13"
          fill={color('urinary')} fillOpacity="0.75"
          stroke={isSelected('urinary') ? '#fff' : 'none'} strokeWidth={isSelected('urinary') ? 2 : 0}
          className="cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => handleClick('urinary')}
        />

        {/* Arms */}
        <rect x="38" y="90" width="22" height="85" rx="10" fill="#1e293b" stroke="#475569" strokeWidth="1"/>
        <rect x="140" y="90" width="22" height="85" rx="10" fill="#1e293b" stroke="#475569" strokeWidth="1"/>

        {/* Musculoskeletal (arms + legs overlay) */}
        <rect
          x="40" y="92" width="18" height="81" rx="8"
          fill={color('musculoskeletal')} fillOpacity="0.5"
          className="cursor-pointer hover:opacity-90"
          onClick={() => handleClick('musculoskeletal')}
          stroke={isSelected('musculoskeletal') ? '#fff' : 'none'} strokeWidth={isSelected('musculoskeletal') ? 1.5 : 0}
          style={{ filter: isSelected('musculoskeletal') ? 'url(#glow)' : undefined }}
        />
        <rect
          x="142" y="92" width="18" height="81" rx="8"
          fill={color('musculoskeletal')} fillOpacity="0.5"
          className="cursor-pointer hover:opacity-90"
          onClick={() => handleClick('musculoskeletal')}
          stroke={isSelected('musculoskeletal') ? '#fff' : 'none'} strokeWidth={isSelected('musculoskeletal') ? 1.5 : 0}
        />

        {/* Legs */}
        <rect x="70" y="216" width="26" height="120" rx="10" fill="#1e293b" stroke="#475569" strokeWidth="1"/>
        <rect x="104" y="216" width="26" height="120" rx="10" fill="#1e293b" stroke="#475569" strokeWidth="1"/>

        {/* Musculoskeletal legs */}
        <rect
          x="72" y="218" width="22" height="116" rx="8"
          fill={color('musculoskeletal')} fillOpacity="0.45"
          className="cursor-pointer hover:opacity-90"
          onClick={() => handleClick('musculoskeletal')}
        />
        <rect
          x="106" y="218" width="22" height="116" rx="8"
          fill={color('musculoskeletal')} fillOpacity="0.45"
          className="cursor-pointer hover:opacity-90"
          onClick={() => handleClick('musculoskeletal')}
        />

        {/* Spine – decorative */}
        {[94, 102, 110, 118, 126, 134, 142, 150, 158, 166, 174, 182, 190, 198, 206].map((y, i) => (
          <circle key={i} cx="100" cy={y} r="2" fill="#334155" opacity="0.7" />
        ))}
      </svg>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-2 justify-center">
        {[
          { status: 'normal' as SystemStatus, label: 'Normal' },
          { status: 'mild' as SystemStatus, label: 'Mild concern' },
          { status: 'attention' as SystemStatus, label: 'Needs attention' },
        ].map(({ status, label }) => (
          <div key={status} className="flex items-center gap-1.5 text-xs text-slate-400">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColor[status] }} />
            {label}
          </div>
        ))}
      </div>

      {/* System grid */}
      <div className="mt-4 grid grid-cols-3 gap-1.5 w-full max-w-xs">
        {(Object.keys(systemLabel) as SystemName[]).map((sys) => {
          const s = statuses[sys] || 'normal';
          const sel = isSelected(sys);
          return (
            <button
              key={sys}
              onClick={() => handleClick(sys)}
              className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                sel
                  ? 'ring-2 ring-white/40 scale-105'
                  : 'hover:scale-102 hover:brightness-110'
              }`}
              style={{
                backgroundColor: color(sys) + '25',
                borderWidth: 1,
                borderColor: color(sys) + '60',
                color: color(sys),
              }}
            >
              {systemLabel[sys]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
