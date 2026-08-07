# Añada

Añada is a visual winery-operations application for small and medium wineries in La Rioja. It is designed for fast cellar use and models red, white, rosado and clarete production as distinct processes.

## Current status

Version 0.34.0 adds canonical grower master management under Administration: legal/trade identity, contact details, active/inactive lifecycle and duplicate code/tax-ID validation, with browser schema v25 migrating legacy grower records without duplicating them. Campaign lifecycle (create, activate, close, reopen, archive, single-active/default invariants, closure blockers) shipped in version 0.33.0 with a full Administration workspace at `/admin/campaigns`. The former DOCa Rioja eligibility workspace remains retired.

The current frontend remains a browser-authoritative prototype. Catalyst confirms the seven provisioned Development tables through a health-only function, but shared server persistence, authentication, protected operational reads, remote writes and synchronization are not active.

## Implemented operational areas

- Harvest planning, vineyard parcels and grape intake
- Red, white, rosado and clarete lot creation
- Type-specific production stages, operations and readings
- Capacity-aware vessel assignment and visual cellar map
- Traceable transfers, splits and compatible merges
- Tasks, laboratory samples and result entry
- Barrel inventory and ageing operations
- Blend trials, tastings, approval and volume reservation
- Bottling release gates, packaging supplier lots and run reconciliation
- Supplier and product masters, physical input lots, quarantine and release history
- Backward and forward traceability views and recall simulations
- Reports, CSV export, PWA installation, offline shell and QR labels
- Spanish and English interfaces with responsive cellar controls

## Current product boundary

- Operational records are stored on the current browser only.
- Local operator names are attribution labels, not authenticated signatures.
- Traceability is generated for product-lot consumption; several older operational mutations still require unification.
- Packaging and oenological-product receipt inventory are implemented.
- Product adjustments, storage transfers and disposal are not yet implemented.
- No screen represents regulatory certification or an official submission.

## Next checkpoint

Phase 8B.2B will add attributed product-stock adjustments, storage transfers and disposal without weakening the immutable consumption history.

See [PHASES.md](./PHASES.md) for the recalibrated roadmap.

## Local development

Requirements: Node.js 22 or newer and npm.

```bash
npm install
npm run dev
```

The entry route is `/#/welcome`. Hash routing is intentional for Catalyst Slate hosting.

## Validation

```bash
npm run typecheck
npm run test:process
npm run test:pwa
npm run test:backend
npm run build
```

## Zoho Catalyst

- Project: `Anada-Winery`
- EU project ID: `11922000000094785`
- Organisation ID: `20117369913`

The production build is written to `dist/`. Preserve the Catalyst CLI-generated configuration. Do not expose operational data without winery membership, authorization and an explicit protected API design.

## Documentation

- `PHASES.md` — active gated roadmap
- `DESIGN_SYSTEM.md` — visual and interaction conventions
- `CATALYST_SCHEMA.md` — current backend foundation and safety boundary
- `CATALYST_DEPLOYMENT.md` — deployment procedure
- `AGENTS.md` — engineering and domain rules


## Version 0.25

Phase 8B.2B adds auditable stock adjustments, location transfers, disposal/zero-balance closure, per-location balances and explicit consumption reversal chains. Local persisted data migrates from schema v16 to v17 without replacing existing supply or wine records.


## Version 0.26.0
Adds the unified operational register with cross-module chronology, filters and CSV export.


## Weather context

Version 0.28 retrieves current winery weather through the Catalyst function using configured coordinates. Responses are cached for 15 minutes and attributed to Open-Meteo. Weather unavailability does not block winery operations.

## Weather snapshots (0.29)
Relevant operations capture an immutable winery-weather snapshot when saved. Failed weather calls create an unavailable provenance record and never block the operation. Snapshots are shown in the operational register and included in CSV exports.

## Version 0.31.0

The harvest workspace now presents factual current conditions and a transparent 48-hour weather assessment. It labels conditions favourable, cautionary or adverse using explicit precipitation, wind and temperature thresholds and avoids recommendations when forecast data is unavailable.


### Cellar asset model

Version 0.32.0 introduces canonical vessel specifications, usable-capacity validation and occupancy derived from active vessel allocations.


## Version 0.33.0 — Campaign foundation

Campaigns now have canonical lifecycle, default selection and audit fields. Lifecycle rules live in `src/campaigns.ts`; UI delivery follows in the next sprint. Browser schema v24 migrates existing v23 campaigns without losing operational relationships.

## Version 0.34.0 — Grower master management

Adds canonical grower master management under Administration, including legal/fiscal identity, contact details, active/inactive lifecycle, duplicate validation and migration of legacy grower records to browser schema v25.

## Version 0.34.0 — Grower master management

Growers are now permanent master records under Administration, independent of campaigns. The workspace supports create/edit, activate/deactivate, searchable status views, audited updates, and duplicate code/tax-ID validation. Browser schema v25 migrates existing v24 grower identities into the richer canonical master without changing parcel or operational history.
