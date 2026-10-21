# Tallshitnearme Nix and Incus migration plan

Approved for execution, October 20, 2026. Work is tracked in Beads epic `tsnm-ytg`. This document describes the implementation and its acceptance gates; Beads owns task status and dependencies.

The target is a complete development VM plus staging and production VMs on the GPU server, with an independent PostgreSQL container inside each VM. The public domains move through Cloudflare DNS and Tunnel. The current application, data, analytics and rollback path must survive the move.

## Target layout

Jake requested Incus, the regular development VM setup, PostgreSQL inside the staging/prod VMs, and Cloudflare DNS plus Tunnel. This plan interprets that as the following three VMs. The initial staging spelling is normalized to `tallshitnearme-staging`.

| Incus VM | Operating environment | Application | PostgreSQL | Access |
| --- | --- | --- | --- | --- |
| `tallshitnearme-dev` | Regular Debian/Xfce development VM with Nix Home Manager | Editable checkout, dev servers, project dev shell, agents and tools | Dedicated PostgreSQL 17 OCI container inside this VM | Tailscale SSH and regular desktop access |
| `tallshitnearme-staging` | NixOS VM | Immutable Nix application package and systemd service | Dedicated PostgreSQL 17 OCI container inside this VM | `staging.tallshitnearme.com` through its own Cloudflare Tunnel |
| `tallshitnearme-prod` | NixOS VM | The same accepted application package | Dedicated PostgreSQL 17 OCI container inside this VM | `tallshitnearme.com` through its own Cloudflare Tunnel |

Use Podman for the OCI containers. Each VM has separate database credentials and durable storage. Publish PostgreSQL only on guest loopback. Application processes in other VMs cannot reach it. Production and staging receive service credentials only; development agent credentials stay in dev.

The regular dev VM keeps its existing Debian provisioning model. Nix manages its project toolchain and Home Manager configuration. Staging and production use NixOS for operating-system and service configuration. This is not a conversion of the regular dev image into NixOS.

Proposed initial allocations are 4 vCPU, 8 GiB RAM and a 64 GiB system disk for dev, and 2 vCPU, 4 GiB RAM and a 32 GiB system disk for each server VM. Allow a separate 10 GiB database volume per VM initially. These are starting budgets, not measured requirements. Measure build memory, representative query latency and storage growth before acceptance.

## Current state and constraints

- The repository is `jakehemmerle/tallstuffnearme`. Local `HEAD` is `ecd0bfba30012b44267dd2e03091b634d76ec0f4`; fetched `origin/master` is `c84b3ba7801921d617e951230ff21819302417ed`. Those two upstream commits include production analytics and the existing lint fix. Begin implementation from the current reviewed remote revision.
- The checkout has unrelated local changes: staged `.beads/issues.jsonl`, a deleted `AGENTS.md`, modified `web/next-env.d.ts` and untracked `web/tsconfig.tsbuildinfo`. Preserve them. Do not re-create the deleted agent file silently.
- Bun runs an Express API and serves a Next static export on port 3001. Prisma already supports native PostgreSQL through `adapter-pg`. There is no queue, background importer or PostGIS dependency. See [package.json](../package.json), [Dockerfile](../Dockerfile), [src/prisma.ts](../src/prisma.ts) and [prisma/schema.prisma](../prisma/schema.prisma).
- Cloud Run serves production and staging. Neon PostgreSQL 17.11 stores two databases on a shared endpoint and role. Read-only inspection found 607,022 `FAAObject` rows in each database, approximately 129 MB per database, the expected primary key and two indexes, and only the `plpgsql` extension. Re-capture counts and fingerprints at migration time.
- Local Compose and CI use PostgreSQL 14. Align them with PostgreSQL 17. Do not combine this move with a database major upgrade.
- The current staging workflow runs on every push to `master` and reapplies Pulumi DNS. Change deployment ownership before a push can overwrite the new routing. See [.github/workflows/deploy-staging.yml](../.github/workflows/deploy-staging.yml) and [infra/src/dns.ts](../infra/src/dns.ts).
- Google Cloud DNS is authoritative; Namecheap is the registrar. The apex has four A and four AAAA records with TTL 300. The AAAA records are absent from Pulumi source. Staging is a CNAME to `ghs.googlehosted.com`. Preserve the complete live zone, including verification TXT, and handle both address families.
- The GPU is behind CGNAT. A direct public A-record change cannot provide ingress. Cloudflare Tunnel avoids inbound port forwarding. A normal Cloudflare Free/Pro setup requires changing authoritative nameservers.
- Live GPU inventory showed 96 logical CPUs, 251 GiB RAM with 164 GiB available, and 616 GiB free on the Incus NVMe pool. These are point-in-time readings, not reservations. Existing `dev-main`, `kali-main`, inference and other services must remain healthy.
- The canonical GPU `~/nix-config` is dirty at `6accca5494ddcc0d39616dc888fc992036a95e36`. Preserve its unrelated DSH edits. The Mac source also declares an undeployed `dev-test-proxy`; activating this migration must not accidentally provision it.

