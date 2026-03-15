import { FAAObject, ObjectType } from './generated/prisma/client';

type Coordinates = {
    latitude: number,
    longitude: number,
};

type Bounds = {
    sw: Coordinates,
    ne: Coordinates,
};

type ObjectQueryRequest = {
    bounds: Bounds,
    center?: Coordinates,
    minHeight?: number,
    maxHeight?: number,
    excludeObjectTypes?: ObjectType[],
    limit?: number,
}

type FAAObjectWithRelativeLocation = {
    FAAObject: FAAObject,
    distanceFromLocation?: number,
}

export {
    FAAObject,
    ObjectType,
    FAAObjectWithRelativeLocation,
    ObjectQueryRequest,
    Coordinates,
    Bounds,
}
