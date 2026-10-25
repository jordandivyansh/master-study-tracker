import { Router } from 'express';
import { DailyLog, loadSettings } from '../models/index.js';
import { ah, pickSchemaFields } from '../lib/http.js';
import { deriveDay } from '../lib/calc.js';
import { dateRange, weekday, today } from '../lib/dates.js';

const r = Router();

/**
 * GET /api/daily?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Returns one row per calendar day in the range — logged or not — so the UI
 * can render a full calendar. Logged days come from Mongo in one indexed
 * range query; blanks are filled in by a hash-map lookup per day.
 */
r.get(
  '/',
  ah(async (req, res) => {
    const settings = await loadSettings();
    const from = req.query.from || settings.trackerStart;
    const to = req.query.to || settings.trackerEnd;
    const logs = await DailyLog.find({ date: { $gte: from, $lte: to } }).lean();
    const byDate = new Map(logs.map((l) => [l.date, l]));
    const rows = dateRange(from, to).map((date) => {
      const log = byDate.get(date) || { date, hours: {}, dsa: null, gym: null, weight: null, notes: '' };
      return { ...deriveDay(log, settings), day: weekday(date), logged: byDate.has(date) };
    });
    res.json({ today: today(), cap: settings.dailyCap, rows });
  }),
);

/** PUT /api/daily/:date — upsert: create the day if missing, otherwise replace its fields. */
r.put(
  '/:date',
  ah(async (req, res) => {
    const settings = await loadSettings();
    const body = pickSchemaFields(DailyLog, req.body);
    delete body.date; // the URL is the source of truth for the key
    const doc = await DailyLog.findOneAndUpdate(
      { date: req.params.date },
      { $set: body, $setOnInsert: { date: req.params.date } },
      { new: true, upsert: true, runValidators: true },
    ).lean();
    res.json({ ...deriveDay(doc, settings), day: weekday(doc.date), logged: true });
  }),
);

r.delete(
  '/:date',
  ah(async (req, res) => {
    await DailyLog.deleteOne({ date: req.params.date });
    res.status(204).end();
  }),
);

export default r;