## Source and ownership

The application repository owns the project flake, immutable application package, dev shell, CLI, project-local skills and application verification. The canonical `~/nix-config` checkout owns Incus declarations, VM profiles, operating-system configuration, secrets, tunnels, persistence and backups.

Add project definitions under `flake.nix`, `flake.lock` and `nix/`. Create operational and verification skills under `.agents/skills/`, with discovery symlinks using the `add-skill` helper. No existing project-specific skills were found in the checkout or the scoped global skill/CLI search, so this portion creates project workflows rather than moving a known skill. Global Nix and Beads skills retain their existing canonical owners.

Extend the regular guest profile through a project-specific Home Manager output and add that output to the permitted `services.devVms.homeConfiguration` values in `hosts/gpu/dev-vms.nix`. Add a project-specific Debian system provisioning step for Podman prerequisites, disk mounts and required service access. Add separate staging/prod `nixosConfigurations` using the existing pinned nixpkgs Incus VM module. Build images and Linux closures on the GPU. Do not create another nix-config checkout or update unrelated inputs.

Have nix-config consume the application flake through an input pinned to a full application commit. Build the application once for the target platform, accept that store path on staging, and promote the identical store path to production. Record and compare the application store path, application Git revision and nix-config revision on both VMs. Supply all environment differences at runtime so a promotion does not rebuild a different application.

Secrets enter services through restricted runtime files or systemd credentials, encrypted with the existing agenix workflow where applicable. Never embed database passwords, tunnel tokens, agent authentication or private keys in the Nix store or Git.

## Implementation sequence

| Phase | Beads issue | Implementation and acceptance gate |
| --- | --- | --- |
| Source baseline | `tsnm-ytg.6` | Reconcile current remote application code and GPU checkout ownership. Preserve local edits and record current production images, DNS, schema and data fingerprints. Identify the safe Git/deployment sequence before pushing to `master`. |
| VM shells and storage | `tsnm-ytg.15` | Add scoped guest declarations, profile selection and NixOS images. Boot all three VMs, attach and mount independent data volumes, establish management access and secret identities, and prove that reprovisioning preserves storage and unrelated guests. |
| Nix application and dev shell | `tsnm-ytg.7` | Pin Bun, Node, PostgreSQL 17 tools and JavaScript dependencies. Build generated Prisma, frontend assets and the application without network access during the build phase. A clean Linux build and dev-shell startup must succeed. |
| CLI and project skills | `tsnm-ytg.8` | Package environment-aware development, seed, export, benchmark, database inspection, logs and verification commands. Verify each from a fresh shell and verify skill discovery. |
| Development VM | `tsnm-ytg.9` | Provision the regular Incus dev VM with the project Home Manager profile, tools, selected agents, credentials and checkout. Verify SSH/desktop access, GitHub, Beads, agent operation, app startup and browser tests after restart. |
| Database containers | `tsnm-ytg.10` | Start one PostgreSQL 17 OCI container inside each VM, with independent durable storage and secrets. Restore source data into disposable targets first. Verify isolation, data parity, restart persistence and an off-host backup restore. |
| Staging and production | `tsnm-ytg.11` | Provision NixOS VMs with the packaged app, PostgreSQL, readiness, per-VM Tunnel and logs. Mirror DNS and change nameserver authority separately from application routing. |
| End-to-end verification | `tsnm-ytg.12` | Prove real API/browser behavior, CLI outputs, database-backed readiness, restore, environment isolation, guest restart and rollback. Record exact source revisions and deployed versions. |
| Domain cutover | `tsnm-ytg.13` | Cut staging first, then production after acceptance. Verify authoritative DNS, IPv4/IPv6 HTTPS, representative data queries, map interactions and analytics. Retain the old services for rollback. |
| Legacy retirement | `tsnm-ytg.14` | After the observation window and restore proof, retire obsolete Cloud Run/Neon resources, obsolete workflows and unused secrets. This is separate from the initial cutover. |

