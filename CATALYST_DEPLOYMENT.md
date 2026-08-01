# Phase 3B.1 Catalyst deployment

This checkpoint deploys one Advanced I/O function that checks the availability of seven empty Data Store tables. It exposes no rows and implements no mutation.

## 1. Generate the Catalyst function configuration

From the existing local project directory:

```bash
cd ~/Documents/anada-winery
catalyst functions:setup --dc eu
```

Choose these values when prompted:

| Prompt | Selection |
| --- | --- |
| Function type | Advanced I/O |
| Runtime | Node.js 22 |
| Package/function name | `anada_data_api` |
| Entry point | `index.js` |
| Author | `Sergio` |
| Install dependencies | Yes |

Keep the generated `functions/anada_data_api/catalyst-config.json` and the function entry added to the root `catalyst.json`.

If the CLI reports that the directory is not an initialized Catalyst project, run `catalyst init --only functions --dc eu`, select the existing `Anada-Winery` project, and use the same selections.

## 2. Install the reviewed health function

```bash
cp backend/anada_data_api/index.js functions/anada_data_api/index.js
cp backend/anada_data_api/contract.js functions/anada_data_api/contract.js
cp backend/anada_data_api/package.json functions/anada_data_api/package.json

cd functions/anada_data_api
npm install
cd ../..

npm run test:backend
```

Do not copy or hand-edit `catalyst-config.json`; it must remain the file produced by the CLI.

## 3. Deploy only the health function

```bash
catalyst deploy --only functions:anada_data_api --dc eu
```

Expected endpoint:

```text
https://anada-winery-20117369913.development.catalystserverless.eu/server/anada_data_api/health
```

Verify it:

```bash
curl -i https://anada-winery-20117369913.development.catalystserverless.eu/server/anada_data_api/health
```

The response must have HTTP 200, `status: "ready"`, `mode: "schema-health-only"`, `schemaVersion: 1`, `tableCount: 7` and `remoteWritesEnabled: false`.

## 4. Deploy the connected frontend

```bash
npm ci
npm run typecheck
npm run build
catalyst deploy slate --dc eu -m "Phase 3B.1 health connectivity"
```

Open Configuration → System and data. The read bridge should automatically become Available. The browser repository and authentication status must remain unchanged.

## 5. Commit generated configuration

```bash
git add -A
git commit -m "feat: deploy Catalyst health connectivity"
git push
```

Do not enable API Gateway, add Data Store rows, create operational read routes or introduce remote writes in this checkpoint.
