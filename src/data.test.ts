import { getQueryCoordinates, DD, LocationAndRadius,  } from './data';

test('run getQueryCoordinates with sample values', () => {
    // lat long at 0, 0
    // radius at 10 miles

    const location: DD = {
        lattitude: 0,
        longitude: 0,
    };

    const queryCoordinates: LocationAndRadius = getQueryCoordinates(location, 10);
    console.log(queryCoordinates);
});