// All dates in this app are stored as 'YYYY-MM-DD' strings.
// Why strings and not Date objects?
//  1. Lexicographic order == chronological order, so '<', '>', sort() and
//     MongoDB index range queries all work on plain strings.
//  2. No timezone drift: a study day in IST never becomes "yesterday" in UTC.

const DAY_MS = 24 * 60 * 60 * 1000;

/** Today's date in the server's local timezone, as YYYY-MM-DD. */
export function today() {
  return toISO(new Date());
}

/** Date -> 'YYYY-MM-DD' using local calendar fields. */
export function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 'YYYY-MM-DD' -> Date at local midnight. */
export function fromISO(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Whole days from a to b (b - a). Rounding absorbs DST hour shifts. */
export function daysBetween(a, b) {
  return Math.round((fromISO(b) - fromISO(a)) / DAY_MS);
}

export function addDays(iso, n) {
  const dt = fromISO(iso);
  dt.setDate(dt.getDate() + n);
  return toISO(dt);
}

/** Every date from start to end inclusive. O(days). */
export function dateRange(start, end) {
  const out = [];
  for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
  return out;
}

export function weekday(iso) {
  return fromISO(iso).toLocaleDateString('en-IN', { weekday: 'short' });
}
