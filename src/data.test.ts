import { _calculateQueryCorodinates, _QueryLocationParameters, _distanceBetweenPoints } from './data';
import { Coordinates } from './types';

test('compute distance between two decimal degree points', async () => {
    const location: Coordinates = {
        lattitude: 39.140115,
        longitude: -84.513876,
    }
    const location2: Coordinates = {
        lattitude: 0,
        longitude: 0,
    }

    console.log(_distanceBetweenPoints(location, location2));
});