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

Status: completed.

- Exact Slate hostname authorized for CORS; iframe disabled
- API Gateway retained in its disabled state
- Direct Advanced I/O schema-health route package
- Strict browser validation of schema version, table count and write lock
- Automatic bilingual connection diagnostics in Administration
- No operational records, seed data, authentication or mutations

Completion gate passed: the deployed `anada_data_api` route returns `ready`, confirms all seven tables and retains the remote-write lock.

### Phase 3B.2 — Protected read integration

- Authentication and winery membership
- Roles and permissions
- Idempotent seed/migration strategy
- Authenticated read-only bootstrap API
- Browser fallback and migration rehearsal

## Phase 4 — Production process engine

### Phase 4A — Executable red-wine process

Status: completed.

- Persistent browser-local production events and schema migration
- Red-stage operation matrix that excludes white and rosado actions
- Selection, vatting, pump-over, punch-down, control, addition, sampling, devatting, racking, malolactic and SO₂ operations
- Density-gated completion of alcoholic fermentation
- Free-run and press-wine reconciliation without volume creation
- Malic-acid gate before moving from malolactic fermentation
- Guarded, sequential stage transitions and automatic next tasks
- Operator-attributed local audit history with explicit non-authenticated status
- Quick cellar readings mirrored into the red process history and transition gate
- Cellar-friendly operation sheet and bilingual process controls

Completion gate passed: a quick density reading is retained in process history and unlocks the guarded transition on the demonstration red lot.

### Phase 4B — Executable white-wine process

Status: completed.

- Independent white-stage operation matrix with no red cap-management actions
- Reception control, must protection, pressing fractions, turbidity, clean-must racking, inoculation, cool-fermentation controls, sampling, bâtonnage, lees tasting and tartaric-stability checks
- Internal press-yield checkpoint capped at 70 L/100 kg of received grapes
- Settling gate requiring both configured turbidity and reconciled clean-must racking
- Density-gated completion of cool alcoholic fermentation
- Explicit continue, complete or skip decision for the optional lees stage
- Internal conductivity-drop checkpoint before filtration and bottling
- Quick cellar readings mirrored into white process history and the fermentation gate
- Bilingual, cellar-friendly visual controls and attributed browser-local history
- Schema migration preserving Phase 4A events and adding the white demonstration history only when absent

Completion gate passed: a density of 0.994 is retained in the white process history and unlocks the optional lees stage on `B-26-006`.

### Phase 4C — Executable rosado and clarete processes

Status: completed.

- Four independent executable routes: direct press, short skin maceration, saignée and traditional clarete co-fermentation
- Route-and-stage operation matrices that prevent red or white operations leaking into rosado work
- Composition and colour-target controls retained with each lot
- Separate source weights and post-weighbridge mixing required before traditional clarete joint vatting
- Planned skin-contact and target-colour gates before short-maceration or co-fermentation separation
- Direct-press, saignée and fraction-separation volume reconciliation without volume creation
- Internal transformation-yield checkpoint capped at 70 L/100 kg of received grapes
- Rosado-specific settling, cool-fermentation, optional lees and stability gates where present in the selected route
- Bilingual visual route identity, operation sheets and attributed browser-local history
- Schema migration preserving completed red and white process histories

Completion gate passed: `R-26-003` retains its colour and skin-contact evidence and advances through the guarded clarete separation route.

### Phase 4D — Reconciled cellar movements

Status: completed.

- Dedicated bilingual, visual cellar-movement workspace designed for desktop and touch use
- Full-lot transfers that atomically clear the source vessel and fill an empty destination
- One-to-many splits with new traceable child-lot identities and optional residual source volume
- Many-to-one merges with a new combined-lot identity and weighted temperature and density
- Compatibility gates for wine type, vintage, current process stage and rosado route
- Empty-destination, unique-vessel and vessel-capacity validation before inventory changes
- Explicit source, received, residual and declared-loss reconciliation without volume creation
- Persistent operator, operation time, notes, vessel legs and loss percentage in browser-local audit history
- Consumed source identities retained for historical traceability but excluded from active operational views
- Four clean reserve vats appended non-destructively when an existing demonstration cellar has no movement capacity
- Clear unavailable-state guidance when a movement lacks the required empty destinations
- Schema migration preserving all Phase 4C process history and adding movement history only when absent

Completion gate passed: movement destinations are available after the non-destructive reserve-vat migration and physical operations reconcile source, destination, residual volume and loss.

### Later Phase 4 checkpoints

- Authenticated audit trail and electronic sign-off after access control is enabled

## Phase 5 — Harvest and traceability

- Server-backed growers, parcels and grape deliveries
- Weights, quality checks and grape lots
- Full wine genealogy
- Bottling lots and stock movements
- Forward/backward traceability and recall simulation

## Phase 6 — Mobile and offline

Phase 6A is intentionally advanced ahead of the authenticated Phase 5 backend work so the existing browser-authoritative application can be installed and used safely in low-connectivity cellar conditions.

### Phase 6A — Installable PWA and offline shell

Status: deployment prepared.

