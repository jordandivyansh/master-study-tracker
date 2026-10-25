import { useCallback } from 'react';
import { api } from '../api.js';
import { useResource, usePatchRow } from '../hooks.js';
import { PageHeader, Panel, Loading, NumCell, TextCell, DateCell, useNotice } from '../components/ui.jsx';
import { STREAMS, h, shortDate, todayISO, addDaysISO } from '../format.js';

export default function Weekly() {
  const notify = useNotice();
  const { data: weeks, setData, error } = useResource('/weeks');
  const setList = useCallback((fn) => setData((w) => fn(w)), [setData]);
  const patch = usePatchRow('/weeks', setList, notify);

  if (!weeks) return <Loading error={error} />;

  const today = todayISO();
  const sum = (f) => weeks.reduce((s, w) => s + (f(w) || 0), 0);
  const anyActual = weeks.some((w) => w.actualStudy !== null);

  async function addWeek() {
    const last = weeks[weeks.length - 1];
    const start = last ? addDaysISO(last.end, 1) : today;
    try {
      const w = await api.post('/weeks', { start, end: addDaysISO(start, 6), phase: last?.phase || '', quotas: {} });
      setData([...weeks, w]);
    } catch (e) {
      notify(e.message);
    }
  }

  async function removeWeek(w) {
    if (!window.confirm(`Delete the week starting ${shortDate(w.start)}? Daily logs are kept.`)) return;
    try {
      await api.del(`/weeks/${w._id}`);
      setData(weeks.filter((x) => x._id !== w._id));
    } catch (e) {
      notify(e.message);
    }
  }

  return (
    <>
      <PageHeader title="Weekly plan" sub="Quotas are editable. Spare is capacity minus planned; a negative spare means the week is overloaded. Click a period to change its dates.">
        <button className="btn" onClick={addWeek}>Add week</button>
      </PageHeader>

      <Panel>
        <div className="table-wrap">
          <table className="data weekly">
            <thead>
              <tr>
                <th>Period</th>
                <th>Phase</th>
                <th className="r" title="Capacity after DSA quota and buffer">Cap.</th>
                {STREAMS.map((s) => <th key={s.key} className="r" title={s.label}>{s.short || s.label}</th>)}
                <th className="r">Planned</th>
                <th className="r" title="Capacity minus planned">Spare</th>
                <th className="r">Actual</th>
                <th className="r">vs plan</th>
                <th className="r">DSA</th>
                <th>Notes</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {weeks.map((w) => {
                const current = w.start <= today && today <= w.end;
                return (
                  <tr key={w._id} className={current ? 'sel' : ''}>
                    <td className="nowrap">
                      <details className="period">
                        <summary>
                          {shortDate(w.start)} to {shortDate(w.end)}
                          <span className="muted small"> {w.days}d</span>
                        </summary>
                        <DateCell value={w.start} onCommit={(v) => v && patch(w, { start: v })} label="Start" />
                        <DateCell value={w.end} onCommit={(v) => v && patch(w, { end: v })} label="End" />
                      </details>
                    </td>
                    <td><TextCell value={w.phase} onCommit={(v) => patch(w, { phase: v })} label="Phase" width="8rem" /></td>
                    <td className="r">{h(w.capacity)}</td>
                    {STREAMS.map((s) => (
                      <td key={s.key} className="r">
                        <NumCell
                          value={w.quotas?.[s.key] ? Math.round(w.quotas[s.key] * 100) / 100 : null}
                          width="3.6rem"
                          label={`${s.label} quota`}
                          onCommit={(v) => patch(w, { quotas: { ...w.quotas, [s.key]: v ?? 0 } })}
                        />
                      </td>
                    ))}
                    <td className="r strong">{h(w.planned)}</td>
                    <td className={`r ${w.unallocated < -0.01 ? 'bad strong' : ''}`}>{h(w.unallocated)}</td>
                    <td className="r">{h(w.actualStudy, { dash: '' })}</td>
                    <td className={`r ${w.actualVsPlan < 0 ? 'bad' : ''}`}>{h(w.actualVsPlan, { dash: '', signed: true })}</td>
                    <td className="r">{h(w.actualDsa, { dash: '' })}<span className="muted small"> / {h(w.dsaQuota)}</span></td>
                    <td><TextCell value={w.notes} onCommit={(v) => patch(w, { notes: v })} label="Notes" width="12rem" /></td>
                    <td><button className="btn ghost small" onClick={() => removeWeek(w)} aria-label="Delete week">Delete</button></td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2}>Total</td>
                <td className="r">{h(sum((w) => w.capacity))}</td>
                {STREAMS.map((s) => <td key={s.key} className="r">{h(sum((w) => w.quotas?.[s.key]))}</td>)}
                <td className="r strong">{h(sum((w) => w.planned))}</td>
                <td className="r">{h(sum((w) => w.unallocated))}</td>
                <td className="r">{anyActual ? h(sum((w) => w.actualStudy)) : ''}</td>
                <td colSpan={4} />
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="note">
          Capacity = days × daily cap, minus the DSA quota, minus the buffer. Changing an exam date does not move these rows; edit the periods here when the plan changes.
        </p>
      </Panel>
    </>
  );
}
