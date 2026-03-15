"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { MapView } from "@/components/map/map-view";
import { Header } from "@/components/header";
import { FilterBar } from "@/components/filter-bar";
import { DetailSheet } from "@/components/detail-sheet";
import { useFilters } from "@/hooks/use-filters";
import { useObjects } from "@/hooks/use-objects";
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
      setSelectedFeature(feature);
    },
    []
  );

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
        onToggleObjectType={toggleObjectType}
      />
      <DetailSheet
        feature={selectedFeature}
        onClose={() => setSelectedFeature(null)}
      />
    </div>
  );
}
