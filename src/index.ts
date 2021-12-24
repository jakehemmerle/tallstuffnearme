import { datFileToObjectArray } from './parseDAT.js';


datFileToObjectArray("./faa-data/39-OH.Dat").then((result) => console.log(result));