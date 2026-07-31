# Añada

Añada is a visual winery-production application for small and medium-sized Rioja wineries. It is designed for fast use in the cellar and models red and white winemaking as genuinely different processes.

## Current status

Phase 1 is a production-fidelity frontend prototype. All operational data is currently mocked; there is no production persistence, authentication or regulatory certification.

Implemented views:

- Visual entry experience
- Today dashboard
- Red/white process selection
- Lot search and filters
- Separate red and white lot-detail experiences
- Process-specific contextual operations
- Responsive visual cellar map
- Quick reading entry with local mock updates
- Cellar-friendly dark theme
- Preview states for later modules

## Local development

Requirements: Node.js 22 or newer and npm.

```bash
npm install
npm run dev
```

Use the URL printed by Vite. The entry route is `/#/welcome`. Hash routing is intentional for reliable static-client hosting in Catalyst.

## Validation

```bash
npm run typecheck
npm run build
npm run preview
```

## Zoho Catalyst

Target Catalyst project:

- Project name: `Anada-Winery`
- EU project ID: `11922000000094785`
- Organisation ID: `20117369913`

The Vite production output is written to `dist/`. Catalyst client configuration should be generated through the Catalyst CLI or console rather than being guessed manually. Once the project has been initialised with the CLI, preserve its generated `catalyst.json` and client structure.

No Catalyst services are connected in Phase 1. Later phases will replace the mock service boundary with authenticated Catalyst functions and Data Store access.

## Mobile direction

The responsive frontend is PWA-ready. Capacitor packaging, native permissions, offline synchronisation and mobile authentication validation belong to Phase 6 and should not be introduced earlier.

## Documentation

- `DESIGN_SYSTEM.md` — visual and interaction conventions
- `PHASES.md` — gated implementation roadmap
- `ATTRIBUTIONS.md` — demonstration imagery
- `AGENTS.md` — durable engineering and domain rules
