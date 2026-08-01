# Añada

Añada is a visual winery-production application for small and medium-sized Rioja wineries. It is designed for fast use in the cellar and models red and white winemaking as genuinely different processes.

## Current status

Phase 2E is a production-fidelity bilingual functional frontend. Operational data starts from realistic Rioja seed data and is persisted in the current browser. There is no shared server persistence, authentication or regulatory certification yet.

Implemented views:

- Visual entry experience
- Today dashboard
- Red/white process selection
- Guided red and white lot creation
- Capacity-aware vessel assignment
- Lot search and filters
- Separate red and white lot-detail experiences
- Process-specific contextual operations
- Responsive visual cellar map
- Persistent quick readings and activity history
- Persistent task creation and completion
- Cellar-friendly dark theme
- Local demonstration-data reset
- Persistent Spanish/English interface selector
- Translated red/white processes and operational terminology
- Visual harvest campaign overview and variety plan
- Vineyard parcel maturity and readiness cards
- Persistent grape-delivery schedule and status
- Guided intake with gross weight, tare, quality and processing destination
- Traceable parcel-to-intake relationships
- Laboratory work queue with priority and status
- Traceable samples from lots, grape deliveries and parcels
- Process-specific analysis profiles
- Persistent result entry and contextual review flags
- Visual barrel-room inventory organised by rack and position
- Barrel identity, cooperage, oak origin, toast, grain and use history
- Lot-level ageing progress, oak profile and cellar-condition overview
- Persistent topping-up, tasting, SO₂, racking and maintenance operations
- Guided barrel registration and traceable operation entry
- Barrel attention states, next actions and physical asset history
- Visual blending bench with trial formulas and component-lot cards
- Percentage and target-volume formula builder with availability validation
- Weighted analytical estimates with explicit pH confirmation warning
- Traceable bench tastings with sensory scores and recommendations
- Formula approval with component-volume reservation
- Separation between approval, reservation and physical cellar movement
- Visual bottling schedule with order status and release readiness
- Bottling orders sourced from approved blend formulas
- Six-gate wine, laboratory, stabilisation, filtration, artwork and sanitation release workflow
- Packaging bills of materials with stock and reservation validation
- Supplier-lot inventory for bottles, closures, capsules, labels, controlled Rioja back labels and cases
- Finished-product lot, bottle, reject, volume, case and yield reconciliation
- Controlled back-label series and exact used-number range tracking
- Explicit separation between internal checks and official DOCa Rioja authorisation
- Desktop typography calibrated for comfortable 1440p use
- Preview states for later modules

## Local development

Requirements: Node.js 22 or newer and npm.

```bash
npm install
npm run dev
```

Use the URL printed by Vite. The entry route is `/#/welcome`. Hash routing is intentional for reliable static-client hosting in Catalyst.

## Validation

```bash
npm run typecheck
npm run build
npm run preview
```

## Zoho Catalyst

Target Catalyst project:

- Project name: `Anada-Winery`
- EU project ID: `11922000000094785`
- Organisation ID: `20117369913`

The Vite production output is written to `dist/`. Catalyst client configuration should be generated through the Catalyst CLI or console rather than being guessed manually. Once the project has been initialised with the CLI, preserve its generated `catalyst.json` and client structure.

Slate hosts the frontend in the development environment. Catalyst Data Store and Functions are not connected yet. The versioned browser repository deliberately sits behind a small interface so it can later be replaced with authenticated Catalyst access without redesigning the screens.

## Mobile direction

The responsive frontend is PWA-ready. Capacitor packaging, native permissions, offline synchronisation and mobile authentication validation belong to Phase 6 and should not be introduced earlier.

## Documentation

- `DESIGN_SYSTEM.md` — visual and interaction conventions
- `PHASES.md` — gated implementation roadmap
- `ATTRIBUTIONS.md` — demonstration imagery
- `AGENTS.md` — durable engineering and domain rules
