import { readFileSync } from 'fs';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// interface FAAObject {
//     OASNumber: number;
//     Verified: boolean;
//     Country: string;
//     State: string;
//     City: string;
//     Latitude: string;
//     Longitude: string;
//     ObstacleType: string;
//     AGL: number;
//     AMSL: number;
//     H: number;
//     AccV: string;
//     MarInd: string;
//     FAAStudyNumber: string;
//     Action: string;
//     JDate: string;
// }

interface FAAObject {
    OASNumber: number;
    Verified: string;
    Country: string;
    State: string;
    City: string;
    Latitude: string;
    Longitude: string;
    ObstacleType: string;
    AGL: number;
    AMSL: number;
    LT: string;
    H: string;
    AccV: string;
    MarInd: string;
    FAAStudyNumber: string;
    Action: string;
    JDate: string;
}

const rawStringToFAAObject = (line: string): Prisma.FAAObjectCreateInput => {

    // NOTE: OASNumber has a prefix, we remove prefix for DB id for now... I think it's a US state identifier
    const currentObject: Prisma.FAAObjectCreateInput = {
        OASNumber: parseInt(line.slice(0, 2).concat(line.slice(3, 10)).trimEnd()),
        Verified: line.slice(10, 11),
        Country: line.slice(12, 14),
        State: line.slice(15, 17),
        City: line.slice(18, 34).trimEnd(),
        Latitude: line.slice(35, 47),
        Longitude: line.slice(48, 61),
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
    // parse raw text
    const rawText = readFileSync(path, { encoding: 'utf8' });
    const rawLines = rawText.split(/\r?\n/);

    // raw text to json
    const locationsAsRawStrings = rawLines.slice(4, rawLines.length - 1); // remove first few lines of non-object shit
    const objects: Prisma.FAAObjectCreateInput[] = locationsAsRawStrings.map((rawLocation) => rawStringToFAAObject(rawLocation));

    // json into db
    console.log(`adding ${objects.length} objects to db...`);

    return Promise.all(
        objects.map(async (object) => {
            return prisma.fAAObject.create({
                data: object,
            })
        })
    )
    
}