// Pure SVG speedometer — no external chart library needed.
import styles from './ConfidenceGauge.module.css';

function polarToXY(cx, cy, r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx, cy, r, startDeg, endDeg) {
  const s = polarToXY(cx, cy, r, endDeg);
  const e = polarToXY(cx, cy, r, startDeg);
  const large = endDeg - startDeg <= 180 ? '0' : '1';
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y}`;
}

function scoreColor(s) {
  if (s === null) return '#e5e7eb';
  if (s >= 80)   return '#10b981';
  if (s >= 60)   return '#6366f1';
  if (s >= 40)   return '#f59e0b';
  return '#ef4444';
}

function scoreLabel(s) {
  if (s === null) return 'Pending';
  if (s >= 80)   return 'Very High';
  if (s >= 60)   return 'High';
  if (s >= 40)   return 'Moderate';
  return 'Low';
}

const CX = 110, CY = 110, R = 76;
const START = -210, END = 30; // 240° sweep

export default function ConfidenceGauge({ score }) {
  const pct   = score != null ? Math.min(100, Math.max(0, score)) : null;
  const color = scoreColor(pct);
  const fillEnd = pct != null ? START + (pct / 100) * (END - START) : START;
  const needleAngle = pct != null ? START + (pct / 100) * (END - START) : START;

  const needleTip  = polarToXY(CX, CY, R - 14, needleAngle);
  const needleBase = polarToXY(CX, CY, 11, needleAngle + 180);
  const needleL    = polarToXY(CX, CY, 7,  needleAngle + 90);
  const needleR    = polarToXY(CX, CY, 7,  needleAngle - 90);

  return (
    <div className={styles.wrap}>
      <svg width={220} height={155} viewBox="0 0 220 155" style={{ overflow: 'visible' }}>
        {/* Track */}
        <path d={arcPath(CX, CY, R, START, END)} fill="none" stroke="#f3f4f6" strokeWidth={12} strokeLinecap="round" />

        {/* Zone arcs */}
        <path d={arcPath(CX, CY, R, START, START + 96)}  fill="none" stroke="rgba(239,68,68,0.15)"   strokeWidth={12} />
        <path d={arcPath(CX, CY, R, START + 96, START + 168)} fill="none" stroke="rgba(245,158,11,0.15)" strokeWidth={12} />
        <path d={arcPath(CX, CY, R, START + 168, END)}   fill="none" stroke="rgba(16,185,129,0.15)"  strokeWidth={12} />

        {/* Score fill */}
        {pct != null && pct > 0 && (
          <path d={arcPath(CX, CY, R, START, fillEnd)} fill="none" stroke={color} strokeWidth={9} strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 6px ${color}60)` }} />
        )}

        {/* Ticks */}
        {[0, 20, 40, 60, 80, 100].map((t) => {
          const deg = START + (t / 100) * (END - START);
          const inner = polarToXY(CX, CY, R - 10, deg);
          const outer = polarToXY(CX, CY, R + 3,  deg);
          return <line key={t} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="#d1d5db" strokeWidth={1.5} strokeLinecap="round" />;
        })}

        {/* Needle */}
        <polygon
          points={`${needleTip.x},${needleTip.y} ${needleL.x},${needleL.y} ${needleBase.x},${needleBase.y} ${needleR.x},${needleR.y}`}
          fill={pct != null ? color : '#d1d5db'}
          opacity={0.9}
        />
        <circle cx={CX} cy={CY} r={6} fill="#fff" stroke={color} strokeWidth={2} />
        <circle cx={CX} cy={CY} r={3} fill={pct != null ? color : '#d1d5db'} />

        {/* Score text */}
        <text x={CX} y={CY + 28} textAnchor="middle" fontSize={26} fontWeight={800} fill={pct != null ? color : '#d1d5db'} fontFamily="Inter,sans-serif">
          {pct != null ? `${pct}%` : '—'}
        </text>
        <text x={CX} y={CY + 43} textAnchor="middle" fontSize={9} fill="#9ca3af" fontFamily="Inter,sans-serif" letterSpacing="2">
          CONFIDENCE
        </text>
      </svg>

      {/* Label */}
      <div className={styles.label} style={{ background: `${color}15`, border: `1px solid ${color}40`, color }}>
        {scoreLabel(pct)}
      </div>
    </div>
  );
}
