# Añada

Añada is a visual winery-operations application for small and medium wineries in La Rioja. It is designed for fast cellar use and models red, white, rosado and clarete production as distinct processes.

## Current status

Version 0.23 adds the first oenological-input inventory checkpoint. The former DOCa Rioja eligibility workspace remains retired. Denomination claims are not assessed or certified by Añada; the application focuses on recording what physically enters the winery, what operations are performed, what materials are consumed and what finished lots are produced.

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
- Traceability is not yet generated automatically from every mutation.
- Packaging and oenological-product receipt inventory are implemented.
- Oenological-product consumption is not yet connected to production additions.
- No screen represents regulatory certification or an official submission.

## Next checkpoint

Phase 8B.2 will connect approved input lots to wine additions, deduct stock atomically and create backward/forward traceability evidence.

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
