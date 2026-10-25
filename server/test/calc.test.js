// Run: npm test   (uses Node's built-in test runner — no extra dependencies)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deriveDay, weekCapacity, attachActuals, findWeek, deriveTest, deriveBacklog, currentStreak, sumOrNull } from '../src/lib/calc.js';

const settings = {
  dailyCap: 8,
  dsaWeekly: 15,
  buffer: 0.15,
  cava: { hoursPerLecture: 3 },
  durations: { UPPSC: { attempt: 2, review: 2 } },
};

test('blank is not zero', () => {
  assert.equal(sumOrNull([null, undefined]), null);
  assert.equal(sumOrNull([0, null]), 0);
});

test('daily totals and cap check', () => {
  const d = deriveDay({ date: '2026-10-23', hours: { ssc: 4, apfc: 3 }, dsa: 2 }, settings);
  assert.equal(d.examStudy, 7);
  assert.equal(d.studyPlusDsa, 9);
  assert.equal(d.capStatus, 'Over daily cap');
});

test('week capacity matches the workbook (23–27 Oct row)', () => {
  const w = weekCapacity({ start: '2026-10-23', end: '2026-10-27', quotas: { ssc: 8, cat: 4, apfc: 6, cava: 6 } }, settings);
  assert.equal(w.days, 5);
  assert.equal(w.gross, 40);
  assert.ok(Math.abs(w.capacity - 24.892857) < 1e-5);
  assert.equal(w.planned, 24);
});

test('two-pointer sweep assigns logs to the right week', () => {
  const weeks = [
    { start: '2026-10-16', end: '2026-10-22', quotas: {} },
    { start: '2026-10-23', end: '2026-10-27', quotas: {} },
  ];
  const logs = [
    { date: '2026-10-27', hours: { ssc: 2 } },
    { date: '2026-10-16', hours: { ssc: 1 } },
    { date: '2026-10-28', hours: { ssc: 9 } }, // outside both weeks
  ];
  const [a, b] = attachActuals(weeks, logs, settings);
  assert.equal(a.actualStudy, 1);
  assert.equal(b.actualStudy, 2);
});

test('binary search finds the containing week', () => {
  const weeks = [
    { start: '2026-10-16', end: '2026-10-22' },
    { start: '2026-10-23', end: '2026-10-27' },
    { start: '2026-10-28', end: '2026-11-03' },
  ];
  assert.equal(findWeek(weeks, '2026-10-25').start, '2026-10-23');
  assert.equal(findWeek(weeks, '2027-01-01'), null);
});

test('test workflow: attempt then review', () => {
  const base = { exam: 'UPPSC', attemptStatus: 'Attempted', reviewStatus: 'Pending', targetReview: '2026-10-17' };
  const t = deriveTest(base, settings, '2026-10-23');
  assert.equal(t.workflow, 'Review pending');
  assert.equal(t.remainingH, 2);
  assert.equal(t.reviewOverdue, true);
  assert.equal(deriveTest({ ...base, reviewStatus: 'Reviewed' }, settings, '2026-10-23').workflow, 'Done');
});

test('backlog follows CAVA hours per lecture from settings', () => {
  const b = deriveBacklog({ totalUnits: 17, completedUnits: 2, hoursPerUnitFromCava: true }, settings);
  assert.equal(b.remainingH, 45);
});

test('streak counts back from yesterday when today is blank', () => {
  const logs = [
    { date: '2026-10-20', hours: { ssc: 1 } },
    { date: '2026-10-21', hours: { ssc: 1 } },
    { date: '2026-10-22', dsa: 2, hours: {} },
  ];
  assert.equal(currentStreak(logs, '2026-10-23', settings), 3);
});
