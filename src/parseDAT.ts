import { readFileSync } from 'fs';

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
    OASNumber: string;
    Verified: string;
    Country: string;
    State: string;
    City: string;
    Latitude: string;
    Longitude: string;
    ObstacleType: string;
    AGL: string;
    AMSL: string;
    LT: string;
    H: string;
    AccV: string;
    MarInd: string;
    FAAStudyNumber: string;
    Action: string;
    JDate: string;
}

const rawStringToFAAObject = (line: string): FAAObject => {

    const currentObject: FAAObject = {
        OASNumber: line.slice(0, 10).trimEnd(),
        Verified: line.slice(10, 11),
        Country: line.slice(12, 14),
        State: line.slice(15, 17),
        City: line.slice(18, 34).trimEnd(),
        Latitude: line.slice(35, 47),
        Longitude: line.slice(48, 61),
        ObstacleType: line.slice(62, 80).trimEnd(),
        AGL: line.slice(83, 88),
        AMSL: line.slice(89, 94),
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

export const parseOhioAsText = (): FAAObject[] => {
    let parsedLocations: FAAObject[] = [];
    const rawText = readFileSync('./faa-data/39-OH.Dat', { encoding: 'utf8' });
    const rawLines = rawText.split(/\r?\n/);

    const locationsAsRawStrings = rawLines.slice(4); // remove first few lines of non-object shit

    locationsAsRawStrings.forEach((line) => {
        parsedLocations.push(rawStringToFAAObject(line));
    })
    
    return parsedLocations;
}

