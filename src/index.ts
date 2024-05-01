import cors from 'cors';
import express, { json, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { defaultQuery, parseRequestBody, searchObjects } from './controller';
import { ObjectQueryRequest } from './types';

// Constants for validation
const MAX_RADIUS = 500;
const MIN_RADIUS = 1;

// Use environment variable for port or default to 3001
const port = process.env.PORT || 3001;

const app = express();
app.use(cors()); // for now allow every domain in development
app.use(json());

/// ROUTES ///

// PROD query function
app.post(
  "/objects",
  body("latitude").isNumeric(),
  body("longitude").isNumeric(),
  body("radius").isInt({ lt: MAX_RADIUS + 1, gt: MIN_RADIUS - 1 }),
  async (req: Request, res: Response) => {
    // validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // parse and query, return GeoJson
    const query: ObjectQueryRequest = parseRequestBody(req.body);
    searchObjects(query)
      .then((result) => res.json(result))
      .catch((error) => {
        console.error('Failed to search objects:', error);
        res.status(500).json({ error: "Internal server error" });
      });
  }
)

// DEV routes only included in development environment
if (process.env.NODE_ENV === 'development') {
  // DEV ping
  app.get('/ping', (_, res: Response) => res.send('pong'));

  // DEV example query for developers to see data format
  app.get('/example', async (_, res: Response) => defaultQuery().then(result => res.json(result)));
}

/// SERVER LAUNCH ///
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
