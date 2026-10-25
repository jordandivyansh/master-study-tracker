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

function dayNum(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d) / 86400000;
}
