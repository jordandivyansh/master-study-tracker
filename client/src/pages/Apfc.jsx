import { useCallback, useState } from 'react';
import { useResource, usePatchRow } from '../hooks.js';
import { PageHeader, Panel, Loading, Chips, Meter, Tag, NumCell, TextCell, DateCell, SelectCell, useNotice } from '../components/ui.jsx';
import { h } from '../format.js';

const TABS = [
  { value: 'modules', label: 'Modules' },
  { value: 'areas', label: 'Syllabus coverage' },
  { value: 'entries', label: 'All 377 entries' },
];

export default function Apfc() {
  const [tab, setTab] = useState('modules');
  return (
    <>
      <PageHeader title="APFC course" sub="CGB Mentors 90-day crash course, access until 31 Jan 2027. Select only the items that close a gap; entries include PDFs and live sessions, so 377 entries are not 377 lecture-hours." />
      <Chips options={TABS} value={tab} onChange={setTab} label="Section" />
      {tab === 'modules' && <Modules />}
      {tab === 'areas' && <Areas />}
      {tab === 'entries' && <Entries />}
    </>
  );
}

function useList(url) {
  const notify = useNotice();
  const res = useResource(url);
  const { setData } = res;
  const setList = useCallback((fn) => setData((x) => fn(x)), [setData]);
  const base = url.split('?')[0];
  const patch = usePatchRow(base, setList, notify);
  return { ...res, patch };
}

