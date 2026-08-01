# Añada implementation phases

Each phase is an independently reviewable checkpoint. Do not begin the next phase without explicit approval.

## Phase 1 — Visual frontend prototype

Status: completed.

- Premium responsive application shell
- Today dashboard
- Red and white process selection
- Lot overview and detail
- Process-specific operations and measurements
- Visual cellar map
- Quick reading interaction
- Mock service boundary and Rioja seed data

## Phase 1B — Functional frontend core

Status: completed.

- Versioned browser persistence behind a repository interface
- Guided red and white lot creation
- Reception readings and process-specific configuration
- Capacity-aware vessel assignment and live occupancy
- Persistent readings, activities and task completion
- New task creation
- Demonstration-data reset

This checkpoint intentionally contains no authentication or shared backend writes.

## Phase 1C — Bilingual interface

Status: completed.

- Persistent Spanish/English selector
- Immediate language switching without reloading
- Translated navigation, dashboards, forms and preview modules
- English red and white process terminology
- Locale-aware dates and number formatting

Wine names, grape varieties, winery names and Rioja place names remain unchanged where they are proper nouns.

## Phase 2 — Complete frontend modules

Status: in progress.

### Phase 2A — Harvest planning and intake

Status: completed.

- Visual campaign progress and variety plan
- Parcel readiness and maturity samples
- Delivery schedule with operational arrival states
- Guided weighbridge and quality-control intake
- Processing-destination assignment
- Persistent parcel-to-intake traceability
- Schema migration preserving Phase 1 browser data

### Phase 2B — Laboratory and sample workflow

Status: completed.

- Priority-based sample work queue
- Traceable lot, delivery and parcel samples
- Maturity, fermentation, malolactic and pre-bottling profiles
- Guided result entry with process-aware units
- Indicative limits and review flags
- Persistent analytical history and responsible operator
- Desktop legibility pass for 1440p displays
- Schema migration preserving Phase 2A browser data

### Phase 2C — Barrel inventory and ageing

Status: completed.

- Visual barrel-room map organised by rack and position
- Physical barrel register with cooperage, origin, toast, grain and use
- Explicit wine-lot assignment, volume, fill date and planned ageing
- Lot-level ageing progress and oak-origin composition
- Topping-up, tasting, SO₂, racking, cleaning and repair operations
- Barrel attention states and next-operation agenda
- Persistent barrel and operation history with responsible operator
- Schema migration preserving Phase 2B browser data

### Phase 2D — Blending workspace

Status: completed.

- Visual formula board and candidate-lot palette
- Red and white component compatibility controls
- Percentage and target-volume formula validation
- Candidate-volume availability and approved-formula reservations
- Weighted indicative analytical profile with pH confirmation warning
- Traceable bench tastings, sensory scores and recommendations
- Approval separated from physical cellar movement
- Schema migration preserving Phase 2C browser data

Remaining Phase 2 modules:

- Bottling orders and packaging
- Traceability explorer
- Reports and administration
- Rosé/clarete frontend process

## Phase 3 — Catalyst foundation

- Generated Catalyst project/client configuration
- Authentication and winery membership
- Roles and permissions
- Data Store schema and seed strategy
- Server-side service layer
- Read-only API integration

## Phase 4 — Production process engine

- Persistent lots and vessel assignments
- Process templates and allowed transitions
- Readings, operations and work orders
- Splits, merges and blends
- Volume reconciliation
- Audit trail and electronic sign-off

## Phase 5 — Harvest and traceability

- Server-backed growers, parcels and grape deliveries
- Weights, quality checks and grape lots
- Full wine genealogy
- Bottling lots and stock movements
- Forward/backward traceability and recall simulation

## Phase 6 — Mobile and offline

- Installable PWA and offline queue
- Conflict resolution and synchronisation
- QR/barcode scanning
- Capacitor authentication validation
- iOS and Android packaging
- Push notifications

## Phase 7 — Rioja compliance and intelligence

- Vintage/campaign rule versioning
- Origin and ageing eligibility
- Yield and documentary controls
- Back-label tracking
- Production costing and forecasting
- Optional sensor integrations
