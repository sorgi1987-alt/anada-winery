# `anada_data_api`

Phase 3B.1 Advanced I/O function source, extended in Phase 9.4 to cover the schema v2 tables provisioned in Phase 9.3 and to add authenticated identity resolution.

Do not deploy this directory as a guessed Catalyst function structure. Generate the function with the EU Catalyst CLI first, choose Advanced I/O and Node.js 22, then copy these source files into the generated `functions/anada_data_api` directory and install its dependencies. Keep the CLI-generated `catalyst-config.json`. See `CATALYST_DEPLOYMENT.md` at the repo root for the full procedure.

Routes:

- `GET /health` — read-only availability check against all 17 Añada Data Store tables. Exposes no operational records, accepts no mutations.
- `GET /whoami` — returns the authenticated Catalyst user (`{status: 'authenticated', user: {...}}`) or `401 {status: 'unauthenticated'}`. Identity resolution (`identity.js`) tries the documented SDK call first, then falls back to forwarding the caller's session cookie directly to Catalyst's own `/project-user/current` endpoint — the SDK's own credential resolution has been observed to return `null`/false for a genuinely valid session on this Zoho org (documented in a sibling project's live Zoho support case). The cookie-forwarding fallback is proven to work where the SDK call does not.
- `GET /weather` — Open-Meteo proxy, 15-minute cache, unrelated to authentication.

API Gateway remains disabled — Advanced I/O functions have direct `/server/{function_name}/{route}` URLs, so it isn't needed. No operational Data Store read or write route exists; `/whoami` returns identity only, never Data Store rows.
