export function makeMockGeoJson(
  count: number,
  objectType = "TOWER",
  options?: { distanceFromLocation?: number }
) {
  return {
    type: "FeatureCollection" as const,
    features: Array.from({ length: count }, (_, i) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [-98.6 + i * 0.01, 39.8],
      },
      properties: {
        OASNumber: 10000 + i,
        Verified: "Y",
        Country: "US",
        State: "KS",
        City: "LEBANON",
        ObjectType: objectType,
        AGL: 200 + i * 100,
        AMSL: 1800 + i * 100,
        LT: "1",
        H: "H",
        AccV: "H",
        MarInd: "Y",
        FAAStudyNumber: `2020-ASW-${1000 + i}`,
        Action: "A",
        JDate: "2020100",
        ...(options?.distanceFromLocation !== undefined && {
          distanceFromLocation: options.distanceFromLocation,
        }),
      },
    })),
  };
}

export const MOCK_GEOJSON = makeMockGeoJson(1, "TOWER", {
  distanceFromLocation: 1.2,
});
