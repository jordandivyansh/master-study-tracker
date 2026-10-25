import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { useResource } from '../hooks.js';
import { PageHeader, Panel, Loading, Meter, Tag, Chips, useNotice } from '../components/ui.jsx';
import { STREAMS, h, shortDate, longDate, todayISO, addDaysISO } from '../format.js';

const EMPTY = { hours: {}, dsa: null, gym: null, weight: null, notes: '' };
const RANGES = [
  { value: 'week', label: 'Last 7 days' },
  { value: 'month', label: 'Last 30 days' },
  { value: 'all', label: 'Whole plan' },
];

export default function Daily() {
  const notify = useNotice();
  const { data, setData, error } = useResource('/daily');
  const [date, setDate] = useState(todayISO());
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [range, setRange] = useState('week');

  // O(1) lookup of any day's row while the form date changes.
  const byDate = useMemo(() => new Map((data?.rows || []).map((r) => [r.date, r])), [data]);

  useEffect(() => {
    const row = byDate.get(date);
    setForm(row && row.logged ? { hours: { ...row.hours }, dsa: row.dsa, gym: row.gym, weight: row.weight, notes: row.notes || '' } : EMPTY);
  }, [date, byDate]);

  if (!data) return <Loading error={error} />;

  const cap = data.cap;
  const toNum = (v) => (v === '' ? null : Number(v));
  const setHour = (k, v) => setForm((f) => ({ ...f, hours: { ...f.hours, [k]: toNum(v) } }));
  const sum = (vals) => (vals.some((v) => typeof v === 'number') ? vals.reduce((s, v) => s + (v || 0), 0) : null);
  const examStudy = sum(STREAMS.map((s) => form.hours[s.key]));
  const total = sum([examStudy, form.dsa]);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const row = await api.put(`/daily/${date}`, form);
      setData((d) => ({ ...d, rows: d.rows.map((r) => (r.date === date ? row : r)) }));
      notify(`Saved ${shortDate(date)}`, 'ok');
    } catch (err) {
      notify(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function clearDay() {
    try {
      await api.del(`/daily/${date}`);
      setData((d) => ({ ...d, rows: d.rows.map((r) => (r.date === date ? { date, day: r.day, hours: {}, logged: false } : r)) }));
      setForm(EMPTY);
      notify(`Cleared ${shortDate(date)}`, 'ok');
    } catch (err) {
      notify(err.message);
    }
  }

  const today = data.today;
  const from = range === 'week' ? addDaysISO(today, -6) : range === 'month' ? addDaysISO(today, -29) : '0000';
  const visible = data.rows.filter((r) => r.date >= from && r.date <= today).reverse();
  const totals = Object.fromEntries(
    [...STREAMS.map((s) => s.key), 'dsa', 'gym', 'examStudy'].map((k) => [
      k,
      sum(visible.map((r) => (STREAMS.some((s) => s.key === k) ? r.hours?.[k] : r[k]))),
    ]),
  );

  return (
    <>
      <PageHeader title="Daily log" sub="Leave a field blank if you did not track it. Enter 0 only when you mean zero." />

      <Panel title={longDate(date)}>
        <form className="log-form" onSubmit={save}>
          <div className="log-date">
            <button type="button" className="btn ghost" onClick={() => setDate(addDaysISO(date, -1))} aria-label="Previous day">‹</button>
            <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="Date" />
            <button type="button" className="btn ghost" onClick={() => setDate(addDaysISO(date, 1))} aria-label="Next day">›</button>
            {date !== today && <button type="button" className="btn ghost" onClick={() => setDate(today)}>Today</button>}
          </div>

          <fieldset className="log-grid">
            <legend>Exam study hours</legend>
            {STREAMS.map((s) => (
              <label key={s.key}>
                <span>{s.label}</span>
                <input type="number" step="0.25" min="0" max="24" inputMode="decimal" value={form.hours[s.key] ?? ''} onChange={(e) => setHour(s.key, e.target.value)} />
              </label>
            ))}
          </fieldset>

          <fieldset className="log-grid">
            <legend>Outside exam study</legend>
            <label>
              <span>DSA (counts toward cap)</span>
              <input type="number" step="0.25" min="0" max="24" value={form.dsa ?? ''} onChange={(e) => setForm({ ...form, dsa: toNum(e.target.value) })} />
            </label>
            <label>
              <span>Gym (outside cap)</span>
              <input type="number" step="0.25" min="0" max="24" value={form.gym ?? ''} onChange={(e) => setForm({ ...form, gym: toNum(e.target.value) })} />
            </label>
            <label>
              <span>Weight, kg</span>
              <input type="number" step="0.1" min="20" max="250" value={form.weight ?? ''} onChange={(e) => setForm({ ...form, weight: toNum(e.target.value) })} />
            </label>
            <label className="wide">
              <span>Notes</span>
              <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="What you covered, what slipped" />
            </label>
          </fieldset>

          <div className="log-foot">
            <div className="log-total">
              <span>
                <strong>{h(total, { dash: '0' })}h</strong> of {cap}h cap ({h(examStudy, { dash: '0' })}h study + {h(form.dsa, { dash: '0' })}h DSA)
              </span>
              <Meter value={total} max={cap} label="Day total against cap" />
            </div>
            {byDate.get(date)?.logged && <button type="button" className="btn ghost" onClick={clearDay}>Clear day</button>}
            <button className="btn primary" disabled={saving}>{saving ? 'Saving…' : 'Save day'}</button>
          </div>
        </form>
      </Panel>

      <Panel title="History" aside={<Chips options={RANGES} value={range} onChange={setRange} label="Range" />}>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Date</th>
                {STREAMS.map((s) => <th key={s.key} className="r" title={s.label}>{s.short || s.label}</th>)}
                <th className="r">Study</th>
                <th className="r">DSA</th>
                <th className="r">Gym</th>
                <th className="r">Kg</th>
                <th>Cap</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.date} className={`clickable ${r.date === date ? 'sel' : ''}`} onClick={() => setDate(r.date)}>
                  <td className="nowrap">{r.day} {shortDate(r.date)}</td>
                  {STREAMS.map((s) => <td key={s.key} className="r">{h(r.hours?.[s.key], { dash: '' })}</td>)}
                  <td className="r strong">{h(r.examStudy, { dash: '' })}</td>
                  <td className="r">{h(r.dsa, { dash: '' })}</td>
                  <td className="r">{h(r.gym, { dash: '' })}</td>
                  <td className="r">{r.weight ?? ''}</td>
                  <td>{r.capStatus ? <Tag tone={r.capStatus === 'In cap' ? 'good' : 'bad'}>{r.capStatus === 'In cap' ? 'In' : 'Over'}</Tag> : <span className="muted">not logged</span>}</td>
                  <td className="notes">{r.notes}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Total</td>
                {STREAMS.map((s) => <td key={s.key} className="r">{h(totals[s.key], { dash: '' })}</td>)}
                <td className="r strong">{h(totals.examStudy, { dash: '' })}</td>
                <td className="r">{h(totals.dsa, { dash: '' })}</td>
                <td className="r">{h(totals.gym, { dash: '' })}</td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        </div>
      </Panel>
    </>
  );
}
