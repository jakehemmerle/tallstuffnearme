"use client";

import { useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { formatObjectType } from "@/lib/constants";
import { ALL_OBJECT_TYPES, type ObjectType } from "@/lib/types";

interface FilterBarProps {
  excludeObjectTypes: ObjectType[];
  onToggleObjectType: (type: ObjectType) => void;
}

export function FilterBar({
  excludeObjectTypes,
  onToggleObjectType,
}: FilterBarProps) {
  const excludedSet = useMemo(() => new Set(excludeObjectTypes), [excludeObjectTypes]);
  return (
    <div className="absolute bottom-4 left-4 z-10 flex items-end gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <button
            data-testid="type-filter-button"
            className="rounded-lg border bg-background/90 px-3 py-2 text-sm font-medium shadow-lg backdrop-blur-sm hover:bg-accent"
          >
            Types
            {excludeObjectTypes.length > 0 && (
              <span className="ml-1 text-muted-foreground">
                (-{excludeObjectTypes.length})
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="max-h-64 w-56 overflow-y-auto p-2"
          align="start"
          side="top"
        >
          <div className="space-y-1">
            {ALL_OBJECT_TYPES.map((type) => (
              <label
                key={type}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-accent"
              >
                <Checkbox
                  checked={!excludedSet.has(type)}
                  onCheckedChange={() => onToggleObjectType(type)}
                />
                {formatObjectType(type)}
              </label>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
