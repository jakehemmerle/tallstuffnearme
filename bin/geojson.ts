import { defaultQuery } from '../src/controller';
import { createWriteStream } from 'fs';

// query data from controller
const geoJsonObjectData = defaultQuery();

// write geojson to file
const geoJsonObjectFile = createWriteStream('./geojson.json');
geoJsonObjectData.then(data => {
  geoJsonObjectFile.write(JSON.stringify(data));
});

console.log('geojson.json created with default query');