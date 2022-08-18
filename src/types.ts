import { FAAObject, ObjectType } from '@prisma/client';

// TODO refactor/remove
// HTTP response is usually is an array of these
type FAAObjectWithRelativeLocation = {
    FAAObject: FAAObject,
    distanceFromLocation: number,
}

// This should be the format of the request body as JSON
type ObjectQueryRequest = {
    location: Coordinates,
    radius: number,
    minHeight?: number,
    maxHeight?: number,
    excludeObjectTypes?: ObjectType[],
}

// TODO refactor/remove
/// digital degree; both are float, eg. -84.7328
type Coordinates = {
    latitude: number,
    longitude: number,
};

export {
    FAAObject,
    ObjectType,
    FAAObjectWithRelativeLocation,
    ObjectQueryRequest,
    Coordinates,
}