import { FAAObject, PrismaClient } from "@prisma/client";
import { _distanceBetweenPoints, _calculateQueryCorodinates } from "./data";
import { FAAObjectWithRelativeLocation, ObjectQueryRequest } from "./types";
import { ObjectResponder } from "./common";

const prisma = new PrismaClient();

export const parseRequestBody = (input): ObjectQueryRequest => {
    var { latitude, longitude, radius, minHeight, maxHeight, excludeObjectTypes } = input;
    // Force lat and long to be floats
    latitude = parseFloat(latitude);
    longitude = parseFloat(longitude);
    return {
        location: {
            longitude,
            latitude
        },
        radius: +radius | 10, // Force an int and set the default to 10 if not provided or an error
        minHeight: +minHeight | 100, // Force an int and default to 100 if not provided or error
        maxHeight: +maxHeight | 1000, // Force an int and default to 1000 if not provided or error
        excludeObjectTypes,
    }
}

// domain logic for /objects
export const searchObjects = async (query: ObjectQueryRequest): Promise<ObjectResponder> => {
    const {
        location,
        radius,
        minHeight,
        maxHeight,
        excludeObjectTypes,
    } = query;

    const {
        latitudeUpperBound,
        latitudeLowerBound,
        longitudeUpperBound,
        longitudeLowerBound,
    } = _calculateQueryCorodinates(location, radius);

    // get objects in query area
    const objects: FAAObject[] = await prisma.fAAObject.findMany({
        where: {
            AGL: {
                gte: minHeight,
                lte: maxHeight
            },
            Latitude: {
                lte: latitudeUpperBound,
                gte: latitudeLowerBound
            },
            Longitude: {
                lte: longitudeUpperBound,
                gte: longitudeLowerBound
            },
            ObjectType: {
                notIn: excludeObjectTypes
            }
        },
        orderBy: {
            AGL: 'desc'
        }
    });

    // add relative distance to each object from query location
    const objectsWithDistance: FAAObjectWithRelativeLocation[] = objects.map(FAAObject => ({
        FAAObject,
        distanceFromLocation: _distanceBetweenPoints(location, {
            latitude: FAAObject.Latitude,
            longitude: FAAObject.Longitude,
        })
    }));

    // return GeoJSON feature collection
    return fAAObjectsToGeoJSON(objectsWithDistance);
}

// default query for testing
export const defaultQuery = (): Promise<ObjectResponder> => (
    searchObjects({
        location: {
            latitude: 36.147769,
            longitude: -115.157224
        },
        radius: 1,
        minHeight: 100,
    })
)


// converts DB query with location to GeoJSON feature collection
const fAAObjectsToGeoJSON = (objects: FAAObjectWithRelativeLocation[]): ObjectResponder => {
    return {
        type: 'FeatureCollection',
        features: objects.map(object => ({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [object.FAAObject.Longitude, object.FAAObject.Latitude]
            },
            properties: {
                ...object.FAAObject,
                distanceFromLocation: object.distanceFromLocation,
            }
        }))
    }
}
