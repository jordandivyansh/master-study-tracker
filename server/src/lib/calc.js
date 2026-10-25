// ---------------------------------------------------------------------------
// calc.js — every spreadsheet formula from Master_Study_Tracker.xlsx, as pure
// functions. "Pure" = no database, no network, no clock unless passed in.
// That makes them trivially unit-testable (see server/test/calc.test.js).
//
// Rule carried over from the workbook: BLANK is not ZERO.
//   null  -> "not reported"  (excluded from actuals)
//   0     -> "I studied zero hours" (counts as a reported day)
// ---------------------------------------------------------------------------
import { daysBetween, addDays } from './dates.js';

/** Study streams in display order. DSA and gym are tracked separately. */
export const STREAMS = [
  { key: 'ssc', label: 'SSC' },
  { key: 'cat', label: 'CAT' },
  { key: 'uppsc', label: 'UPPSC' },
  { key: 'apfc', label: 'APFC' },
  { key: 'cava', label: 'CAVA' },
  { key: 'pubad', label: 'Pub Ad' },
  { key: 'mains', label: 'Mains writing' },
  { key: 'books', label: 'Books / revision' },
  { key: 'other', label: 'Other study' },
];
export const STREAM_KEYS = STREAMS.map((s) => s.key);

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
/** Sum that returns null when every input is blank (Excel: IF(COUNT()=0,"",SUM())). */
export function sumOrNull(values) {
  let total = 0;
  let seen = false;
  for (const v of values) {
    if (isNum(v)) {
      total += v;
      seen = true;
    }
  }
  return seen ? total : null;
}
const round = (v, dp = 2) => (isNum(v) ? Math.round(v * 10 ** dp) / 10 ** dp : v);

// ---------------------------------------------------------------- Daily ----
/** Daily sheet: Exam study h, Study + DSA h, and the cap check. */
export function deriveDay(log, settings) {
  const hours = log.hours || {};
  const examStudy = sumOrNull(STREAM_KEYS.map((k) => hours[k]));
  const studyPlusDsa = sumOrNull([examStudy, log.dsa]);
  let capStatus = null;
  if (studyPlusDsa !== null) {
    capStatus = studyPlusDsa > settings.dailyCap ? 'Over daily cap' : 'In cap';
  }
  return { ...log, examStudy: round(examStudy), studyPlusDsa: round(studyPlusDsa), capStatus };
}

// --------------------------------------------------------------- Weekly ----
/** Capacity side of one Weekly row (columns D..U). */
export function weekCapacity(week, settings) {
  const days = daysBetween(week.start, week.end) + 1;
  const gross = days * settings.dailyCap;
  const dsaQuota = (days / 7) * settings.dsaWeekly;
  const afterDsa = Math.max(0, gross - dsaQuota);
  const bufferH = afterDsa * settings.buffer;
  const capacity = afterDsa - bufferH;
  const planned = sumOrNull(STREAM_KEYS.map((k) => week.quotas?.[k])) ?? 0;
  const unallocated = capacity - planned;
  const overload = Math.max(0, -unallocated);
  return { days, gross, dsaQuota, afterDsa, bufferH, capacity, planned, unallocated, overload };
}

/**
 * Attach actuals from daily logs to every week.
 *
 * Weeks are sorted, non-overlapping intervals; logs are sorted by date.
 * A two-pointer sweep visits each log once: O(W + L) instead of the
 * O(W * L) a naive "filter logs for each week" (= Excel SUMIFS) would cost.
 */
export function attachActuals(weeks, logs, settings) {
  const sortedWeeks = [...weeks].sort((a, b) => (a.start < b.start ? -1 : 1));
  const sortedLogs = [...logs].sort((a, b) => (a.date < b.date ? -1 : 1));
  let j = 0;
  return sortedWeeks.map((week) => {
    // skip logs that fall before this week (gaps between weeks)
    while (j < sortedLogs.length && sortedLogs[j].date < week.start) j++;
    const inWeek = [];
    while (j < sortedLogs.length && sortedLogs[j].date <= week.end) inWeek.push(sortedLogs[j++]);

    const cap = weekCapacity(week, settings);
    const days = inWeek.map((l) => deriveDay(l, settings));
    const actualStudy = sumOrNull(days.map((d) => d.examStudy));
    const actualDsa = sumOrNull(days.map((d) => d.dsa));
    const actualGym = sumOrNull(days.map((d) => d.gym));
    const actualByStream = Object.fromEntries(
      STREAM_KEYS.map((k) => [k, sumOrNull(days.map((d) => d.hours?.[k]))]),
    );
    return {
      ...week,
      ...mapRound(cap),
      actualStudy: round(actualStudy),
      actualDsa: round(actualDsa),
      actualGym: round(actualGym),
      actualByStream: mapRound(actualByStream),
      actualVsPlan: actualStudy === null ? null : round(actualStudy - cap.planned),
      actualVsGross:
        actualStudy === null || actualDsa === null ? null : round(actualStudy + actualDsa - cap.gross),
      daysLogged: days.filter((d) => d.studyPlusDsa !== null).length,
    };
  });
}

/** Binary search: the week containing `date`, or null. O(log W). */
export function findWeek(sortedWeeks, date) {
  let lo = 0;
  let hi = sortedWeeks.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const w = sortedWeeks[mid];
    if (date < w.start) hi = mid - 1;
    else if (date > w.end) lo = mid + 1;
    else return w;
  }
  return null;
}

