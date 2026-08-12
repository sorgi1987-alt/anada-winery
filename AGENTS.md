# Añada repository guidance

## Product

Añada is a Spanish-first winery-operations application for small and medium wineries in La Rioja. The interface should feel premium and calm while remaining usable in a working cellar.

## Commands

- Install: `npm install`
- Develop: `npm run dev`
- Type-check: `npm run typecheck`
- Test: `npm run test:process`, `npm run test:pwa`, `npm run test:backend`
- Build: `npm run build`

## Non-negotiable domain rules

- Red, white, rosado and clarete use distinct process templates, stages, metrics and contextual operations.
- Never expose red-only actions such as `Remontado`, `Bazuqueo` or `Descube` on white lots.
- Never expose white-specific operations such as `Desfangado` as routine red-lot actions.
- Rosado may use direct pressing, short skin maceration or saignée; clarete may use joint vatting and co-fermentation after separately recorded grape receipts.
- Process colour, contact-time and turbidity targets are winery configuration, not denomination eligibility decisions.
- Physical outputs must reconcile with available input; denomination-specific transformation limits must not be hard-coded into core production.
- Keep physical barrels, current wine assignment and operation history as distinct concepts.
- Blend formulas total exactly 100%, cannot mix incompatible wine types and reserve volume without implying movement.
- Every transfer, split and merge reconciles source, destination, residual and explicit loss without creating wine.
- Bottling starts only after every release gate is verified and completes with bottle, reject, volume, packaging and finished-lot reconciliation.
- Supplier and material lots are distinct from product masters and stock transactions.
- Traceability links are directional evidence records; backward traces identify inputs and forward traces identify affected outputs.
- Recall simulations never change stock or release status.
- All future mutations require audit history and user attribution.
- No screen may claim legal compliance, qualification, certification or official submission.

## Data and security

- Browser storage remains authoritative until authenticated synchronization exists.
- Provisioned Catalyst tables are not an operational backend.
- Never expose operational reads or writes without winery membership and authorization.
- Never put API keys or service credentials in the browser bundle.
- Offline local attribution is not an authenticated electronic signature.
- Service workers may cache GET navigation and assets but never intercept mutation requests.
- Scanner identifiers use `ANADA:<ENTITY-TYPE>:<CODE>` and ambiguous identifiers are never guessed.

## Engineering conventions

- Keep TypeScript strict mode enabled.
- Keep data access behind repository/service interfaces.
- Route interface copy through i18n; Spanish and English remain at parity.
- Keep design values in CSS custom properties.
- Mobile touch targets should normally be at least 44 px.
- Preserve responsive behavior at 390, 768, 1024 and 1440 px.
- Use migration-safe schema changes and preserve user records.
- Run type-check, tests and production build before each checkpoint.

## Current phase

