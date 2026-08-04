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


## Schema v17 — Product stock control

Physical product lots now retain auditable per-location balances. Adjustment, transfer, disposal, closure and consumption-reversal transactions are immutable and linked to their source records.
