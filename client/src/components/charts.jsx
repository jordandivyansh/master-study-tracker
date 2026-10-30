// Hand-drawn SVG charts. A chart is just a function from a data domain
// (dates, hours) to a pixel range: x = (value - min) / (max - min) * width.
import { shortDate } from '../format.js';

/** The tracker period as a rail with exam stops and a "today" needle. */
export function ExamRail({ start, end, today, exams }) {
  const span = dayNum(end) - dayNum(start);
  const pos = (iso) => Math.max(0, Math.min(100, ((dayNum(iso) - dayNum(start)) / span) * 100));
  const todayPos = pos(today);
  return (
    <div className="rail" aria-label="Exam timeline">
      <div className="rail-track">
        <div className="rail-done" style={{ width: `${todayPos}%` }} />
        {exams.map((e, i) => (
          <div
            key={e.key}
            className={`rail-stop ${i % 2 ? 'below' : 'above'} ${e.daysLeft < 0 ? 'past' : ''} ${pos(e.date) > 75 ? 'flip' : ''}`}
            style={{ left: `${pos(e.date)}%` }}
          >
            <span className="rail-dot" />
            <span className="rail-label">
              <strong>{e.name}</strong>
              <span>{shortDate(e.date)}</span>
              <span className="rail-days">
                {e.daysLeft > 1 ? `${e.daysLeft} days left` : e.daysLeft === 1 ? 'Tomorrow' : e.daysLeft === 0 ? 'Today' : 'Done'}
              </span>
            </span>
          </div>
        ))}
        <div className="rail-today" style={{ left: `${todayPos}%` }} title={`Today, ${shortDate(today)}`} />
      </div>
      <div className="rail-ends">
        <span>{shortDate(start)}</span>
        <span>{shortDate(end)}</span>
      </div>
      {/* Narrow screens: the same information as a list */}
      <ul className="rail-list">
        {exams.map((e) => (
          <li key={e.key} className={e.daysLeft < 0 ? 'past' : ''}>
            <strong>{e.name}</strong>
            <span>{shortDate(e.date)}</span>
            <span className="rail-days">{e.daysLeft > 0 ? `${e.daysLeft} days` : e.daysLeft === 0 ? 'Today' : 'Done'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Last N days: stacked study (navy) + DSA (gold), dashed line at the daily cap. */
export function RecentBars({ days, cap }) {
  const W = 560;
  const H = 150;
  const pad = { t: 10, b: 22, l: 26, r: 6 };
  const max = Math.max(cap + 1, ...days.map((d) => (d.study || 0) + (d.dsa || 0)));
  const bw = (W - pad.l - pad.r) / days.length;
  const y = (v) => H - pad.b - (v / max) * (H - pad.t - pad.b);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Study and DSA hours, last 14 days">
      {[0, Math.round(max / 2), Math.round(max)].map((v) => (
        <g key={v}>
          <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} className="grid" />
          <text x={pad.l - 6} y={y(v) + 4} className="axis" textAnchor="end">{v}</text>
        </g>
      ))}
      {days.map((d, i) => {
        const x = pad.l + i * bw + 3;
        const s = d.study || 0;
        const k = d.dsa || 0;
        const blank = d.study === null && d.dsa === null;
        return (
          <g key={d.date}>
            <title>{`${shortDate(d.date)}: ${blank ? 'not logged' : `${s}h study, ${k}h DSA`}`}</title>
            {blank ? (
              <rect x={x} y={y(0) - 2} width={bw - 6} height={2} className="bar-blank" />
            ) : (
              <>
                <rect x={x} y={y(s)} width={bw - 6} height={y(0) - y(s)} className="bar-study" rx="1.5" />
                <rect x={x} y={y(s + k)} width={bw - 6} height={y(s) - y(s + k)} className="bar-dsa" rx="1.5" />
              </>
            )}
            <text x={x + (bw - 6) / 2} y={H - 6} className="axis" textAnchor="middle">{d.day.slice(0, 2)}</text>
          </g>
        );
      })}
      <line x1={pad.l} x2={W - pad.r} y1={y(cap)} y2={y(cap)} className="cap-line" />
      <text x={W - pad.r} y={y(cap) - 4} className="axis" textAnchor="end">cap {cap}h</text>
    </svg>
  );
}

/** Weight line from logged values with a target line. */
export function WeightLine({ points, target, start }) {
  const W = 300;
  const H = 120;
  const pad = { t: 10, b: 18, l: 30, r: 8 };
  const vals = [...points.map((p) => p.weight), target, start].filter((v) => typeof v === 'number');
  const lo = Math.floor(Math.min(...vals) - 1);
  const hi = Math.ceil(Math.max(...vals) + 1);
  const y = (v) => pad.t + ((hi - v) / (hi - lo)) * (H - pad.t - pad.b);
  const x = (i) => pad.l + (points.length < 2 ? (W - pad.l - pad.r) / 2 : (i / (points.length - 1)) * (W - pad.l - pad.r));
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.weight)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Weight trend">
      <line x1={pad.l} x2={W - pad.r} y1={y(target)} y2={y(target)} className="cap-line" />
      <text x={W - pad.r} y={y(target) - 4} className="axis" textAnchor="end">target {target}</text>
      {[lo, hi].map((v) => (
        <text key={v} x={pad.l - 6} y={y(v) + 4} className="axis" textAnchor="end">{v}</text>
      ))}
      {points.length > 1 && <path d={path} className="line" />}
      {points.map((p, i) => (
        <circle key={p.date} cx={x(i)} cy={y(p.weight)} r="3" className="dot">
          <title>{`${shortDate(p.date)}: ${p.weight} kg`}</title>
        </circle>
      ))}
    </svg>
  );
}

/** Circular Radial Progress Ring */
export function RadialProgressRing({ pct = 0, label, count, total, unit = '', color = 'var(--gold)', size = 96 }) {
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, pct));
  const offset = circ - (clamped / 100) * circ;

  return (
    <div className="radial-card">
      <div className="radial-chart-wrap" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="radial-svg">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="var(--line)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <div className="radial-center-text">
          <span className="radial-pct">{Math.round(clamped)}%</span>
        </div>
      </div>
      <div className="radial-meta">
        <strong className="radial-title">{label}</strong>
        <span className="radial-subtitle">
          {count != null && total != null ? `${count}/${total} ${unit}`.trim() : `${clamped}% complete`}
        </span>
      </div>
    </div>
  );
}