Phase 9.2 is the version 0.38.0 checkpoint. Every operational collection is filtered by the active winery on read and stamped with it on write, via a single generic mechanism rather than touching every call site by hand; the full unscoped dataset stays the persistence source of truth so switching wineries never loses data; the sidebar winery switcher is functional; a second demo winery proves isolation for both pre-seeded and newly-created records. `WinerySettings` remains a single shared object, not yet winery-scoped. Phase 9.3 (10 August 2026) provisioned matching Catalyst Schema v2 tables for `Winery`/`User`/`Membership`/`Campaign`/`Grower`/`VineyardEstate`/`VineyardParcel`/`CampaignParcelPlan`/`WineryLocation`/`Vessel`/`VesselAllocation` in the Development environment — structure only, 0 rows, no API Gateway route, no operational data exposure. Phase 9.4 (10 August 2026) added a real Catalyst login gate and replaced hardcoded operator attribution everywhere with the authenticated identity via `src/operator.ts`; a `GET /whoami` route on `anada_data_api` proves unauthenticated requests are rejected, and identity resolution has a cookie-forwarding fallback (`backend/anada_data_api/identity.js`) for a known-unreliable SDK call on this Zoho org. Login uses **hosted** auth (`src/auth.ts`'s `redirectToHostedSignIn()`), not embedded — embedded's OAuth handshake hangs indefinitely on this project, a platform issue. The app is now deployed via Catalyst's own **Web Client Hosting** (`/app/`), not Slate — auth requires the frontend and Catalyst's session cookies to share a domain, which Slate (a separate domain) cannot provide; see `CATALYST_SCHEMA.md`. Verified working end-to-end with a real login. Role-based access aligned with `Membership` records is not yet done. Phase 9.5 stage 1 (10 August 2026) added `GET /me/context` (protected reads of all 11 Phase 9.3 tables, scoped to the caller's own winery membership) and `POST /me/provision` (a one-time bootstrap write, gated on zero existing `Anada_Wineries` rows, that backfills the caller's existing local demo data into Catalyst on first login) to `anada_data_api`; both go through the function's own server-side Catalyst access rather than API Gateway, which remains disabled. Verified live end-to-end with real data across all 11 tables, including two real bugs only real data could surface — Catalyst datetime columns silently reject ISO 8601 and require `"yyyy-MM-dd HH:mm:ss"`, and `Anada_VineyardParcels` was missing its `ParcelID` column despite `CATALYST_SCHEMA.md` documenting it since Phase 9.3 — see `CATALYST_SCHEMA.md`'s "Phase 9.5 stage 1" section. Phase 9.5 stage 2 (10 August 2026) added `POST /me/sync` for general remote writes to the 5 collections with live edit UI (campaigns, growers, vineyards, parcels, campaign-parcel plans) — `Wineries`/`Users`/`Memberships`/`Locations`/`Vessels`/`VesselAllocations` stay read-only mirrors since nothing edits them live. Optimistic-concurrency conflict detection uses Catalyst's own row revision (exposed as `_rev`, no new column needed); a stale write is rejected with the server's current row, not silently overwritten. The browser runs a background sync loop (`src/wineryDiff.ts`, `src/wineryRemote.ts`) — a 20s heartbeat plus a 3s post-edit debounce — that pushes local edits and pulls remote changes into the running app without a reload; a push conflict is resolved by adopting the server's row and discarding the local edit, with a toast. Verified live: real writes attributed to the real authenticated user (`UpdatedBy`), no duplicate rows across repeated edits, and the server genuinely rejecting a stale write rather than accepting it — see `CATALYST_SCHEMA.md`'s "Phase 9.5 stage 2" section for what wasn't independently isolated (the client's own conflict-toast path specifically, versus the server-side rejection it depends on, which was directly verified). Phase 9.5 stage 3 (Batch 1 complete, 10–12 August 2026) extended sync to core cellar-operations collections one table at a time: `tanks`, `tasks`, `productionEvents`, `movements`/`movementLegs`, and `lots`/`readings`/`activities` are all done and verified live (`Anada_Tasks.TaskDueAt` was dropped and replaced with a plain varchar `TaskTime` column, not renamed, since `Time` is a reserved ZCQL keyword - `CellarTask.time` is a free-text display string like `'Hoy'`, not a real timestamp; `Anada_ProductionEvents` flattens `ProductionEvent.metrics` - 27 optional scalar fields - onto 27 individual columns via dotted `TABLE_FIELDS` keys and new `getPath`/`setPath` helpers in `mapRow`/`toRow`; `movements` is the batch's first child-table sync, with `WineMovementLeg`'s synthesized id/side/sequence derived fresh from `movements` on every tick and reattached after each pull via a new `groupSortedBy` helper; `lots` adds a `'json'` wireType for `process`/`productionDetails`, reusing the `productionEvents.metrics` deep-equality mechanism, plus a second reattachment pass for `readings`/`activities`, with `readings` using a non-index-based synthesized id since they append repeatedly unlike a movement's legs). Verifying it live surfaced five bugs, four retroactively affecting stage 2 as well: `undefined`/`null` were never treated as equal in the sync-diff comparison, causing a silent continuous self-retrigger loop against `/me/sync` since stage 2 shipped (fixed in `src/wineryDiff.ts` for every synced collection, later extended with a `deepEqualTolerant` variant for nested-object fields like `productionEvents.metrics` and `lots.process`); `Anada_Vineyards.VineyardID`/`Anada_CampaignParcelPlans.PlanID` were both too short (`varchar(40)`) for some real generated ids, silently truncated during the stage 1 bootstrap (both columns resized live, affected rows corrected); ZCQL rejects any `SELECT` with more than 30 columns, which `Anada_ProductionEvents`'s 41 columns exceeded, breaking `GET /me/context` for every winery-scoped table (not just productionEvents) - fixed by having `queryRows` chunk a wide table's `SELECT` and re-join the results by `ROWID`; `mergePulledRows` adopting a remote change used to replace a whole local row with only Catalyst-tracked fields, silently dropping required local-only fields (`VineyardParcel.sample`/`.image`) and crashing the Harvest page for a real user - fixed by spreading the local row first so local-only fields survive; and verifying `lots` surfaced that an earlier verification step's own cleanup had been incomplete (a real UI-driven transfer's effect on a lot's vessel assignment wasn't reverted, only the resulting movement rows were) - fixed with a real reverse transfer through the UI, not direct state surgery. See `CATALYST_SCHEMA.md`'s "Phase 9.5 stage 3" section. Batch 2 (the remaining ~20 browser-local collections) is a separate, deliberately deferred future effort. Phase 9.1 (version 0.37.0) introduced `Winery`, `User` and `Membership` as real domain entities with stable IDs; browser schema v27 derived a default winery/user/membership from the existing single-winery data without regenerating any record's identity. Phase 9B.1 (version 0.36.0) made vessel usable capacity configurable independently of nominal capacity. Phase 10A.3 (version 0.35.0) made vineyard parcels permanent, campaign-independent master data. Phase 10A.2 (version 0.34.0) made growers permanent master data. Campaign lifecycle (Phase 10A.1) shipped in version 0.33.0.

## Migration rules

- A migration may enrich, normalize or add structures.
- A migration must never regenerate IDs, replace operational objects,
  discard history or recreate lots.
- Preserve object identity; enrich existing records rather than replacing them.
- Legacy schemas predating campaigns have no campaigns collection —
  migration code must tolerate missing campaign arrays.
- Canonical relationship builders enrich existing data, never rebuild it.

## Fragile areas

- Migration pipeline
- Campaign normalization
- Relationship normalization
- Browser persistence compatibility

## Recurring failure modes

- Prop signature drift after UI refactors.
- Migration regressions affecting older schemas.
- Assuming campaigns have always existed.
- Replacing objects instead of enriching them.
- Never remove a test because it fails. Migration tests catch the
  regressions that schema evolution causes.
