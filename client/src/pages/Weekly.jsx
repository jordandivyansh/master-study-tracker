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
  const currentWeek = weeks.find((w) => w.start <= today && today <= w.end);

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

      {currentWeek && (
        <div style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(56, 189, 248, 0.08))', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 800, letterSpacing: '0.5px' }}>
              📍 Current Active Period ({shortDate(currentWeek.start)} – {shortDate(currentWeek.end)})
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginTop: '3px' }}>
              {currentWeek.phase}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {currentWeek.notes || 'Interview mocks & Pub Ad Optional focus.'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--line)', borderRadius: '8px', padding: '8px 14px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Capacity</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>{h(currentWeek.capacity)}h</div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--line)', borderRadius: '8px', padding: '8px 14px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Planned Study</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--blue)' }}>{h(currentWeek.planned)}h</div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--line)', borderRadius: '8px', padding: '8px 14px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Logged Study</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--emerald)' }}>{h(currentWeek.actualStudy, { dash: '0' })}h</div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--line)', borderRadius: '8px', padding: '8px 14px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Daily Newspaper</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--gold)' }}>{h(currentWeek.actualDsa, { dash: '0' })} / {h(currentWeek.dsaQuota)}h</div>
            </div>
          </div>
        </div>
      )}

      <Panel>
        <div className="table-wrap">
          <table className="data weekly">
            <thead>
              <tr>
                <th>Period</th>
                <th>Phase</th>
                <th className="r" title="Capacity after Newspaper quota and buffer">Cap.</th>
                {STREAMS.map((s) => <th key={s.key} className="r" title={s.label}>{s.short || s.label}</th>)}
                <th className="r">Planned</th>
                <th className="r" title="Capacity minus planned">Spare</th>
                <th className="r">Actual</th>
                <th className="r">vs plan</th>
                <th className="r">Newspaper</th>
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
          Capacity = days × daily cap, minus the Newspaper quota (14h/week), minus the buffer. Changing an exam date does not move these rows; edit the periods here when the plan changes.
        </p>
      </Panel>
    </>
  );
}
