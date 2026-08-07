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

Phase 10A.3 is the version 0.35.0 checkpoint. Vineyard parcels are permanent, campaign-independent master data: `Grower -> Vineyard -> Parcel` under Administration (`/admin/vineyards`, `/admin/parcels`); campaign-specific planning lives separately in `CampaignParcelPlan` records; browser schema v26 derives these from every existing parcel's campaign reference without regenerating parcel IDs or grower/location relationships; Harvest scopes to the active campaign and disables intake when none is active. Phase 10A.2 (version 0.34.0) made growers permanent Administration master data with legal/trade identity, contact details, active/inactive lifecycle and duplicate code/tax-ID validation; browser schema v25 migrates legacy grower records without duplicating them. Campaign lifecycle (Phase 10A.1) shipped in version 0.33.0: single-active and single-default invariants, closure blockers, audit attribution and a full Administration workspace at `/admin/campaigns`. Authentication, shared persistence and remote writes remain deferred until Phase 9.

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
