import type { FeatureCollection, Point } from "geojson";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Bounds {
  sw: Coordinates;
  ne: Coordinates;
}

export interface ObjectQueryRequest {
  bounds: Bounds;
  center?: Coordinates;
  minHeight?: number;
  maxHeight?: number;
  excludeObjectTypes?: ObjectType[];
  limit?: number;
}

export type ObjectType =
  | "RIG"
  | "STACK"
  | "BLDG"
  | "TOWER"
  | "POLE"
  | "ELEC_SYS"
  | "TL_TWR"
  | "TANK"
  | "BRIDGE"
  | "SIGN"
  | "REFINERY"
  | "FENCE"
  | "PLANT"
  | "GEN_UTIL"
  | "ELEVATOR"
  | "ANTENNA"
  | "NAVAID"
  | "CTRL_TWR"
  | "SILO"
  | "UTILITY_POLE"
  | "CRANE"
  | "BLDGTWR"
  | "VERTICAL_STRUCTURE"
  | "AG_EQUIP"
  | "CATENARY"
  | "WINDSOCK"
  | "DOME"
  | "SOLAR_PANELS"
  | "MET"
  | "AMUSEMENT_PARK"
  | "MONUMENT"
  | "STADIUM"
  | "COOL_TWR"
  | "DAM"
  | "WINDMILL"
  | "LANDFILL"
  | "POWER_PLANT"
  | "TRAMWAY"
  | "BALLOON"
  | "SPIRE"
  | "WALL"
  | "HEAT_COOL_SYSTEM"
  | "NATURAL_GAS_SYSTEM"
  | "LGTHOUSE"
  | "PIPELINE_PIPE"
  | "HANGAR"
  | "ARCH"
  | "GRAIN_ELEVATOR"
  | "GATE"
  | "WIND_INDICATOR"
  | "UNDEFINED";

const ALL_OBJECT_TYPES_MAP = {
  RIG: true,
  STACK: true,
  BLDG: true,
  TOWER: true,
  POLE: true,
  ELEC_SYS: true,
  TL_TWR: true,
  TANK: true,
  BRIDGE: true,
  SIGN: true,
  REFINERY: true,
  FENCE: true,
  PLANT: true,
  GEN_UTIL: true,
  ELEVATOR: true,
  ANTENNA: true,
  NAVAID: true,
  CTRL_TWR: true,
  SILO: true,
  UTILITY_POLE: true,
  CRANE: true,
  BLDGTWR: true,
  VERTICAL_STRUCTURE: true,
  AG_EQUIP: true,
  CATENARY: true,
  WINDSOCK: true,
  DOME: true,
  SOLAR_PANELS: true,
  MET: true,
  AMUSEMENT_PARK: true,
  MONUMENT: true,
  STADIUM: true,
  COOL_TWR: true,
  DAM: true,
  WINDMILL: true,
  LANDFILL: true,
  POWER_PLANT: true,
  TRAMWAY: true,
  BALLOON: true,
  SPIRE: true,
  WALL: true,
  HEAT_COOL_SYSTEM: true,
  NATURAL_GAS_SYSTEM: true,
  LGTHOUSE: true,
  PIPELINE_PIPE: true,
  HANGAR: true,
  ARCH: true,
  GRAIN_ELEVATOR: true,
  GATE: true,
  WIND_INDICATOR: true,
  UNDEFINED: true,
} satisfies Record<ObjectType, true>;

export const ALL_OBJECT_TYPES = Object.keys(ALL_OBJECT_TYPES_MAP) as ObjectType[];

export interface ObjectGeoJsonProperties {
  OASNumber: number;
  Verified: string;
  Country: string;
  State: string;
  City: string;
  ObjectType: ObjectType;
  AGL: number;
  AMSL: number;
  LT: string;
  H: string;
  AccV: string;
  MarInd: string;
  FAAStudyNumber: string;
  Action: string;
  JDate: string;
  distanceFromLocation?: number;
}

export type ObjectGeoJson = FeatureCollection<Point, ObjectGeoJsonProperties>;
