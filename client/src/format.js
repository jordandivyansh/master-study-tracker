export const STREAMS = [
  { key: 'ssc', label: 'SSC' },
  { key: 'cat', label: 'CAT' },
  { key: 'uppsc', label: 'UPPSC' },
  { key: 'apfc', label: 'APFC' },
  { key: 'cava', label: 'CAVA' },
  { key: 'pubad', label: 'Pub Ad', short: 'PubAd' },
  { key: 'mains', label: 'Mains writing', short: 'Mains' },
  { key: 'books', label: 'Books / revision', short: 'Books' },
  { key: 'other', label: 'Other study', short: 'Other' },
];

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

/** Hours: 1 decimal, trailing .0 dropped; blank stays as an en dash. */
export function h(v, { dash = '–', signed = false } = {}) {
  if (!isNum(v)) return dash;
  const s = (Math.round(v * 10) / 10).toString();
  return signed && v > 0 ? `+${s}` : s;
}

/** Hours with unit, or a dash when blank. */
export function hu(v) {
  return isNum(v) ? `${h(v)}h` : '–';
}

export function pct(v) {
  return isNum(v) ? `${Math.round(v * 100)}%` : '–';
}

export function shortDate(iso) {
  if (!iso) return '–';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function longDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function addDaysISO(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d + n);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}
