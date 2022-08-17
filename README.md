# tallstuffnearme

This shows you tall stuff around you from the best possible resource available: the [FAA Digital Obstacle File][dof]

## Instructions (as of 08/16/2022)

1. Clone repo with `git clone --depth 1 https://github.com/jakehemmerle/tallstuffnearme`
2. Start a new Postgres instance and set URL in `.env`, or use the provided `docker-compose.yaml`.
3. Decompress the (or [download the latest][dof] DOF zip file into `faa-data`.
4. `yarn` (to install deps)
5. `yarn db:reinitialize` - configure DB, parse DAT files, and seed the DB.
6. Enter your location and radius in `bin/cli.ts`.
7. `yarn cli` to execute `bin/cli.ts`.

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

## TODO

My shitty mock of Frontend requests will be done in the following format-ish:

```ts
// GET request with following JSON payload in body
{
    location: DDCoordinate, // decimal degree coordinate, DDCoordinate is in `./src/data.ts`
    radius: number,  // integer in miles
    minHeight?: number // integer in feet
    maxHeight?: number // integer in feet
    excludedObjects?: ObjectType[],  // enum of objects to ignore in search; ObjectType from @prisma/client
}

// response
FAAObjectWithRelativeLocation[]
```

- `FAAObject`, `ObjectType` in `@prisma/client` (be sure to run `yarn prisma generate` to generate `client`)
- `FAAObjectWithRelativeLocation` and ` in `./src/data.ts`
