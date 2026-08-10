# Catalyst Data Store schema — Phase 3A

Environment: Development, EU project `11922000000094785` (`Anada-Winery`). Schema version: 1.

The schema was provisioned on 1 August 2026. Tables are global and server-controlled. They contain no seed rows, grant no browser write authority, and do not change the versioned browser repository used by the deployed frontend.

| Table | ID | Application columns |
| --- | --- | --- |
| `Anada_Wineries` | `11922000000093921` | `WineryID`, `DisplayName`, `LegalName`, `RegistryCode`, `Municipality`, `Province`, `Designation`, `Timezone`, `CampaignYear`, `SchemaVersion`, `UpdatedAt` |
| `Anada_WineLots` | `11922000000096178` | `LotID`, `WineryID`, `Name`, `WineType`, `Varieties`, `Origin`, `Vintage`, `VolumeLitres`, `VesselID`, `Stage`, `Progress`, `Attention`, `NextAction`, `NextTime`, `ProcessJSON`, `ProductionJSON`, `UpdatedAt` |
| `Anada_Tanks` | `11922000000094860` | `TankID`, `WineryID`, `CapacityLitres`, `VolumeLitres`, `LotID`, `WineType`, `Stage`, `TemperatureC`, `Attention`, `UpdatedAt` |
| `Anada_Tasks` | `11922000000095587` | `TaskID`, `WineryID`, `LotID`, `Title`, `TaskDueAt`, `AssignedTo`, `TaskPriority`, `CompletionState`, `AppUpdatedAt` |
| `Anada_Readings` | `11922000000097280` | `ReadingID`, `WineryID`, `LotID`, `RecordedAt`, `Label`, `TemperatureC`, `Density`, `VolumeLitres`, `Note` |
| `Anada_Activities` | `11922000000096537` | `ActivityID`, `WineryID`, `LotID`, `Title`, `Person`, `Detail`, `RecordedAt` |
| `Anada_SyncState` | `11922000000098219` | `SyncKey`, `WineryID`, `Resource`, `Revision`, `LastReadAt`, `LastWriteAt`, `Status`, `Message` |

Catalyst also manages `ROWID`, `CREATORID`, `CREATEDTIME` and `MODIFIEDTIME` on every table.

## Planned supply registers (not provisioned)

Version 0.23 keeps these records as separate collections in the browser repository. When authenticated synchronization is enabled, they should map to four separate winery-scoped tables rather than one combined inventory table:

| Planned table | Purpose |
| --- | --- |
| `Anada_Suppliers` | Supplier identity, fiscal ID, contact, status and approval metadata |
| `Anada_ProductMasters` | Reusable commercial product definition, category, manufacturer, unit and document references |
| `Anada_ProductLots` | One physical supplier lot, receipt, expiry, location, release status and current quantity |
| `Anada_ProductStockTransactions` | Append-only receipt, release, rejection, recall, adjustment, transfer, consumption and disposal events |

These tables must not be exposed to the Slate client until winery membership, role checks, audit attribution and conflict handling are in place.

## Safety boundary

- Browser persistence remains authoritative during Phase 3B.1.
- No browser bundle contains Catalyst credentials.
- No operational Data Store rows are publicly readable.
- No server or browser mutation endpoint exists.
- Authentication, winery membership and roles remain deferred by product decision.
- Later migrations must be idempotent, versioned and auditable; destructive schema changes require a backup and an explicit checkpoint.

## Next integration gate

The authorized CORS hostname is `anada-winery-web-ucfcgorv.onslate.eu` (configuration ID `11922000000096932`); CORS is enabled and iframe access is disabled. API Gateway remains disabled.

Deploy the `anada_data_api` health route using the CLI-generated function configuration and verify the Slate-origin connection check. Authenticated membership is still required before exposing operational reads. Remote writes only follow after audit attribution and conflict policy are implemented.


## Weather proxy

`GET /weather?latitude=<lat>&longitude=<lon>&timezone=<iana>` returns current conditions from Open-Meteo. The Catalyst function validates coordinates, caches responses for 15 minutes and may return the last cached response when the upstream service is unavailable.

## Schema v21 — operational weather snapshots
The browser state includes `weatherSnapshots`, immutable records linked to grape deliveries, production events, wine movements and bottling orders. Each record stores coordinates, capture/observation timestamps, source, provenance status and available weather measurements.


## Browser schema v22 canonical relationship layer

