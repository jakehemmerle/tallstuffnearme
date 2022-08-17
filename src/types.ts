import { FAAObject, ObjectType } from '@prisma/client';

// HTTP response is usually is an array of these
type FAAObjectWithRelativeLocation = {
    FAAObject,
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

/// digital degree; both are float, eg. -84.7328
type Coordinates = {
    lattitude: number,
    longitude: number,
};

export {
    FAAObject,
    ObjectType,
    FAAObjectWithRelativeLocation,
    ObjectQueryRequest,
    Coordinates,
}