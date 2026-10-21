---
name: tallshitnearme
description: Develop, test, inspect and operate this Tallshitnearme checkout and its Nix-managed Incus environments.
---

# Tallshitnearme

Read `docs/development.md` for local commands. Run `bd prime` in the repository
before taking tracked work. The repository flake owns the application, CLI and
development toolchain; `~/nix-config` owns the three VM declarations and services.

Use `nix develop` and `tsnm help`. On the development VM, load the root-decrypted
environment from `/run/tallshitnearme/app.env` before running database commands.
Never print it. `tsnm db-status` reports the database identity and row count
without credentials. Development uses `tallshit_dev`; tests use `tallshit_test`.
Seed and reset commands reject remote hosts and non-development database names.

For verification, apply committed migrations to an empty test database, seed
fixtures twice, then run `tsnm test`. The browser acceptance test must run against
the packaged application with `PLAYWRIGHT_REAL_API=1`; mocked requests alone do
not verify the deployed database. `/readyz` requires an existing FAA record.

Inspect the live environment before deployment. Staging and production must use
the same accepted application store path. Read `~/nix-config/docs/tallshitnearme.md`
for pinned VM builds, database volumes, SOPS secret delivery and restore checks.
Read each VM's `/etc/tallshitnearme/deployment.json` to identify its exact source.
Secrets are encrypted separately for each VM; never copy a private age identity
or production environment file into development.

Use `tsnm logs` for application service logs and `tsnm analytics` for JSON
analytics records. Staging and development disable product analytics. Production
retains encrypted daily log backups for 365 days. Check the real public hostname
after a Tunnel route change, and preserve the documented rollback resources
until the migration's observation period has passed.
