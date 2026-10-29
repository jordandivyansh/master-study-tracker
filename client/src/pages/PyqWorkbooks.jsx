import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function PyqWorkbooks() {
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paperFilter, setPaperFilter] = useState('ALL');

  const loadData = async () => {
    try {
      const data = await api.get('/pyqs');
      setSets(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleField = async (item, field) => {
    const updated = { ...item, [field]: !item[field] };
    try {
      await api.patch(`/pyqs/${item._id}`, { [field]: updated[field] });
      setSets((prev) => prev.map((s) => (s._id === item._id ? updated : s)));
    } catch (e) {
      alert('Could not update: ' + e.message);
    }
  };

  if (loading) return <div className="loading">Loading PYQ workbooks…</div>;
  if (error) return <div className="error">{error}</div>;

  const totalSets = sets.length;
  const writtenSets = sets.filter((s) => s.written).length;
  const reviewedSets = sets.filter((s) => s.reviewed).length;
  const enrichedSets = sets.filter((s) => s.notesEnriched).length;

  const totalQuestions = sets.reduce((sum, s) => sum + (s.questions || 0), 0);
  const writtenQuestions = sets.filter((s) => s.written).reduce((sum, s) => sum + (s.questions || 0), 0);
  const overallPct = totalSets > 0 ? (writtenSets * 0.5 + reviewedSets * 0.3 + enrichedSets * 0.2) / totalSets : 0;

  const filtered = sets.filter((s) => (paperFilter === 'ALL' ? true : s.paper === paperFilter));

  return (
    <div className="pyq-workbooks-page">
      <header className="page-head">
        <div>
          <h1>Smartwork Labs PYQ Workbooks (2020–2024)</h1>
          <p className="subhead">
            General Studies I, II, III & IV (Ethics) · 400 Total Questions · Year-wise Answer Writing Practice
          </p>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-label">TOTAL WORKBOOKS</span>
          <span className="stat-val indigo">4 Books</span>
          <span className="stat-sub">{totalQuestions} PYQ Questions (5 Years)</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">SETS WRITTEN</span>
          <span className="stat-val emerald">{writtenSets} / {totalSets}</span>
          <span className="stat-sub">{writtenQuestions} questions written</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">OVERALL PROGRESS</span>
          <span className="stat-val purple">{(overallPct * 100).toFixed(1)}%</span>
          <span className="stat-sub">50% write · 30% review · 20% notes</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">MODEL ANSWER REVIEW</span>
          <span className="stat-val amber">{reviewedSets} / {totalSets} sets</span>
          <span className="stat-sub">Self-critiqued & evaluated</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">NOTES ENRICHED</span>
          <span className="stat-val cyan">{enrichedSets} / {totalSets} sets</span>
          <span className="stat-sub">Keywords & data added to notes</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-bar">
        <span className="filter-title">Filter by Paper:</span>
        <button className={`btn-pill ${paperFilter === 'ALL' ? 'active' : ''}`} onClick={() => setPaperFilter('ALL')}>All Workbooks (40 Sets)</button>
        <button className={`btn-pill ${paperFilter === 'GS-1' ? 'active' : ''}`} onClick={() => setPaperFilter('GS-1')}>GS-1 (10 Sets)</button>
        <button className={`btn-pill ${paperFilter === 'GS-2' ? 'active' : ''}`} onClick={() => setPaperFilter('GS-2')}>GS-2 (10 Sets)</button>
        <button className={`btn-pill ${paperFilter === 'GS-3' ? 'active' : ''}`} onClick={() => setPaperFilter('GS-3')}>GS-3 (10 Sets)</button>
        <button className={`btn-pill ${paperFilter === 'GS-4' ? 'active' : ''}`} onClick={() => setPaperFilter('GS-4')}>GS-4 Ethics (10 Sets)</button>
      </div>

      {/* Data Table */}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Paper</th>
              <th>Exam Year</th>
              <th>Question Range / Set</th>
              <th>Qs Count</th>
              <th>Exam Pattern</th>
              <th>Written (50%)</th>
              <th>Model Review (30%)</th>
              <th>Notes Enriched (20%)</th>
              <th>Progress</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const prog = (item.written ? 0.5 : 0) + (item.reviewed ? 0.3 : 0) + (item.notesEnriched ? 0.2 : 0);
              return (
                <tr key={item._id} className={item.written ? 'is-done' : ''}>
                  <td><span className="badge-paper">{item.paper}</span></td>
                  <td><strong>{item.year}</strong></td>
                  <td>{item.range}</td>
                  <td className="cell-center">{item.questions}</td>
                  <td className="cell-muted">{item.pattern}</td>
                  <td className="cell-center">
                    <input
                      type="checkbox"
                      checked={!!item.written}
                      onChange={() => toggleField(item, 'written')}
                    />
                  </td>
                  <td className="cell-center">
                    <input
                      type="checkbox"
                      checked={!!item.reviewed}
                      onChange={() => toggleField(item, 'reviewed')}
                    />
                  </td>
                  <td className="cell-center">
                    <input
                      type="checkbox"
                      checked={!!item.notesEnriched}
                      onChange={() => toggleField(item, 'notesEnriched')}
                    />
                  </td>
                  <td className="cell-center">
                    <span className="prog-pill">{(prog * 100).toFixed(0)}%</span>
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
