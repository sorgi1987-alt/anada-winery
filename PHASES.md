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

Status: implemented in version 0.25.0.

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

Real multi-winery persistence and authentication, staged as five ordered sub-phases rather than one migration. Each is independently shippable and gates the next.

### Phase 9.1 — Winery and User foundational entities

Status: implemented in version 0.37.0.

- `Winery` and `User`/`Member` added as real domain entities with stable IDs
- `Membership` junction records role-per-winery
- `wineryId` added to every top-level collection in the browser schema
- Winery-switcher UI stub, not yet enforcing scoping
- Browser schema v27 migration preserving all v26 operational data

Completion gate: every existing collection carries a valid `wineryId`; a `User`/`Member` record exists for the current hardcoded operator; migration tests confirm no data loss.

### Phase 9.2 — Winery scoping enforcement

Status: implemented in version 0.38.0.

- Every one of the 30 operational collections is filtered by the selected winery at read time and stamped with it at write time, via a single generic mechanism (`useWineryScopedState`) rather than 120+ individually-touched call sites
- The full unscoped dataset remains the persistence source of truth; switching wineries never loses another winery's data
- The sidebar winery switcher is functional — lists every winery, switches the active scope, navigates to a safe page
- A second demo winery (`Bodega Ejemplo Dos`) with its own growers is seeded to prove isolation, sharing the same demo user across both wineries via separate `Membership` records
- `WinerySettings` remains a single shared object, not yet winery-scoped — flagged explicitly, not silently left inconsistent

Completion gate: two wineries' demo data coexist in the browser state without either being visible from the other's context; a record created while scoped to one winery is verified absent from the other after switching, both for pre-seeded and newly-created data.

### Phase 9.3 — Catalyst Schema v2 provisioning

Status: implemented in the Development environment, 10 August 2026 (no app version bump — no code changed).

- `Anada_Wineries`, `Anada_Users` and `Anada_Memberships` tables provisioned, matching `Winery`/`User`/`Membership` field-for-field. `Anada_Wineries` was rebuilt in place from its incompatible Phase 3A single-tenant column set rather than left orphaned under a new name.
- `Anada_Campaigns`, `Anada_Growers`, `Anada_Vineyards`, `Anada_VineyardParcels`, `Anada_CampaignParcelPlans`, `Anada_WineryLocations`, `Anada_Vessels` and `Anada_VesselAllocations` provisioned, matching their browser domain types field-for-field (with legacy UI-projection fields on `VineyardParcel` intentionally excluded — see `CATALYST_SCHEMA.md`).
- All 11 tables have 0 rows, no API Gateway route and no Slate client exposure, per the standing safety boundary.

Completion gate: schema v2 tables are provisioned in the Development environment and match the browser domain model field-for-field. Met — see `CATALYST_SCHEMA.md` for the full table-by-table mapping.

### Phase 9.4 — Catalyst authentication

Status: implemented in version 0.38.0, verified with a real end-to-end login, 10 August 2026.

- Real login backed by Zoho Catalyst authentication — done, via **hosted** auth (plain top-level redirect), not embedded. Embedded auth's iframe renders correctly but its OAuth handshake hangs indefinitely on this project regardless of SDK version, browser or config — a platform-side issue. Verified end-to-end with real credentials: sign in → real dashboard with the authenticated user's name shown → sign out → back to login, cleanly.
- **The app moved from Slate to Catalyst's own Web Client Hosting** (`https://anada-winery-20117369913.development.catalystserverless.eu/app/`) — the actual fix that made login work reliably. Auth cookies are scoped to the Catalyst project's own domain; Slate is a separate domain and cannot see them. See `CATALYST_SCHEMA.md` for the full diagnosis, confirmed against a sibling project in the same org with the working architecture.
- Identity resolution has a cookie-forwarding fallback (`backend/anada_data_api/identity.js`) for a credential-resolution bug in the Web SDK observed on this Zoho org — the browser now trusts the backend's `GET /whoami` as the authority, not the SDK's own session check.
- Replaces hardcoded operator attribution everywhere with the authenticated user's identity — done for every real mutation call site (`domain.ts` and all UI files); seed/historical/explicitly-decorative demo content deliberately left alone.
- The Welcome/Dashboard greeting and the Administration status tile also now show the real authenticated name (fixed a React reactivity race where a module-level getter was read one tick before the effect that updates it); remaining gendered Spanish copy ("Enóloga", "Bienvenida") switched to gender-neutral phrasing since the app has no gender data for the user.
- Role-based access aligned with `Membership` records — not yet done.

