// import { PrismaClient, Prisma } from '@prisma/client'
import { _getQueryCoordinates, DDCoordinates, _QueryLocationParameters, distanceBetweenPoints } from './data';
import { readdirSync } from 'fs';

// lat long at 0, 0
// radius at 10 miles
test('run getQueryCoordinates with sample values', () => {
    const location: DDCoordinates = {
        lattitude: 0,
        longitude: 0,
    };

    const queryCoordinates: _QueryLocationParameters = _getQueryCoordinates(location, 10);

    // console.log(queryCoordinates);
});

test('compute distance between two decimal degree points', async () => {
    const location: DDCoordinates = {
        lattitude: 39.140115,
        longitude: -84.513876,
    }
    const location2: DDCoordinates = {
        lattitude: 0,
        longitude: 0,
    }
    
    console.log(distanceBetweenPoints(location, location2));
});