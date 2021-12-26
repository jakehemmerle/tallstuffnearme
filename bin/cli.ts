import yargs from 'yargs/yargs';
import { DD, queryTallestNearMe } from '../src/data';

var argv = yargs(process.argv.slice(2))
    .usage('Usage: $0 <command> [options]')
    .command('count', 'Find tall objects near you.')
    .example('$0 --lat 39.140115 --long -84.513876 --radius 50 --excludeObjects windmill', 'show me all objects within 50 miles of location except windmills')
    .example('$0 --lat 39.140115 --long -84.513876 --radius 50 --only bldg', 'only show me buildings (bldg) within 50 miles of location')
    .alias('r', 'radius')
    .alias('e', 'excludeObjects')
    .alias('o', 'only')
    .nargs('r', 1)
    .nargs('e', 1)
    .nargs('o', 1)
    .nargs('lat', 1)
    .nargs('long', 1)
    .describe('lat', 'lattitude in decimal degrees')
    .describe('long', 'longitude in decimal degrees')
    .describe('e', 'exclude certain object types ')
    .demandOption(['r', 'lat', 'long'])
    // .help('h')
    .epilog('test')
    .argv;

const main = async () => {
    const location: DD = {
        lattitude: 39.140115,
        longitude: -84.513876,
    }
    
    const objects = await queryTallestNearMe(location, 20, 400);
    console.log(objects);
}


main();