# Development with Nix

The repository flake pins Bun, Node, PostgreSQL 17 clients, Prisma's build engine,
and the JavaScript dependency closure. Run commands from the repository root:

```sh
nix develop
tsnm setup
export TALLSTUFF_ENV=dev
export TSNM_ENV_FILE=/run/tallshitnearme/app.env
tsnm db-status
tsnm dev
```

The VM profile already sets `TSNM_ENV_FILE` on `tallshitnearme-dev`. Database
commands load this trusted shell environment file when `DATABASE_URL` is unset
or empty. An explicit `DATABASE_URL` takes precedence. On another machine, supply
`DATABASE_URL` for a local `tallshit_dev` database through your secret manager.
Do not put passwords in shell arguments or commit `.env` files. Next serves the
development UI on port 3000 and the API on port 3001. For a remote browser, set
`TSNM_DEV_HOST` to the development VM's private hostname before `tsnm dev`.

`tsnm help` lists database inspection, migration, FAA seed, GeoJSON export,
benchmark and log commands. `tsnm seed PATH` imports missing FAA records from
state-specific `.dat` files in PATH. It accepts only local `tallshit_dev` or
`tallshit_test` databases and does not overwrite existing records. Production
migration restores the live database; it never seeds from the old bundled archive.

## Tests and package checks

Use a separate local database named `tallshit_test` with `TALLSTUFF_ENV=test`.
Set its `DATABASE_URL` privately, then run:

```sh
tsnm migrate
tsnm seed-fixtures
tsnm seed-fixtures
tsnm test
nix build .#default
```

The fixture operation is repeatable. Backend and CLI tests require the database.
The package builds the Next static export and API without network access during
its sandboxed build phase. Runtime settings and database credentials are supplied
when it starts. It serves the UI and API from one origin on port 3001.

For browser verification against that running package:

```sh
cd web
PLAYWRIGHT_REAL_API=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 \
  bunx --no-install playwright test e2e/acceptance.spec.ts
```

`/ping` checks the process. `/readyz` returns success only when it can query an
existing FAA record. `HOST=127.0.0.1` restricts the API listener to loopback;
NixOS staging and production use this behind their Cloudflare Tunnels.

## Existing database migration

The initial Prisma migration describes the existing production schema. For an
empty database, `tsnm migrate` creates it. After restoring an existing database,
compare its schema with `prisma/migrations/0_init/migration.sql`, then mark that
baseline as applied with `bunx --no-install --bun prisma migrate resolve --applied 0_init`.
Do not apply its CREATE statements over an existing schema. Future schema changes
must be committed migrations. `bun run db:reset` is restricted to a local
development or test database and destroys that database's contents.

## Agents and infrastructure

The project skill has one source at `.agents/skills/tallshitnearme/SKILL.md`.
Agent-specific discovery entries link there. `bd` tracks migration work and
dependencies. Infrastructure, persistent disk UUIDs, immutable application pins,
secret recovery and backup commands are documented in
`~/nix-config/docs/tallshitnearme.md`.

The refreshed Beads workspace uses prefix `tsnm`. On a new clone, run
`bd init --prefix tsnm` if no workspace exists, then `bd dolt pull` and
`bd prime`. The Dolt remote uses the repository's Git-over-SSH transport;
agent credentials need write access only when publishing issue updates.
