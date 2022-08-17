// starts the webserver, routes etc.

// const express = require('express');
import express, { Express, Request, Response, json } from 'express';
import 'dotenv';

const port = 3000;

const app = express();
app.use(json());


/// ROUTES
app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!')
})

app.get('/objects', (req: Request, res: Response, next) => {
  // sanatize request 
  let query = sanatizeInput(req.body);

  res.json(query);
})


/// SERVER LAUNCH
app.listen(port, () => {
  console.log(`Tall shit near you can be found on port ${port}...`)
})


/// HELPER FUNCTIONS
const sanatizeInput = (input) => {
  // long
  // lattitude
  // radius 
  // excluded objects
}