// starts the webserver, routes etc.

import express, { Request, Response, json } from 'express';
import { ObjectQueryRequest } from './types';
import { parseRequestBody, defaultQuery, searchObjects } from './controller';

const port = 3000;

const app = express();
app.use(json());


/// ROUTES ///

// PROD query function
app.get('/objects', async (req: Request, res: Response) => {
  const query: ObjectQueryRequest = parseRequestBody(req.body);
  searchObjects(query)
    .then((result) => res.json(result));
})

// DEV ping
app.get('/ping', (_, res: Response) => res.send('pong'));

// DEV example query for developers to see data format
app.get('/example', async (_, res: Response) => searchObjects(defaultQuery).then(result => res.json(result)));


/// SERVER LAUNCH ///
app.listen(port, () => {
  console.log(`Tall shit near you can be found on port ${port}...`);
});
