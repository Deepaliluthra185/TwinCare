'use client';

interface Props {
  values: number[];
  normalMin?: number;
  normalMax?: number;
  height?: number;
}

export function SparklineChart({ values, normalMin, normalMax, height = 56 }: Props) {
  if (values.length < 2) return null;

  const w = 240;
  const h = height;
  const pad = 4;

  const min = Math.min(...values, normalMin ?? Infinity) - 0.5;
  const max = Math.max(...values, normalMax ?? -Infinity) + 0.5;
  const range = max - min || 1;

  const toX = (i: number) => pad + (i / (values.length - 1)) * (w - pad * 2);
  const toY = (v: number) => h - pad - ((v - min) / range) * (h - pad * 2);

  const linePath = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ');

  const normalBandY1 = normalMax != null ? toY(normalMax) : null;
  const normalBandY2 = normalMin != null ? toY(normalMin) : null;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', maxWidth: w, height: h, overflow: 'visible' }}>
      {/* Normal range band */}
      {normalBandY1 != null && normalBandY2 != null && (
        <rect
          x={pad} y={normalBandY1}
          width={w - pad * 2} height={normalBandY2 - normalBandY1}
          fill="var(--status-normal)" fillOpacity="0.08"
        />
      )}

      {/* Normal range boundary lines */}
      {normalBandY1 != null && (
        <line x1={pad} y1={normalBandY1} x2={w - pad} y2={normalBandY1}
          stroke="var(--status-normal)" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
      )}
      {normalBandY2 != null && (
        <line x1={pad} y1={normalBandY2} x2={w - pad} y2={normalBandY2}
          stroke="var(--status-normal)" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
      )}

      {/* Data line */}
      <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Last point dot */}
      <circle
        cx={toX(values.length - 1)} cy={toY(values[values.length - 1])} r="3"
        fill="var(--accent)" />
    </svg>
  );
}
