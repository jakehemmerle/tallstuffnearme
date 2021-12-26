import { readFileSync } from 'fs';
import { PrismaClient, Prisma, FAAObject } from '@prisma/client';

/// digital degree
export type DD = {
    lattitude: number,
    longitude: number,
};

export type LocationAndRadius = {
    location: DD
    radiusInMiles: number,
    lattitudeUpperBound: number,
    lattitudeLowerBound: number,
    longitudeUpperBound: number,
    longitudeLowerBound: number,
}

export const getQueryCoordinates = (location: DD, radiusInMiles: number): LocationAndRadius => {
    // conversion parameters from: http://wiki.gis.com/wiki/index.php/Decimal_degrees

    const MILES_TO_KM = 1.609344;
    const KM_PER_DEGREE = 111320;

    const decimalDistance = Math.abs((radiusInMiles * MILES_TO_KM) / KM_PER_DEGREE / 2) // divide by 2 because we do abs, 113,320 is surface distance in km per degree
    return {
        location,
        radiusInMiles,
        lattitudeUpperBound: location.lattitude + decimalDistance,
        lattitudeLowerBound: location.lattitude - decimalDistance,
        longitudeUpperBound: location.lattitude + decimalDistance,
        longitudeLowerBound: location.lattitude - decimalDistance
    }
}

// input format eg. ' 40 06 17.00N', takes lat or long as input
export const DMSStringToDD = (dms: string): number => {
    // parse strings
    const decimal = parseFloat(dms.slice(0, 3));
    const minute = parseFloat(dms.slice(4, 6));
    const second = parseFloat(dms.slice(7, 12));
    const direction = dms.slice(12, 13);

    // convert to decimal
    let dd = decimal + (minute / 60) + (second / (60 * 60));

    // positive or negative dd based on direction of dms
    if (direction === 'W' || direction === 'S') {
        dd *= -1;
    }

    return dd;
}

const rawStringToFAAObject = (line: string): Prisma.FAAObjectCreateInput => {
    const currentObject: Prisma.FAAObjectCreateInput = {
        OASNumber: parseInt(line.slice(0, 2).concat(line.slice(3, 10)).trimEnd()),
        Verified: line.slice(10, 11),
        Country: line.slice(12, 14),
        State: line.slice(15, 17),
        City: line.slice(18, 34).trimEnd(),
        Latitude: DMSStringToDD(line.slice(34, 47)),
        Longitude: DMSStringToDD(line.slice(48, 61)),
        ObstacleType: line.slice(62, 80).trimEnd(),
        AGL: parseInt(line.slice(83, 88)),
        AMSL: parseInt(line.slice(89, 94)),
        LT: line.slice(95, 96),
        H: line.slice(97, 98),
        AccV: line.slice(99, 100),
        MarInd: line.slice(101, 102),
        FAAStudyNumber: line.slice(103, 117),
        Action: line.slice(118, 119),
        JDate: line.slice(120, 127)
    };

    return currentObject;
}

export const insertDatFileIntoDB = async (path: string): Promise<FAAObject[]> => {
    const prisma = new PrismaClient();

    // parse raw text
    const rawText: string = readFileSync(path, { encoding: 'utf8' });
    const rawLines: string[] = rawText.split(/\r?\n/);

    // raw text to json
    const cleanedStrings: string[] = rawLines.slice(4, rawLines.length - 1); // remove first few lines of non-object shit
    const insertableObjects: Prisma.FAAObjectCreateInput[] = cleanedStrings.map((rawLocation) => rawStringToFAAObject(rawLocation));

    // json into db
    console.log(`adding ${insertableObjects.length} objects to db...`);

    return Promise.all(
        insertableObjects.map(async (object) => {
            return prisma.fAAObject.create({
                data: object,
            })
        })
    )
    
}