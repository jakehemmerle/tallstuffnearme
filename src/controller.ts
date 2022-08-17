import { FAAObject, Prisma, PrismaClient } from "@prisma/client";
import { _distanceBetweenPoints, _getQueryCoordinates } from "./data";
import { Coordinates, FAAObjectWithRelativeLocation, ObjectQueryRequest } from "./types";

const prisma = new PrismaClient();

export const parseRequestBody = (input): ObjectQueryRequest => {
    const { lattitude, longitude, radius, minHeight, maxHeight, excludeObjectTypes } = input;
    return {
        location: {
            longitude,
            lattitude
        },
        radius: radius | 10,
        minHeight: minHeight | 100,
        maxHeight,
        excludeObjectTypes,
    }
}

export const searchObjects = async (query: ObjectQueryRequest): Promise<FAAObjectWithRelativeLocation[]> => {
    const {
        location,
        radius,
        minHeight,
        maxHeight,
        excludeObjectTypes,
    } = query;

    const {
        lattitudeUpperBound,
        lattitudeLowerBound,
        longitudeUpperBound,
        longitudeLowerBound,
    } = _getQueryCoordinates(location, radius);

    const where: Prisma.FAAObjectWhereInput = {
        AGL: {
            gte: minHeight,
            lte: maxHeight
        },
        Latitude: {
            lte: lattitudeUpperBound,
            gte: lattitudeLowerBound
        },
        Longitude: {
            lte: longitudeUpperBound,
            gte: longitudeLowerBound
        },
        ObjectType: {
            notIn: excludeObjectTypes
        }
    }
    const orderBy: Prisma.FAAObjectOrderByWithRelationInput = {
        AGL: 'desc'
    }
    const objects: FAAObject[] = await prisma.fAAObject.findMany({
        where,
        orderBy
    });

    const objectsWithDistance: FAAObjectWithRelativeLocation[] = objects.map(FAAObject => {
        const objectCoordinates: Coordinates = {
            lattitude: FAAObject.Latitude,
            longitude: FAAObject.Longitude,
        }
        return {
            FAAObject,
            distanceFromLocation: _distanceBetweenPoints(location, objectCoordinates),
        }
    })

    return objectsWithDistance.sort((a, b) => (a.distanceFromLocation - b.distanceFromLocation));
}

export const defaultQuery: ObjectQueryRequest = {
    location: {
        lattitude: 36.147769,
        longitude: -115.157224
    },
    radius: 1,
    minHeight: 100,
};