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

- Red and white winemaking use distinct process templates, stages, metrics and contextual operations.
- Never expose red-only actions such as `Remontado`, `Bazuqueo` or `Descube` on a white lot.
- Never expose white-specific operations such as `Desfangado` as a routine red-lot action.
- Process stages can be complete, current, upcoming or optional.
- Keep the physical barrel, its current wine assignment and its operation history as distinct domain concepts.
- Topping-up volume must not exceed the measured headspace of the selected filled barrels.
- Blend formulas must total exactly 100% and cannot mix incompatible red and white component lots.
- Formula approval reserves component volume but never implies that a physical cellar transfer has occurred.
- Weighted blend analytics are indicative; pH must be confirmed by laboratory analysis.
- Regulatory eligibility is indicative until it has been validated against the relevant DOCa rules and vintage.
- All future mutations require an audit trail and user attribution.

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

Phase 2D is a bilingual blending-workspace frontend checkpoint with versioned local persistence. Authentication and shared Catalyst persistence remain deferred. See `PHASES.md`.
