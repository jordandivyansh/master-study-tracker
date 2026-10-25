// Routers built from the generic CRUD factory. Each only declares what is
// different about it: sort order, filters, and the derive step.
import { Week, Test, BacklogItem, ApfcModule, SyllabusArea, CourseEntry, DailyLog, loadSettings } from '../models/index.js';
import { crudRouter } from '../lib/http.js';
import { attachActuals, deriveTest, deriveBacklog, deriveModule, deriveEntry, deriveArea } from '../lib/calc.js';
import { today } from '../lib/dates.js';

export const weeksRouter = crudRouter(Week, {
  sort: { start: 1 },
  derive: async (weeks) => {
    const settings = await loadSettings();
    if (!weeks.length) return [];
    const from = weeks.reduce((m, w) => (w.start < m ? w.start : m), weeks[0].start);
    const to = weeks.reduce((m, w) => (w.end > m ? w.end : m), weeks[0].end);
    const logs = await DailyLog.find({ date: { $gte: from, $lte: to } }).lean();
    return attachActuals(weeks, logs, settings);
  },
});

export const testsRouter = crudRouter(Test, {
  sort: { targetAttempt: 1, code: 1 },
  filter: (req) => (req.query.exam ? { exam: req.query.exam } : {}),
  derive: async (tests) => {
    const settings = await loadSettings();
    const t = today();
    return tests.map((x) => deriveTest(x, settings, t));
  },
});

export const backlogRouter = crudRouter(BacklogItem, {
  sort: { order: 1, _id: 1 },
  derive: async (items) => {
    const settings = await loadSettings();
    return items.map((x) => deriveBacklog(x, settings));
  },
});

export const modulesRouter = crudRouter(ApfcModule, {
  sort: { num: 1 },
  derive: async (mods) => mods.map(deriveModule),
});

export const areasRouter = crudRouter(SyllabusArea, {
  sort: { num: 1 },
  derive: async (areas) => areas.map(deriveArea),
});

export const entriesRouter = crudRouter(CourseEntry, {
  sort: { code: 1 },
  filter: (req) => {
    const f = {};
    if (req.query.module) f.module = req.query.module;
    if (req.query.platformStatus) f.platformStatus = req.query.platformStatus;
    if (req.query.studyMode) f.studyMode = req.query.studyMode === 'none' ? null : req.query.studyMode;
    if (req.query.q) f.$text = { $search: req.query.q };
    return f;
  },
  derive: async (entries) => entries.map(deriveEntry),
});
