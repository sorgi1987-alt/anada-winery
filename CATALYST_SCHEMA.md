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

These tables must not be exposed to the browser client until winery membership, role checks, audit attribution and conflict handling are in place.

## Safety boundary

- Browser persistence remains authoritative; Catalyst is not yet an operational backend for any collection.
- No browser bundle contains Catalyst credentials.
- No operational Data Store rows are publicly readable.
- No server or browser mutation endpoint exists.
- Authentication exists as of Phase 9.4 (login, identity attribution, unauthenticated-rejection), but winery membership/role checks and operational reads/writes remain deferred by product decision (Phase 9.5).
- Later migrations must be idempotent, versioned and auditable; destructive schema changes require a backup and an explicit checkpoint.

## Next integration gate

`anada-winery-web-ucfcgorv.onslate.eu` (configuration ID `11922000000096932`) is authorized for CORS and iframe access — a leftover from the Slate-hosted era and the abandoned embedded-auth attempt (see Phase 9.4 below). The app no longer runs there; harmless to leave, not cleaned up. API Gateway remains disabled.

The `anada_data_api` health route is deployed and live at `https://anada-winery-20117369913.development.catalystserverless.eu/server/anada_data_api/health`, alongside an authenticated `/whoami` route (Phase 9.4). Authenticated winery membership is still required before exposing operational reads. Remote writes only follow after audit attribution and conflict policy are implemented (Phase 9.5).


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

## Phase 9.4 — Catalyst authentication

Status: implemented and verified with a real, complete login cycle, 10 August 2026.

Authentication was enabled on the project — both `embedded` and `hosted` types are on (`public_signup: false`; new accounts are provisioned via `Add_User`, not open signup). The `anada_data_api` health contract was reconciled to schema v2 (17 tables) and redeployed as part of this phase.

### The app moved off Slate onto Catalyst's own Web Client Hosting

This is the load-bearing architectural change of the phase, and the reason two earlier approaches (below) failed. Zoho's Catalyst session cookies are scoped to the **project's own domain** (`anada-winery-20117369913.development.catalystserverless.eu`). The app was originally deployed to **Slate** (`anada-winery-web-ucfcgorv.onslate.eu`), a separate domain — so neither the browser SDK's session check nor a cross-domain redirect could reliably see a valid session there. Confirmed by direct comparison with a sibling project in the same Zoho org (org `20117369913`) that serves its frontend from Catalyst's own Web Client Hosting and has no such problem.

Fixed by deploying the real app to **Web Client Hosting** instead, live at `https://anada-winery-20117369913.development.catalystserverless.eu/app/` — the same domain as the backend function and Zoho's session cookies. `catalyst.json`'s `client.source` points at `dist`; `vite.config.ts`'s existing `base: './'` and the manifest/service-worker's already-relative paths meant no path configuration was needed for the subpath. See `CATALYST_DEPLOYMENT.md` for the full procedure. **Slate is decommissioned** — the app there still exists in the console but is no longer deployed to.

### Two approaches were tried and abandoned before this

1. **Embedded auth (iframe-based)**, tried first. `catalyst.auth.signIn()` renders a real sign-in iframe correctly, but its OAuth handshake (`/oauthorize` → `/__catalyst/.../signin-redirect`) hung indefinitely — reproduced across SDK versions (the correct version is `4.6.2`, matching the Catalyst console's own generated snippet, not the `4.0.0` first used), browsers, profiles and `service_url` configurations.
2. **Hosted auth with a client-side redirect stub**, tried second, after switching away from embedded. A plain top-level redirect to Catalyst's hosted sign-in page completed real logins, but landed on Catalyst's default `/app/` destination — which at the time hosted only a one-file JS redirect stub bouncing back to Slate. That client-side `window.location.replace()` cannot carry a cookie scoped to a different domain, so the app never saw the session and looped back to the login screen. This is what "moving the app itself to `/app/`" resolved: `/app/` now *is* the real app, on the domain the cookie is actually scoped to, so no bridging is needed at all.

### What's live now

- `src/auth.ts`'s `redirectToHostedSignIn()` does a plain `window.location.href` to `${projectDomain}/__catalyst/auth/login` — no iframe. `src/Login.tsx` is a branded screen with a "Continue to sign in" button.
- **The backend is the authority on identity, not the browser SDK.** `catalyst.auth.isUserAuthenticated()`/`getCurrentProjectUser()` have been observed to report a session as invalid even when it is fully valid — documented in a sibling project's live Zoho support case for this same org. `src/auth.ts`'s `fetchAuthenticatedUser()` instead calls `anada_data_api`'s `GET /whoami`, which resolves identity server-side (`backend/anada_data_api/identity.js`) by trying the documented SDK call first, then falling back to forwarding the caller's session cookie directly to Catalyst's own `/project-user/current` endpoint — proven to work where the SDK call does not. `App.tsx` checks this once on load; no polling loop, since a full page reload naturally re-runs the check on return from the redirect.
- A `src/operator.ts` module holds the current authenticated operator's display name; on successful login this replaces the single hardcoded `'Elena Martín'` literal at every real attribution call site across `domain.ts`, `App.tsx`, `Administration.tsx`, and the red/white/rosé process, movements, laboratory, supplies and product-use screens. Seed/historical demo data (`data.ts`) and explicitly-decorative demo content (the Administration "not user management" team roster, `App.tsx`'s fallback activity feed shown only when a lot has no real history) were deliberately left untouched.
- `GET /whoami` on `anada_data_api`: an unauthenticated request returns `401 {"status":"unauthenticated",...}` — the completion gate's "an unauthenticated request is rejected" proof, kept separate from the still-unauthenticated `/health` route.
- A top-level `ErrorBoundary` (`src/main.tsx`) so any future render-time crash shows a visible error instead of a silent blank screen — the failure mode that made this phase's real bugs so hard to diagnose from a blank screen alone.
- The first real Catalyst App User (`sorgi1987@gmail.com`, App Administrator role), provisioned via `Add_User`, confirmed and active, used for the real, live, end-to-end login test: sign in → real dashboard showing the authenticated user's name in the sidebar and topbar (not the demo placeholder) → sign out → back to the login screen, cleanly, with no loop.

