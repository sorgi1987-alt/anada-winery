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
