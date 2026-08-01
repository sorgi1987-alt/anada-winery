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

## Safety boundary

- Browser persistence remains authoritative during Phase 3A.
- No browser bundle contains Catalyst credentials.
- No operational Data Store rows are publicly readable.
- No server or browser mutation endpoint exists.
- Authentication, winery membership and roles remain deferred by product decision.
- Later migrations must be idempotent, versioned and auditable; destructive schema changes require a backup and an explicit checkpoint.

## Next integration gate

Deploy and protect the `anada_data_api` health route, enable the Slate-origin connection check, then add authenticated membership before exposing operational reads. Remote writes only follow after audit attribution and conflict policy are implemented.
