"use client";

import { useState, useCallback } from "react";
import { DEFAULT_MIN_HEIGHT } from "@/lib/constants";
import type { ObjectType } from "@/lib/types";

export function useFilters() {
  const [minHeight, setMinHeight] = useState(DEFAULT_MIN_HEIGHT);
  const [excludeObjectTypes, setExcludeObjectTypes] = useState<ObjectType[]>(
    []
  );

  const toggleObjectType = useCallback((type: ObjectType) => {
    setExcludeObjectTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }, []);

  return {
    minHeight,
    setMinHeight,
    excludeObjectTypes,
    toggleObjectType,
  };
}
