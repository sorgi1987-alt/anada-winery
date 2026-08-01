# `anada_data_api`

Phase 3A Advanced I/O function source. It performs a read-only availability check against the seven Añada Data Store tables and exposes `GET /health`. It deliberately exposes no operational records and accepts no mutations.

Do not deploy this directory as a guessed Catalyst function structure. Generate the function with the EU Catalyst CLI first, choose Advanced I/O and Node.js 22, then copy these source files into the generated `functions/anada_data_api` directory and install its dependencies. Keep the CLI-generated `catalyst-config.json`.

Do not configure `VITE_CATALYST_READ_API_URL` until the function route and the Slate origin have been explicitly protected and verified. Authentication remains deferred, so operational read routes must not be added yet.
