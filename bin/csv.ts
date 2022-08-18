import { stringify } from 'csv-stringify';
import assert from 'assert';
import { searchObjects, defaultQuery } from '../src/controller';

const data = [];
const inputData = searchObjects({
  ...defaultQuery,
  radius: 1000,
});

// Initialize the stringifier
const stringifier = stringify({
  delimiter: ','
});
// Use the readable stream api to consume CSV data
stringifier.on('readable', function () {
  let row;
  while ((row = stringifier.read()) !== null) {
    data.push(row);
  }
});
// Catch any error
stringifier.on('error', function (err) {
  console.error(err.message);
});
// When finished, validate the CSV output with the expected value
stringifier.on('finish', function () {
  const newData = data.join('');
  console.log(newData);
});
// Write records to the stream


inputData.then(data => {
  stringifier.write([
    'Latitude',
    'Longitude',
    'AGL',
    'ObjectType',
    'OASNumber'
  ]);
  data.forEach(row => {
    let someData = [
      row.FAAObject.Latitude,
      row.FAAObject.Longitude,
      row.FAAObject.AGL,
      row.FAAObject.ObjectType,
      row.FAAObject.OASNumber
    ];
    // console.log(someData);
    stringifier.write(someData);
  })
}).then(() => {
  stringifier.end();
});
// stringifier.write(['someone', 'x', '1022', '1022', '', '/home/someone', '/bin/bash']);
// Close the writable stream
// stringifier.end();