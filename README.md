# tallstuffnearme

This repo should show tall stuff around you based on the [FAA Digital Obstacle File](https://www.faa.gov/air_traffic/flight_info/aeronav/digital_products/dof/)

## Instructions

decompress zip file in `faa-data`

then run `yarn` (to install deps)
then run `yarn dev` to start program

### Updating DB with new DAT files

If you need to use newer DOF database, then do the following to generate a new DB from a new set of DAT files.

1. empty the `./faa-data` folder, download the latest [FAA Digital Obstacle File](<https://www.faa.gov/air_traffic/flight_info/aeronav/digital_products/dof/> into the `./faa-data` folder and unzip it
2. `yarn db:reset` - resets the DB to empty state
3. `yarn db:seed` - seeds the database with the new DOF `.Dat` files.
4. `yarn dev` to start the program

## Dev Resources

[FAA Digital Obstacle File](https://www.faa.gov/air_traffic/flight_info/aeronav/digital_products/dof/)
[FAA Obstacle Data FAQ](https://www.faa.gov/air_traffic/flight_info/aeronav/obst_data/)

For parsing earth data down the road(?):
[USGS map](https://apps.nationalmap.gov/downloader/#/)

Google Maps JS API: <https://developers.google.com/maps/documentation/javascript/tutorials>

## Legal

From the DOF FAQ:

Q: Is the DOF data considered to be in the public domain? Are there any restrictions on using the DOF data?

A: Yes, it is in the public domain. There are no restrictions on how you may use the data, but you are not allowed to change the data.
