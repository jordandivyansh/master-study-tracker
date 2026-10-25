// Loads the data extracted from Master_Study_Tracker.xlsx into MongoDB.
//   npm run seed            first-time load (refuses if you already logged days)
//   npm run seed -- --force wipe everything and reload the original plan
import 'dotenv/config';
import mongoose from 'mongoose';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as M from '../models/index.js';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data');
const load = (name) => JSON.parse(fs.readFileSync(path.join(dir, `${name}.json`), 'utf8'));
const force = process.argv.includes('--force');

async function main() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/master-study-tracker';
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });

  const logged = await M.DailyLog.countDocuments();
  if (logged > 0 && !force) {
    console.log(`Found ${logged} logged days. Nothing changed.`);
    console.log('To wipe everything and reload the original plan: npm run seed -- --force');
    console.log('Tip: download a backup first from Settings → Backup.');
    return;
  }

  const backlog = load('backlog').map((b) => ({
    ...b,
    // These rows read "hours per lecture" from Settings, like the workbook's ='Start'!$B$24
    hoursPerUnitFromCava: /^CAVA/.test(b.workstream),
  }));

  const plan = [
    [M.Settings, [load('settings')]],
    [M.Week, load('weeks')],
    [M.Test, load('tests')],
    [M.BacklogItem, backlog],
    [M.ApfcModule, load('apfcModules')],
    [M.SyllabusArea, load('syllabusAreas')],
    [M.CourseEntry, load('courseEntries')],
    [M.DailyLog, load('dailyLogs')],
  ];

  for (const [Model, docs] of plan) {
    await Model.deleteMany({});
    if (docs.length) await Model.insertMany(docs);
    await Model.syncIndexes(); // make sure unique / text indexes exist
    console.log(`${Model.modelName.padEnd(14)} ${docs.length}`);
  }
  console.log('Seed complete.');
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
