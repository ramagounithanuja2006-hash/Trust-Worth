# VisionTrust database

MongoDB collections used by the backend:

| Collection | Model |
| --- | --- |
| users | User |
| contributors | Contributor |
| images | Image |
| aimodels | AIModel |
| predictions | Prediction |
| pipelineevents | PipelineEvent |
| blockchainevidences | BlockchainEvidence |
| trustscores | TrustScore |
| incidents | Incident |

Default connection string (see `backend/.env.example`):

```
mongodb://127.0.0.1:27017/visiontrust
```

## Indexes

From `backend/`:

```
node ../database/indexes.js
```

`ensureIndexes()` is also invoked from `seed.js`.

## Seed

```
node database/seed.js
```

Optional environment variables:

- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`