function Modules() {
  const { data: mods, error, patch } = useList('/apfc/modules');
  if (!mods) return <Loading error={error} />;
  const sel = mods.reduce((s, m) => s + (m.selectedStudyH || 0), 0);
  const done = mods.reduce((s, m) => s + (m.hoursDone || 0), 0);
  return (
    <Panel title="Modules" aside={<span className="muted">{h(done)} of {h(sel)}h selected study done</span>}>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th className="r">#</th><th>Module</th><th>Priority</th><th className="r">Entries</th><th>Platform complete</th>
              <th>Study status</th><th className="r">Selected h</th><th className="r">Done h</th><th className="r">Left</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {mods.map((m) => (
              <tr key={m._id}>
                <td className="r muted">{m.num}</td>
                <td className="strong">{m.module}</td>
                <td><Tag tone={m.priority === 'Core' ? 'gold' : m.priority === 'Gap' ? 'bad' : 'plain'}>{m.priority}</Tag></td>
                <td className="r">{m.items}</td>
                <td className="progress-cell">
                  <NumCell value={m.platformComplete} step={1} max={m.items} width="3.4rem" onCommit={(v) => patch(m, { platformComplete: v ?? 0 })} label="Platform complete" />
                  <Meter value={m.platformComplete} max={m.items || 1} label="Platform complete" />
                </td>
                <td><SelectCell value={m.studyStatus} options={['Not started', 'Selecting', 'Studying', 'Reviewed']} onCommit={(v) => patch(m, { studyStatus: v })} label="Study status" /></td>
                <td className="r"><NumCell value={m.selectedStudyH} onCommit={(v) => patch(m, { selectedStudyH: v })} label="Selected study hours" /></td>
                <td className="r"><NumCell value={m.hoursDone} onCommit={(v) => patch(m, { hoursDone: v })} label="Hours done" /></td>
                <td className="r">{h(m.hoursRemaining, { dash: '' })}</td>
                <td className="small">{m.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function Areas() {
  const { data: areas, error, patch } = useList('/apfc/areas');
  if (!areas) return <Loading error={error} />;
  return (
    <Panel title="Syllabus coverage" aside={<span className="muted">A cycle is complete after coverage, questions, error correction and a recall check</span>}>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr><th>Area</th><th>First coverage</th><th className="r">Questions reviewed</th><th>Errors corrected</th><th>Recall checked</th><th>Cycle</th><th>Source or gap action</th></tr>
          </thead>
          <tbody>
            {areas.map((a) => (
              <tr key={a._id}>
                <td className="strong">{a.area}</td>
                <td><DateCell value={a.firstCoverage} onCommit={(v) => patch(a, { firstCoverage: v })} label="First coverage" /></td>
                <td className="r"><NumCell value={a.questionsReviewed} step={5} onCommit={(v) => patch(a, { questionsReviewed: v })} label="Questions reviewed" /></td>
                <td><DateCell value={a.errorsCorrected} onCommit={(v) => patch(a, { errorsCorrected: v })} label="Errors corrected" /></td>
                <td><DateCell value={a.recallChecked} onCommit={(v) => patch(a, { recallChecked: v })} label="Recall checked" /></td>
                <td><Tag tone={a.learningCycle === 'Cycle complete' ? 'good' : 'plain'}>{a.learningCycle}</Tag></td>
                <td className="small">{a.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function Entries() {
  const { data: mods } = useResource('/apfc/modules');
  const [module, setModule] = useState('');
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  // The URL is derived from the filters; changing it makes useResource refetch.
  const params = new URLSearchParams(Object.entries({ module, platformStatus: status, q: search }).filter(([, v]) => v));
  const { data: entries, error, patch } = useList(`/apfc/entries${params.size ? `?${params}` : ''}`);

  return (
    <Panel title={entries ? `${entries.length} entries` : 'Entries'}>
      <div className="filters">
        <select value={module} onChange={(e) => setModule(e.target.value)} aria-label="Module">
          <option value="">All modules</option>
          {(mods || []).map((m) => <option key={m._id} value={m.module}>{m.num}. {m.module}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Platform status">
          <option value="">Any platform status</option>
          <option>Not started</option><option>Now playing</option><option>Completed</option>
        </select>
        <form onSubmit={(e) => { e.preventDefault(); setSearch(q.trim()); }} className="search">
          <input type="search" value={q} onChange={(e) => { setQ(e.target.value); if (!e.target.value) setSearch(''); }} placeholder="Search titles, press Enter" aria-label="Search titles" />
        </form>
      </div>
      {!entries ? (
        <Loading error={error} />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr><th>ID</th><th>Title</th><th>Type</th><th>Platform</th><th className="r">Runtime</th><th>Study mode</th><th className="r">Selected h</th><th className="r">Done h</th><th>Review</th><th>Notes</th></tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e._id}>
                  <td className="nowrap muted small">{e.code}</td>
                  <td>{e.title}{!module && <div className="muted small">{e.module}</div>}</td>
                  <td className="small">{e.type}</td>
                  <td><SelectCell value={e.platformStatus} options={['Not started', 'Now playing', 'Completed']} onCommit={(v) => patch(e, { platformStatus: v })} label="Platform status" /></td>
                  <td className="r small">{e.displayedDuration || ''}</td>
                  <td><SelectCell value={e.studyMode} allowBlank options={['Watch', 'Read', 'Practice', 'Notes only', 'Skip overlap']} onCommit={(v) => patch(e, { studyMode: v })} label="Study mode" /></td>
                  <td className="r"><NumCell value={e.selectedStudyH} step={0.25} width="4rem" onCommit={(v) => patch(e, { selectedStudyH: v })} label="Selected hours" /></td>
                  <td className="r"><NumCell value={e.hoursDone} step={0.25} width="4rem" onCommit={(v) => patch(e, { hoursDone: v })} label="Hours done" /></td>
                  <td><SelectCell value={e.reviewStatus} options={['Not reviewed', 'Reviewed']} onCommit={(v) => patch(e, { reviewStatus: v })} label="Review status" /></td>
                  <td><TextCell value={e.notes} onCommit={(v) => patch(e, { notes: v })} label="Notes" width="12rem" /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {entries.length === 0 && <p className="empty muted">No entries match. Clear a filter to see more.</p>}
        </div>
      )}
    </Panel>
  );
}
