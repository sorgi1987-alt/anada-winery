# Añada implementation roadmap

The roadmap is organized around auditable winery operations and general legal-record support. Denomination-specific qualification or certification is out of scope until the operational evidence model is complete and independently validated.

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

Status: completed in version 0.22.

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

Status: deployment prepared for version 0.23.

- Visual bilingual supply workspace with product lots, product masters and suppliers
- Separate product, supplier and physical supplier-lot identities
- Yeast, nutrient, enzyme, sulphur, acid, fining, stabilisation, filtration and cleaning categories
- Receipt date, quantity, unit, expiry, storage location and certificate reference
- Quarantine by default with explicit release, rejection and recall actions
- Attributed receipt and status transactions retained without rewriting prior events
- Duplicate supplier-lot, blocked-supplier, unit and expiry validation
- Schema v16 migration preserving version 0.22 wine records and adding supply registers

### Phase 8B.2 — Consumption and wine-lot traceability

- Receipt, release, consumption, adjustment, transfer and disposal transactions
- Addition to wine lot with product lot, dosage, target volume, stage, operator and timestamp
- Atomic inventory deduction and insufficient/expired/quarantined-stock guards
- Forward trace from product lot to wine and finished lots; backward trace from wine lot to every input lot

Completion gate: receive a yeast lot, approve it, consume part of it in fermentation, reconcile stock and find every affected wine lot in both traceability directions.

## Phase 8C — Unified operational register and genealogy

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
