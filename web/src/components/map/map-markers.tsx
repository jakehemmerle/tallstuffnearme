"use client";

import { Source, Layer } from "react-map-gl/maplibre";
import type { ObjectGeoJson } from "@/lib/types";
import type { CircleLayerSpecification } from "maplibre-gl";
import {
  HEIGHT_COLOR_STOPS,
  HEIGHT_RADIUS_STOPS,
  HEIGHT_STROKE_COLOR_STOPS,
} from "@/lib/constants";

const circleLayer: CircleLayerSpecification = {
  id: "objects-circle",
  type: "circle",
  source: "objects",
  paint: {
    "circle-radius": [
      "interpolate",
      ["linear"],
      ["get", "AGL"],
      ...HEIGHT_RADIUS_STOPS.flat(),
    ],
    "circle-color": [
      "interpolate",
      ["linear"],
      ["get", "AGL"],
      ...HEIGHT_COLOR_STOPS.flat(),
    ],
    "circle-opacity": 0.8,
    "circle-stroke-width": 1.5,
    "circle-stroke-color": [
      "interpolate",
      ["linear"],
      ["get", "AGL"],
      ...HEIGHT_STROKE_COLOR_STOPS.flat(),
    ],
    "circle-stroke-opacity": 1,
  },
};

interface MapMarkersProps {
  data: ObjectGeoJson | null;
}

export function MapMarkers({ data }: MapMarkersProps) {
  if (!data) return null;

  return (
    <Source id="objects" type="geojson" data={data}>
      <Layer {...circleLayer} />
    </Source>
  );
}
