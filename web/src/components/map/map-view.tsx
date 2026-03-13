"use client";

import { useCallback, useRef, useEffect, useState } from "react";
import Map, {
  NavigationControl,
  GeolocateControl,
  type MapRef,
  type ViewStateChangeEvent,
  type MapLayerMouseEvent,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapMarkers } from "./map-markers";
import { CARTO_POSITRON, DEFAULT_BOUNDS, DEFAULT_CENTER, DEFAULT_ZOOM } from "@/lib/constants";
import type { ObjectGeoJson, Bounds, ObjectGeoJsonProperties } from "@/lib/types";
import type { Feature, Point } from "geojson";

interface MapViewProps {
  data: ObjectGeoJson | null;
  onBoundsChange: (bounds: Bounds, center: { latitude: number; longitude: number }) => void;
  onFeatureClick: (feature: Feature<Point, ObjectGeoJsonProperties>) => void;
}

export function MapView({ data, onBoundsChange, onFeatureClick }: MapViewProps) {
  const mapRef = useRef<MapRef>(null);
  const [mapError, setMapError] = useState(false);
  const hasFetchedRef = useRef(false);

  const extractBoundsAndFetch = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const bounds = map.getBounds();
    const center = map.getCenter();
    hasFetchedRef.current = true;
    onBoundsChange(
      {
        sw: { latitude: bounds.getSouth(), longitude: bounds.getWest() },
        ne: { latitude: bounds.getNorth(), longitude: bounds.getEast() },
      },
      { latitude: center.lat, longitude: center.lng }
    );
  }, [onBoundsChange]);

  const handleMoveEnd = useCallback(
    (_e: ViewStateChangeEvent) => {
      extractBoundsAndFetch();
    },
    [extractBoundsAndFetch]
  );

  const handleLoad = useCallback(() => {
    if (mapRef.current && process.env.NODE_ENV !== "production") {
      (window as unknown as Record<string, unknown>).__testMap = mapRef.current.getMap();
    }
    extractBoundsAndFetch();
  }, [extractBoundsAndFetch]);

  const handleClick = useCallback(
    (e: MapLayerMouseEvent) => {
      const features = e.features;
      if (features && features.length > 0) {
        onFeatureClick(
          features[0] as unknown as Feature<Point, ObjectGeoJsonProperties>
        );
      }
    },
    [onFeatureClick]
  );

  // Fallback: if map fails to load (e.g. no WebGL), fetch with default bounds
  useEffect(() => {
    if (mapError && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      onBoundsChange(
        DEFAULT_BOUNDS,
        { latitude: DEFAULT_CENTER.latitude, longitude: DEFAULT_CENTER.longitude }
      );
    }
  }, [mapError, onBoundsChange]);

  return (
    <Map
      ref={mapRef}
      initialViewState={{
        latitude: DEFAULT_CENTER.latitude,
        longitude: DEFAULT_CENTER.longitude,
        zoom: DEFAULT_ZOOM,
      }}
      style={{ width: "100%", height: "100%" }}
      mapStyle={CARTO_POSITRON}
      onMoveEnd={handleMoveEnd}
      onLoad={handleLoad}
      onError={() => setMapError(true)}
      onClick={handleClick}
      interactiveLayerIds={["objects-circle"]}
      cursor="auto"
    >
      <NavigationControl position="top-right" />
      <GeolocateControl position="top-right" />
      <MapMarkers data={data} />
    </Map>
  );
}
