import React, { useState, useEffect } from 'react';

const DATES = [
  { date: '2026-11-13', day: 'Friday', note: 'All 3 completed: TH + IE + Mint editorials. Geopolitics & Macro analysis.' },
  { date: '2026-11-14', day: 'Saturday (Today)', note: 'Target: Constitutional bodies, UP Budget linkage, RBI liquidity & Unacademy CA breakdown.' },
  { date: '2026-11-15', day: 'Sunday', note: '' },
  { date: '2026-11-16', day: 'Monday', note: '' },
  { date: '2026-11-17', day: 'Tuesday', note: '' },
  { date: '2026-11-18', day: 'Wednesday', note: '' },
  { date: '2026-11-19', day: 'Thursday', note: '' },
  { date: '2026-11-20', day: 'Friday', note: '' },
  { date: '2026-11-21', day: 'Saturday', note: '' },
  { date: '2026-11-22', day: 'Sunday', note: '' },
  { date: '2026-11-23', day: 'Monday', note: '' },
  { date: '2026-11-24', day: 'Tuesday', note: '' },
  { date: '2026-11-25', day: 'Wednesday', note: '' },
  { date: '2026-11-26', day: 'Thursday', note: '' },
  { date: '2026-11-27', day: 'Friday', note: '' },
  { date: '2026-11-28', day: 'Saturday', note: '' },
  { date: '2026-11-29', day: 'Sunday', note: '' },
  { date: '2026-11-30', day: 'Monday', note: '' },
  { date: '2026-12-01', day: 'Tuesday', note: '' },
  { date: '2026-12-02', day: 'Wednesday', note: '' },
  { date: '2026-12-03', day: 'Thursday', note: '' },
  { date: '2026-12-04', day: 'Friday', note: '' },
  { date: '2026-12-05', day: 'Saturday', note: '' },
  { date: '2026-12-06', day: 'Sunday (UPPCS D-Day)', note: '' },
];

const STORAGE_KEY = 'mst_newspaper_tracker_v2';

