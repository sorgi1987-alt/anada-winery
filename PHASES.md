# Añada implementation roadmap

The roadmap is organized around auditable winery operations and general legal-record support. Denomination-specific qualification or certification is out of scope until the operational evidence model is complete and independently validated.

## Status vocabulary

Every phase below carries exactly one of two statuses:

- **Implemented in version X** — the capability is built, wired into the UI and available to users as of that shipped version.
- **Prepared for version X** — the underlying domain logic, data model or migration exists, but UI exposure (or full UI replacement) is deferred to a later version.

## Completed foundation — versions 0.1 to 0.21

- Premium responsive React interface and bilingual navigation
- Harvest, lots, cellar, tasks, laboratory, ageing, blending and bottling views
- Distinct red, white, rosado and clarete process templates
- Executable process operations and guarded stage transitions
- Reconciled cellar transfers, splits and merges
- Packaging lots, bottling release gates and finished-run reconciliation
- Traceability registry, recall simulations, reports, PWA and QR scanner
- Catalyst Data Store schema and health-only function boundary
- Historical DOCa Rioja eligibility prototype, preserved in Git history at version 0.21

## Phase 8A — Operational scope reset

Status: implemented in version 0.22.

- Remove the DOCa Rioja route, navigation and eligibility engines
- Remove denomination-specific decisions from bottling
- Convert controlled label numbering into optional generic packaging evidence
- Replace hard-coded denomination thresholds with winery-configured process targets and physical reconciliation
- Preserve version 0.21 browser records through schema v15 migration
- Recalibrate documentation and tests around the legal operational core

Completion gate: no active route, screen, domain type or production rule claims DOCa eligibility; existing v14 data migrates without losing bottling or packaging history; the full validation suite passes.

## Phase 8B — Suppliers and oenological products

Build the first legally meaningful input-to-wine traceability slice.

### Phase 8B.1 — Receipt, quarantine and release

Status: implemented in version 0.23.

- Visual bilingual supply workspace with styled segmented navigation and creation workflows for product and supplier masters
- Separate product, supplier and physical supplier-lot identities
- Yeast, nutrient, enzyme, sulphur, acid, fining, stabilisation, filtration and cleaning categories
- Receipt date, quantity, unit, expiry, storage location and certificate reference
- Quarantine by default with explicit release, rejection and recall actions
- Attributed receipt and status transactions retained without rewriting prior events
- Duplicate supplier-lot, blocked-supplier, unit and expiry validation
- Schema v16 migration preserving version 0.22 wine records and adding supply registers

### Phase 8B.2A — Consumption and wine-lot traceability

Status: implemented in version 0.24.

- Addition to an active wine lot with physical product lot, quantity, stage, operator and timestamp
- Atomic inventory deduction and insufficient/expired/quarantined-stock guards
- Inventory transaction and production event joined by immutable identifiers
- Forward trace from product lot to wine; backward trace from wine lot to every consumed input lot
- Legacy untracked addition actions removed from active process menus while preserving historical events

Completion gate: receive a yeast lot, approve it, consume part of it in fermentation, reconcile stock and find every affected wine lot in both traceability directions.

### Phase 8B.2B — Stock corrections and location control

- Attributed quantity adjustments with mandatory reasons
- Storage-location transfers without changing ownership or product identity
- Disposal and stock-zero closure events
- Consumption corrections by explicit reversal and replacement, never silent overwrite

## Phase 8C — Unified operational register and genealogy

### Phase 8C.1 — Unified operational register

Status: implemented in version 0.26.0.

- Read-only unified chronology across intake, production, movements, supplies, ageing and bottling
- Standard event identity, performed/recorded timestamps, operator, quantities, locations and references
- Filters by category, date and free-text record identity
- Daily or filtered CSV export
- Schema v18 migration preserving all v17 operational data
- Immutable event identity and correction/supersession records
- Consistent operator, performed-at and recorded-at attribution
- Automatic genealogy for intake, additions, movements, blending and bottling
- Source and destination quantities with explicit losses
- Supporting-document references
- Daily operation-register export
- Correction workflow that never silently overwrites history

Completion gate: a finished lot reconstructs its complete history from actual transactions without seeded traceability links.

## Phase 8D — HACCP, sanitation and equipment

- Configurable winery control points and limits
- Monitoring records, deviations and corrective actions
- Tank and bottling-line sanitation
- Equipment, measuring instrument and calibration history
- Verification responsibility and attachments
- Due and overdue tasks generated from control plans

Completion gate: record a failed sanitation or calibration check, document corrective action and retain the complete review trail.

## Phase 8E — Stock closing and reporting

- Wine stock by product category and physical location
- Production, entry, withdrawal and adjustment totals
- Period closing and discrepancy reconciliation
- INFOVI-oriented preparation export without automatic submission
- Ingredient, allergen and nutrition evidence dossier for bottling
- Audit-ready CSV and printable registers

Completion gate: reconcile one reporting period from operational transactions and produce a reviewable export without manual spreadsheet reconstruction.

## Phase 9 — Shared production infrastructure

- Catalyst operational persistence
- Authentication, winery membership and roles
- Protected API reads and writes
- Server-side audit trail
- Multi-device synchronization and conflict handling
- Backup, restore and winery-level data separation

Completion gate: two authorized devices can work on the same winery without lost updates, unauthorized access or ambiguous authorship.

## Phase 10 — Sensor pilot

