import 'dotenv/config';
import mongoose from 'mongoose';
import { createApp } from './app.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/master-study-tracker';
const PORT = Number(process.env.PORT) || 5050;

async function main() {
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  } catch (err) {
    console.error(`\nCould not reach MongoDB at ${MONGO_URI}`);
    console.error('Start MongoDB first (see README: "Start MongoDB"), then run this again.\n');
    console.error(err.message);
    process.exit(1);
  }
  console.log(`MongoDB connected: ${mongoose.connection.name}`);
  createApp().listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
}

main();