const STREAM_COLORS = [
  '#c9a227', // gold
  '#2f7a55', // sage
  '#2b6cb0', // blue
  '#805ad5', // purple
  '#dd6b20', // orange
  '#d69e2e', // yellow
  '#319795', // teal
  '#e53e3e', // red
  '#718096', // gray
];

/** Syllabus / Study Stream Allocation Donut Chart */
export function StreamDonut({ streamTotals = {}, streams = [] }) {
  const size = 180;
  const stroke = 24;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;

  const validEntries = streams
    .map((s, idx) => ({
      ...s,
      hours: Number(streamTotals[s.key] || 0),
      color: STREAM_COLORS[idx % STREAM_COLORS.length],
    }))
    .filter((e) => e.hours > 0);

  const totalH = validEntries.reduce((acc, cur) => acc + cur.hours, 0);

  let accumulatedPct = 0;
  const slices = validEntries.map((e) => {
    const fraction = totalH > 0 ? e.hours / totalH : 0;
    const sliceLength = fraction * circ;
    const dashOffset = circ - sliceLength;
    const rotation = accumulatedPct * 360 - 90;
    accumulatedPct += fraction;
    return {
      ...e,
      fraction,
      pct: Math.round(fraction * 100),
      dashOffset,
      rotation,
    };
  });

  return (
    <div className="donut-container">
      <div className="donut-graphic" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="var(--surface-2)"
            strokeWidth={stroke}
          />
          {totalH > 0 ? (
            slices.map((slice) => (
              <circle
                key={slice.key}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth={stroke}
                strokeDasharray={`${slice.fraction * circ} ${circ}`}
                transform={`rotate(${slice.rotation} ${size / 2} ${size / 2})`}
                style={{ transition: 'stroke-dasharray 0.5s ease' }}
              >
                <title>{`${slice.label}: ${slice.hours}h (${slice.pct}%)`}</title>
              </circle>
            ))
          ) : (
            <text x="50%" y="50%" textAnchor="middle" dy="0.3em" className="axis">
              No study logged
            </text>
          )}
        </svg>
        <div className="donut-center-metric">
          <span className="donut-hours">{Math.round(totalH * 10) / 10}h</span>
          <span className="donut-label">Study Logged</span>
        </div>
      </div>
      <div className="donut-legend">
        {validEntries.length > 0 ? (
          validEntries.map((item) => (
            <div key={item.key} className="donut-legend-item">
              <span className="donut-dot" style={{ background: item.color }} />
              <span className="donut-item-label">{item.short || item.label}</span>
              <strong className="donut-item-hours">{item.hours}h</strong>
            </div>
          ))
        ) : (
          <p className="muted">Log your daily hours to see your preparation distribution.</p>
        )}
      </div>
    </div>
  );
}