Not yet done: role gating against `Membership.role` (Catalyst's two built-in roles don't map to Añada's five `Membership` roles, so this needs app-side logic, not a Catalyst role check) and mapping the authenticated Catalyst identity to a real `User`/`Membership` record rather than just a display name. API Gateway remains disabled; no operational Data Store route exists.

## Phase 9.5 stage 1 — protected reads and a one-time bootstrap write

Status: implemented and verified live with real data, 10 August 2026. Mapping the authenticated identity to a real `User`/`Membership` record (flagged as not-yet-done at the end of Phase 9.4) is what this stage delivers.

Two new routes on `anada_data_api`, both going through the function's own server-side Catalyst access (`scope: 'admin'`) rather than API Gateway, which remains disabled — the function enforces authorization in code before returning anything, instead of exposing generic per-table CRUD:

- **`GET /me/context`** resolves the caller's own `Anada_Users` row (matched by email — Catalyst's identity carries no stable app user ID), their active `Membership`(s), and every winery-scoped Phase 9.3 table (all 11) filtered to just the winery IDs those memberships grant. An unmatched caller gets `{status: 'unprovisioned', bootstrapAvailable}` — `bootstrapAvailable` is true only when zero `Anada_Wineries` rows exist anywhere, so a first login can bootstrap a real winery but a second person with no membership gets a clear "no access" result instead of silently getting their own disconnected winery.
- **`POST /me/provision`** is the one narrow write this stage adds — not general write capability. Re-verifies both bootstrap conditions server-side (no existing user for this identity, zero `Anada_Wineries` rows anywhere) rather than trusting a prior `/me/context` read. Creates the `User`/`Winery`/`Membership` triple plus all 8 winery-scoped collections from whatever the caller's browser currently holds locally, backfilling the existing demo dataset into Catalyst exactly once rather than starting the remote copy empty. Every entity keeps its existing local `id` so cross-references (`growerId`, `locationId`, `campaignId`, etc.) stay valid without remapping — only the new `User`/`Membership` rows get server-generated IDs.
- Both implemented in `backend/anada_data_api/wineryContext.js`. The browser only calls these once, right after login (`src/wineryRemote.ts`, wired into `App.tsx`); local storage remains the app's actual live source of truth afterward — this stage proves the read+bootstrap-write mechanics work end to end, it does not add ongoing sync. That's the still-separate "remote writes" half of Phase 9.5.

Two real bugs surfaced only once real data was written (Development's tables had been empty since Phase 9.3, so nothing had ever exercised this before):

- **Catalyst datetime columns reject ISO 8601 outright** (`"Invalid input value for CreatedAt. datetime value expected"` for `"2026-08-10T15:00:00.000Z"`, `"10-Aug-2026 15:00:00"`, and an offset-suffixed ISO variant — all rejected). Empirically confirmed via a live insert+read round trip that the actual accepted/returned format is `"yyyy-MM-dd HH:mm:ss"` — UTC wall clock, no milliseconds, no offset. `wineryContext.js` now converts in both directions (`toCatalystDatetime`/`fromCatalystDatetime`) for every datetime-typed column across all 11 tables, with regression tests in `wineryContext.test.js`. Not documented anywhere in Catalyst's own REST/SDK reference pages at the time of writing — found by testing directly against the live table via the Catalyst management tools, not by reading docs.
- **`Anada_VineyardParcels` was missing its `ParcelID` column** — every other table in this schema has an app-level `<Entity>ID` primary identifier column; this table didn't, despite the column being correctly listed in this very doc's table above since Phase 9.3. A real provisioning gap from that phase, not a doc error — the doc was right, the table just never got the column. Fixed by adding it (`varchar(40)`, mandatory, unique, matching every other table's ID-column pattern) via `Create_Column` — safe since the table still had 0 rows. Caught only because a real insert was attempted; `/health`'s row-count-1 probe and `/me/context`'s reads (against an empty table) could never have caught a write-time-only column gap like this.

Verified live end-to-end with the real authenticated user (`sorgi1987@gmail.com`): `GET /me/context` unauthenticated → 401; authenticated with no prior `Anada_Users` row → `{status: 'unprovisioned', bootstrapAvailable: true}`; `POST /me/provision` with the real local `winery-default` dataset → `201`, all 8 collections' row counts matching the payload exactly (1 campaign, 5 growers, 5 vineyards, 5 parcels, 5 campaign-parcel plans, 9 locations, 15 vessels, 4 vessel allocations); a second `POST /me/provision` attempt → `409 already_provisioned`; a follow-up `GET /me/context` → the same data read back correctly, including valid round-tripped datetime values.
