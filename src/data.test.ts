// import { PrismaClient, Prisma } from '@prisma/client'
import { _getQueryCoordinates, DD, _QueryLocationParameters, queryTallestNearMe  } from './data';

// lat long at 0, 0
// radius at 10 miles
test('run getQueryCoordinates with sample values', () => {
    const location: DD = {
        lattitude: 0,
        longitude: 0,
    };

    const queryCoordinates: _QueryLocationParameters = _getQueryCoordinates(location, 10);

    // console.log(queryCoordinates);
});

test('query db for taller than 600ft objects', async () => {
    // university of cincinnati
    const location: DD = {
        lattitude: 39.140115,
        longitude: -84.513876,
    }

    const objects = await queryTallestNearMe(location, 50, 400);
    console.log(objects);
});