/** 14-Day Trajectory Area & Velocity Chart */
export function TrajectoryAreaChart({ days = [], cap = 8 }) {
  const W = 620;
  const H = 160;
  const pad = { t: 15, b: 24, l: 30, r: 12 };
  const n = days.length;
  if (!n) return null;

  const maxVal = Math.max(cap + 2, ...days.map((d) => (d.study || 0) + (d.dsa || 0)));
  const y = (v) => H - pad.b - (v / maxVal) * (H - pad.t - pad.b);
  const x = (i) => pad.l + (i / (n - 1)) * (W - pad.l - pad.r);

  // Totals per day
  const dailyTotals = days.map((d) => (d.study || 0) + (d.dsa || 0));

  // Points for 7-day rolling average trendline
  const rolling = dailyTotals.map((_, i) => {
    const windowStart = Math.max(0, i - 6);
    const windowDays = dailyTotals.slice(windowStart, i + 1);
    const avg = windowDays.reduce((a, b) => a + b, 0) / windowDays.length;
    return avg;
  });

  const areaPath = [
    `M ${x(0)} ${y(0)}`,
    ...dailyTotals.map((val, i) => `L ${x(i)} ${y(val)}`),
    `L ${x(n - 1)} ${y(0)}`,
    'Z',
  ].join(' ');

  const trendPath = rolling.map((val, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(val)}`).join(' ');

  const activeDays = dailyTotals.filter((v) => v > 0).length;
  const avgActive = activeDays ? (dailyTotals.reduce((a, b) => a + b, 0) / activeDays).toFixed(1) : 0;
  const consistencyPct = Math.round((activeDays / n) * 100);

  return (
    <div className="trajectory-chart-wrap">
      <div className="trajectory-header-stats">
        <span className="stat-pill">
          Consistency: <strong>{consistencyPct}%</strong>
        </span>
        <span className="stat-pill">
          Active Avg: <strong>{avgActive}h/day</strong>
        </span>
        <span className="stat-pill">
          Daily Cap: <strong>{cap}h</strong>
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="chart trajectory-svg" role="img" aria-label="14-day study trajectory">
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--gold)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Cap Line */}
        <line x1={pad.l} x2={W - pad.r} y1={y(cap)} y2={y(cap)} className="cap-line" />
        <text x={W - pad.r} y={y(cap) - 5} className="axis" textAnchor="end">
          Cap {cap}h
        </text>

        {/* Area fill */}
        <path d={areaPath} fill="url(#areaGradient)" />

        {/* 7-day Rolling trendline */}
        <path d={trendPath} fill="none" stroke="var(--sage)" strokeWidth="2.5" strokeDasharray="3 3" />

        {/* Daily bars */}
        {days.map((d, i) => {
          const tot = (d.study || 0) + (d.dsa || 0);
          const cx = x(i);
          const cy = y(tot);
          return (
            <g key={d.date}>
              <title>{`${shortDate(d.date)}: ${tot}h total (${d.study || 0}h study + ${d.dsa || 0}h DSA)`}</title>
              <line x1={cx} x2={cx} y1={y(0)} y2={cy} stroke="var(--gold)" strokeWidth="4" strokeLinecap="round" />
              <circle cx={cx} cy={cy} r="3" fill="var(--gold)" />
              <text x={cx} y={H - 6} className="axis" textAnchor="middle">
                {d.day.slice(0, 2)}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="trajectory-legend">
        <span><span className="legend-indicator" style={{ background: 'var(--gold)' }} /> Daily Hours</span>
        <span><span className="legend-indicator" style={{ borderColor: 'var(--sage)', borderStyle: 'dashed' }} /> 7-Day Trend</span>
        <span><span className="legend-indicator" style={{ borderColor: 'var(--brick)' }} /> Target Cap</span>
      </div>
    </div>
  );
}

function dayNum(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d) / 86400000;
}
