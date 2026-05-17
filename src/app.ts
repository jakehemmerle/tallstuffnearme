import path from 'path';
import cors from 'cors';
import express, { json, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { defaultQuery, parseRequestBody, searchObjects } from './controller';
import { ObjectQueryRequest } from './types';
import { recordClientAnalyticsEvent, recordObjectSearch } from './analytics';

const app = express();
app.use(cors());
app.use(json());

// Serve static frontend (Next.js export)
const staticDir = path.join(__dirname, '..', 'public');
app.use(express.static(staticDir));

app.post("/analytics", (req: Request, res: Response) => {
  const logged = recordClientAnalyticsEvent(req.body, req);
  res.status(202).json({ ok: true, logged });
});

// PROD query function
app.post(
  "/objects",
  body("bounds.sw.latitude").isNumeric(),
  body("bounds.sw.longitude").isNumeric(),
  body("bounds.ne.latitude").isNumeric(),
  body("bounds.ne.longitude").isNumeric(),
  body("center.latitude").optional().isNumeric(),
  body("center.longitude").optional().isNumeric(),
  body("minHeight").optional().isInt(),
  body("maxHeight").optional().isInt(),
  body("limit").optional().isInt({ min: 1, max: 2000 }),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const query: ObjectQueryRequest = parseRequestBody(req.body);
    const startedAt = Date.now();
    searchObjects(query)
      .then((result) => {
        recordObjectSearch(req, query, result, Date.now() - startedAt);
        res.json(result);
      }).catch(() => res.status(400).json({ error: "could not query" }));
  }
)

// DEV ping
app.get('/ping', (_, res: Response) => res.send('pong'));

// DEV example query for developers to see data format
app.get('/example', async (_, res: Response) => defaultQuery().then(result => res.json(result)));

// SPA fallback — serve index.html for unmatched routes
app.get('*', (_, res: Response) => {
  res.sendFile(path.join(staticDir, 'index.html'));
});

export default app;
