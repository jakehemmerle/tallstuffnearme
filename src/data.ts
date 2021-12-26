import { readFileSync } from 'fs';
import { PrismaClient, Prisma, FAAObject } from '@prisma/client';

/*
decimal degrees to distance

places	degrees	distance
0	1.0	111 km    ~ 111,319.9km
1	0.1	11.1 km
2	0.01	1.11 km
3	0.001	111 m
4	0.0001	11.1 m
5	0.00001	1.11 m
6	0.000001	0.111 m
7	0.0000001	1.11 cm
8	0.00000001	1.11 mm

*/

// lat and long are the string as it's formatted in the DB

// def dms2dd(degrees, minutes, seconds, direction):
//     dd = float(degrees) + float(minutes)/60 + float(seconds)/(60*60);
//     if direction == 'W' or direction == 'S':
//         dd *= -1
//     return dd;
export const DMSToDD = (lat: string, long: string) => {

}


export const insertDatFileIntoDB = async (path: string): Promise<FAAObject[]> => {
    const prisma = new PrismaClient();

    const rawStringToFAAObject = (line: string): Prisma.FAAObjectCreateInput => {

        // input format is: '040 06 17.00N'
        const DMSStringToDD = (dms: string): number => {
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