// ---------------------------------------------------------------- Tests ----
/** Tests sheet: hours, remaining, workflow, score % and date flags. */
export function deriveTest(test, settings, todayISO) {
  const dur = settings.durations?.[test.exam] || { attempt: 0, review: 0 };
  const attempted = test.attemptStatus === 'Attempted';
  const reviewed = test.reviewStatus === 'Reviewed';
  const remainingH = attempted && reviewed ? 0 : attempted ? dur.review : dur.attempt + dur.review;
  const workflow = attempted && reviewed ? 'Done' : attempted ? 'Review pending' : 'Pending';
  const scorePct = isNum(test.maxScore) && test.maxScore > 0 && isNum(test.score) ? test.score / test.maxScore : null;
  const attemptOverdue = !attempted && !!test.targetAttempt && test.targetAttempt < todayISO;
  const reviewOverdue = !reviewed && !!test.targetReview && test.targetReview < todayISO;
  const released = !test.release || test.release <= todayISO;
  return {
    ...test,
    attemptH: dur.attempt,
    reviewH: dur.review,
    remainingH,
    workflow,
    scorePct: round(scorePct, 4),
    released,
    attemptOverdue,
    reviewOverdue,
  };
}

// -------------------------------------------------------------- Backlog ----
export function deriveBacklog(item, settings) {
  const hpu = item.hoursPerUnitFromCava ? settings.cava.hoursPerLecture : item.hoursPerUnit;
  const total = item.totalUnits;
  const done = item.completedUnits ?? 0;
  const remainingH = isNum(total) && isNum(hpu) ? Math.max(0, total - done) * hpu : null;
  // Unit counts win; a manual percentage is the fallback for unscoped work (e.g. a book at "10% done").
  const progress = isNum(total) && total > 0 ? done / total : isNum(item.progressOverride) ? item.progressOverride : null;
  return { ...item, effectiveHoursPerUnit: hpu ?? null, remainingH, progress: round(progress, 4) };
}

// ----------------------------------------------------------- APFC course ---
export function deriveModule(m) {
  return {
    ...m,
    itemsRemaining: Math.max(0, (m.items || 0) - (m.platformComplete || 0)),
    hoursRemaining: isNum(m.selectedStudyH) ? Math.max(0, m.selectedStudyH - (m.hoursDone || 0)) : null,
  };
}

export function deriveEntry(e) {
  return {
    ...e,
    hoursRemaining: isNum(e.selectedStudyH) ? Math.max(0, e.selectedStudyH - (e.hoursDone || 0)) : null,
  };
}

export function deriveArea(a) {
  const complete = !!a.firstCoverage && (a.questionsReviewed || 0) > 0 && !!a.errorsCorrected && !!a.recallChecked;
  return { ...a, learningCycle: complete ? 'Cycle complete' : 'Pending' };
}

// ------------------------------------------------------------ Summaries ----
/** Start sheet "Capacity and progress" block. */
export function startSummary({ settings, weeks, tests, backlog }) {
  const pivot = settings.exams.find((e) => e.key === settings.pivotExam)?.date;
  // Excel: pre = rows whose END < pivot; post = rows whose START >= pivot.
  const pre = weeks.filter((w) => pivot && w.end < pivot);
  const post = weeks.filter((w) => pivot && w.start >= pivot);
  const sum = (arr, f) => arr.reduce((s, x) => s + (f(x) || 0), 0);
  // Recompute from inputs (not the rounded display values) so totals match Excel exactly.
  const cap = (w) => weekCapacity(w, settings);
  const prePlanned = sum(pre, (w) => cap(w).planned);
  const preCapacity = sum(pre, (w) => cap(w).capacity);
  const postPlanned = sum(post, (w) => cap(w).planned);
  const postCapacity = sum(post, (w) => cap(w).capacity);
  const cava = backlog.find((b) => /CAVA opening/i.test(b.workstream));
  return mapRound({
    prePlanned,
    preCapacity,
    preUnallocated: preCapacity - prePlanned,
    postPlanned,
    postCapacity,
    postUnallocated: postCapacity - postPlanned,
    availablePerDay: Math.max(0, settings.dailyCap - settings.dsaWeekly / 7) * (1 - settings.buffer),
    testsRemainingH: sum(tests, (t) => t.remainingH),
    testsDone: tests.filter((t) => t.workflow === 'Done').length,
    testsTotal: tests.length,
    openingCavaH: cava?.remainingH ?? null,
    weightToGoal: settings.weight.start - settings.weight.target,
    plannedByStream: mapRound(Object.fromEntries(STREAM_KEYS.map((k) => [k, sum(weeks, (w) => w.quotas?.[k])]))),
  });
}

/** Consecutive logged days with study+DSA > 0, ending today (or yesterday if today is blank). */
export function currentStreak(logs, todayISO, settings) {
  const byDate = new Map(logs.map((l) => [l.date, deriveDay(l, settings)])); // O(1) lookups
  const positive = (d) => (byDate.get(d)?.studyPlusDsa || 0) > 0;
  let day = positive(todayISO) ? todayISO : addDays(todayISO, -1);
  let streak = 0;
  while (positive(day)) {
    streak++;
    day = addDays(day, -1);
  }
  return streak;
}

function mapRound(obj) {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, round(v)]));
}
