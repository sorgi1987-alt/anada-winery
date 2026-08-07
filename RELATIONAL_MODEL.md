# Añada canonical relational model

Version 0.31 introduces an additive canonical relationship layer. Existing display fields remain for compatibility, while identifiers below are authoritative.

## Canonical masters

- `Campaign`: campaign identity and date range.
- `Grower`: one record per viticulturist or supplying organisation.
- `WineryLocation`: controlled vineyard, winery and processing locations.
- `Vessel`: physical vessel master; capacity and location are properties of the vessel, not its contents.

## Canonical transactions and histories

- `VineyardSampleRecord`: historical parcel sample. `VineyardParcel.sample` is only the latest summary.
- `VesselAllocation`: time-bounded relationship between a wine lot and a vessel. Tank occupancy is a projection.

## Authoritative relationships

- Parcel → Grower through `growerId`.
- Parcel → Location through `locationId`.
- Parcel and delivery → Campaign through `campaignId`.
- Delivery → Parcel through `parcelId`.
- Wine lot → current vessel through `currentVesselId`, with history in `VesselAllocation`.

Legacy fields such as `grower`, `vessel` and embedded `sample` remain temporarily for display compatibility. They must not become independently editable once canonical forms are exposed in the UI.


## Phase 9B.1 — Cellar assets

`Vessel` is the canonical physical asset. `Tank` remains a temporary UI projection. Nominal and usable capacity are distinct; active `VesselAllocation` records determine occupancy, remaining capacity and fill percentage. Vessel operational status blocks receiving operations when cleaning, under maintenance, quarantined or inactive.


## Campaign lifecycle (schema v24)

Campaigns are persistent operational masters. Exactly one campaign is default and no more than one campaign is active. Closing is blocked while campaign-linked lots, receptions or bottling orders remain unresolved. Reopen and archive actions preserve audit attribution.

## v0.34 Grower master

`Grower` is permanent winery master data and is not campaign-scoped. A grower may remain linked to parcels and historical receptions after being made inactive.

Authoritative grower relationships:

- `VineyardParcel.growerId -> Grower.id`
- `GrapeDelivery.growerId -> Grower.id` (historical operational attribution)

Grower lifecycle is non-destructive. Records are activated/deactivated; they are never deleted to preserve parcel and reception genealogy. `code` and non-empty fiscal identities are unique within the winery.

## Grower master (schema v25)

`Grower` is permanent winery master data and never belongs directly to a campaign. `VineyardParcel.growerId` is the authoritative relationship; legacy grower-name strings remain display projections only. Grower code and normalized fiscal identity are unique. Deactivation preserves historical parcel and delivery links and prevents destructive deletion.

## Vineyard and parcel master model (v0.35)

`Grower 1—N VineyardEstate 1—N VineyardParcel` is permanent master data. `Campaign N—N VineyardParcel` is represented by `CampaignParcelPlan`; expected yield, harvest window and readiness belong to that junction record rather than to the parcel master. Legacy parcel fields remain as UI projections during migration.
