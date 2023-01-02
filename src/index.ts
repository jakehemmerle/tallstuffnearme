// starts the webserver, routes etc.

import cors from 'cors';
import express, { json, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { defaultQuery, parseRequestBody, searchObjects } from './controller';
import { ObjectQueryRequest } from './types';

const port = 3001;

const app = express();
app.use(cors()); // for now allow every domain in development
app.use(json());


/// ROUTES ///

// PROD query function
app.post(
  "/objects",
  async (req: Request, res: Response) => {
    // validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // parse and query, return GeoJson
    const query: ObjectQueryRequest = parseRequestBody(req.body);
    searchObjects(query)
      .then((result) => res.json(result)).catch(() => res.status(400).json({ error: "could not query" }));
  }
)

// DEV ping
app.get('/ping', (_, res: Response) => res.send('pong'));

// DEV example query for developers to see data format
app.get('/example', async (_, res: Response) => defaultQuery().then(result => res.json(result)));


/// SERVER LAUNCH ///
app.listen(port, () => {
  console.log(`Tall shit near you can be found on port ${port}...`);
});