Packaging and VM-shell work can proceed in parallel after the source and topology decisions. Database containers depend on the VM shells and mounted data volumes. The complete dev setup then depends on its database and packaged CLI. Staging and production application deployment depend on the package, database services and ingress setup. Public cutover depends on the full acceptance gate.

### Application and CLI details

The immutable application package must preserve the current same-origin frontend/API arrangement and port behavior. Pin a local Inter font asset instead of fetching Google Fonts during the build. Keep credentials as runtime inputs.

Expose the existing seed, GeoJSON export and benchmark utilities through stable Nix commands. Preserve their actual behavior while fixing migration blockers. The seed currently fails on repeated inserts; GeoJSON export needs a completed output stream and a clean process exit. Verify those properties against disposable data. Keep destructive reset and schema commands explicitly scoped to disposable dev/test databases.

A clean clone cannot reproduce production by running the current seed. The tracked FAA archive is from 2022, while local extracted files identify February 2026 data. Restore current Neon data for this migration. Pinning and updating the FAA source is a separate operation.

Introduce a baseline Prisma migration without recreating restored tables. Mark the baseline applied on restored databases, then verify that the next deployment has no unintended schema change. Never use `db:reinitialize`, `db:reset` or `prisma db push --force-reset` on restored staging or production.

### Database and persistence details

Pin a PostgreSQL 17 image by digest, verifying its reported patch version and supported architecture. Attach an independent Incus block volume to each VM, initialize only newly created blank volumes, and mount by filesystem UUID. Bind its PostgreSQL directory into the container. Require that mount before starting the service so a missing data volume cannot silently create an empty database on the system disk.

Use PostgreSQL 17 client tools and Neon's unpooled endpoint for `pg_dump -Fc`. Restore into an empty target using target ownership and `--no-owner --no-acl`; run `ANALYZE`. Compare schema, enum values, indexes, exact row counts and deterministically ordered data fingerprints. Restore staging and production from their respective source databases. Development receives a disposable copy.

Keep imports and schema changes frozen during the final dump and rollback window. The public application reads the dataset; analytics writes logs rather than database rows. Re-check that assumption against the exact deployed revision before using it to justify a short cutover.

Configure scheduled encrypted off-host backups and prove restoration into a disposable database before production cutover. Record the destination, credentials, schedule and retention in the implementation runbook. A proposed starting policy is daily backups retained for 30 days, subject to the chosen destination. Do not call a same-disk snapshot an off-host backup.

Incus currently uses the `dir` storage driver. Its snapshots copy data rather than using copy-on-write, and container/custom-volume quota enforcement has not been established. Verify actual VM volume capacity and available space. Snapshot/export separately attached data volumes as well as VM instances. A Nix generation rollback does not roll back PostgreSQL data.

### Development agents and Beads

The regular guest profile already supplies OMP/providerproxy, Cua, Beads and Dolt. It does not supply the fleet skill catalog or native Codex/Claude. Extend only the project profile with the tools and skill discovery needed for this repository, then verify an actual agent invocation. Do not install production credentials into the development agent environment.

The Debian development VM also needs rootless Podman prerequisites in its project-specific provisioning step: Debian `uidmap` helpers with their required permissions, non-overlapping subordinate UID/GID ranges, cgroups v2, user namespaces and user lingering. Home Manager supplies Podman and its user service, but cannot establish those privileged host prerequisites alone. Verify `podman info`, database access and reboot startup from Jake's normal user session.

Research roles for this migration are `application_research`, `nix_vm_research` and `database_domain_research`. Their findings and assignments are saved in `tsnm-ytg.1`, `.2` and `.3`; the agents remain resumable within this chat. These are research roles, not an unattended production service or a recurring schedule. On a new chat, recover the Beads records before assigning implementation.

The fresh Beads database uses the `tsnm` prefix and embedded Dolt. The previous ten issues have a full native backup and a directory archive at `/Users/jake/.local/state/tallshitnearme-migration/20261020T231731Z/`. The original staged legacy JSONL remains intact. New import/export configuration uses `migration-issues.jsonl` so the legacy file cannot repopulate the new workspace. Establish and test the intended Dolt sync path before using Beads across the Mac and dev VM.

