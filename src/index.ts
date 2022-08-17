// starts the webserver, routes etc.

import createApplication from 'express';

const app = createApplication();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/objects', (req, res) => {
  res.send('Objects here')
})

app.listen(port, () => {
  console.log(`Tall shit near you can be found on port ${port}...`)
})