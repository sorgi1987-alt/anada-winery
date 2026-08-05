# Añada

Añada is a visual winery-operations application for small and medium wineries in La Rioja. It is designed for fast cellar use and models red, white, rosado and clarete production as distinct processes.

## Current status

Version 0.24 connects approved oenological-product lots to wine production. Each recorded use deducts physical stock atomically and creates linked inventory, production-history and traceability evidence. The former DOCa Rioja eligibility workspace remains retired.

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