export default function NewspaperTracker() {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
      // Migrate v1 if present
      const v1 = localStorage.getItem('mst_newspaper_tracker_v1');
      if (v1) {
        const parsed = JSON.parse(v1);
        return {
          ...parsed,
          '2026-11-13': { th: true, ie: true, mint: true, unacademy: true, note: 'All completed: TH + IE + Mint editorials. Geopolitics & Macro analysis.' }
        };
      }
    } catch (e) {}
    // Default initial state: 13 Nov all completed
    return {
      '2026-11-13': { th: true, ie: true, mint: true, unacademy: true, note: 'All completed: TH + IE + Mint editorials. Geopolitics & Macro analysis.' },
    };
  });

  const [filter, setFilter] = useState('all');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  }, [data]);

  const togglePaper = (date, paper) => {
    setData((prev) => {
      const day = prev[date] || { th: false, ie: false, mint: false, unacademy: false, note: '' };
      return {
        ...prev,
        [date]: {
          ...day,
          [paper]: !day[paper],
        },
      };
    });
  };

  const updateNote = (date, text) => {
    setData((prev) => {
      const day = prev[date] || { th: false, ie: false, mint: false, unacademy: false, note: '' };
      return {
        ...prev,
        [date]: {
          ...day,
          note: text,
        },
      };
    });
  };

  const isDayComplete = (date, d) => {
    if (date === '2026-11-13') return d.th && d.ie && d.mint;
    return d.th && d.ie && d.mint && d.unacademy;
  };

  const hasAnyDone = (date, d) => {
    return d.th || d.ie || d.mint || d.unacademy;
  };

  // Metrics
  const thDays = Object.values(data).filter((d) => d.th).length;
  const ieDays = Object.values(data).filter((d) => d.ie).length;
  const mintDays = Object.values(data).filter((d) => d.mint).length;
  const unacDays = Object.entries(data).filter(([date, d]) => date >= '2026-11-14' && d.unacademy).length;
  const fullyCompletedDays = DATES.filter((item) => isDayComplete(item.date, data[item.date] || {})).length;

  const filteredDates = DATES.filter((item) => {
    const d = data[item.date] || {};
    const complete = isDayComplete(item.date, d);
    if (filter === 'completed') return complete;
    if (filter === 'pending') return !complete;
    return true;
  });

  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '24px 16px', color: '#f8fafc' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid #1f293d', paddingBottom: '20px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#fff', margin: 0 }}>
            📰 Daily Current Affairs & Newspaper Tracker
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '6px' }}>
            Continuous 4-Target Command: <strong>The Hindu</strong> • <strong>Indian Express (IE)</strong> • <strong>Mint</strong> • <strong>Unacademy CA Explanation</strong> (from 14 Nov)
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)', color: '#10b981', padding: '6px 14px', borderRadius: '9999px', fontSize: '13px', fontWeight: 700 }}>
            🎯 Daily Non-Negotiable
          </span>
          <a
            href="/plan.html"
            target="_blank"
            rel="noopener noreferrer"
            style={{ background: '#111827', border: '1px solid #1f293d', color: '#38bdf8', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}
          >
            Plan View ↗
          </a>
        </div>
      </div>

      {/* KPI Cards (4 Source Targets) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <div style={{ background: '#111827', border: '1px solid #1f293d', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700 }}>The Hindu</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>{thDays} Days</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Constitutional & IR focus</div>
        </div>
        <div style={{ background: '#111827', border: '1px solid #1f293d', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700 }}>Indian Express</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>{ieDays} Days</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Explained & Governance</div>
        </div>
        <div style={{ background: '#111827', border: '1px solid #1f293d', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700 }}>Mint</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#a855f7', marginTop: '4px' }}>{mintDays} Days</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Macro, Banking & Deficit</div>
        </div>
        <div style={{ background: '#111827', border: '1px solid #1f293d', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700 }}>Unacademy CA Video</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>{unacDays} / {DATES.length - 1} Days</div>
          <div style={{ fontSize: '12px', color: '#f59e0b', marginTop: '4px' }}>Active from today (14 Nov)</div>
        </div>
      </div>

      {/* Focus Pillars (4 Quadrants) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <div style={{ background: '#111827', border: '1px solid #1f293d', borderTop: '3px solid #38bdf8', borderRadius: '10px', padding: '14px' }}>
          <strong style={{ color: '#38bdf8', fontSize: '13.5px' }}>🏛️ The Hindu Strategy</strong>
          <p style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '6px', lineHeight: 1.5 }}>
            Focus on Constitutional jurisprudence, Supreme Court judgments, Union-State relations, Foreign Policy & Global multilateral treaties.
          </p>
        </div>
        <div style={{ background: '#111827', border: '1px solid #1f293d', borderTop: '3px solid #10b981', borderRadius: '10px', padding: '14px' }}>
          <strong style={{ color: '#10b981', fontSize: '13.5px' }}>🗞️ Indian Express Strategy</strong>
          <p style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '6px', lineHeight: 1.5 }}>
            Focus on 'Explained' section, internal security, electoral reforms, administrative innovation, and balanced contrarian views.
          </p>
        </div>
        <div style={{ background: '#111827', border: '1px solid #1f293d', borderTop: '3px solid #a855f7', borderRadius: '10px', padding: '14px' }}>
          <strong style={{ color: '#a855f7', fontSize: '13.5px' }}>📈 Mint Strategy</strong>
          <p style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '6px', lineHeight: 1.5 }}>
            Focus on RBI monetary policy, inflation & fiscal deficit dynamics, corporate governance, tech/AI policy, and public finance.
          </p>
        </div>
        <div style={{ background: '#111827', border: '1px solid #1f293d', borderTop: '3px solid #f59e0b', borderRadius: '10px', padding: '14px' }}>
          <strong style={{ color: '#f59e0b', fontSize: '13.5px' }}>🎓 Unacademy CA Explanation</strong>
          <p style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '6px', lineHeight: 1.5 }}>
            Daily comprehensive video analysis: static-current linkage, key news synthesis, Prelims factual pointers, and interview opinion framing.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['all', 'completed', 'pending'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                background: filter === f ? '#3b82f6' : '#111827',
                border: '1px solid #1f293d',
                color: filter === f ? '#fff' : '#94a3b8',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {f} ({f === 'all' ? DATES.length : f === 'completed' ? fullyCompletedDays : DATES.length - fullyCompletedDays})
            </button>
          ))}
        </div>
        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
          Fully completed days: <strong style={{ color: '#10b981' }}>{fullyCompletedDays}</strong> / {DATES.length}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#111827', border: '1px solid #1f293d', borderRadius: '12px', overflowX: 'auto', padding: '8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1f293d' }}>
              <th style={{ textAlign: 'left', padding: '12px 14px', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' }}>Date & Day</th>
              <th style={{ textAlign: 'left', padding: '12px 14px', color: '#38bdf8', fontSize: '12px', textTransform: 'uppercase' }}>The Hindu</th>
              <th style={{ textAlign: 'left', padding: '12px 14px', color: '#10b981', fontSize: '12px', textTransform: 'uppercase' }}>Indian Express (IE)</th>
              <th style={{ textAlign: 'left', padding: '12px 14px', color: '#a855f7', fontSize: '12px', textTransform: 'uppercase' }}>Mint</th>
              <th style={{ textAlign: 'left', padding: '12px 14px', color: '#f59e0b', fontSize: '12px', textTransform: 'uppercase' }}>Unacademy CA</th>
              <th style={{ textAlign: 'left', padding: '12px 14px', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' }}>Status</th>
              <th style={{ textAlign: 'left', padding: '12px 14px', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' }}>Key Topics / Editorials Studied</th>
            </tr>
          </thead>
          <tbody>
            {filteredDates.map((item) => {
              const d = data[item.date] || { th: false, ie: false, mint: false, unacademy: false, note: item.note || '' };
              const isToday = item.date === '2026-11-14';
              const isFirstDay = item.date === '2026-11-13';
              const complete = isDayComplete(item.date, d);
              const anyDone = hasAnyDone(item.date, d);

              return (
                <tr
                  key={item.date}
                  style={{
                    borderBottom: '1px solid #1f293d',
                    background: isToday ? 'rgba(56, 189, 248, 0.05)' : complete ? 'rgba(16, 185, 129, 0.03)' : 'transparent',
                  }}
                >
                  <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                    <div style={{ fontWeight: 700, color: '#fff' }}>{item.date}</div>
                    <div style={{ fontSize: '11px', color: isToday ? '#38bdf8' : '#94a3b8' }}>{item.day}</div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={!!d.th}
                        onChange={() => togglePaper(item.date, 'th')}
                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#38bdf8' }}
                      />
                      <span style={{ color: d.th ? '#38bdf8' : '#cbd5e1', fontWeight: d.th ? 600 : 400 }}>The Hindu</span>
                    </label>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={!!d.ie}
                        onChange={() => togglePaper(item.date, 'ie')}
                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#10b981' }}
                      />
                      <span style={{ color: d.ie ? '#10b981' : '#cbd5e1', fontWeight: d.ie ? 600 : 400 }}>Indian Express</span>
                    </label>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={!!d.mint}
                        onChange={() => togglePaper(item.date, 'mint')}
                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#a855f7' }}
                      />
                      <span style={{ color: d.mint ? '#a855f7' : '#cbd5e1', fontWeight: d.mint ? 600 : 400 }}>Mint</span>
                    </label>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    {isFirstDay ? (
                      <span style={{ color: '#64748b', fontSize: '11px', fontStyle: 'italic' }}>– Baseline Day –</span>
                    ) : (
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={!!d.unacademy}
                          onChange={() => togglePaper(item.date, 'unacademy')}
                          style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#f59e0b' }}
                        />
                        <span style={{ color: d.unacademy ? '#f59e0b' : '#cbd5e1', fontWeight: d.unacademy ? 600 : 400 }}>Unacademy CA</span>
                      </label>
                    )}
                  </td>
                  <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                    {complete ? (
                      <span style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)', color: '#10b981', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                        ✓ All Done
                      </span>
                    ) : isToday ? (
                      <span style={{ background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.35)', color: '#38bdf8', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                        {anyDone ? '⏳ In Progress' : '🎯 Today'}
                      </span>
                    ) : (
                      <span style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#94a3b8', padding: '3px 8px', borderRadius: '4px', fontSize: '11px' }}>
                        {anyDone ? 'Partial' : 'Pending'}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <input
                      type="text"
                      value={d.note || ''}
                      onChange={(e) => updateNote(item.date, e.target.value)}
                      placeholder="Key editorials, video takeaways, case studies..."
                      style={{
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid #1f293d',
                        borderRadius: '6px',
                        color: '#cbd5e1',
                        fontSize: '12px',
                        padding: '6px 10px',
                        outline: 'none',
                      }}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
