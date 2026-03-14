import app from './app';

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`Tall shit near you can be found on port ${port}...`);
});
