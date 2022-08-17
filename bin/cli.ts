// This is not used for anything yet, but may be in the future

import yargs from 'yargs/yargs';
import { DDCoordinates, queryTallestNearMe } from '../src/data';

// var argv = yargs(process.argv.slice(2))
//     .usage('Usage: $0 <command> [options]')
//     .command('count', 'Find tall FAA obstacles around you.')
//     .example('$0 --lat 39.140115 --long -84.513876 --radius 50 --height 400 --excludeObjects "tower, bldg, pole"', 'show me all objects within 50 miles of location except buildings towers and poles')
//     .example('$0 --lat 39.140115 --long -84.513876 --radius 50 --height 200 --only "bldg"', 'only show me buildings within 50 miles of location')
//     .alias('r', 'radius')
//     .alias('h', 'height')
//     .alias('m', 'heightMax')
//     .alias('e', 'excludeObjects')
//     .alias('o', 'only')
//     .nargs('r', 1)
//     .nargs('e', 1)
//     .nargs('o', 1)
//     .nargs('h', 1)
//     .nargs('m', 1)
//     .nargs('lat', 1)
//     .nargs('long', 1)
//     .describe('lat', 'lattitude in decimal degrees')
//     .describe('long', 'longitude in decimal degrees')
//     .describe('r', 'radius in miles from lat long ')
//     .describe('e', 'exclude object types from results (see below for acceptable objects')
//     .describe('h', 'only show objects above this height in feet (default 250)')
//     .describe('m', 'set a max height')
//     .describe('e', 'show all objects except these types (default: "cantery, met, balloon"')
//     .describe('o', 'return only these types of objects')
//     .demandOption(['radius', 'lat', 'long', 'height'])
//     .epilog('object types include: antenna (ASR towers), bldg (building), windmill, tank, t-l twr (power tower), stack (smoke stack), elevator (grain elevator)')
//     .argv;

const main = async () => {

    const location: DDCoordinates = {
        lattitude: 39.140115,
        longitude: -84.513876,
    }

    const radiusInMiles = 30;

    const height: number = 250;

    const objects = await queryTallestNearMe(location, radiusInMiles, height);
    console.log(objects);
}


main();