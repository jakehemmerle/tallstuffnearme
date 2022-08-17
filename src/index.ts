// starts the webserver, routes etc.

// const express = require('express');
import express, { Express, Request, Response, json } from 'express';
import { ObjectType } from '@prisma/client';
import { DDCoordinates, queryTallestNearMe } from './data';
import 'dotenv';

const port = 3000;

const app = express();
app.use(json());

/// ROUTES
app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!')
})

app.get('/objects', async (req: Request, res: Response, next) => {
  // TODO sanatize request
  const query: ObjectQueryRequest = sanitizeInput(req.body);
  const queryResult = await queryTallestNearMe(query.location, query.radius, query.minHeight, query.excludeObjectTypes);
  res.json(queryResult);
})

app.get('/example', async (req: Request, res: Response, next) => {
  // TODO sanatize request
  const query: ObjectQueryRequest = sanitizeInput(req.body);
  const queryResult = await queryTallestNearMe(query.location, query.radius, query.minHeight, query.excludeObjectTypes);
  res.json(queryResult);
})


/// SERVER LAUNCH
app.listen(port, () => {
  console.log(`Tall shit near you can be found on port ${port}...`);
});


/// HELPER FUNCTIONS
export type ObjectQueryRequest = {
  location: DDCoordinates,
  radius: number,
  minHeight?: number,
  maxHeight?: number,
  excludeObjectTypes: ObjectType[],
}

const sanitizeInput = (input): ObjectQueryRequest => {
  return {
    location: input.location,
    radius: input.radius ? input.radius : 10,
    minHeight: input.minHeight ? input.minHeight : 100,
    maxHeight: input.maxHeight,
    excludeObjectTypes: input.excludeObjectTypes,
  }
}