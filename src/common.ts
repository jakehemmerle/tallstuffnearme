// shared types for client/server

import { FeatureCollection, Point } from 'geojson';
import { ObjectType } from './types';

// GeoJson properties for Object
type ObjectGeoJsonProperties = {
    OASNumber: number
    Verified: string
    Country: string
    State: string
    City: string
    ObjectType: ObjectType
    AGL: number
    AMSL: number
    LT: string
    H: string
    AccV: string
    MarInd: string
    FAAStudyNumber: string
    Action: string
    JDate: string
    distanceFromLocation: number,
}

// Response format for objects domain logic is a GeoJson feature collection
export type ObjectResponder = FeatureCollection<Point, ObjectGeoJsonProperties>;