The local domain now includes canonical masters for campaigns, growers, controlled winery locations and vessels, plus historical vineyard samples and vessel allocations. These records are not yet persisted in Catalyst tables; they define the target foreign-key structure for Catalyst Schema v2.

Authoritative relationships:

- `VineyardParcel.growerId -> Grower.id`
- `VineyardParcel.locationId -> WineryLocation.id`
- `VineyardParcel.campaignId -> Campaign.id`
- `GrapeDelivery.parcelId -> VineyardParcel.id`
- `GrapeDelivery.growerId -> Grower.id`
- `VineyardSampleRecord.parcelId -> VineyardParcel.id`
- `Vessel.locationId -> WineryLocation.id`
- `VesselAllocation.vesselId -> Vessel.id`
- `VesselAllocation.wineLotId -> WineLot.id`

Legacy labels remain temporary UI projections and must not become independently editable once the canonical masters are exposed.


## Browser schema v23 — Cellar assets

Vessels now include material, nominal and usable capacity, location, equipment capabilities and operational status. Vessel allocations remain the authoritative occupancy relationship.


## Browser schema v24 — Campaign lifecycle

`campaigns` is the authoritative campaign master. Required fields include `id`, `code`, `name`, `vintage`, `status`, `startsAt`, `isDefault`, audit timestamps and audit users. Operational records continue to reference `campaignId`.

### Growers (planned Catalyst Schema v2 master)

Browser schema v25 treats growers as permanent master data. Future Catalyst persistence should expose one `Growers` table keyed by immutable `id`, with unique `code` and optional unique normalized `taxId`. Parcels and grape receptions should store the grower row ID rather than duplicated legal-name text.

## Browser schema v25 — Grower master management

Schema v25 enriches `Grower` as a permanent master record with legal/trade identity, grower type, fiscal identity, contact/address fields, status and audit attribution. Growers remain campaign-independent. Parcels and deliveries continue to reference growers by stable `growerId`. This browser model is the target structure for the future Catalyst Schema v2 grower table.

## Browser schema v26 — vineyard master separation

The browser model now contains `vineyards` (permanent Grower → VineyardEstate master data) and `campaignParcels` (Campaign ↔ Parcel planning junctions). Parcel agronomic identity is permanent; expected yield, harvest readiness and campaign inclusion belong to `campaignParcels`. These collections are currently browser-local and are candidates for dedicated Catalyst tables in the remote persistence milestone.

## Browser schema v27 — Winery and User foundational entities (Phase 9.1)

The browser model now contains `wineries`, `users` and `memberships` (a Winery ↔ User role junction), and every other top-level collection carries a `wineryId` foreign key. As of Phase 9.2, this scoping is enforced in the browser app itself: every page reads a winery-filtered projection and every mutation stamps the active winery, with a functional switcher and a second demo winery proving isolation.

Authoritative relationships:

- `Membership.wineryId -> Winery.id`
- `Membership.userId -> User.id`
- every operational collection's `wineryId -> Winery.id`

## Catalyst Schema v2 — Phase 9.3 provisioning

Provisioned 7–10 August 2026 in the Development environment. Structure only: every table below has 0 rows, no API Gateway route, and no Slate client exposure. This does not change what the deployed frontend reads or writes — browser persistence remains authoritative until Phase 9.5.

`Anada_Wineries` was **rebuilt in place** rather than left alongside a new table, since it already existed from Phase 3A as a single-tenant config row (`RegistryCode`, `CampaignYear`, `SchemaVersion` — none present in the multi-tenant `Winery` domain type) and held 0 rows. `RegistryCode`/`CampaignYear`/`SchemaVersion` were dropped and `DisplayName` was renamed to `Name`; everything else was added.