- Standalone PWA manifest with branded 192 px, 512 px, maskable and Apple touch icons
- Direct shortcuts to Today, Cellar, Movements, Tasks and Scanner
- Versioned service-worker cache generated from every production application chunk
- Offline navigation fallback and runtime caching for representative images and fonts
- Cache replacement with an explicit in-app update action
- Online/offline indicator in the persistent cellar header
- Clear offline banner confirming that changes remain on the current device
- Install action where the browser exposes it and bilingual manual iOS installation guidance
- Visual PWA readiness, installation, cache and connectivity controls in Administration
- Service worker restricted to GET navigation and static assets; operational mutations are never intercepted
- Authentication, background synchronization, conflict resolution and remote writes remain deferred

Completion gate: deploy through Slate, open Añada once while online, install it from Chrome/Edge or add it to the iOS home screen, then disable connectivity and confirm that Today, Cellar and Movements reopen while a local reading remains available after restarting the installed app.

- Authenticated offline synchronization queue
- Conflict resolution and synchronisation
### Phase 6B — Cellar QR scanner and physical labels

Status: deployment prepared.

- Dedicated touch-first Scanner route and persistent mobile centre action
- Explicit camera activation with rear-camera preference and native QR/barcode recognition where the browser supports it
- Always-available manual identifier entry for unsupported cameras, denied permissions and damaged labels
- Deterministic `ANADA:<ENTITY-TYPE>:<CODE>` label contract, with exact typed matching and no silent guessing
- Searchable local registry for wine lots, vessels, barrels, vineyard parcels, grape deliveries and bottling orders
- Clear unknown and ambiguous-code states requiring the operator to select a record
- Contextual actions to open the record, capture a lot reading, start a movement, inspect traceability or prepare a replacement label
- Multi-select printable QR-label workspace with physical 86 × 54 mm label layouts
- Scanner registry and generated QR-image tests
- Browser-local and offline-safe lookup; no claim of server synchronisation or authenticated identity

Completion gate: deploy through Slate, confirm version 0.19.1, generate and print at least one label, scan it in Chrome on the Pixel and verify the exact record opens. Then disable connectivity and confirm manual identifier lookup still works. Where native camera recognition is unavailable, confirm the interface explains the manual fallback instead of presenting a false success state.

- Authenticated scanner events and server-side asset resolution
- Capacitor authentication validation
- iOS and Android packaging
- Push notifications

## Phase 7 — Rioja compliance and intelligence

### Phase 7A — Versioned ageing eligibility

Status: deployment prepared.

- Explicit internal rule-set version `DOCa-RIOJA-2025-08`, reviewed on 3 August 2026
- Traceable official sources for DOCa Rioja ageing classification and minimum alcoholic strength changes
- Separate rules for red and white/rosé wines
- Generic, Crianza, Reserva and Gran Reserva thresholds for alcoholic strength, total ageing, oak, bottle and 225 L barrel evidence where applicable
- Three-state assessment: internally eligible, blocked by a known value, or incomplete because evidence is absent
- Visual bottling-portfolio view exposing protected mentions whose evidence is not yet linked
- Interactive planning checker and bilingual ageing matrix
- Responsive cellar and mobile presentation
- Explicit statement that internal checks do not replace the current specification, official qualification or Regulatory Council certification
- No authenticated approvals, official submissions or server-side evidence in this checkpoint

Completion gate: deploy version 0.20, open DOCa Rioja from the sidebar, verify the three bottling orders appear, run one passing and one blocked Crianza assessment, switch the matrix between red and white, and confirm the interface never describes an internal result as officially certified.

### Phase 7B — Versioned origin eligibility

Status: deployment prepared.

- Explicit origin rule-set version `DOCa-RIOJA-ORIGIN-2026-08`, reviewed on 3 August 2026
- Direct official sources for DOCa Rioja, Vino de Zona, Vino de Pueblo and Viñedo Singular
- Separate provenance, winery-operation and documentary evidence groups
- DOCa Rioja checks for authorised grapes, Rioja origin, in-region processing, qualification, traceability and guarantee seals
- Vino de Zona and Vino de Pueblo controls for 85–100% declared origin and a maximum 15% neighbouring-municipality exception
- Zone-specific ten-year linkage evidence when the neighbouring-origin exception is used
- Viñedo Singular controls for exclusive parcel origin, same-winery processing, vineyard age, manual harvest, exclusive tenure, crop yield, 65% transformation yield, double tasting, prior declaration, grower card, specific back label and exclusive brand
- Distinct maximum vineyard yields for red and white/rosé Viñedo Singular candidates
- Bottling-portfolio actions to assess ageing and origin independently
- Mobile-friendly numeric evidence and Pending / Yes / No controls
- Passing examples for each origin figure without pre-filling actual operational evidence
- Internal eligible, blocked and incomplete states; never official certification

Completion gate: deploy version 0.21, open DOCa Rioja → Origin, load the complete examples for Vino de Zona and Viñedo Singular, confirm both pass, then reduce the Zone linkage to 9 years and increase a red Viñedo Singular yield above 5,000 kg/ha to confirm each blocks. Open an origin assessment from a bottling-order card and verify it starts with evidence incomplete.

- Vintage/campaign rule versioning and annual campaign controls
- Yield and documentary controls
- Back-label tracking
- Production costing and forecasting
- Optional sensor integrations
