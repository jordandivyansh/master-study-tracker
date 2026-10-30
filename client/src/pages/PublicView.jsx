import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import ThemeSelector from '../components/ThemeSelector.jsx';
import { ExamRail, RadialProgressRing, StreamDonut, TrajectoryAreaChart } from '../components/charts.jsx';
import { h, hu, pct, shortDate, longDate } from '../format.js';

export default function PublicView() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    api.get('/public/')
      .then(setData)
      .catch((err) => setError(err.message || 'Unable to load public tracker.'));
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (error) {
    return (
      <div className="public-wrap">
        <div className="public-card error-card">
          <h2>Could not load public tracker</h2>
          <p>{error}</p>
          <button className="btn" onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="public-wrap">
        <div className="public-card">
          <div className="loading-spinner" />
          <p>Loading Divyansh's live preparation tracker…</p>
        </div>
      </div>
    );
  }

  const { settings, summary, tracker, cava, pyqs, apfc, testsByExam } = data;
  const totalTests = Object.values(testsByExam || {}).reduce((acc, g) => acc + (g.total || 0), 0);
  const doneTests = Object.values(testsByExam || {}).reduce((acc, g) => acc + (g.done || 0), 0);
  const testPct = totalTests ? Math.round((doneTests / totalTests) * 100) : 0;
  const apfcPct = apfc.items ? Math.round((apfc.platformComplete / apfc.items) * 100) : 0;

  return (
    <div className="public-container">
      {/* Public Header Bar */}
      <header className="public-top-bar">
        <div className="public-brand">
          <span className="brand-dot-live" />
          <div>
            <div className="public-title-row">
              <h1 className="public-title">Divyansh's Master Study Tracker</h1>
              <span className="public-badge">Live Public View · Read-Only</span>
            </div>
            <p className="public-subtitle">
              UPSC Civil Services & EPFO APFC Comprehensive Preparation Journey
            </p>
          </div>
        </div>

        <div className="public-actions">
          <ThemeSelector compact />
          <button className="btn ghost" onClick={copyLink}>
            {copied ? '✓ Link Copied' : '🔗 Share Link'}
          </button>
          <Link to="/" className="btn primary">
            Studio Sign In ➔
          </Link>
        </div>
      </header>

      {/* Exam Countdown Rail */}
      <div className="public-section">
        <ExamRail start={tracker.start} end={tracker.end} today={data.today} exams={data.exams} />
      </div>

      {/* Tabs */}
      <nav className="public-nav-tabs" aria-label="Public tabs">
        <button
          className={`public-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Preparation Overview
        </button>
        <button
          className={`public-tab-btn ${activeTab === 'cava' ? 'active' : ''}`}
          onClick={() => setActiveTab('cava')}
        >
          🎥 CAVA Lectures ({cava.done}/{cava.total})
        </button>
        <button
          className={`public-tab-btn ${activeTab === 'pyqs' ? 'active' : ''}`}
          onClick={() => setActiveTab('pyqs')}
        >
          📝 PYQ Workbooks ({pyqs.questionsWritten}/{pyqs.totalQuestions} Qs)
        </button>
        <button
          className={`public-tab-btn ${activeTab === 'mocks' ? 'active' : ''}`}
          onClick={() => setActiveTab('mocks')}
        >
          🎯 Mocks & Tests ({doneTests}/{totalTests})
        </button>
      </nav>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="public-tab-content">
          {/* Key Metrics Row */}
          <div className="public-stats-grid">
            <div className="stat-card">
              <span className="stat-label">🔥 Current Streak</span>
              <strong className="stat-value">{data.streak} Days</strong>
              <span className="stat-sub">Consistent daily study</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">⏱ Today's Logged</span>
              <strong className="stat-value">{hu(data.todayLog?.studyPlusDsa)}</strong>
              <span className="stat-sub">Study: {hu(data.todayLog?.examStudy)} · DSA: {hu(data.todayLog?.dsa)}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">📅 Tracker Progress</span>
              <strong className="stat-value">Day {tracker.elapsed + 1}</strong>
              <span className="stat-sub">of {tracker.total + 1} days planned</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">🎯 Daily Study Cap</span>
              <strong className="stat-value">{settings.dailyCap} Hours</strong>
              <span className="stat-sub">Target focus cap</span>
            </div>
          </div>

          {/* Pillars of Preparation */}
          <div className="pillars-grid">
            <RadialProgressRing
              pct={cava.pct}
              label="CAVA Lectures"
              count={cava.done}
              total={cava.total}
              unit="lectures"
              color="var(--gold)"
            />
            <RadialProgressRing
              pct={pyqs.writtenPct}
              label="PYQ Workbooks"
              count={pyqs.questionsWritten}
              total={pyqs.totalQuestions}
              unit="written"
              color="var(--sage)"
            />
            <RadialProgressRing
              pct={testPct}
              label="Mocks & Tests"
              count={doneTests}
              total={totalTests}
              unit="done"
              color="#3b82f6"
            />
            <RadialProgressRing
              pct={apfcPct}
              label="APFC Modules"
              count={apfc.platformComplete}
              total={apfc.items}
              unit="entries"
              color="#8b5cf6"
            />
          </div>

          {/* Trajectory & Stream Allocation */}
          <div className="grid two">
            <section className="panel">
              <div className="panel-head">
                <h2>14-Day Trajectory & Consistency</h2>
                <span className="panel-aside">Daily study + DSA against cap</span>
              </div>
              <TrajectoryAreaChart days={data.recent} cap={settings.dailyCap} />
            </section>

            <section className="panel">
              <div className="panel-head">
                <h2>Syllabus Stream Allocation</h2>
                <span className="panel-aside">All-time hours breakdown</span>
              </div>
              <StreamDonut streamTotals={data.streamTotals} streams={data.streams} />
            </section>
          </div>

          {/* Upcoming Tests and Milestones */}
          <div className="grid two">
            <section className="panel">
              <div className="panel-head">
                <h2>Target Exam Milestones</h2>
              </div>
              <ul className="exam-countdown-list">
                {data.exams.map((e) => (
                  <li key={e.key} className="exam-countdown-item">
                    <div>
                      <strong>{e.name}</strong>
                      <span className="muted">{shortDate(e.date)}</span>
                    </div>
                    <span className={`exam-days-tag ${e.daysLeft < 30 ? 'soon' : ''}`}>
                      {e.daysLeft > 0 ? `${e.daysLeft} days to go` : e.daysLeft === 0 ? 'Today!' : 'Completed'}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="panel">
              <div className="panel-head">
                <h2>Capacity & Budget Planning</h2>
              </div>
              <table className="kv">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th className="r">Allocation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Pre-Pivot Planned Study</td>
                    <td className="r">{h(summary.prePlanned)}h</td>
                  </tr>
                  <tr>
                    <td>Gross Available Capacity</td>
                    <td className="r">{h(summary.preCapacity)}h</td>
                  </tr>
                  <tr>
                    <td>Buffer Allocation ({Math.round(settings.buffer * 100)}%)</td>
                    <td className="r">{Math.round(settings.buffer * 100)}%</td>
                  </tr>
                  <tr className="em">
                    <td>Unallocated Study Reserve</td>
                    <td className="r">{h(summary.preUnallocated)}h</td>
                  </tr>
                </tbody>
              </table>
              <p className="note">
                Strict {settings.dailyCap}h daily ceiling safeguards against cognitive burnout while ensuring consistent execution.
              </p>
            </section>
          </div>
        </div>
      )}

      {/* TAB 2: CAVA LECTURES */}
      {activeTab === 'cava' && (
        <div className="public-tab-content">
          <section className="panel">
            <div className="panel-head">
              <h2>CAVA Current Affairs Video Lectures (Batch 2026)</h2>
              <span className="panel-aside">
                {cava.done} Done · {cava.inProgress} In Progress · {cava.pending} Pending
              </span>
            </div>
            <p className="sub" style={{ marginBottom: '16px' }}>
              Tracks Current Affairs video lectures synced bidirectional via Google Sheets.
            </p>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Lecture Title</th>
                    <th>Date Released</th>
                    <th>Status</th>
                    <th>Sprint Linkage</th>
                  </tr>
                </thead>
                <tbody>
                  {cava.recent.map((lec) => (
                    <tr key={lec._id || lec.num}>
                      <td><strong>Lec {lec.num}</strong></td>
                      <td>{lec.title || `CAVA Lecture ${lec.num}`}</td>
                      <td>{shortDate(lec.date) || '–'}</td>
                      <td>
                        <span className={`status-pill ${lec.status === 'Done' ? 'done' : lec.status === 'In progress' ? 'progress' : 'pending'}`}>
                          {lec.status || 'Pending'}
                        </span>
                      </td>
                      <td>{lec.sprint || '–'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* TAB 3: PYQ WORKBOOKS */}
      {activeTab === 'pyqs' && (
        <div className="public-tab-content">
          <section className="panel">
            <div className="panel-head">
              <h2>Smartwork Labs PYQ Workbooks (2020–2024)</h2>
              <span className="panel-aside">
                {pyqs.questionsWritten} Written · {pyqs.modelReviewed} Reviewed of {pyqs.totalQuestions} Questions
              </span>
            </div>
            <p className="sub" style={{ marginBottom: '16px' }}>
              400 mains questions spanning General Studies Papers 1 through 4 with model answer evaluation.
            </p>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Set / Paper</th>
                    <th>Topic / Coverage</th>
                    <th className="r">Questions</th>
                    <th className="r">Written</th>
                    <th className="r">Reviewed</th>
                    <th>Completion</th>
                  </tr>
                </thead>
                <tbody>
                  {pyqs.recent.map((p) => {
                    const pct = p.totalQuestions ? Math.round((p.questionsWritten / p.totalQuestions) * 100) : 0;
                    return (
                      <tr key={p._id || p.id}>
                        <td><strong>{p.paper} ({p.year})</strong></td>
                        <td>{p.topic}</td>
                        <td className="r">{p.totalQuestions}</td>
                        <td className="r">{p.questionsWritten}</td>
                        <td className="r">{p.modelReviewed}</td>
                        <td>
                          <div className="table-progress-bar">
                            <div className="table-progress-fill" style={{ width: `${pct}%` }} />
                            <span>{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* TAB 4: MOCKS & TESTS */}
      {activeTab === 'mocks' && (
        <div className="public-tab-content">
          <section className="panel">
            <div className="panel-head">
              <h2>Test Series, AWFG & Lukmaan Mocks</h2>
              <span className="panel-aside">
                {doneTests} Completed of {totalTests} Tests Scheduled
              </span>
            </div>
            <div className="mocks-summary-cards">
              {Object.entries(testsByExam).map(([examName, stats]) => (
                <div key={examName} className="mock-exam-card">
                  <h3>{examName}</h3>
                  <div className="mock-exam-stats">
                    <div>
                      <span className="metric-num">{stats.done}/{stats.total}</span>
                      <span className="metric-lbl">Completed</span>
                    </div>
                    <div>
                      <span className="metric-num">{stats.reviewPending}</span>
                      <span className="metric-lbl">Review Pending</span>
                    </div>
                    <div>
                      <span className="metric-num bad">{stats.overdue}</span>
                      <span className="metric-lbl">Overdue</span>
                    </div>
                  </div>
                  <div className="table-progress-bar" style={{ marginTop: '10px' }}>
                    <div
                      className="table-progress-fill"
                      style={{ width: `${stats.total ? Math.round((stats.done / stats.total) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Read-Only Footer Guarantee */}
      <footer className="public-footer">
        <p>
          Master Study Tracker V2 · Verified Live Sync with Google Sheets & SQLite · Viewing Divyansh's Preparation Journey
        </p>
      </footer>
    </div>
  );
}
