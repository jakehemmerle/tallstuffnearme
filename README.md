# tallstuffnearme

This shows you tall stuff around you from the best possible resource available: the [FAA Digital Obstacle File][dof]

## Instructions

1. Start a new Postgres instance and set URL in `.env`, or use the provided `docker-compose.yaml`.
2. Decompress the (or [download the latest][dof] DOF zip file into `faa-data`.
3. `yarn` (to install deps)
4. `yarn db:reinitialize` - configure DB, parse DAT files, and seed the DB.
5. Enter your location and radius in `bin/cli.ts`.
6. `yarn cli` to execute `bin/cli.ts`.

## Dev Resources

[FAA Digital Obstacle File][dof]
[FAA Obstacle Data FAQ](https://www.faa.gov/air_traffic/flight_info/aeronav/obst_data/)

For parsing earth data down the road(?):
[USGS map](https://apps.nationalmap.gov/downloader/#/)

Google Maps JS API: <https://developers.google.com/maps/documentation/javascript/tutorials>

## Legal

From the DOF FAQ:

Q: Is the DOF data considered to be in the public domain? Are there any restrictions on using the DOF data?

A: Yes, it is in the public domain. There are no restrictions on how you may use the data, but you are not allowed to change the data.

[dof]: https://www.faa.gov/air_traffic/flight_info/aeronav/digital_products/dof/
