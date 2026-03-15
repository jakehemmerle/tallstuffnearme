"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatObjectType } from "@/lib/constants";
import type { ObjectGeoJsonProperties } from "@/lib/types";
import type { Feature, Point } from "geojson";
import { ExternalLink } from "lucide-react";

interface DetailSheetProps {
  feature: Feature<Point, ObjectGeoJsonProperties> | null;
  onClose: () => void;
}

export function DetailSheet({ feature, onClose }: DetailSheetProps) {
  if (!feature) return null;
  const props = feature.properties;
  const maxHeight = 2000;
  const heightPercent = Math.min((props.AGL / maxHeight) * 100, 100);
  const [lng, lat] = feature.geometry.coordinates;
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  return (
    <Dialog open={!!feature} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {formatObjectType(props.ObjectType)}
            <Badge variant="secondary">{props.AGL} ft AGL</Badge>
          </DialogTitle>
          <DialogDescription>
            {props.City}, {props.State}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
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
              <span className="text-muted-foreground">Marking</span>
              <p className="font-medium">
                {props.MarInd === "Y" ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Coordinates</span>
              <p className="font-medium text-xs">
                {lat.toFixed(4)}, {lng.toFixed(4)}
              </p>
            </div>
          </div>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <ExternalLink className="size-4" />
            Open in Google Maps
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
