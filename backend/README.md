# VisionTrust Backend

Node.js/Express backend for SIH26228. It stores contributor pipeline records in MongoDB, authenticates users with JWT, validates uploads with Multer, and records SHA-256 integrity hashes.

AI inference is integrated through Axios and blockchain anchoring is integrated through ethers. Both integrations fail closed: unavailable services return errors and no successful prediction or confirmed evidence is fabricated.

## Setup

1. Install Node.js 18+ and MongoDB.
2. Copy `.env.example` to `.env` and set a unique `JWT_SECRET`.
3. Install dependencies with `npm install`.
4. Start with `npm start` (or `npm run dev` for nodemon).

`MONGO_REQUIRED=false` allows the health endpoint and application startup while MongoDB is unavailable. Set it to `true` for production so startup fails when persistence cannot be reached.

## Scripts

- `npm start` — production-style start
- `npm run dev` — watch mode
- `npm test` — Jest + Supertest
- `node ../database/seed.js` — optional seed user (from `backend/`, or run `node database/seed.js` from repo root)

## API

Public:

- `GET /health`
- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`

Protected (`Authorization: Bearer <token>`):

- `GET /api/auth/me`
- `GET /api/images`, `GET /api/images/:id`, `POST /api/images`, `POST /api/images/:id/verify`
- `GET /api/models`, `GET /api/models/:id`, `POST /api/models`, `POST /api/models/:id/verify`
- `GET /api/predictions`, `GET /api/predictions/:id`, `POST /api/predictions`, `POST /api/predictions/:id/verify`
- `POST /api/predictions/infer` — integrity-gated AI inference, prediction verification, trust scoring, and blockchain evidence decision
- `GET /api/contributors`, `GET /api/contributors/:id`, `POST /api/contributors`
- `GET /api/trust`, `GET /api/trust/:id`, `GET /api/trust/contributors/:id`, `POST /api/trust`
- `GET /api/impact/summary`, `GET /api/impact/:entityType/:id`
- `GET /api/contributors/:id/history`
- `GET /api/integrity/impact/:entityType/:id`, `GET /api/integrity/incidents`, `GET /api/pipeline-events`
- `GET /api/incidents`, `GET /api/incidents/:id`, `POST /api/incidents`
- `GET /api/blockchain`, `GET /api/blockchain/:id`, `POST /api/blockchain`
- `POST /api/blockchain/anchor` — submits evidence to the configured ethers contract and confirms only after mining

Upload endpoints expect a multipart `file` field. Image uploads accept JPEG, PNG, WebP, and TIFF. Model uploads accept zip/octet-stream types. Optional `expectedSha256` is compared against the computed SHA-256. A mismatch marks the asset `BLOCKED`, moves it to quarantine, creates an incident, records pipeline events, and prevents prediction creation.

Prediction creation re-verifies both the image and model before allowing inference-related processing. Trust scores use image integrity, model integrity, prediction verification, blockchain evidence, contributor history, and pipeline consistency with transparent weighted factors.

## Integration Configuration

Required for AI inference: `AI_SERVICE_URL` and `AI_INFERENCE_ENABLED=true`. The AI service must expose `POST /infer` and return a prediction/output plus optional confidence, prediction hash, and request ID.

Required for blockchain anchoring: `BLOCKCHAIN_RPC_URL`, `BLOCKCHAIN_CONTRACT_ADDRESS`, `BLOCKCHAIN_PRIVATE_KEY`, `BLOCKCHAIN_CONTRACT_ABI`, and optionally `BLOCKCHAIN_RECORD_FUNCTION`. The configured contract function must accept the asset ID, asset type, SHA-256 hash, event type, Unix timestamp, and contributor ID in that order.

The repository currently contains no local `ai-service/` or `blockchain/` directory, so those services must be started from their external project locations. The backend starts with `npm start`; the integration tests use mocked adapters and do not claim live AI or blockchain availability.
