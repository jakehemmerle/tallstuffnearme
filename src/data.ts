import { readFileSync } from 'fs';
import { PrismaClient, Prisma, FAAObject } from '@prisma/client';

// conversion parameters from: http://wiki.gis.com/wiki/index.php/Decimal_degrees
const KM_PER_DEGREE = 111.320; // surface distance in km per degree
const MILES_TO_KM = 1.609344;

const prisma = new PrismaClient();

/// digital degree
export type DDCoordinates = {
    lattitude: number,
    longitude: number,
};

export type _QueryLocationParameters = {
    location: DDCoordinates
    radiusInMiles: number,
    lattitudeUpperBound: number,
    lattitudeLowerBound: number,
    longitudeUpperBound: number,
    longitudeLowerBound: number,
}

export type FAAObjectWithRelativeLocation = {
    FAAObject,
    distanceFromLocation: number,
}

const _degreesToMiles = (degrees: number): number => {
    return degrees * KM_PER_DEGREE / MILES_TO_KM;
}

const _milesToDegrees = (miles: number): number => {
    return miles * MILES_TO_KM / KM_PER_DEGREE // 113,320 is 
}

export const _getQueryCoordinates = (location: DDCoordinates, radiusInMiles: number): _QueryLocationParameters => {
    const decimalDistance = _milesToDegrees(radiusInMiles);
    return {
        location,
        radiusInMiles,
        lattitudeUpperBound: location.lattitude + decimalDistance,
        lattitudeLowerBound: location.lattitude - decimalDistance,
        longitudeUpperBound: location.longitude + decimalDistance,
        longitudeLowerBound: location.longitude - decimalDistance
    }
}

// input format eg. ' 40 06 17.00N', takes lat or long as input
export const _DMSStringToDD = (dms: string): number => {
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

const _rawStringToFAAObject = (line: string): Prisma.FAAObjectCreateInput => {
    const currentObject: Prisma.FAAObjectCreateInput = {
        OASNumber: parseInt(line.slice(0, 2).concat(line.slice(3, 10)).trimEnd()),
        Verified: line.slice(10, 11),
        Country: line.slice(12, 14),
        State: line.slice(15, 17),
        City: line.slice(18, 34).trimEnd(),
        Latitude: _DMSStringToDD(line.slice(34, 47)),
        Longitude: _DMSStringToDD(line.slice(48, 61)),
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

// compute the distance between two decimal degree points
export const distanceBetweenPoints = (p1: DDCoordinates, p2: DDCoordinates): number => {
    const latDelta = Math.abs(p1.lattitude - p2.lattitude);
    const longDelta = Math.abs(p1.longitude - p2.longitude);

    const distanceInDD = Math.sqrt(latDelta**2 + longDelta**2); // pythagorean theorum

    return _degreesToMiles(distanceInDD);
    
} 

// used for adding .Dat files to the PostgresDB
export const insertDatFileIntoDB = async (path: string): Promise<void> => {
    // parse raw text
    const rawText: string = readFileSync(path, { encoding: 'utf8' });
    const rawLines: string[] = rawText.split(/\r?\n/);

    // raw text to json
    const cleanedStrings: string[] = rawLines.slice(4, rawLines.length - 1); // remove first few lines of non-object shit
    const insertableObjects: Prisma.FAAObjectCreateInput[] = cleanedStrings.map((rawLocation) => _rawStringToFAAObject(rawLocation));

    // json into db
    console.log(`found ${insertableObjects.length} objects. inserting into db...`);

    await prisma.fAAObject.createMany({
        data: insertableObjects,
    })

    return Promise.resolve();
}

// one way to query objects!
export const queryTallestNearMe = async (location: DDCoordinates, radius: number, gteHeightFeet: number): Promise<FAAObject[]> => {
    const {
        lattitudeUpperBound,
        lattitudeLowerBound,
        longitudeUpperBound,
        longitudeLowerBound,
    } = _getQueryCoordinates(location, radius);

    const where: Prisma.FAAObjectWhereInput = {
        AGL: {
            gte: gteHeightFeet
        },
        Latitude: {
            lte: lattitudeUpperBound,
            gte: lattitudeLowerBound
        },
        Longitude: {
            lte: longitudeUpperBound,
            gte: longitudeLowerBound
        },

        // double negatives allows eliminating multiple strings from query (I know enum is cleaner but I'm lazy)
        ObstacleType: {
            contains: "TOWER",
            not: {
                contains: "BLDG",

                not: {
                    not:{
                        // equals: "TOWER",
                        not: {
                            not:{
                                equals: "STACK",
                                not: {
                                    not:{
                                        equals: "WINDMILL",
                                        not: {
                                            not:{
                                                equals: "CATENARY",
                                                not: {
                                                    not:{
                                                        contains: "TWR",
                                                        not: {
                                                            not:{
                                                                // contains: "BRIDGE",
                                                                not: {
                                                                    not:{
                                                                        contains: "MET",
                                                                        
                                                                    }
                                                                    
                                                                }
                                                                
                                                            }
                                                            
                                                        }
                                                        
                                                    }
                                                    
                                                }
                                                
                                            }
                                            
                                        }
                                        
                                    }
                                    
                                }
                            }
                            
                        }
                    }
                }
            }
        }

    }

    const orderBy: Prisma.FAAObjectOrderByWithRelationInput = {
        AGL: 'desc'
    }

    return prisma.fAAObject.findMany({
        where,
        orderBy
    });

}