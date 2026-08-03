# Añada repository guidance

## Product

Añada is a Spanish-first winery production application for small and medium Rioja wineries. The interface should feel premium and calm while remaining usable in a working cellar.

## Commands

- Install: `npm install`
- Develop: `npm run dev`
- Type-check: `npm run typecheck`
- Build: `npm run build`
- Preview: `npm run preview`

## Non-negotiable domain rules

- Red, white, rosado and clarete winemaking use distinct process templates, stages, metrics and contextual operations.
- Never expose red-only actions such as `Remontado`, `Bazuqueo` or `Descube` on a white lot.
- Never expose white-specific operations such as `Desfangado` as a routine red-lot action.
- Rosado routes may use direct pressing, short skin maceration or saignée; traditional clarete uses joint vatting and co-fermentation after separate weighbridge records.
- Internal rosado/clarete eligibility requires at least 25% red varieties, mixing after delivery or weighbridge when red and white grapes are combined, 0.10–1.80 UA/cm colour intensity and no more than 70 L/100 kg estimated transformation yield.
- Process stages can be complete, current, upcoming or optional.
- Keep the physical barrel, its current wine assignment and its operation history as distinct domain concepts.
- Topping-up volume must not exceed the measured headspace of the selected filled barrels.
- Blend formulas must total exactly 100% and cannot mix incompatible red and white component lots.
- Formula approval reserves component volume but never implies that a physical cellar transfer has occurred.
- Every physical transfer, split or merge must reconcile source volume into destination volume, retained residual volume and explicit loss without creating wine.
- Split child lots and merged lots require new traceable identities; fully used source identities remain historical records and must not appear as active stock.
- Physical merges require compatible wine type, vintage, current process stage and rosado route, and every destination vessel must be empty and large enough before inventory changes.
- Weighted blend analytics are indicative; pH must be confirmed by laboratory analysis.
- A bottling order may only be created from an approved blend and may start only after every release gate is verified.
- Packaging reservations include the configured operating allowance and must never exceed unreserved supplier-lot stock.
- Completing a bottling run must reconcile good bottles, rejects, actual wine volume, finished-product lot and controlled back-label range.
- Traceability links are directional evidence records; entity relationships must not be inferred only from display order or shared names.
- Backward traces identify origin and inputs; forward traces identify every affected downstream entity and finished-product lot.
- Recall simulations are exercises and must not change stock, release status or official regulatory state.
- Reports must be derived from operational records and must state when an indicator is an internal management measure.
- Exported figures must respect the active campaign and wine-type filters.
- Administration screens must never imply that authentication, Catalyst persistence or external integrations are active before they are actually connected.
- Catalyst tables being provisioned does not make them the operational source of truth; the UI must distinguish schema readiness from a deployed and protected data service.
- Never expose operational Data Store reads without winery membership and authorization, and never place API keys or service credentials in the browser bundle.
- Resetting demonstration data requires an explicit confirmation and restores winery settings together with operational records.
- Internal Rioja controls never imply official wine qualification, label authorisation or regulatory approval.
- Regulatory eligibility is indicative until it has been validated against the relevant DOCa rules and vintage.
- All future mutations require an audit trail and user attribution.
- Offline operation remains browser-local until authenticated synchronization exists; never describe local persistence as a synchronized queue.
- The service worker may cache navigation and static assets but must never intercept non-GET requests or operational API mutations.
- PWA cache names must be versioned and old application caches removed only after a replacement worker activates.

## Engineering conventions

- TypeScript strict mode must remain enabled.
- Keep data access behind service interfaces when Catalyst is connected.
- Route interface copy through the lightweight i18n context; Spanish and English must remain at feature parity.
- Do not translate grape varieties, winery names or Rioja place names when they are proper nouns.
- Keep design values in CSS custom properties.
- Mobile touch targets should normally be at least 44px.
- Preserve responsive behavior at 390px, 768px, 1024px and 1440px.
- Do not add a backend or Catalyst service without a phase-specific plan and approval.
- Run type-check and production build before committing a checkpoint.

## Current phase

Phase 6A is prepared: the complete browser-authoritative winery workspace is installable as a standalone PWA, precaches every production chunk, reports connectivity honestly and retains device-local operations while offline. Phase 4D movements remain reconciled and the Phase 3B.1 health check remains live. Authentication, synchronization, protected operational reads and remote writes are still deferred. See `PHASES.md`.
