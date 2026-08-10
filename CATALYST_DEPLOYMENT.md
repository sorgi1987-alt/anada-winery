# Catalyst deployment

Añada is deployed entirely to Catalyst's **Development** environment, EU data centre, project `Anada-Winery` (`11922000000094785`, org `20117369913`). There is no Production environment and no CI/CD — every deploy below is run manually from a local machine with the Catalyst CLI authenticated.

Three independently deployable pieces:

| Piece | Source | Deploy command | Live at |
| --- | --- | --- | --- |
| Frontend (the app) | `dist/` (built from `src/`) | `catalyst deploy --only client --dc eu` | `https://anada-winery-20117369913.development.catalystserverless.eu/app/` |
| Backend function | `functions/anada_data_api/` (copied from `backend/anada_data_api/`) | `catalyst deploy --only functions:anada_data_api --dc eu` | `https://anada-winery-20117369913.development.catalystserverless.eu/server/anada_data_api/` |
| Data Store schema | Provisioned via Catalyst MCP tools, not the CLI | — | Catalyst console → Data Store |

## Why the frontend is on Web Client Hosting, not Slate

The app was originally deployed to Catalyst Slate (`anada-winery-web-ucfcgorv.onslate.eu`), a separate domain from the Catalyst project. That worked fine until Phase 9.4 added real Catalyst authentication: Zoho's session cookies are scoped to the project's own domain, and a frontend on a different domain (Slate) cannot reliably read them — both embedded auth's OAuth bridge and the Web SDK's client-side session check failed for exactly this reason, confirmed against a sibling project in the same Zoho org that has the identical architecture. Moving the frontend to Catalyst's own **Web Client Hosting**, served from the project's own domain, resolved it — verified with a real, complete login cycle. See `CATALYST_SCHEMA.md`'s Phase 9.4 section for the full diagnosis.

The Slate app (`anada-winery-web-ucfcgorv.onslate.eu`) still exists in the Catalyst console but is no longer deployed to and should be treated as decommissioned.

## 1. One-time setup (already done for this project; included for a fresh clone)

```bash
cd ~/Documents/anada-winery
catalyst init --only functions --dc eu   # select the existing Anada-Winery project
catalyst client:setup --type basic --name anada-login-redirect -ni
```

The `client:setup` name is fixed permanently to whatever the *first* Web Client Hosting deploy under this project used — there is no CLI or console way to rename or delete a Web Client Hosting target. `anada-login-redirect` was that first deploy (an early Phase 9.4 workaround, since superseded); every real deploy since reuses that name via the generated `client-package.json` (see `vite.config.ts`'s `pwaPrecache` plugin) even though the name no longer describes what's deployed.

## 2. Deploy the frontend

```bash
npm run typecheck
npm run test:process
npm run test:pwa
npm run build
catalyst deploy --only client --dc eu
```

Verify:

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://anada-winery-20117369913.development.catalystserverless.eu/app/
```

Expect `200`. The build's `base: './'` (see `vite.config.ts`) and the manifest/service-worker's relative paths mean the app works correctly served from the `/app/` subpath with no path configuration needed.

## 3. Deploy the backend function

```bash
cp backend/anada_data_api/index.js functions/anada_data_api/index.js
cp backend/anada_data_api/contract.js functions/anada_data_api/contract.js
cp backend/anada_data_api/identity.js functions/anada_data_api/identity.js
cp backend/anada_data_api/package.json functions/anada_data_api/package.json

cd functions/anada_data_api && npm install && cd ../..

npm run test:backend
catalyst deploy --only functions:anada_data_api --dc eu
```

Do not copy or hand-edit `functions/anada_data_api/catalyst-config.json`; it must remain the file the CLI generated during setup.

Verify:

```bash
curl -s https://anada-winery-20117369913.development.catalystserverless.eu/server/anada_data_api/health
```

Expect HTTP 200, `status: "ready"`, `mode: "schema-health-only"`, `schemaVersion: 2`, `tableCount: 17`, `remoteWritesEnabled: false`.

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://anada-winery-20117369913.development.catalystserverless.eu/server/anada_data_api/whoami
```

Expect `401` with no session — this is the Phase 9.4 completion gate ("an unauthenticated request is rejected").

## 4. Commit

```bash
git add -A
git commit -m "..."
git push
```

## Standing safety boundary

Do not enable API Gateway, add Data Store rows, create operational read/write routes, or introduce remote writes without an explicit, separate decision — see `CATALYST_SCHEMA.md`'s safety boundary and `AGENTS.md`'s data rules. Nothing deployed here should give the browser bundle read or write access to operational Data Store rows; the browser's local repository remains authoritative until Phase 9.5.
