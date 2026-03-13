"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { formatObjectType } from "@/lib/constants";
import type { ObjectGeoJsonProperties } from "@/lib/types";
import type { Feature, Point } from "geojson";
import { useEffect, useState } from "react";

interface DetailSheetProps {
  feature: Feature<Point, ObjectGeoJsonProperties> | null;
  onClose: () => void;
}

export function DetailSheet({ feature, onClose }: DetailSheetProps) {
  const [side, setSide] = useState<"bottom" | "right">(() =>
    typeof window !== "undefined" &&
    window.matchMedia("(min-width: 768px)").matches
      ? "right"
      : "bottom"
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const handler = (e: MediaQueryListEvent) =>
      setSide(e.matches ? "right" : "bottom");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (!feature) return null;
  const props = feature.properties;
  const maxHeight = 2000;
  const heightPercent = Math.min((props.AGL / maxHeight) * 100, 100);

  return (
    <Sheet open={!!feature} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side={side} className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {formatObjectType(props.ObjectType)}
            <Badge variant="secondary">{props.AGL} ft AGL</Badge>
          </SheetTitle>
          <SheetDescription>
            {props.City}, {props.State}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 p-4">
          {/* Height bar */}
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-muted-foreground">Height AGL</span>
              <span className="font-medium">{props.AGL} ft</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-400 via-amber-400 to-purple-400"
                style={{ width: `${heightPercent}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">AMSL</span>
              <p className="font-medium">{props.AMSL} ft</p>
            </div>
            {props.distanceFromLocation !== undefined && (
              <div>
                <span className="text-muted-foreground">Distance</span>
                <p className="font-medium">
                  {props.distanceFromLocation.toFixed(1)} mi
                </p>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">OAS Number</span>
              <p className="font-medium">{props.OASNumber}</p>
            </div>
            {props.FAAStudyNumber && (
              <div>
                <span className="text-muted-foreground">FAA Study</span>
                <p className="font-medium">{props.FAAStudyNumber}</p>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Light Type</span>
              <p className="font-medium">{props.LT || "None"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Marking</span>
              <p className="font-medium">
                {props.MarInd === "Y" ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Verified</span>
              <p className="font-medium">
                {props.Verified === "Y" ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Coordinates</span>
              <p className="font-medium text-xs">
                {feature.geometry.coordinates[1].toFixed(4)},{" "}
                {feature.geometry.coordinates[0].toFixed(4)}
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
