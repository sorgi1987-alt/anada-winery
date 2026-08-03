# Añada

Añada is a visual winery-production application for small and medium-sized Rioja wineries. It is designed for fast use in the cellar and models red, white, rosado and clarete winemaking as genuinely different processes.

## Current status

Phase 4D adds executable physical cellar movements to the completed red, white, rosado and clarete engines. Full transfers, one-to-many splits and compatible many-to-one merges now reconcile vessel capacity, residual volume and declared loss while retaining traceable lot identities and operator-attributed history. Catalyst health connectivity is live and confirms the seven normalized Development tables, but operational authority intentionally remains in the browser. There is no shared server persistence, authentication or regulatory certification yet.

Implemented views:

- Visual entry experience
- Today dashboard
- Red, white, rosado and clarete process selection
- Guided lot creation with type-specific cellar controls
- Capacity-aware vessel assignment
- Lot search and filters
- Separate red, white and rosado/clarete lot-detail experiences
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
- Visual genealogy from vineyard parcel and grape intake through wine, ageing, blend, bottling and packaging
- Searchable traceability registry with entity-type and forward/backward scope controls
- Evidence links with quantities, source documents and verification state
- Persistent recall simulations with impacted finished lots, bottling orders and source parcels
- Seed examples for wine-lot, finished-product and packaging-material investigations
- Visual reports for harvest, production, cellar capacity, laboratory, bottling and traceability
- Campaign and wine-type filters backed by current operational records
- Printable management views and client-side CSV export
- Persistent winery identity, campaign dates, harvest target and operational thresholds
- Transparent system status distinguishing local storage from deferred Catalyst, authentication and external integrations
- Confirmed demonstration-data reset with destructive-action protection
- Desktop typography calibrated for comfortable 1440p use
- Direct-press, short-maceration, saignée and traditional clarete co-fermentation routes
- Internal rosado/clarete checks for composition, weighbridge timing, colour intensity and transformation yield
- Rosado/clarete filters in lot, cellar and reporting views
- Preview state for the later sparkling-wine module
- Seven normalized Catalyst Data Store tables for wineries, wine lots, tanks, tasks, readings, activities and synchronization state
- Visual Catalyst foundation status in Administration with explicit browser-authority and remote-operation locks
- Typed frontend connection diagnostics that remain inactive until a protected read-health URL is configured
- Advanced I/O health-function scaffold with no operational reads or mutations
- Direct health endpoint contract with automatic bilingual connection diagnostics
- Exact Slate-origin CORS authorization with iframe access disabled
- API Gateway deliberately left disabled
- Executable red-wine stage controls with only contextually valid operations
- Guarded fermentation, devatting and malolactic transitions
- Free-run and press-wine volume reconciliation
- Executable white-wine controls with protected-must, pressing, settling, cool-fermentation, lees and stability operations
- White-specific turbidity, dry-density, lees-decision and conductivity-drop stage gates
- Press-fraction reconciliation with an internal 70 L/100 kg transformation-yield checkpoint
- Executable direct-press, short-maceration, saignée and traditional clarete co-fermentation routes
- Separate weighbridge evidence before clarete joint vatting
- Skin-contact and target-colour gates before rosado/clarete separation
- Route-specific volume reconciliation and protected cool-fermentation controls
- Visual cellar-movement workspace with full transfers, traceable splits and compatible merges
- Capacity, empty-vessel, compatibility, residual-volume and declared-loss validation
- Persistent source and destination vessel legs with child, merged and consumed lot identities
- Persistent operator-attributed local production history
- Explicit distinction between local attribution and authenticated electronic signatures

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
npm run test:process
npm run test:backend
npm run build
npm run preview
```

## Zoho Catalyst

Target Catalyst project:

- Project name: `Anada-Winery`
- EU project ID: `11922000000094785`
- Organisation ID: `20117369913`

The Vite production output is written to `dist/`. Catalyst client configuration should be generated through the Catalyst CLI or console rather than being guessed manually. Once the project has been initialised with the CLI, preserve its generated `catalyst.json` and client structure.

Slate hosts the frontend in the development environment. The Data Store schema is provisioned but empty. The browser targets the health-only function URL and checks it automatically when System and data opens; until the function is deployed, it honestly reports the bridge as unavailable. The versioned browser repository remains authoritative and deliberately sits behind a small interface so it can later be replaced with authenticated Catalyst access without redesigning the screens.

Do not add an operational public API merely to avoid implementing authentication. Generate Catalyst function configuration through the CLI, deploy the schema-health route behind an explicitly reviewed route/origin policy, and only then set `VITE_CATALYST_READ_API_URL`.

## Mobile direction

The responsive frontend is PWA-ready. Capacitor packaging, native permissions, offline synchronisation and mobile authentication validation belong to Phase 6 and should not be introduced earlier.

## Documentation

- `DESIGN_SYSTEM.md` — visual and interaction conventions
- `PHASES.md` — gated implementation roadmap
- `ATTRIBUTIONS.md` — demonstration imagery
- `CATALYST_SCHEMA.md` — provisioned development schema and safety boundary
- `CATALYST_DEPLOYMENT.md` — one-time Phase 3B.1 function deployment procedure
- `AGENTS.md` — durable engineering and domain rules