Completion gate: a user logs in, their identity is attributed on every mutation, and an unauthenticated request is rejected. Met — verified live end-to-end, including `GET /whoami` on `anada_data_api` returning 401 with no session.

### Phase 9.5 — Remote reads, then remote writes

Stage 1 and stage 2 status: implemented in version 0.38.0, verified live with real data, 10 August 2026.

- Protected API reads before any remote writes — done. `GET /me/context` resolves the caller's own winery membership and all 11 Phase 9.3 tables scoped to it; `POST /me/provision` is a one-time bootstrap write (not general write capability) that backfills the caller's existing local demo data into Catalyst on their first login, keyed off zero existing `Anada_Wineries` rows so it can only ever fire once. See `CATALYST_SCHEMA.md`'s "Phase 9.5 stage 1" section for the full design and the two real bugs (Catalyst's undocumented datetime format, a missing `ParcelID` column) only real data could surface.
- General remote writes — done, for the 5 collections the app actually has live edit UI for (campaigns, growers, vineyards, parcels, campaign-parcel plans). `POST /me/sync` writes with optimistic-concurrency conflict detection (Catalyst's own row revision, not a new column); a stale write is rejected, not silently overwritten. `Wineries`/`Users`/`Memberships`/`Locations`/`Vessels`/`VesselAllocations` stay read-only mirrors since nothing edits them live. See `CATALYST_SCHEMA.md`'s "Phase 9.5 stage 2" section.
- Server-side audit trail — partially done. Every synced write records the real authenticated user in `UpdatedBy`/`UpdatedAt` (verified live), but there's no append-only change log — only the current state, not a history of who changed what when.
- Multi-device synchronization and conflict handling — mostly done. A background sync loop (20s heartbeat + 3s post-edit debounce) pushes local edits and pulls remote changes into the running app without a reload, verified live by simulating a second device via direct authenticated API calls; the server-side conflict rejection this depends on is directly verified live. Not yet independently verified: the exact moment the running app's *own* push gets rejected and shows its conflict toast — every attempt to force that exact race during this session instead had the pull path win the race first (arguably the better outcome, but not the same observation). Worth a deliberate two-real-device test in a future session.
- Backup, restore and winery-level data separation enforced server-side — not yet done. (Every read and write is scoped to the caller's own winery membership, which is data separation in the access sense; backup/restore specifically is not built.)

Completion gate: two authorized devices can work on the same winery without lost updates, unauthorized access or ambiguous authorship. Mostly met, verified with one real device plus simulated concurrent writes rather than two genuinely separate logged-in devices — see the note above.

**Stage 3 (in progress)**: extends sync to the app's core cellar-operations collections (lots, tanks, tasks, production events, movements) one table at a time, verifying each live. `tanks` done and verified 10 August 2026 — see `CATALYST_SCHEMA.md`'s "Phase 9.5 stage 3" section, which also documents two bugs found while verifying it live: an `undefined`-vs-`null` equality gap in the sync-diff logic that had likely been causing a silent, continuous self-retrigger loop since stage 2 shipped (not tanks-specific — fixed retroactively for all synced collections), and two Phase 9.3 ID columns (`Anada_Vineyards.VineyardID`, `Anada_CampaignParcelPlans.PlanID`) that were too short for real generated ids, silently truncated during the original stage 1 bootstrap, and only surfaced as a write failure once stage 3's real sync traffic tried to write one of those rows again. Both fixed live. `tasks`/`productionEvents`/`movements`/`lots` not yet started.

## Phase 10 — Sensor pilot

- Sensor-neutral telemetry model
- Device identity, unit, calibration and quality status
- Manual reading remains first-class
- Offline buffering and duplicate handling
- One narrow temperature-monitoring integration
- Winery-configured alerts and manual acknowledgement

Completion gate: one pilot winery confirms that the integration reduces manual workload without making production dependent on sensor availability.

## Validation gate before expansion

Real multi-winery validation is not available for this project — there is no path to test with three to five Rioja wineries. That original gate is dropped as unreachable rather than left as a blocker nothing can satisfy.

In its place: do not add another broad operational module (Phase 8D, 8E) without an explicit decision from the product owner, made the same way Phase 9 was — a deliberate call, not something started by momentum. Absent real winery usage, that decision rests on internal review of the existing modules against the domain rules in `AGENTS.md`, not on field-observed unmet need.


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