### Cloudflare and cutover details

1. Verify access to the Cloudflare account and zone, Namecheap nameserver controls, Google Cloud DNS and source deployment state. Capture all existing DNS records, image digests and database fingerprints in restricted migration artifacts.
2. Create the Cloudflare zone and mirror the existing Cloud Run A, AAAA and CNAME destinations as DNS-only records, preserving verification records. Do not enable the Cloudflare proxy during this authority-only step. Do not copy Google's provider-owned NS/SOA records as application records. Change nameservers at Namecheap only after the zone is complete. Verify delegation and unchanged application behavior before changing app routes. The nameserver delegation can take longer to propagate than the application records' TTL 300.
3. Give staging and production separate locally managed Tunnel credentials and route only each VM's own hostname to its loopback application service. Use a final HTTP 404 catch-all ingress rule. Keep account-wide management credentials off the VMs. Verify outbound Tunnel connectivity and certificates. Keep development private through Tailscale.
4. Replace the old Pulumi deployment/DNS ownership path before its next run can undo changes. Retain recoverable state and the old service artifacts.
5. Wait for the Cloudflare zone to be Active and verify valid edge certificates. Restore staging, pass real API/browser and restore checks, then point `staging.tallshitnearme.com` to its Tunnel. A proposed minimum observation window is 24 hours with automated health and log checks.
6. Take the final production dump under the import/schema freeze, restore and compare data, then switch `tallshitnearme.com`. Replace the legacy A and AAAA routing together. Verify from external IPv4 and IPv6 clients and check authoritative DNS plus independent resolvers.
7. Keep Cloud Run and Neon for a proposed seven-day production rollback window. Require healthy observations and a recent successful backup restore before retiring them.

If application acceptance fails, restore the recorded old application targets through Cloudflare, which will then be the active DNS authority. Reverting nameservers is not the routine rollback because it starts another delegation-propagation event. Keep the old A/AAAA/CNAME sets and service revisions available. If imports resume, reconcile their data before routing back to the old database.

### Verification and analytics

Add a readiness check that queries PostgreSQL; the existing `/ping` only proves the HTTP process is alive. The current CI excludes the only backend end-to-end test file. Run those tests against a real seeded disposable database. Fix the Playwright launcher to use the Bun workspace and add acceptance runs against the real packaged API, beyond existing mocked responses.

The browser gate covers map load, location/search, bounds and height filters, marker details, outbound Google Maps links, and desktop/mobile layouts. Match representative old/new API responses from a fixed dataset. Record latency on identical queries and data, with no unexplained regression accepted.

Preserve production `TALLSTUFF_ENV=prod` and `ANALYTICS_ENABLED=true`; staging uses its own environment value and disables analytics. The current remote application emits structured JSON logs, and its analytics documentation describes 365-day Cloud Logging retention. Configure durable rotated logs, an off-host archive with equivalent retention, and a query CLI before cutting over. Size storage using observed log volume.

After restarting only the new VMs, verify services, database contents, mounts, SSH identities, Tunnel identities and secret permissions. Compare the existing GPU guests and critical services before and after provisioning. Use the GPU provisioning guard and pinned-revision deployment procedure where required by nix-config.

## Completion and remaining prerequisites

The migration is complete when a fresh development VM can build, run, test and operate the project; staging and production use the same accepted immutable package with independent in-VM databases; the existing public domains resolve through the new ingress; and data parity, isolation, persistence, backup restore, analytics and rollback have recorded evidence.

Implementation still needs verified Cloudflare/Namecheap account access, a chosen off-host backup destination, the exact deployed image digests, resolution of the dirty GPU checkout, and a measured resource check. These are implementation prerequisites, not claims that access or deployment already exists. This planning pass has not provisioned VMs, deployed the app or changed DNS.

Primary technical references: [NixOS Incus VM module at the fleet pin](https://github.com/NixOS/nixpkgs/blob/7fc6f2c20af09cdcaf48b92ec3121860139ec668/nixos/modules/virtualisation/incus-virtual-machine.nix), [PostgreSQL 17 pg_dump](https://www.postgresql.org/docs/17/app-pgdump.html), [Neon migration guidance](https://neon.com/docs/import/migrate-from-postgres), [Cloudflare full DNS setup](https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/), [Incus directory storage](https://linuxcontainers.org/incus/docs/main/reference/storage_dir/).