- Sensor-neutral telemetry model
- Device identity, unit, calibration and quality status
- Manual reading remains first-class
- Offline buffering and duplicate handling
- One narrow temperature-monitoring integration
- Winery-configured alerts and manual acknowledgement

Completion gate: one pilot winery confirms that the integration reduces manual workload without making production dependent on sensor availability.

## Validation gate before expansion

Test with three to five Rioja wineries using real or anonymized records. Prioritize grape intake, fermentation, product addition, movement, analysis, bottling and recall. Do not add another broad module unless the same unmet need is independently observed in multiple wineries.


### Phase 8C.3 — Winery weather context

Status: implemented in version 0.28.0.

- Winery latitude and longitude configuration
- Catalyst weather proxy backed by Open-Meteo
- Fifteen-minute server-side cache with stale fallback
- Live temperature, condition, wind and precipitation in harvest planning
- Source and last-refresh attribution
- Weather failure never blocks operational workflows

### Phase 8C.4 — Weather snapshots and operational context

Status: implemented in version 0.29.0.

- Immutable weather snapshots linked to grape receipts, production events, wine movements and bottling operations
- Live, cached and unavailable provenance states retained without blocking operations
- Temperature, humidity, wind and precipitation exposed in the operational register and CSV export
- Winery coordinates and observation timestamps preserved with every snapshot
- Schema v21 migration preserving all v20 operational data

### Phase 8C.5 — Forecast-backed harvest context

Status: implemented in version 0.31.0.

- Replaced promotional harvest copy with an operational conditions summary.
- Added a transparent 48-hour assessment based on forecast precipitation, peak wind and peak temperature.
- The app does not issue an assessment when forecast evidence is unavailable.
- Current-day intake metrics now use the winery-local calendar date rather than a seeded date.


## Phase 9A.1 — Canonical masters and relationship integrity

Status: implemented in version 0.31.0.

- Campaign, grower, controlled-location and vessel masters
- Stable parcel-to-grower and parcel-to-location references
- Delivery campaign and grower references
- Historical vineyard samples separated from the latest parcel summary
- Vessel allocations separated from tank occupancy display fields
- Schema v22 migration preserving existing operational and supply master data
- Relationship-integrity validation and migration tests

Completion gate: all current parcels, deliveries, vineyard samples and active vessel allocations resolve to valid canonical records without changing existing user workflows.


### Phase 9B.1 — Cellar asset normalization

Status: implemented in version 0.36.0.

- Canonical vessel specifications and derived occupancy established in version 0.32.0
- Usable capacity is configurable per vessel, independent of nominal capacity, editable from the cellar map vessel detail
- New-lot assignment, transfers, splits and merges all validate against usable capacity, not nominal capacity
- The canonical `Vessel`/`VesselAllocation` model remains a load-only snapshot; the live production engine continues to operate on the tank model directly, now carrying real usable-capacity data rather than the tank UI being fully unified with the canonical model — that unification is a separate, larger undertaking

Completion gate: a vessel's usable capacity can be set below its nominal capacity, reducing it below the currently allocated volume is rejected, and every assignment or movement into that vessel is blocked once it would exceed the usable capacity.


## Phase 10A.1 — Campaign foundation

Status: implemented in version 0.33.0.

- Canonical campaign lifecycle fields and audit attribution
- Create, activate, close, reopen and archive domain operations
- Single active and single default campaign invariants, enforced as separate rules
- Closure blockers for active lots, pending deliveries and unfinished bottling
- Browser schema v24 migration preserving v23 campaign relationships
- Campaign workspace under Administration (`/admin/campaigns`) exposing every lifecycle operation, with Spanish and English at parity

Completion gate: create a campaign, activate it, attempt an invalid close and see it blocked, archive it.

## Phase 10A.2 — Grower master management

Status: implemented in version 0.34.0.

- Permanent grower CRUD workspace under Administration, independent of campaign records
- Legal/trade identity, grower type, tax ID, contact and address master data
- Active/inactive lifecycle without destructive deletion, with attributed updates
- Unique grower code and normalized tax-ID validation, rejecting duplicates
- Existing parcel relationships retained through stable `growerId`
- Schema v25 migration enriches legacy grower records without duplicating them, preserving v24 operational history

Completion gate: create and edit a grower, reject duplicate fiscal identity, deactivate/reactivate it, and retain every existing parcel relationship through migration.

## Phase 10A.3 — Vineyard and parcel master management

Status: implemented in version 0.35.0.

- `Grower -> Vineyard -> Parcel` as permanent, campaign-independent master data
- `Campaign -> CampaignParcelPlan -> Parcel` for campaign-specific planning, separating expected yield, harvest window and readiness from the parcel master
- Permanent vineyard-estate CRUD linked to growers, and permanent parcel CRUD with agronomic identity and grower/vineyard ownership validation
- Administration workspace at `/admin/vineyards` and `/admin/parcels`, matching the grower workspace pattern, with Spanish and English at parity
- Harvest scoped to the active/default campaign through `CampaignParcelPlan`; intake registration disabled when no campaign is active
- Browser schema v26 migration derives vineyards and campaign-parcel plans from every existing `parcel.campaignId`; parcel IDs and `growerId`/`locationId` relationships are never regenerated; `parcel.campaignId` is deprecated, not deleted; legacy parcels with no campaign reference are tolerated

Completion gate: every existing parcel resolves to a valid grower and location; every former `parcel.campaignId` value is represented as a `CampaignParcelPlan`; no operational history changes.
