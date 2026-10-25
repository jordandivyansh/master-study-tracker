import { Router } from 'express';
import { Week, Test, BacklogItem, DailyLog, ApfcModule, SyllabusArea, loadSettings } from '../models/index.js';
import { ah } from '../lib/http.js';
import {
  attachActuals,
  deriveTest,
  deriveBacklog,
  deriveDay,
  deriveModule,
  deriveArea,
  startSummary,
  currentStreak,
  findWeek,
  STREAMS,
} from '../lib/calc.js';
import { today, daysBetween, addDays, weekday } from '../lib/dates.js';

const r = Router();

/**
 * GET /api/dashboard — one round trip for the home screen.
 * Promise.all fires the independent queries concurrently, so total latency
 * is roughly max(query) rather than sum(query).
 */
r.get(
  '/',
  ah(async (_req, res) => {
    const t = today();
    const [settings, weeksRaw, testsRaw, backlogRaw, logs, modules, areas] = await Promise.all([
      loadSettings(),
      Week.find().sort({ start: 1 }).lean(),
      Test.find().lean(),
      BacklogItem.find().sort({ order: 1 }).lean(),
      DailyLog.find().sort({ date: 1 }).lean(),
      ApfcModule.find().lean(),
      SyllabusArea.find().lean(),
    ]);

    const weeks = attachActuals(weeksRaw, logs, settings);
    const tests = testsRaw.map((x) => deriveTest(x, settings, t));
    const backlog = backlogRaw.map((x) => deriveBacklog(x, settings));
    const summary = startSummary({ settings, weeks, tests, backlog });

    const currentWeek = findWeek(weeks, t);
    const todayLog = deriveDay(logs.find((l) => l.date === t) || { date: t, hours: {} }, settings);

    // Last 14 days of study + DSA for the sparkline
    const byDate = new Map(logs.map((l) => [l.date, deriveDay(l, settings)]));
    const recent = [];
    for (let i = 13; i >= 0; i--) {
      const d = addDays(t, -i);
      const row = byDate.get(d);
      recent.push({ date: d, day: weekday(d), study: row?.examStudy ?? null, dsa: row?.dsa ?? null });
    }

    const weights = logs.filter((l) => typeof l.weight === 'number').map((l) => ({ date: l.date, weight: l.weight }));

    const horizon = addDays(t, 7);
    const due = tests
      .filter((x) => x.workflow !== 'Done')
      .filter((x) => x.attemptOverdue || x.reviewOverdue || (x.targetAttempt && x.targetAttempt <= horizon))
      .sort((a, b) => ((a.targetAttempt || a.targetReview || '') < (b.targetAttempt || b.targetReview || '') ? -1 : 1))
      .slice(0, 12);

    const exams = settings.exams
      .map((e) => ({ ...e, daysLeft: daysBetween(t, e.date) }))
      .sort((a, b) => (a.date < b.date ? -1 : 1));

    const testsByExam = {};
    for (const x of tests) {
      const g = (testsByExam[x.exam] ||= { total: 0, done: 0, reviewPending: 0, overdue: 0 });
      g.total++;
      if (x.workflow === 'Done') g.done++;
      if (x.workflow === 'Review pending') g.reviewPending++;
      if (x.attemptOverdue || x.reviewOverdue) g.overdue++;
    }

    const mods = modules.map(deriveModule);
    const apfc = {
      items: mods.reduce((s, m) => s + m.items, 0),
      platformComplete: mods.reduce((s, m) => s + m.platformComplete, 0),
      cyclesComplete: areas.map(deriveArea).filter((a) => a.learningCycle === 'Cycle complete').length,
      areas: areas.length,
    };

    res.json({
      today: t,
      settings,
      streams: STREAMS,
      summary,
      exams,
      currentWeek,
      todayLog,
      recent,
      weights,
      latestWeight: weights.at(-1) || null,
      streak: currentStreak(logs, t, settings),
      due,
      testsByExam,
      backlog,
      apfc,
      tracker: { start: settings.trackerStart, end: settings.trackerEnd, elapsed: daysBetween(settings.trackerStart, t), total: daysBetween(settings.trackerStart, settings.trackerEnd) },
    });
  }),
);

export default r;
