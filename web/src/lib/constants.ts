export const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const DEFAULT_CENTER = {
  latitude: 39.8,
  longitude: -98.6,
};

export const DEFAULT_ZOOM = 5;

export const DEFAULT_MIN_HEIGHT = 100;
export const DEFAULT_LIMIT = 500;

export const HEIGHT_COLOR_STOPS: [number, string][] = [
  [100, "#60a5fa"],
  [300, "#34d399"],
  [500, "#fbbf24"],
  [1000, "#f87171"],
  [2000, "#c084fc"],
];

export const HEIGHT_RADIUS_STOPS: [number, number][] = [
  [100, 4],
  [300, 7],
  [500, 10],
  [1000, 15],
  [2000, 22],
];

export const DEFAULT_BOUNDS = {
  sw: { latitude: 24.0, longitude: -125.0 },
  ne: { latitude: 50.0, longitude: -66.0 },
};

export const HEIGHT_STROKE_COLOR_STOPS: [number, string][] = [
  [100, "#3b82f6"],
  [300, "#10b981"],
  [500, "#f59e0b"],
  [1000, "#ef4444"],
  [2000, "#a855f7"],
];

export function formatObjectType(type: string): string {
  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export const CARTO_POSITRON =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
