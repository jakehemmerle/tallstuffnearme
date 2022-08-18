// starts the webserver, routes etc.

import express, { Request, Response, json } from 'express';
import { body, validationResult } from 'express-validator';
import { ObjectQueryRequest } from './types';
import { parseRequestBody, defaultQuery, searchObjects } from './controller';

const port = 3000;

const app = express();
app.use(json());


/// ROUTES ///

// PROD query function
app.get('/objects',
  body("latitude").isNumeric(),
  body("longitude").isNumeric(),
  body("radius").isInt({ lt: 501, gt: 0 }),
  async (req: Request, res: Response) => {
    // validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // parse and query, return GeoJson
    const query: ObjectQueryRequest = parseRequestBody(req.body);
    console.log(query);
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