import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function CavaTracker() {
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const loadLectures = async () => {
    try {
      const data = await api.get('/cava');
      setLectures(data.sort((a, b) => a.num - b.num));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLectures();
  }, []);

  const toggleField = async (lec, field) => {
    const updated = { ...lec, [field]: !lec[field] };
    try {
      await api.patch(`/cava/${lec._id}`, { [field]: updated[field] });
      setLectures((prev) => prev.map((l) => (l._id === lec._id ? updated : l)));
    } catch (e) {
      alert('Could not update: ' + e.message);
    }
  };

  if (loading) return <div className="loading">Loading CAVA lectures…</div>;
  if (error) return <div className="error">{error}</div>;

  const total = lectures.length;
  const watchedCount = lectures.filter((l) => l.watched).length;
  const notesCount = lectures.filter((l) => l.notes).length;
  const revisedCount = lectures.filter((l) => l.revised).length;
  const totalHours = total * 3.0;
  const watchedHours = watchedCount * 3.0;
  const overallPct = total > 0 ? (watchedCount * 0.5 + notesCount * 0.3 + revisedCount * 0.2) / total : 0;

  const filtered = lectures.filter((l) => {
    if (filter === 'scheduled') return !!l.studyDate;
    if (filter === 'backlog') return l.num <= 17 && !l.watched;
    if (filter === 'unwatched') return !l.watched;
    if (filter === 'watched') return l.watched;
    return true;
  });

  return (
    <div className="cava-tracker-page">
      <header className="page-head">
        <div>
          <h1>CAVA Lecture Tracker</h1>
          <p className="subhead">
            Current Affairs Video Course · Lec 1–17 delivered by 13 Oct · 2 lectures/week ongoing delivery
          </p>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-label">TOTAL LECTURES</span>
          <span className="stat-val indigo">{total}</span>
          <span className="stat-sub">{totalHours} total course hours</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">WATCHED</span>
          <span className="stat-val emerald">{watchedCount} / {total}</span>
          <span className="stat-sub">{watchedHours} h watched</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">OVERALL PROGRESS</span>
          <span className="stat-val purple">{(overallPct * 100).toFixed(1)}%</span>
          <span className="stat-sub">50% watch · 30% notes · 20% rev</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">HOURS LEFT</span>
          <span className="stat-val amber">{(totalHours - watchedHours).toFixed(1)} h</span>
          <span className="stat-sub">Across remaining lectures</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">IN WEEKLY SPRINTS</span>
          <span className="stat-val cyan">6 planned</span>
          <span className="stat-sub">Lec 2–5 (Week 1), Lec 6–7 (Week 2)</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-bar">
        <span className="filter-title">Filter view:</span>
        <button className={`btn-pill ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All (36)</button>
        <button className={`btn-pill ${filter === 'scheduled' ? 'active' : ''}`} onClick={() => setFilter('scheduled')}>Scheduled in Sprints (6)</button>
        <button className={`btn-pill ${filter === 'backlog' ? 'active' : ''}`} onClick={() => setFilter('backlog')}>Backlog (Lec 1–17)</button>
        <button className={`btn-pill ${filter === 'unwatched' ? 'active' : ''}`} onClick={() => setFilter('unwatched')}>Pending Watch</button>
        <button className={`btn-pill ${filter === 'watched' ? 'active' : ''}`} onClick={() => setFilter('watched')}>Watched</button>
      </div>

      {/* Data Table */}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Lecture Code</th>
              <th>Faculty Release</th>
              <th>Scheduled Date</th>
              <th>Duration</th>
              <th>Watched (50%)</th>
              <th>Notes (30%)</th>
              <th>Revised (20%)</th>
              <th>Progress</th>
              <th>Status / Cadence</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((lec) => {
              const rowProg = (lec.watched ? 0.5 : 0) + (lec.notes ? 0.3 : 0) + (lec.revised ? 0.2 : 0);
              return (
                <tr key={lec._id} className={lec.watched ? 'is-done' : ''}>
                  <td className="cell-num">{lec.num}</td>
                  <td><strong>{lec.title}</strong></td>
                  <td className="cell-muted">{lec.facultyRelease}</td>
                  <td>
                    {lec.studyDate ? (
                      <span className="badge-yellow">{lec.studyDate}</span>
                    ) : (
                      <span className="cell-dim">—</span>
                    )}
                  </td>
                  <td className="cell-center">{lec.duration} h</td>
                  <td className="cell-center">
                    <input
                      type="checkbox"
                      checked={!!lec.watched}
                      onChange={() => toggleField(lec, 'watched')}
                    />
                  </td>
                  <td className="cell-center">
                    <input
                      type="checkbox"
                      checked={!!lec.notes}
                      onChange={() => toggleField(lec, 'notes')}
                    />
                  </td>
                  <td className="cell-center">
                    <input
                      type="checkbox"
                      checked={!!lec.revised}
                      onChange={() => toggleField(lec, 'revised')}
                    />
                  </td>
                  <td className="cell-center">
                    <span className="prog-pill">{(rowProg * 100).toFixed(0)}%</span>
                  </td>
                  <td>
                    <span className={`status-tag tag-${lec.studyDate ? 'scheduled' : lec.num <= 17 ? 'backlog' : 'upcoming'}`}>
                      {lec.status}
                    </span>
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