| Table | ID | Application columns |
| --- | --- | --- |
| `Anada_Wineries` | `11922000000093921` | `WineryID`, `Code`, `Name`, `LegalName`, `Municipality`, `Province`, `Designation`, `Timezone`, `Status`, `Notes`, `CreatedAt`, `UpdatedAt`, `CreatedBy`, `UpdatedBy` |
| `Anada_Users` | `11922000000124065` | `UserID`, `Name`, `Email`, `Status`, `CreatedAt`, `UpdatedAt`, `CreatedBy`, `UpdatedBy` |
| `Anada_Memberships` | `11922000000127104` | `MembershipID`, `WineryID`, `UserID`, `Role`, `Status`, `CreatedAt`, `UpdatedAt`, `CreatedBy`, `UpdatedBy` |
| `Anada_Campaigns` | `11922000000126495` | `CampaignID`, `WineryID`, `Code`, `Name`, `Vintage`, `Status`, `StartsAt`, `ExpectedHarvestStart`, `ExpectedEndAt`, `ClosedAt`, `IsDefault`, `Notes`, `CreatedAt`, `UpdatedAt`, `CreatedBy`, `UpdatedBy`, `ReopenedAt`, `ReopenedBy` |
| `Anada_Growers` | `11922000000124478` | `GrowerID`, `WineryID`, `Code`, `Name`, `LegalName`, `TradeName`, `GrowerType`, `TaxID`, `ContactName`, `Email`, `Phone`, `Address`, `Municipality`, `Province`, `Country`, `Status`, `Notes`, `CreatedAt`, `UpdatedAt`, `CreatedBy`, `UpdatedBy` |
| `Anada_Vineyards` | `11922000000124837` | `VineyardID`, `WineryID`, `Code`, `Name`, `GrowerID`, `Municipality`, `Province`, `Country`, `LocationID`, `Status`, `Notes`, `CreatedAt`, `UpdatedAt`, `CreatedBy`, `UpdatedBy` |
| `Anada_VineyardParcels` | `11922000000127505` | `ParcelID`, `WineryID`, `Code`, `Name`, `GrowerID`, `LocationID`, `CampaignID`, `EstateID`, `Varieties`, `Hectares`, `Status`, `Clone`, `Rootstock`, `PlantingYear`, `TrainingSystem`, `Irrigation`, `AltitudeM`, `Orientation`, `Organic`, `Latitude`, `Longitude`, `Notes`, `CreatedAt`, `UpdatedAt`, `CreatedBy`, `UpdatedBy` |
| `Anada_CampaignParcelPlans` | `11922000000126860` | `PlanID`, `WineryID`, `CampaignID`, `ParcelID`, `ExpectedKg`, `ExpectedHarvestDate`, `HarvestWindow`, `Status`, `Notes`, `CreatedAt`, `UpdatedAt`, `CreatedBy`, `UpdatedBy` |
| `Anada_WineryLocations` | `11922000000129220` | `LocationID`, `WineryID`, `Code`, `Name`, `Type`, `ParentLocationID`, `Active` |
| `Anada_Vessels` | `11922000000128244` | `VesselID`, `WineryID`, `Code`, `Name`, `Type`, `Material`, `NominalCapacity`, `UsableCapacity`, `Unit`, `LocationID`, `Status`, `CoolingJacket`, `Heating`, `VariableLid`, `PressureRated`, `Active` |
| `Anada_VesselAllocations` | `11922000000129581` | `AllocationID`, `WineryID`, `VesselID`, `WineLotID`, `CampaignID`, `Volume`, `Unit`, `StartedAt`, `EndedAt`, `Status` |

`Anada_VineyardParcels` intentionally omits the browser model's legacy denormalized fields (`grower` name string, `municipality`, `zone`, `image`, `estimatedKg`, `harvestWindow`, `readiness`, `sample`) — these are temporary UI projections per the v22 note above, not source-of-truth. `estimatedKg`/`harvestWindow`/`readiness` map to `Anada_CampaignParcelPlans` instead; `sample` maps to `VineyardSampleRecord`, which has no table yet (out of scope for this phase).

FK columns (`WineryID`, `GrowerID`, `LocationID`, etc.) are plain string columns holding the referenced entity's stable app `id`, matching the pattern the Phase 3A tables already use (`Anada_Tanks.LotID`, `Anada_WineLots.VesselID`). Catalyst Datastore does not enforce referential integrity; validation is deferred to the Catalyst function layer whenever Phase 9.5 introduces real writes. `Latitude`/`Longitude` on `Anada_VineyardParcels` were requested at 6 decimal digits but Catalyst silently capped both at 4 — sufficient precision for Rioja-scale coordinates, noted here in case it matters later.

Still not provisioned: `VineyardSampleRecord` (historical vineyard samples) and the four planned supply-register tables listed above. Neither was in Phase 9.3's scope.

## Phase 9.4 — Catalyst authentication (in progress)

Embedded authentication was enabled on the project 10 August 2026 (`embedded_auth: true`, `public_signup: false` — new accounts are provisioned via `Membership`, not open signup). The `anada_data_api` health contract was reconciled to schema v2 (17 tables) the same day and redeployed; see the table above. The login UI, session wiring, replacement of the hardcoded demo-operator attribution, and role gating against `Membership.role` are not yet built — API Gateway remains disabled and no route requires authentication yet, so this does not change what the deployed frontend can do.
