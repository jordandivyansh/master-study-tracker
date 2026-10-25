import { useCallback } from 'react';
import { api } from '../api.js';
import { useResource, usePatchRow } from '../hooks.js';
import { PageHeader, Panel, Loading, Meter, NumCell, TextCell, DateCell, SelectCell, useNotice } from '../components/ui.jsx';
import { h, pct } from '../format.js';

const STATUSES = ['Pending', 'In progress', 'Complete', 'Scope needed'];

export default function Backlog() {
  const notify = useNotice();
  const { data: items, setData, error } = useResource('/backlog');
  const setList = useCallback((fn) => setData((x) => fn(x)), [setData]);
  const patch = usePatchRow('/backlog', setList, notify);

  if (!items) return <Loading error={error} />;
  const total = items.reduce((s, b) => s + (b.remainingH || 0), 0);
  const unscoped = items.filter((b) => b.remainingH === null).length;

  async function add() {
    try {
      const b = await api.post('/backlog', { workstream: 'New workstream', status: 'Scope needed', order: items.length + 1 });
      setData([...items, b]);
    } catch (e) {
      notify(e.message);
    }
  }

  async function remove(b) {
    if (!window.confirm(`Delete "${b.workstream}"?`)) return;
    await api.del(`/backlog/${b._id}`);
    setData(items.filter((x) => x._id !== b._id));
  }

  return (
    <>
      <PageHeader
        title="CSE backlog"
        sub={`${h(total)}h of scoped work remains. ${unscoped} workstreams still need a total and hours per unit before they can be counted.`}
      >
        <button className="btn" onClick={add}>Add workstream</button>
      </PageHeader>

      <Panel>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Workstream</th><th>Unit</th><th className="r">Total</th><th className="r">Done</th><th className="r">h / unit</th>
                <th>Progress</th><th className="r">Left</th><th>Status</th><th>Deadline</th><th>Notes</th><th />
              </tr>
            </thead>
            <tbody>
              {items.map((b) => (
                <tr key={b._id}>
                  <td><TextCell value={b.workstream} onCommit={(v) => patch(b, { workstream: v })} label="Workstream" width="11rem" /></td>
                  <td><TextCell value={b.unit} onCommit={(v) => patch(b, { unit: v })} label="Unit" width="9rem" /></td>
                  <td className="r"><NumCell value={b.totalUnits} step={1} onCommit={(v) => patch(b, { totalUnits: v })} label="Total units" /></td>
                  <td className="r"><NumCell value={b.completedUnits} step={1} max={b.totalUnits ?? undefined} onCommit={(v) => patch(b, { completedUnits: v })} label="Completed units" /></td>
                  <td className="r">
                    {b.hoursPerUnitFromCava ? (
                      <span title="Set in Settings, CAVA hours per lecture">{h(b.effectiveHoursPerUnit)}</span>
                    ) : (
                      <NumCell value={b.hoursPerUnit} onCommit={(v) => patch(b, { hoursPerUnit: v })} label="Hours per unit" />
                    )}
                  </td>
                  <td className="progress-cell">
                    <Meter value={b.progress || 0} max={1} label="Progress" />
                    {b.totalUnits === null ? (
                      <span className="small nowrap" title="No unit count yet, so enter progress directly">
                        <NumCell
                          value={b.progressOverride === null ? null : Math.round(b.progressOverride * 100)}
                          step={5}
                          max={100}
                          width="3.6rem"
                          onCommit={(v) => patch(b, { progressOverride: v === null ? null : v / 100 })}
                          label="Progress percent"
                        />
                        %
                      </span>
                    ) : (
                      <span className="small">{pct(b.progress)}</span>
                    )}
                  </td>
                  <td className="r strong">{b.remainingH === null ? <span className="muted">–</span> : `${h(b.remainingH)}h`}</td>
                  <td><SelectCell value={b.status} options={STATUSES} onCommit={(v) => patch(b, { status: v })} label="Status" /></td>
                  <td><DateCell value={b.deadline} onCommit={(v) => patch(b, { deadline: v })} label="Deadline" /></td>
                  <td><TextCell value={b.notes} onCommit={(v) => patch(b, { notes: v })} label="Notes" width="16rem" /></td>
                  <td><button className="btn ghost small" onClick={() => remove(b)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="note">
          Mains writing papers live on the Tests page, not here, so their hours are not counted twice. CAVA rows take hours per lecture from Settings.
        </p>
      </Panel>
    </>
  );
}
