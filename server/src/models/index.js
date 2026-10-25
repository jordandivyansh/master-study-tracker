// ---------------------------------------------------------------------------
// Mongoose models. A schema is the "type definition" of a document; a model
// is the class you query with (Model.find, Model.create, ...).
//
// One file keeps the whole data model visible at a glance. Each collection
// maps to one sheet of the original workbook.
// ---------------------------------------------------------------------------
import mongoose from 'mongoose';
import { STREAM_KEYS } from '../lib/calc.js';

const { Schema, model } = mongoose;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const isoDate = { type: String, match: [ISO_DATE, 'Use YYYY-MM-DD'], default: null };
const num = { type: Number, default: null, min: 0 };

// { ssc: Number, cat: Number, ... } built from the stream list, so adding a
// stream in calc.js automatically adds a field here.
const streamHours = () =>
  new Schema(Object.fromEntries(STREAM_KEYS.map((k) => [k, { ...num }])), { _id: false });

// ---------------------------------------------------------------- Settings -
// Singleton document: the "Start" sheet's blue input cells.
const settingsSchema = new Schema(
  {
    dailyCap: { type: Number, required: true, min: 0, max: 24 },
    dsaWeekly: { type: Number, required: true, min: 0 },
    buffer: { type: Number, required: true, min: 0, max: 0.9 },
    gymDaily: { type: Number, default: 0 },
    trackerStart: { ...isoDate, required: true },
    trackerEnd: { ...isoDate, required: true },
    exams: [
      new Schema(
        {
          key: { type: String, required: true },
          name: { type: String, required: true },
          date: { ...isoDate, required: true },
          prepBudgetH: num,
          note: { type: String, default: null },
        },
        { _id: false },
      ),
    ],
    pivotExam: { type: String, default: 'apfc' },
    weight: { start: Number, target: Number, goalDate: isoDate },
    cava: { newPerWeek: Number, hoursPerLecture: Number },
    // Map<examName, {attempt, review}> — e.g. durations.UPPSC.attempt = 2
    durations: { type: Map, of: new Schema({ attempt: Number, review: Number }, { _id: false }) },
  },
  { timestamps: true },
);

// ------------------------------------------------------------------- Daily -
const dailyLogSchema = new Schema(
  {
    // unique index = a B-tree keyed on date: O(log n) lookup + ordered range scans
    date: { ...isoDate, required: true, unique: true },
    hours: { type: streamHours(), default: () => ({}) },
    dsa: num,
    gym: num,
    weight: { type: Number, default: null, min: 20, max: 250 },
    notes: { type: String, default: '' },
  },
  { timestamps: true },
);

// ------------------------------------------------------------------ Weekly -
const weekSchema = new Schema(
  {
    start: { ...isoDate, required: true, index: true },
    end: { ...isoDate, required: true },
    phase: { type: String, default: '' },
    quotas: { type: streamHours(), default: () => ({}) },
    notes: { type: String, default: '' },
  },
  { timestamps: true },
);
weekSchema.pre('validate', function checkRange(next) {
  if (this.start && this.end && this.end < this.start) this.invalidate('end', 'End must be on or after start');
  next();
});

// ------------------------------------------------------------------- Tests -
const testSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, trim: true },
    exam: { type: String, required: true, enum: ['UPPSC', 'SSC', 'CAT', 'APFC', 'CSE'] },
    paper: { type: String, required: true },
    type: { type: String, default: '' },
    release: isoDate,
    targetAttempt: isoDate,
    targetReview: isoDate,
    attemptStatus: { type: String, enum: ['Not reported', 'Pending', 'Attempted'], default: 'Pending' },
    reviewStatus: { type: String, enum: ['Pending', 'Reviewed'], default: 'Pending' },
    actualAttempt: isoDate,
    actualReview: isoDate,
    maxScore: num,
    score: { type: Number, default: null },
    notes: { type: String, default: '' },
  },
  { timestamps: true },
);
testSchema.index({ exam: 1, targetAttempt: 1 }); // compound index for "tests of exam X by date"

// ----------------------------------------------------------------- Backlog -
const backlogSchema = new Schema(
  {
    order: { type: Number, default: 0 },
    workstream: { type: String, required: true },
    unit: { type: String, default: '' },
    totalUnits: num,
    completedUnits: num,
    hoursPerUnit: num,
    hoursPerUnitFromCava: { type: Boolean, default: false },
    progressOverride: { type: Number, default: null, min: 0, max: 1 },
    status: { type: String, enum: ['Pending', 'In progress', 'Complete', 'Scope needed'], default: 'Pending' },
    deadline: isoDate,
    notes: { type: String, default: '' },
    source: { type: String, default: '' },
  },
  { timestamps: true },
);

// ------------------------------------------------------------- APFC course -
const apfcModuleSchema = new Schema({
  num: { type: Number, required: true, unique: true },
  module: { type: String, required: true },
  items: { type: Number, default: 0 },
  platformComplete: { type: Number, default: 0 },
  attachmentBadges: { type: Number, default: 0 },
  priority: { type: String, default: '' },
  action: { type: String, default: '' },
  studyStatus: { type: String, enum: ['Not started', 'Selecting', 'Studying', 'Reviewed'], default: 'Not started' },
  verifiedRuntimeH: num,
  selectedStudyH: num,
  hoursDone: num,
  notes: { type: String, default: '' },
});

const syllabusAreaSchema = new Schema({
  num: { type: Number, required: true, unique: true },
  area: { type: String, required: true },
  firstCoverage: isoDate,
  questionsReviewed: num,
  errorsCorrected: isoDate,
  recallChecked: isoDate,
  action: { type: String, default: '' },
});

const courseEntrySchema = new Schema({
  code: { type: String, required: true, unique: true },
  module: { type: String, required: true, index: true },
  title: { type: String, required: true },
  type: { type: String, default: '' },
  platformStatus: { type: String, enum: ['Not started', 'Now playing', 'Completed'], default: 'Not started' },
  displayedDuration: { type: String, default: null },
  observedRuntimeH: num,
  studyMode: { type: String, enum: [null, 'Watch', 'Read', 'Practice', 'Notes only', 'Skip overlap'], default: null },
  selectedStudyH: num,
  hoursDone: num,
  reviewStatus: { type: String, enum: ['Not reviewed', 'Reviewed'], default: 'Not reviewed' },
  notes: { type: String, default: '' },
});
courseEntrySchema.index({ title: 'text' }); // inverted index for the search box

export const Settings = model('Settings', settingsSchema);
export const DailyLog = model('DailyLog', dailyLogSchema);
export const Week = model('Week', weekSchema);
export const Test = model('Test', testSchema);
export const BacklogItem = model('BacklogItem', backlogSchema);
export const ApfcModule = model('ApfcModule', apfcModuleSchema);
export const SyllabusArea = model('SyllabusArea', syllabusAreaSchema);
export const CourseEntry = model('CourseEntry', courseEntrySchema);

/** Settings as a plain object (Map -> object) — what calc.js expects. */
export async function loadSettings() {
  const doc = await Settings.findOne().lean({ flattenMaps: true });
  if (!doc) {
    const err = new Error('No settings found. Run "npm run seed" first.');
    err.status = 503;
    throw err;
  }
  return doc;
}
