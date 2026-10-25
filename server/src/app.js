import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import dailyRouter from './routes/daily.js';
import dashboardRouter from './routes/dashboard.js';
import adminRouter from './routes/admin.js';
import { weeksRouter, testsRouter, backlogRouter, modulesRouter, areasRouter, entriesRouter } from './routes/resources.js';

/**
 * Express is a pipeline (a linked list of middleware). Each request walks the
 * chain in the order of app.use() calls until something sends a response.
 */
export function createApp() {
  const app = express();

  app.use(cors({ origin: [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/] }));
  app.use(express.json({ limit: '5mb' })); // parses JSON bodies into req.body

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/daily', dailyRouter);
  app.use('/api/weeks', weeksRouter);
  app.use('/api/tests', testsRouter);
  app.use('/api/backlog', backlogRouter);
  app.use('/api/apfc/modules', modulesRouter);
  app.use('/api/apfc/areas', areasRouter);
  app.use('/api/apfc/entries', entriesRouter);
  app.use('/api', adminRouter); // /api/settings, /api/backup, /api/restore

  app.use('/api', (_req, res) => res.status(404).json({ error: 'Unknown API route' }));

  // Production mode: serve the built React app from client/dist on the same port.
  const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
  if (fs.existsSync(dist)) {
    app.use(express.static(dist));
    app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html'))); // SPA fallback
  }

  // Central error handler: the 4-argument signature is how Express recognises it.
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err.name === 'ValidationError' || err.name === 'CastError') {
      return res.status(400).json({ error: err.message });
    }
    if (err.code === 11000) {
      return res.status(409).json({ error: `Duplicate value: ${JSON.stringify(err.keyValue)}` });
    }
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Server error' });
  });

  return app;
}
