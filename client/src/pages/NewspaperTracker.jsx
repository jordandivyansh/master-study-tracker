import React, { useState, useEffect } from 'react';

const DATES = [
  { date: '2026-11-13', day: 'Friday', note: 'All 3 completed: TH + IE + Mint editorials. Geopolitics & Macro analysis.' },
  { date: '2026-11-14', day: 'Saturday (Today)', note: 'Target: Constitutional bodies, UP Budget linkage, and RBI liquidity stance.' },
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

const STORAGE_KEY = 'mst_newspaper_tracker_v1';

export default function NewspaperTracker() {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    // Default initial state: 13 Nov all completed
    return {
      '2026-11-13': { th: true, ie: true, mint: true, note: 'All 3 completed: TH + IE + Mint editorials. Geopolitics & Macro analysis.' },
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
      const day = prev[date] || { th: false, ie: false, mint: false, note: '' };
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
      const day = prev[date] || { th: false, ie: false, mint: false, note: '' };
      return {
        ...prev,
        [date]: {
          ...day,
          note: text,
        },
      };
    });
  };

  const markAllToday = (date, val) => {
    setData((prev) => {
      const day = prev[date] || { note: '' };
      return {
        ...prev,
        [date]: {
          ...day,
          th: val,
          ie: val,
          mint: val,
        },
      };
    });
  };

  // Metrics
  const thDays = Object.values(data).filter((d) => d.th).length;
  const ieDays = Object.values(data).filter((d) => d.ie).length;
  const mintDays = Object.values(data).filter((d) => d.mint).length;
  const allThreeDays = Object.values(data).filter((d) => d.th && d.ie && d.mint).length;

  const filteredDates = DATES.filter((item) => {
    const d = data[item.date] || {};
    const allDone = d.th && d.ie && d.mint;
    if (filter === 'completed') return allDone;
    if (filter === 'pending') return !allDone;
    return true;
  });

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 16px', color: '#f8fafc' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid #1f293d', paddingBottom: '20px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#fff', margin: 0 }}>
            📰 Daily Newspaper Completion Tracker
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '6px' }}>
            Continuous 3-Source Reading: <strong>The Hindu</strong> • <strong>Indian Express (IE)</strong> • <strong>Mint</strong>
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

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#111827', border: '1px solid #1f293d', borderRadius: '12px', padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700 }}>Starting Date</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>13 Nov 2026</div>
          <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>✓ Baseline Day Complete</div>
        </div>
        <div style={{ background: '#111827', border: '1px solid #1f293d', borderRadius: '12px', padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700 }}>The Hindu</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>{thDays} Days</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Constitutional & IR focus</div>
        </div>
        <div style={{ background: '#111827', border: '1px solid #1f293d', borderRadius: '12px', padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700 }}>Indian Express</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>{ieDays} Days</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Explained & Governance</div>
        </div>
        <div style={{ background: '#111827', border: '1px solid #1f293d', borderRadius: '12px', padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700 }}>Mint</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#a855f7', marginTop: '4px' }}>{mintDays} Days</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Macro, Banking & Deficit</div>
        </div>
      </div>

      {/* Focus Pillars */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#111827', border: '1px solid #1f293d', borderTop: '3px solid #38bdf8', borderRadius: '10px', padding: '16px' }}>
          <strong style={{ color: '#38bdf8', fontSize: '14px' }}>🏛️ The Hindu Strategy</strong>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px', lineHeight: 1.5 }}>
            Focus on Constitutional jurisprudence, Supreme Court judgments, Federal relations, Foreign Policy & Global multilateral engagements.
          </p>
        </div>
        <div style={{ background: '#111827', border: '1px solid #1f293d', borderTop: '3px solid #10b981', borderRadius: '10px', padding: '16px' }}>
          <strong style={{ color: '#10b981', fontSize: '14px' }}>🗞️ Indian Express Strategy</strong>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px', lineHeight: 1.5 }}>
            Focus on 'Explained' section, internal security, electoral reforms, administrative innovation, and balanced contrarian perspectives.
          </p>
        </div>
        <div style={{ background: '#111827', border: '1px solid #1f293d', borderTop: '3px solid #a855f7', borderRadius: '10px', padding: '16px' }}>
          <strong style={{ color: '#a855f7', fontSize: '14px' }}>📈 Mint Strategy</strong>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px', lineHeight: 1.5 }}>
            Focus on RBI monetary stance, inflation & fiscal deficit dynamics, corporate governance, tech/AI policy, and public finance.
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
              {f} ({f === 'all' ? DATES.length : f === 'completed' ? allThreeDays : DATES.length - allThreeDays})
            </button>
          ))}
        </div>
        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
          Triple-read days: <strong style={{ color: '#10b981' }}>{allThreeDays}</strong> / {DATES.length}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#111827', border: '1px solid #1f293d', borderRadius: '12px', overflowX: 'auto', padding: '8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1f293d' }}>
              <th style={{ textAlign: 'left', padding: '12px 14px', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' }}>Date & Day</th>
              <th style={{ textAlign: 'left', padding: '12px 14px', color: '#38bdf8', fontSize: '12px', textTransform: 'uppercase' }}>The Hindu</th>
              <th style={{ textAlign: 'left', padding: '12px 14px', color: '#10b981', fontSize: '12px', textTransform: 'uppercase' }}>Indian Express (IE)</th>
              <th style={{ textAlign: 'left', padding: '12px 14px', color: '#a855f7', fontSize: '12px', textTransform: 'uppercase' }}>Mint</th>
              <th style={{ textAlign: 'left', padding: '12px 14px', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' }}>Status</th>
              <th style={{ textAlign: 'left', padding: '12px 14px', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' }}>Key Topics / Editorials Studied</th>
            </tr>
          </thead>
          <tbody>
            {filteredDates.map((item) => {
              const d = data[item.date] || { th: false, ie: false, mint: false, note: item.note || '' };
              const isToday = item.date === '2026-11-14';
              const allDone = d.th && d.ie && d.mint;
              const anyDone = d.th || d.ie || d.mint;

              return (
                <tr
                  key={item.date}
                  style={{
                    borderBottom: '1px solid #1f293d',
                    background: isToday ? 'rgba(56, 189, 248, 0.05)' : allDone ? 'rgba(16, 185, 129, 0.03)' : 'transparent',
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
                  <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                    {allDone ? (
                      <span style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)', color: '#10b981', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                        ✓ All 3 Done
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
                      placeholder="Add key editorials, case studies, or economic concepts read..."
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
