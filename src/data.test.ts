import { getQueryCoordinates, DD, LocationAndRadius,  } from './data';

test('run getQueryCoordinates with sample values', () => {
    console.log(`samples long lat: 0, 0`);
    console.log(`samples radius: 10 miles`);

    const location = {
        lattitude: 0,
        longitude: 0,
    };

    const queryCoordinates: LocationAndRadius = getQueryCoordinates(location, 10);
    console.log(queryCoordinates);

});