# tallstuffnearme

This shows you tall stuff around you from the best possible resource available: the [FAA Digital Obstacle File][dof];

## Setup

1. Clone repo with `git clone --depth 1 https://github.com/jakehemmerle/tallstuffnearme`
2. Start a new Postgres instance and set URL in `.env`, or use the provided `docker-compose.yaml`.
3. Decompress the (or [download the latest][dof] DOF zip file into `faa-data`.
4. `yarn` (to install deps)
5. `yarn db:reinitialize` - configure DB, parse DAT files, and seed the DB.

## Usage: Generate GeoJSON Data

### Write to File

Set your search parameters and stuff in `src/geojson.ts` and then run `yarn geojson`. This will write your output to a file `geojson.json`

## Serve via webserver

Run `yarn dev` to start the webserver. The `GET /object` endpoint will return a GeoJSON feature collection based on the query parameters you provide it. Example:

```ts
// GET /object with following JSON payload in body
{
    latitude: number, // decimal degrees
    longitude: number, // decimal degrees
    radius?: number,  // integer in miles, default to 10
    minHeight?: number // integer in feet, default to 100ft
    maxHeight?: number // integer in feet, default is null
    excludedObjects?: ObjectType[],  // enum of objects to ignore in search; ObjectType from @prisma/client
}

// response is a geojson feature collection
FeatureCollection<Point, ObjectGeoJsonProperties>
```

## Dev Resources

[FAA Digital Obstacle File][dof]

[FAA Obstacle Data FAQ](https://www.faa.gov/air_traffic/flight_info/aeronav/obst_data/)

For parsing earth data down the road(?):
[USGS map](https://apps.nationalmap.gov/downloader/#/)

Google Maps JS API: <https://developers.google.com/maps/documentation/javascript/tutorials>

## Example API

## Legal

From the DOF FAQ:

Q: Is the DOF data considered to be in the public domain? Are there any restrictions on using the DOF data?

A: Yes, it is in the public domain. There are no restrictions on how you may use the data, but you are not allowed to change the data.

Seem the [FAQ here](https://www.faa.gov/air_traffic/flight_info/aeronav/obst_data/doffaqs/)].

[dof]: https://www.faa.gov/air_traffic/flight_info/aeronav/digital_products/dof/

----

- `FAAObject`, `ObjectType` in `@prisma/client` (be sure to run `yarn prisma generate` to generate `client`)
- `FAAObjectWithRelativeLocation` and ` in `./src/data.ts`
