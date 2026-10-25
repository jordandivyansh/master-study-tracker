import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { useResource } from '../hooks.js';
import { PageHeader, Panel, Loading, useNotice } from '../components/ui.jsx';

export default function Settings() {
  const notify = useNotice();
  const { data, error, setData } = useResource('/settings');
  const [form, setForm] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (data) setForm(structuredClone(data)); // deep copy: edits do not mutate the loaded data
  }, [data]);

  if (!form) return <Loading error={error} />;

  // Immutable update of a nested path, e.g. set(['weight', 'target'], 70)
  const set = (path, value) =>
    setForm((f) => {
      const next = structuredClone(f);
      let o = next;
      for (const k of path.slice(0, -1)) o = o[k];
      o[path.at(-1)] = value;
      return next;
    });
  const n = (v) => (v === '' ? null : Number(v));

  async function save(e) {
    e.preventDefault();
    try {
      const saved = await api.put('/settings', form);
      setData(saved);
      notify('Settings saved', 'ok');
    } catch (err) {
      notify(err.message);
    }
  }

  async function restore(file) {
    if (!file) return;
    if (!window.confirm('Restoring replaces everything in the tracker with the backup. Continue?')) return;
    try {
      const json = JSON.parse(await file.text());
      const res = await api.post('/restore', json);
      notify(`Restored ${res.restored.dailyLogs} daily logs and ${res.restored.tests} tests`, 'ok');
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      notify(err.message);
    } finally {
      fileRef.current.value = '';
    }
  }

  return (
    <>
      <PageHeader title="Settings" sub="These are the inputs every calculation reads. Changing an exam date here does not move weekly rows." />
      <form onSubmit={save} className="settings">
        <Panel title="Daily capacity">
          <div className="form-grid">
            <Field label="Study + DSA cap, hours a day" value={form.dailyCap} onChange={(v) => set(['dailyCap'], n(v))} step="0.5" />
            <Field label="DSA, hours a week" value={form.dsaWeekly} onChange={(v) => set(['dsaWeekly'], n(v))} step="0.5" />
            <Field label="Buffer, % of capacity" value={Math.round(form.buffer * 100)} onChange={(v) => set(['buffer'], n(v) / 100)} step="1" />
            <Field label="Gym, hours a day (outside cap)" value={form.gymDaily} onChange={(v) => set(['gymDaily'], n(v))} step="0.5" />
            <Field label="Plan starts" type="date" value={form.trackerStart} onChange={(v) => set(['trackerStart'], v)} />
            <Field label="Plan ends" type="date" value={form.trackerEnd} onChange={(v) => set(['trackerEnd'], v)} />
          </div>
        </Panel>

        <Panel title="Exams">
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Exam</th><th>Date</th><th className="r">Prep budget h</th><th>Note</th></tr></thead>
              <tbody>
                {form.exams.map((ex, i) => (
                  <tr key={ex.key}>
                    <td><input className="cell" value={ex.name} onChange={(e) => set(['exams', i, 'name'], e.target.value)} aria-label="Exam name" /></td>
                    <td><input className="cell date" type="date" value={ex.date} onChange={(e) => set(['exams', i, 'date'], e.target.value)} aria-label="Exam date" /></td>
                    <td className="r"><input className="cell num" type="number" value={ex.prepBudgetH ?? ''} onChange={(e) => set(['exams', i, 'prepBudgetH'], n(e.target.value))} aria-label="Prep budget" /></td>
                    <td><input className="cell" style={{ width: '22rem' }} value={ex.note ?? ''} onChange={(e) => set(['exams', i, 'note'], e.target.value)} aria-label="Note" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <label className="field inline">
            <span>Split capacity before and after</span>
            <select value={form.pivotExam} onChange={(e) => set(['pivotExam'], e.target.value)}>
              {form.exams.map((ex) => <option key={ex.key} value={ex.key}>{ex.name}</option>)}
            </select>
          </label>
        </Panel>

        <div className="grid two">
          <Panel title="Test durations, hours">
            <table className="data">
              <thead><tr><th>Exam</th><th className="r">Attempt</th><th className="r">Review</th></tr></thead>
              <tbody>
                {Object.entries(form.durations).map(([exam, d]) => (
                  <tr key={exam}>
                    <td>{exam === 'CSE' ? 'CSE Mains paper' : exam}</td>
                    <td className="r"><input className="cell num" type="number" step="0.5" value={d.attempt} onChange={(e) => set(['durations', exam, 'attempt'], n(e.target.value))} aria-label={`${exam} attempt hours`} /></td>
                    <td className="r"><input className="cell num" type="number" step="0.5" value={d.review} onChange={(e) => set(['durations', exam, 'review'], n(e.target.value))} aria-label={`${exam} review hours`} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
          <Panel title="Weight and CAVA">
            <div className="form-grid">
              <Field label="Starting weight, kg" value={form.weight.start} onChange={(v) => set(['weight', 'start'], n(v))} step="0.1" />
              <Field label="Target weight, kg" value={form.weight.target} onChange={(v) => set(['weight', 'target'], n(v))} step="0.1" />
              <Field label="Weight goal date" type="date" value={form.weight.goalDate} onChange={(v) => set(['weight', 'goalDate'], v)} />
              <Field label="New CAVA lectures a week" value={form.cava.newPerWeek} onChange={(v) => set(['cava', 'newPerWeek'], n(v))} />
              <Field label="CAVA hours per lecture" value={form.cava.hoursPerLecture} onChange={(v) => set(['cava', 'hoursPerLecture'], n(v))} step="0.5" />
            </div>
          </Panel>
        </div>

        <div className="sticky-save">
          <button className="btn primary">Save settings</button>
        </div>
      </form>

      <Panel title="Backup">
        <p>Your data is saved to your account. Download a backup to keep a copy of your study plan and progress.</p>
        <div className="row-actions">
          <a className="btn" href="/api/backup" download>Download backup</a>
          <label className="btn ghost">
            Restore from backup
            <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => restore(e.target.files[0])} />
          </label>
        </div>
      </Panel>
    </>
  );
}

function Field({ label, value, onChange, type = 'number', step }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} step={step} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
