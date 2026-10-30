import { Link } from 'react-router-dom';
import { useResource } from '../hooks.js';
import { PageHeader, Panel, Loading, Meter, Tag, workflowTone } from '../components/ui.jsx';
import { ExamRail, RecentBars, WeightLine, RadialProgressRing, StreamDonut, TrajectoryAreaChart } from '../components/charts.jsx';
import { h, hu, pct, shortDate, longDate, STREAMS } from '../format.js';

export default function Dashboard() {
  const { data: d, error } = useResource('/dashboard');
  if (!d) return <Loading error={error} />;

  const { settings, summary, currentWeek: wk, todayLog, tracker } = d;
  const pivot = settings.exams.find((e) => e.key === settings.pivotExam);
  const todayTotal = todayLog.studyPlusDsa;

  // Calculate total tests done vs total tests
  const totalTests = Object.values(d.testsByExam || {}).reduce((acc, g) => acc + (g.total || 0), 0);
  const doneTests = Object.values(d.testsByExam || {}).reduce((acc, g) => acc + (g.done || 0), 0);
  const testPct = totalTests ? Math.round((doneTests / totalTests) * 100) : 0;
  const apfcPct = d.apfc.items ? Math.round((d.apfc.platformComplete / d.apfc.items) * 100) : 0;

  return (
    <>
      <PageHeader title={longDate(d.today)} sub={`Day ${tracker.elapsed + 1} of ${tracker.total + 1} in this plan`}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link className="btn" to="/public" title="View the shareable read-only public dashboard">
            👁 Public View
          </Link>
          <Link className="btn primary" to="/daily">Log today</Link>
        </div>
      </PageHeader>

      <ExamRail start={tracker.start} end={tracker.end} today={d.today} exams={d.exams} />

      {/* Visual Progress Pillars */}
      <div className="pillars-grid">
        <RadialProgressRing
          pct={d.cava?.pct || 0}
          label="CAVA Lectures"
          count={d.cava?.done || 0}
          total={d.cava?.total || 36}
          unit="lectures"
          color="var(--gold)"
        />
        <RadialProgressRing
          pct={d.pyqs?.writtenPct || 0}
          label="PYQ Workbooks"
          count={d.pyqs?.questionsWritten || 0}
          total={d.pyqs?.totalQuestions || 395}
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
          count={d.apfc.platformComplete}
          total={d.apfc.items}
          unit="entries"
          color="#8b5cf6"
        />
      </div>

      <div className="grid three">
        <Panel title="Today" aside={todayLog.capStatus && <Tag tone={todayLog.capStatus === 'In cap' ? 'good' : 'bad'}>{todayLog.capStatus}</Tag>}>
          <div className="figure">
            <span className="figure-num">{h(todayTotal, { dash: '0' })}</span>
            <span className="figure-unit">of {settings.dailyCap}h study + DSA</span>
          </div>
          <Meter value={todayTotal} max={settings.dailyCap} label="Today against daily cap" />
          <dl className="facts">
            <div><dt>Exam study</dt><dd>{hu(todayLog.examStudy)}</dd></div>
            <div><dt>DSA</dt><dd>{hu(todayLog.dsa)}</dd></div>
            <div><dt>Gym</dt><dd>{hu(todayLog.gym)}</dd></div>
            <div><dt>Streak</dt><dd>{d.streak} {d.streak === 1 ? 'day' : 'days'}</dd></div>
          </dl>
        </Panel>

        <Panel
          title="This week"
          aside={wk && <span className="muted">{shortDate(wk.start)} to {shortDate(wk.end)}, {wk.phase}</span>}
          className="span-2"
        >
          {wk ? <WeekStreams wk={wk} /> : <p className="muted">Today is outside every planned week. Add one on the Weekly plan page.</p>}
        </Panel>
      </div>

      {/* Progress & Trajectory Visualization */}
      <div className="grid two">
        <Panel title="14-Day Trajectory & Velocity" aside={<span className="muted">Study & DSA consistency</span>}>
          <TrajectoryAreaChart days={d.recent} cap={settings.dailyCap} />
        </Panel>
        <Panel title="Syllabus Stream Allocation" aside={<span className="muted">All-time hours breakdown</span>}>
          <StreamDonut streamTotals={d.streamTotals} streams={d.streams} />
        </Panel>
      </div>

      <div className="grid three">
        <Panel title="Last 14 days" className="span-2" aside={<span className="legend"><i className="k-study" />Study <i className="k-dsa" />DSA</span>}>
          <RecentBars days={d.recent} cap={settings.dailyCap} />
        </Panel>
        <Panel title="Due and overdue tests" aside={<Link to="/tests">All tests</Link>}>
          {d.due.length === 0 ? (
            <p className="muted">Nothing due in the next 7 days.</p>
          ) : (
            <ul className="due">
              {d.due.slice(0, 6).map((t) => (
                <li key={t._id}>
                  <div>
                    <strong>{t.paper}</strong>
                    <span className="muted">{t.exam}, {t.workflow === 'Review pending' ? `review by ${shortDate(t.targetReview)}` : `attempt by ${shortDate(t.targetAttempt)}`}</span>
                  </div>
                  {t.attemptOverdue || t.reviewOverdue ? <Tag tone="bad">Overdue</Tag> : <Tag tone={workflowTone(t.workflow)}>{t.workflow}</Tag>}
                </li>
              ))}
            </ul>
          )}
          {d.due.length > 6 && <p className="note">{d.due.length - 6} more on the Tests page.</p>}
        </Panel>
      </div>

      <div className="grid three">
        <Panel title="Capacity">
          <table className="kv">
            <thead>
              <tr><th /><th className="r">Before {pivot?.name.split(' ').pop()}</th><th className="r">After</th></tr>
            </thead>
            <tbody>
              <tr><td>Capacity</td><td className="r">{h(summary.preCapacity)}h</td><td className="r">{h(summary.postCapacity)}h</td></tr>
              <tr><td>Planned</td><td className="r">{h(summary.prePlanned)}h</td><td className="r">{h(summary.postPlanned)}h</td></tr>
              <tr className="em"><td>Unallocated</td><td className="r">{h(summary.preUnallocated)}h</td><td className="r">{h(summary.postUnallocated)}h</td></tr>
            </tbody>
          </table>
          <p className="note">After DSA and a {Math.round(settings.buffer * 100)}% buffer you have about {h(summary.availablePerDay)}h a day for exam study.</p>
        </Panel>

        <Panel title="Tests by exam">
          <table className="kv">
            <thead><tr><th>Exam</th><th className="r">Done</th><th className="r">Review</th><th className="r">Overdue</th></tr></thead>
            <tbody>
              {Object.entries(d.testsByExam).map(([exam, g]) => (
                <tr key={exam}>
                  <td>{exam}</td>
                  <td className="r">{g.done}/{g.total}</td>
                  <td className="r">{g.reviewPending || '–'}</td>
                  <td className={`r ${g.overdue ? 'bad' : ''}`}>{g.overdue || '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="note">{h(summary.testsRemainingH)}h of attempts and reviews remain.</p>
        </Panel>

        <Panel title="Weight" aside={<span className="muted">goal {settings.weight.target} kg by {shortDate(settings.weight.goalDate)}</span>}>
          <div className="figure">
            <span className="figure-num">{d.latestWeight ? d.latestWeight.weight : settings.weight.start}</span>
            <span className="figure-unit">kg {d.latestWeight ? `on ${shortDate(d.latestWeight.date)}` : '(starting value)'}</span>
          </div>
          {d.weights.length > 0 ? (
            <WeightLine points={d.weights} target={settings.weight.target} start={settings.weight.start} />
          ) : (
            <p className="muted">Log your weight on the Daily page to see the trend.</p>
          )}
          <p className="note">
            {h((d.latestWeight?.weight ?? settings.weight.start) - settings.weight.target)} kg to go from {settings.weight.start} kg start.
          </p>
        </Panel>
      </div>

      <div className="grid two">
        <Panel title="CSE backlog" aside={<Link to="/backlog">Edit backlog</Link>}>
          <ul className="bars">
            {d.backlog.map((b) => (
              <li key={b._id}>
                <span className="bars-label">{b.workstream}</span>
                <Meter value={b.progress || 0} max={1} label={`${b.workstream} progress`} />
                <span className="bars-val">{b.remainingH !== null ? `${h(b.remainingH)}h left` : b.status}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="APFC course" aside={<Link to="/apfc">Open course</Link>}>
          <div className="figure">
            <span className="figure-num">{d.apfc.platformComplete}</span>
            <span className="figure-unit">of {d.apfc.items} platform entries complete</span>
          </div>
          <Meter value={d.apfc.platformComplete} max={d.apfc.items} label="APFC entries complete" />
          <p className="note">
            {d.apfc.cyclesComplete} of {d.apfc.areas} syllabus areas have a full learning cycle (coverage, questions, error fixes, recall).
            Planned APFC hours in the weekly plan: {h(summary.plannedByStream.apfc)}h.
          </p>
        </Panel>
      </div>
    </>
  );
}

function WeekStreams({ wk }) {
  const rows = STREAMS.filter((s) => (wk.quotas?.[s.key] || 0) > 0 || (wk.actualByStream?.[s.key] || 0) > 0);
  return (
    <>
      <div className="week-head">
        <div className="figure">
          <span className="figure-num">{h(wk.actualStudy, { dash: '0' })}</span>
          <span className="figure-unit">of {h(wk.planned)}h planned exam study, {wk.daysLogged} of {wk.days} days logged</span>
        </div>
        <span className="muted">Capacity {h(wk.capacity)}h, DSA {h(wk.actualDsa, { dash: '0' })} of {h(wk.dsaQuota)}h</span>
      </div>
      <ul className="bars">
        {rows.map((s) => {
          const plan = wk.quotas?.[s.key] || 0;
          const act = wk.actualByStream?.[s.key] || 0;
          return (
            <li key={s.key}>
              <span className="bars-label">{s.label}</span>
              <Meter value={act} max={plan || act} label={`${s.label} this week`} />
              <span className="bars-val">{h(act)} / {h(plan)}h</span>
            </li>
          );
        })}
      </ul>
      {wk.overload > 0 && <p className="note bad">This week is over capacity by {h(wk.overload)}h. Reduce a quota on the Weekly plan.</p>}
      {wk.daysLogged > 0 && <p className="note">Actual vs plan: {h(wk.actualVsPlan, { signed: true })}h ({pct(wk.planned ? wk.actualStudy / wk.planned : null)} of plan).</p>}
    </>
  );
}
