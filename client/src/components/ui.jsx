import { createContext, useContext, useEffect, useState, useCallback } from 'react';

// ----------------------------------------------------------------- Notice --
// A tiny app-wide message bar. Context = dependency injection for components:
// any page can call notify() without passing callbacks down through props.
const NoticeCtx = createContext(() => {});
export const useNotice = () => useContext(NoticeCtx);

export function NoticeProvider({ children }) {
  const [notice, setNotice] = useState(null);
  const notify = useCallback((text, tone = 'error') => setNotice({ text, tone, id: Date.now() }), []);
  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(null), notice.tone === 'error' ? 6000 : 2500);
    return () => clearTimeout(t);
  }, [notice]);
  return (
    <NoticeCtx.Provider value={notify}>
      {children}
      {notice && (
        <div className={`notice notice-${notice.tone}`} role="status" onClick={() => setNotice(null)}>
          {notice.text}
        </div>
      )}
    </NoticeCtx.Provider>
  );
}

// ----------------------------------------------------------------- Layout --
export function PageHeader({ title, sub, children }) {
  return (
    <header className="page-head">
      <div>
        <h1>{title}</h1>
        {sub && <p className="sub">{sub}</p>}
      </div>
      {children && <div className="page-actions">{children}</div>}
    </header>
  );
}

export function Panel({ title, aside, children, className = '' }) {
  return (
    <section className={`panel ${className}`}>
      {(title || aside) && (
        <div className="panel-head">
          {title && <h2>{title}</h2>}
          {aside && <div className="panel-aside">{aside}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function Loading({ error }) {
  if (error) {
    return (
      <div className="empty">
        <p><strong>Could not load data.</strong> {error}</p>
        <p className="muted">Check that the API is running (<code>npm run dev</code>) and MongoDB is started.</p>
      </div>
    );
  }
  return <div className="empty muted">Loading…</div>;
}

/** Horizontal meter. Goes brick red when value exceeds max. */
export function Meter({ value, max, label }) {
  const v = value || 0;
  const ratio = max > 0 ? v / max : 0;
  const over = ratio > 1;
  return (
    <div className={`meter ${over ? 'over' : ''}`} role="meter" aria-valuenow={v} aria-valuemax={max} aria-label={label}>
      <span style={{ width: `${Math.min(100, ratio * 100)}%` }} />
    </div>
  );
}

export function Tag({ tone = 'plain', children }) {
  return <span className={`tag tag-${tone}`}>{children}</span>;
}

export function workflowTone(w) {
  return w === 'Done' ? 'good' : w === 'Review pending' ? 'gold' : 'plain';
}

// ---------------------------------------------------------- Editable cells --
// Each cell keeps a local draft while typing and commits on blur / Enter.
// Committing only when the value changed avoids a network call per keystroke.

export function NumCell({ value, onCommit, step = 0.5, min = 0, max, width = '4.5rem', label }) {
  const [draft, setDraft] = useState(value ?? '');
  useEffect(() => setDraft(value ?? ''), [value]);
  const commit = () => {
    const next = draft === '' ? null : Number(draft);
    if (next !== (value ?? null) && !Number.isNaN(next)) onCommit(next);
  };
  return (
    <input
      className="cell num"
      type="number"
      inputMode="decimal"
      step={step}
      min={min}
      max={max}
      style={{ width }}
      value={draft}
      aria-label={label}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
    />
  );
}

export function TextCell({ value, onCommit, placeholder, label, width }) {
  const [draft, setDraft] = useState(value ?? '');
  useEffect(() => setDraft(value ?? ''), [value]);
  return (
    <input
      className="cell"
      value={draft}
      placeholder={placeholder}
      aria-label={label}
      style={width ? { width } : undefined}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => draft !== (value ?? '') && onCommit(draft)}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
    />
  );
}

export function DateCell({ value, onCommit, label }) {
  return (
    <input
      className="cell date"
      type="date"
      value={value || ''}
      aria-label={label}
      onChange={(e) => onCommit(e.target.value || null)}
    />
  );
}

export function SelectCell({ value, options, onCommit, label, allowBlank }) {
  return (
    <select className="cell" value={value ?? ''} aria-label={label} onChange={(e) => onCommit(e.target.value || null)}>
      {allowBlank && <option value="">–</option>}
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

export function Chips({ options, value, onChange, label }) {
  return (
    <div className="chips" role="group" aria-label={label}>
      {options.map((o) => {
        const v = typeof o === 'string' ? o : o.value;
        const text = typeof o === 'string' ? o : o.label;
        return (
          <button key={v} type="button" className={value === v ? 'chip on' : 'chip'} aria-pressed={value === v} onClick={() => onChange(v)}>
            {text}
          </button>
        );
      })}
    </div>
  );
}
