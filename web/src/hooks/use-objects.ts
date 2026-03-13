"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { fetchObjects } from "@/lib/api";
import type { Bounds, ObjectType, ObjectGeoJson } from "@/lib/types";
import { DEFAULT_LIMIT } from "@/lib/constants";

interface UseObjectsOptions {
  minHeight: number;
  excludeObjectTypes: ObjectType[];
}

export function useObjects({ minHeight, excludeObjectTypes }: UseObjectsOptions) {
  const [data, setData] = useState<ObjectGeoJson | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetch = useCallback(
    (bounds: Bounds, center?: { latitude: number; longitude: number }) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(async () => {
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);
        try {
          const result = await fetchObjects(
            {
              bounds,
              center,
              minHeight,
              excludeObjectTypes:
                excludeObjectTypes.length > 0 ? excludeObjectTypes : undefined,
              limit: DEFAULT_LIMIT,
            },
            controller.signal
          );
          if (!controller.signal.aborted) {
            setData(result);
          }
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") return;
          console.error("Failed to fetch objects:", err);
        } finally {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        }
      }, 300);
    },
    [minHeight, excludeObjectTypes]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  return { data, loading, fetch };
}
