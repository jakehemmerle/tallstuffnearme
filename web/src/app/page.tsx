"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { MapView } from "@/components/map/map-view";
import { Header } from "@/components/header";
import { FilterBar } from "@/components/filter-bar";
import { DetailSheet } from "@/components/detail-sheet";
import { useFilters } from "@/hooks/use-filters";
import { useObjects } from "@/hooks/use-objects";
import {
  objectAnalyticsPayload,
  startAnalyticsSession,
  trackEvent,
} from "@/lib/analytics";
import type { Bounds, ObjectGeoJsonProperties } from "@/lib/types";
import type { Feature, Point } from "geojson";

export default function Home() {
  const { minHeight, setMinHeight, excludeObjectTypes, toggleObjectType } =
    useFilters();
  const { data, loading, fetch: fetchData } = useObjects({
    minHeight,
    excludeObjectTypes,
  });
  const [selectedFeature, setSelectedFeature] = useState<Feature<
    Point,
    ObjectGeoJsonProperties
  > | null>(null);

  // Track latest bounds so we can re-fetch when filters change
  const boundsRef = useRef<{
    bounds: Bounds;
    center: { latitude: number; longitude: number };
  } | null>(null);

  const handleBoundsChange = useCallback(
    (bounds: Bounds, center: { latitude: number; longitude: number }) => {
      boundsRef.current = { bounds, center };
      fetchData(bounds, center);
    },
    [fetchData]
  );

  const handleFeatureClick = useCallback(
    (feature: Feature<Point, ObjectGeoJsonProperties>) => {
      trackEvent("object_detail_open", objectAnalyticsPayload(feature));
      setSelectedFeature(feature);
    },
    []
  );

  const handleToggleObjectType = useCallback(
    (type: Parameters<typeof toggleObjectType>[0]) => {
      trackEvent("filter_toggle", {
        filter: "object_type",
        objectType: type,
        action: excludeObjectTypes.includes(type) ? "include" : "exclude",
      });
      toggleObjectType(type);
    },
    [excludeObjectTypes, toggleObjectType]
  );

  const handleGoogleMapsClick = useCallback(
    (feature: Feature<Point, ObjectGeoJsonProperties>) => {
      trackEvent("google_maps_click", objectAnalyticsPayload(feature));
    },
    []
  );

  useEffect(() => startAnalyticsSession(), []);

  // Re-fetch when filters change
  useEffect(() => {
    if (boundsRef.current) {
      fetchData(boundsRef.current.bounds, boundsRef.current.center);
    }
  }, [fetchData]);

  return (
    <div className="h-dvh w-full relative overflow-hidden">
      <Header
        objectCount={data?.features?.length ?? 0}
        loading={loading}
      />
      <MapView
        data={data}
        onBoundsChange={handleBoundsChange}
        onFeatureClick={handleFeatureClick}
      />
      <FilterBar
        excludeObjectTypes={excludeObjectTypes}
        onToggleObjectType={handleToggleObjectType}
      />
      <DetailSheet
        feature={selectedFeature}
        onClose={() => setSelectedFeature(null)}
        onGoogleMapsClick={handleGoogleMapsClick}
      />
    </div>
  );
}
