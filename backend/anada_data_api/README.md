# `anada_data_api`

Phase 3B.1 Advanced I/O function source, extended in Phase 9.4 to cover the schema v2 tables provisioned in Phase 9.3. It performs a read-only availability check against all 17 Añada Data Store tables and exposes `GET /health`. It deliberately exposes no operational records and accepts no mutations.

Do not deploy this directory as a guessed Catalyst function structure. Generate the function with the EU Catalyst CLI first, choose Advanced I/O and Node.js 22, then copy these source files into the generated `functions/anada_data_api` directory and install its dependencies. Keep the CLI-generated `catalyst-config.json`.

The exact Slate hostname is authorized for CORS with iframe access disabled. API Gateway remains disabled because Advanced I/O functions have direct `/server/{function_name}/{route}` URLs. Authentication remains deferred, so operational read routes must not be added yet.
