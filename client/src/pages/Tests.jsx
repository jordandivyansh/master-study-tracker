import { useCallback, useMemo, useState } from 'react';
import { api } from '../api.js';
import { useResource, usePatchRow } from '../hooks.js';
import { PageHeader, Panel, Loading, Chips, Tag, workflowTone, NumCell, TextCell, DateCell, SelectCell, useNotice } from '../components/ui.jsx';
import { h, pct, shortDate, todayISO } from '../format.js';

const EXAMS = ['UPPSC', 'SSC', 'CAT', 'APFC', 'CSE'];
const VIEWS = [
  { value: 'open', label: 'Open' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'review', label: 'Review pending' },
  { value: 'done', label: 'Done' },
  { value: 'all', label: 'All' },
];
const BLANK = { code: '', exam: 'UPPSC', paper: '', type: '', targetAttempt: '', targetReview: '', maxScore: '' };

export default function Tests() {
  const notify = useNotice();
  const { data: tests, setData, error } = useResource('/tests');
  const setList = useCallback((fn) => setData((t) => fn(t)), [setData]);
  const patch = usePatchRow('/tests', setList, notify);
  const [exam, setExam] = useState('All');
  const [view, setView] = useState('open');
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(BLANK);

  // Filtering is a pure function of (tests, exam, view): memoise it so typing
  // in a cell does not re-filter unless one of those inputs changed.
  const visible = useMemo(() => {
    if (!tests) return [];
    return tests.filter((t) => {
      if (exam !== 'All' && t.exam !== exam) return false;
      if (view === 'open') return t.workflow !== 'Done';
      if (view === 'overdue') return t.attemptOverdue || t.reviewOverdue;
      if (view === 'review') return t.workflow === 'Review pending';
      if (view === 'done') return t.workflow === 'Done';
      return true;
    });
  }, [tests, exam, view]);

  if (!tests) return <Loading error={error} />;
  const today = todayISO();
  const remaining = visible.reduce((s, t) => s + t.remainingH, 0);

  const markAttempted = (t) => patch(t, { attemptStatus: 'Attempted', actualAttempt: t.actualAttempt || today });
  const markReviewed = (t) => patch(t, { reviewStatus: 'Reviewed', actualReview: t.actualReview || today, ...(t.attemptStatus !== 'Attempted' && { attemptStatus: 'Attempted', actualAttempt: t.actualAttempt || today }) });

  async function create(e) {
    e.preventDefault();
    try {
      const body = { ...draft, maxScore: draft.maxScore === '' ? null : Number(draft.maxScore), targetAttempt: draft.targetAttempt || null, targetReview: draft.targetReview || draft.targetAttempt || null };
      const t = await api.post('/tests', body);
      setData([...tests, t]);
      setDraft(BLANK);
      setAdding(false);
      notify(`Added ${t.code}`, 'ok');
    } catch (err) {
      notify(err.message);
    }
  }

  return (
    <>
      <PageHeader title="Tests" sub="A test is done only after both the attempt and the review. Log the hours once, on the Daily page.">
        <button className="btn" onClick={() => setAdding((a) => !a)}>{adding ? 'Close' : 'Add test'}</button>
      </PageHeader>

      {adding && (
        <Panel title="New test">
          <form className="inline-form" onSubmit={create}>
            <label><span>ID</span><input required value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} placeholder="APFC-MOCK-5" /></label>
            <label><span>Exam</span><select value={draft.exam} onChange={(e) => setDraft({ ...draft, exam: e.target.value })}>{EXAMS.map((x) => <option key={x}>{x}</option>)}</select></label>
            <label className="wide"><span>Paper or topic</span><input required value={draft.paper} onChange={(e) => setDraft({ ...draft, paper: e.target.value })} /></label>
            <label><span>Type</span><input value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })} placeholder="Full mock" /></label>
            <label><span>Attempt by</span><input type="date" value={draft.targetAttempt} onChange={(e) => setDraft({ ...draft, targetAttempt: e.target.value })} /></label>
            <label><span>Review by</span><input type="date" value={draft.targetReview} onChange={(e) => setDraft({ ...draft, targetReview: e.target.value })} /></label>
            <label><span>Max score</span><input type="number" value={draft.maxScore} onChange={(e) => setDraft({ ...draft, maxScore: e.target.value })} /></label>
            <button className="btn primary">Add test</button>
          </form>
        </Panel>
      )}

      <Panel
        title={`${visible.length} tests`}
        aside={<span className="muted">{h(remaining)}h of work left in this view</span>}
      >
        <div className="filters">
          <Chips options={['All', ...EXAMS]} value={exam} onChange={setExam} label="Exam" />
          <Chips options={VIEWS} value={view} onChange={setView} label="Status" />
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>ID</th><th>Paper</th><th>Released</th><th>Attempt by</th><th>Review by</th>
                <th>Attempt</th><th>Review</th><th>Score</th><th className="r">%</th><th className="r">Left</th><th>Status</th><th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((t) => (
                <tr key={t._id}>
                  <td className="nowrap strong">{t.code}</td>
                  <td className="paper">{t.paper}<div className="muted small">{t.type}</div></td>
                  <td className={`nowrap ${t.released ? '' : 'muted'}`}>{shortDate(t.release)}</td>
                  <td className={t.attemptOverdue ? 'bad' : ''}><DateCell value={t.targetAttempt} onCommit={(v) => patch(t, { targetAttempt: v })} label="Target attempt" /></td>
                  <td className={t.reviewOverdue ? 'bad' : ''}><DateCell value={t.targetReview} onCommit={(v) => patch(t, { targetReview: v })} label="Target review" /></td>
                  <td>
                    {t.attemptStatus === 'Attempted' ? (
                      <SelectCell value={t.attemptStatus} options={['Not reported', 'Pending', 'Attempted']} onCommit={(v) => patch(t, { attemptStatus: v })} label="Attempt status" />
                    ) : (
                      <button className="btn small" onClick={() => markAttempted(t)}>Mark attempted</button>
                    )}
                    {t.actualAttempt && <div className="muted small">{shortDate(t.actualAttempt)}</div>}
                  </td>
                  <td>
                    {t.reviewStatus === 'Reviewed' ? (
                      <SelectCell value={t.reviewStatus} options={['Pending', 'Reviewed']} onCommit={(v) => patch(t, { reviewStatus: v })} label="Review status" />
                    ) : (
                      <button className="btn small" onClick={() => markReviewed(t)}>Mark reviewed</button>
                    )}
                    {t.actualReview && <div className="muted small">{shortDate(t.actualReview)}</div>}
                  </td>
                  <td className="nowrap">
                    <NumCell value={t.score} min={-1000} step={0.5} width="4rem" onCommit={(v) => patch(t, { score: v })} label="Score" />
                    <span className="muted"> / </span>
                    <NumCell value={t.maxScore} step={1} width="3.6rem" onCommit={(v) => patch(t, { maxScore: v })} label="Max score" />
                  </td>
                  <td className="r">{pct(t.scorePct)}</td>
                  <td className="r">{h(t.remainingH)}h</td>
                  <td>{t.attemptOverdue || t.reviewOverdue ? <Tag tone="bad">Overdue</Tag> : <Tag tone={workflowTone(t.workflow)}>{t.workflow}</Tag>}</td>
                  <td><TextCell value={t.notes} onCommit={(v) => patch(t, { notes: v })} label="Notes" width="14rem" /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {visible.length === 0 && <p className="empty muted">No tests match these filters.</p>}
        </div>
      </Panel>
    </>
  );
}
