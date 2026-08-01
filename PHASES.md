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

Status: completed.

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

### Phase 2E — Bottling orders and packaging

Status: completed.

- Visual bottling-line schedule and operational order board
- Orders linked to approved blending formulas
- Wine, laboratory, stabilisation, filtration, artwork and line-sanitation release gates
- Bottle-format and packaging bill-of-material configuration
- Supplier-lot stock, operating allowance and material reservations
- Controlled DOCa Rioja contraetiqueta/precinta series tracking
- Finished-product lot, good bottle, reject, case, volume and yield reconciliation
- Exact used back-label number range retained with each completed run
- Internal regulatory checks clearly separated from official authorisation
- Schema migration preserving Phase 2D browser data

### Phase 2F — Traceability explorer and recall simulations

Status: completed.

- Visual genealogy across vineyard, intake, wine, ageing, blend, bottling and packaging
- Searchable entity registry with Rioja and internal identifiers
- Evidence links with quantities, document references and verification state
- Backward origin tracing and forward affected-product tracing
- Guided recall simulations for wine and packaging-material investigations
- Impact summaries for finished lots, bottling orders and source parcels
- Persistent simulation history without changing operational or regulatory state
- Schema migration preserving Phase 2E browser data

### Phase 2G — Reports and administration

Status: completed.

- Campaign and wine-type reporting filters
- Harvest, production, vessel, laboratory, bottling and traceability indicators
- Visual intake, volume, stage, quality and documentary-coverage reporting
- Operational attention board derived from current records
- Client-side CSV export and printable management view
- Persistent winery identity, campaign and operational-threshold configuration
- Honest integration status for browser storage, Catalyst, authentication and external systems
- Protected demonstration-data reset
- Schema migration preserving Phase 2F browser data

### Phase 2H — Rosado and clarete production

Status: completed.

- Four distinct routes: direct press, short skin maceration, saignée and traditional clarete co-fermentation
- Composition, separate-weighing, press-fraction, protection, skin-contact, turbidity and colour-intensity controls
- Internal DOCa eligibility checks for minimum red-grape percentage, mixing point, colour range and transformation yield
- Guided rosado/clarete lot creation with process-specific stages and opening tasks
- Dedicated lot detail, cellar, search and reporting experiences
- Bilingual operational terminology and large-screen legibility pass
- Schema migration preserving Phase 2G browser data and introducing a process-detailed clarete example

## Phase 3 — Catalyst foundation

### Phase 3A — Data foundation

Status: completed.

- Seven normalized, empty Development Data Store tables
- Stable schema IDs and documented application-column contract
- Typed frontend Catalyst configuration boundary
- Visual backend-readiness and connection status in Administration
- Advanced I/O schema-health function scaffold
- Browser repository retained as the only operational authority
- No public operational reads, remote writes, authentication or user data

### Phase 3B.1 — Health connectivity

Status: deployment prepared.

- Exact Slate hostname authorized for CORS; iframe disabled
- API Gateway retained in its disabled state
- Direct Advanced I/O schema-health route package
- Strict browser validation of schema version, table count and write lock
- Automatic bilingual connection diagnostics in Administration
- No operational records, seed data, authentication or mutations

Completion gate: deploy the CLI-generated `anada_data_api` function and verify a ready response from Slate.

### Phase 3B.2 — Protected read integration

- Authentication and winery membership
- Roles and permissions
- Idempotent seed/migration strategy
- Authenticated read-only bootstrap API
- Browser fallback and migration rehearsal

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
