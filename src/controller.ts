import { FAAObject } from "./generated/prisma/client";
import { _distanceBetweenPoints } from "./data";
import { FAAObjectWithRelativeLocation, ObjectQueryRequest } from "./types";
import { ObjectResponder } from "./common";
import prisma from "./prisma";

export const parseRequestBody = (input: any): ObjectQueryRequest => {
    const { bounds, center, minHeight, maxHeight, excludeObjectTypes, limit } = input;
    return {
        bounds,
        center,
        minHeight: minHeight ?? 100,
        maxHeight,
        excludeObjectTypes,
        limit: limit ?? 500,
    }
}

// domain logic for /objects
export const searchObjects = async (query: ObjectQueryRequest): Promise<ObjectResponder> => {
    const {
        bounds,
        center,
        minHeight,
        maxHeight,
        excludeObjectTypes,
        limit,
    } = query;

    // get objects in query area
    const objects: FAAObject[] = await prisma.fAAObject.findMany({
        where: {
            AGL: {
                gte: minHeight,
                ...(maxHeight != null ? { lte: maxHeight } : {}),
            },
            Latitude: {
                gte: bounds.sw.latitude,
                lte: bounds.ne.latitude,
            },
            Longitude: {
                gte: bounds.sw.longitude,
                lte: bounds.ne.longitude,
            },
            ...(excludeObjectTypes?.length ? {
                ObjectType: { notIn: excludeObjectTypes }
            } : {}),
        },
        orderBy: {
            AGL: 'desc'
        },
        take: limit,
    });

    // add relative distance to each object from center (if provided)
    const objectsWithDistance: FAAObjectWithRelativeLocation[] = objects.map(FAAObject => ({
        FAAObject,
        ...(center ? {
            distanceFromLocation: _distanceBetweenPoints(center, {
                latitude: FAAObject.Latitude,
                longitude: FAAObject.Longitude,
            })
        } : {}),
    }));

    // return GeoJSON feature collection
    return fAAObjectsToGeoJSON(objectsWithDistance);
}

// default query for testing
export const defaultQuery = (): Promise<ObjectResponder> => (
    searchObjects({
        bounds: {
            sw: { latitude: 36.137, longitude: -115.167 },
            ne: { latitude: 36.157, longitude: -115.147 },
        },
        center: { latitude: 36.147769, longitude: -115.157224 },
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
                ...(object.distanceFromLocation != null
                    ? { distanceFromLocation: object.distanceFromLocation }
                    : {}),
            }
        }))
    }
}
