import cors from 'cors';
import express, { json, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { defaultQuery, parseRequestBody, searchObjects } from './controller';
import { ObjectQueryRequest } from './types';

const app = express();
app.use(cors());
app.use(json());

// PROD query function
app.post(
  "/objects",
  body("latitude").isNumeric(),
  body("longitude").isNumeric(),
  body("radius").isInt({ lt: 501, gt: 0 }),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const query: ObjectQueryRequest = parseRequestBody(req.body);
    searchObjects(query)
      .then((result) => res.json(result)).catch(() => res.status(400).json({ error: "could not query" }));
  }
)

// DEV ping
app.get('/ping', (_, res: Response) => res.send('pong'));

// DEV example query for developers to see data format
app.get('/example', async (_, res: Response) => defaultQuery().then(result => res.json(result)));

export default app;
