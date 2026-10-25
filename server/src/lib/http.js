import { Router } from 'express';

/**
 * Express 4 does not catch rejected promises. Wrapping every async handler
 * forwards errors to the central error middleware in app.js.
 */
export const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** Fields the client may never write directly. */
const PROTECTED = ['_id', '__v', 'createdAt', 'updatedAt'];
export function clean(body = {}) {
  const out = { ...body };
  for (const k of PROTECTED) delete out[k];
  // Derived fields are recomputed on every read; never persist them.
  for (const k of Object.keys(out)) if (k.startsWith('$')) delete out[k];
  return out;
}

/** Pick only keys that exist on the schema, so derived values sent back by the UI are dropped. */
export function pickSchemaFields(Model, body) {
  const paths = new Set(Object.keys(Model.schema.paths).map((p) => p.split('.')[0]));
  return Object.fromEntries(Object.entries(clean(body)).filter(([k]) => paths.has(k)));
}

/**
 * Generic CRUD router — one factory instead of five near-identical files.
 *   GET    /       list (optionally filtered) -> derive() applied to each doc
 *   POST   /       create
 *   PATCH  /:id    partial update (only the fields sent)
 *   DELETE /:id    remove
 * `derive(docs, req)` lets each resource attach computed columns.
 */
export function crudRouter(Model, { sort = { _id: 1 }, filter = () => ({}), derive = async (d) => d } = {}) {
  const r = Router();

  r.get(
    '/',
    ah(async (req, res) => {
      const docs = await Model.find(filter(req)).sort(sort).lean();
      res.json(await derive(docs, req));
    }),
  );

  r.post(
    '/',
    ah(async (req, res) => {
      const doc = await Model.create(pickSchemaFields(Model, req.body));
      const [out] = await derive([doc.toObject()], req);
      res.status(201).json(out);
    }),
  );

  r.patch(
    '/:id',
    ah(async (req, res) => {
      const doc = await Model.findByIdAndUpdate(req.params.id, pickSchemaFields(Model, req.body), {
        new: true,
        runValidators: true,
      }).lean();
      if (!doc) return res.status(404).json({ error: 'Not found' });
      const [out] = await derive([doc], req);
      res.json(out);
    }),
  );

  r.delete(
    '/:id',
    ah(async (req, res) => {
      const doc = await Model.findByIdAndDelete(req.params.id);
      if (!doc) return res.status(404).json({ error: 'Not found' });
      res.status(204).end();
    }),
  );

  return r;
}
