// Settings, backup and restore.
import { Router } from 'express';
import * as M from '../models/index.js';
import { ah, pickSchemaFields } from '../lib/http.js';
import { today } from '../lib/dates.js';

const r = Router();

r.get('/settings', ah(async (_req, res) => res.json(await M.loadSettings())));

r.put(
  '/settings',
  ah(async (req, res) => {
    const doc = await M.Settings.findOneAndUpdate({}, pickSchemaFields(M.Settings, req.body), {
      new: true,
      upsert: true,
      runValidators: true,
    }).lean({ flattenMaps: true });
    res.json(doc);
  }),
);

// Collections included in a backup, keyed by the JSON property name.
const COLLECTIONS = {
  settings: M.Settings,
  dailyLogs: M.DailyLog,
  weeks: M.Week,
  tests: M.Test,
  backlog: M.BacklogItem,
  apfcModules: M.ApfcModule,
  syllabusAreas: M.SyllabusArea,
  courseEntries: M.CourseEntry,
};

/** GET /api/backup — the whole database as one JSON file. */
r.get(
  '/backup',
  ah(async (_req, res) => {
    const out = { exportedAt: new Date().toISOString(), version: 1 };
    for (const [key, Model] of Object.entries(COLLECTIONS)) {
      out[key] = await Model.find().lean({ flattenMaps: true });
    }
    res.setHeader('Content-Disposition', `attachment; filename="study-tracker-backup-${today()}.json"`);
    res.json(out);
  }),
);

/** POST /api/restore — replace every collection with the contents of a backup file. */
r.post(
  '/restore',
  ah(async (req, res) => {
    const data = req.body;
    if (!data || data.version !== 1 || !Array.isArray(data.weeks)) {
      return res.status(400).json({ error: 'This is not a study tracker backup file (version 1).' });
    }
    const counts = {};
    for (const [key, Model] of Object.entries(COLLECTIONS)) {
      const docs = Array.isArray(data[key]) ? data[key] : [];
      await Model.deleteMany({});
      if (docs.length) await Model.insertMany(docs);
      counts[key] = docs.length;
    }
    res.json({ restored: counts });
  }),
);

export default r;
