---
name: domo-api
description: >
  Curated DOMO API reference — only the endpoints we actually use, with real
  working examples from Rawso projects. DOMO has 23,000+ API endpoints; this
  skill documents the ones that matter. Use when making direct API calls,
  debugging API responses, or when the user needs to interact with DOMO's API
  outside the CLI. Also use when the user mentions "API", "endpoint", "REST",
  "domo.get", or "domo.post". For in-app data fetching, see pro-code-apps skill.
---

# DOMO API Reference (Curated)

Working reference for DOMO API endpoints used in our development.

DOMO has 23,000+ API endpoints. This documents only the endpoints we've
actually used, with real examples and notes from our projects. New endpoints
get added here via the `/learn` skill as we use them.

**Base URL:** `https://rawso.domo.com`
**Auth header:** `X-Domo-Developer-Token: {TOKEN}`
**Docs:** https://www.domo.com/docs/portal/API-Reference/overview

## Authentication

### Developer Token (primary method)
All requests use the developer token header:
```
X-Domo-Developer-Token: YOUR_TOKEN
```

Source: DOMO Admin → Authentication → Access Tokens
See credentials skill for setup.

**Scope limitation:** The developer token (ryuu token) is scoped to app development — it can publish apps and proxy data for `domo dev`, but it CANNOT access the data query API (`/v1/datasets/{id}/data`). For dataset queries and automated QC scripts, you need an OAuth client (Client ID + Client Secret) set up via DOMO Admin → OAuth.

### OAuth Client Credentials (for automated workflows)
```bash
curl -u CLIENT_ID:CLIENT_SECRET \
  "https://api.domo.com/oauth/token?grant_type=client_credentials&scope=data dashboard user"
```

Response:
```json
{
  "access_token": "...",
  "token_type": "bearer",
  "expires_in": 3599,
  "scope": "data user dashboard"
}
```

Token expires in ~1 hour. Use `Authorization: Bearer {access_token}` for subsequent requests.

## Dataset Endpoints

### List All Datasets/ETLs
```
GET /api/data/v3/datasources?limit=50&offset=0
```
Returns all datasets and ETLs. Paginate with `limit` and `offset`.

**Status:** Confirmed working

### Get Single Dataset
```
GET /api/data/v3/datasources/{datasetId}
```
Returns full metadata for one dataset. `datasetId` is the UUID.

**Status:** Confirmed working

## ETL / DataFlow Endpoints

> **Important:** ETL numeric `id` (e.g., `76`) is NOT the dataset UUID.
> Get numeric IDs from the list endpoint.
>
> `PUT` to edit requires ownership — only works on ETLs where
> `responsibleUserId` matches your user.
>
> `POST /executions` triggers a **LIVE run immediately** — do not call
> carelessly on production ETLs.

| Action | Method | Endpoint | Status |
|--------|--------|----------|--------|
| List all ETLs | GET | `/api/dataprocessing/v1/dataflows?limit=50&offset=0` | Confirmed |
| Get single ETL | GET | `/api/dataprocessing/v1/dataflows/{id}` | Confirmed |
| Edit ETL (owned) | PUT | `/api/dataprocessing/v1/dataflows/{id}` | Confirmed |
| Trigger a run | POST | `/api/dataprocessing/v1/dataflows/{id}/executions` | Confirmed |
| List executions | GET | `/api/dataprocessing/v1/dataflows/{id}/executions?limit=10` | Confirmed |
| Check run status | GET | `/api/dataprocessing/v1/dataflows/{id}/executions/{execId}` | Confirmed |
| Create new ETL | POST | `/api/dataprocessing/v1/dataflows` | 403 — needs OAuth/Admin |

### Edit ETL Workflow
```javascript
// 1. Fetch current definition
const etl = await fetch('https://rawso.domo.com/api/dataprocessing/v1/dataflows/76', {
  headers: { 'X-Domo-Developer-Token': TOKEN }
}).then(r => r.json());

// 2. Modify (e.g., update SQL in an action)
etl.actions.find(a => a.type === 'SQL').statements = ['SELECT ...'];

// 3. Save (send full definition back)
await fetch('https://rawso.domo.com/api/dataprocessing/v1/dataflows/76', {
  method: 'PUT',
  headers: { 'X-Domo-Developer-Token': TOKEN, 'Content-Type': 'application/json' },
  body: JSON.stringify(etl)
});

// 4. Trigger a run
await fetch('https://rawso.domo.com/api/dataprocessing/v1/dataflows/76/executions', {
  method: 'POST',
  headers: { 'X-Domo-Developer-Token': TOKEN }
});
```

### ETL Execution States
`CREATED` → `RUNNING_INDEXING` → `SUCCESS` or `FAILED`

### ETL Action Types (Magic ETL v2)
- `LoadFromVault` — input dataset (`dataSourceId` = dataset UUID)
- `SQL` — SQL transform (`statements[]` array, dialect = `MAGIC`)
- `SelectValues` — column rename/select (`fields[]` array)
- `PublishToVault` — output dataset (`dataSource.guid` = output UUID)
- `Filter`, `GroupBy`, `Join`, `SetColumnType`, `AddConstants`

## Workflow Endpoints

| Action | Method | Endpoint | Status |
|--------|--------|----------|--------|
| List all workflows | GET | `/api/workflow/v1/models?limit=50` | Confirmed |
| Get single workflow | GET | `/api/workflow/v1/models/{id}` | Confirmed |
| Create workflow | POST | `/api/workflow/v1/models` | Confirmed |
| Update workflow | PUT | `/api/workflow/v1/models/{id}` | Not yet tested |
| Delete workflow | DELETE | `/api/workflow/v1/models/{id}` | Confirmed |

## Connector / Stream Endpoints

> Streams are how DOMO connectors ingest data. Each stream = one scheduled
> dataset ingestion. Transport types: `CONNECTOR` (external) or `API` (push).

### Data Providers (Connectors)
| Action | Method | Endpoint | Status |
|--------|--------|----------|--------|
| List all providers | GET | `/api/data/v1/providers?limit=50&offset=0` | Confirmed — 3,292 providers |
| List connector types | GET | `/api/data/v1/connectors?limit=50` | Confirmed |

**Key provider keys:**
| Key | Description |
|-----|-------------|
| `api` | API Push — upload CSV/data programmatically |
| `json5` | JSON Connector |
| `instagram-business` | Instagram Business |
| `microsoft-onedrive-business` | OneDrive Business |
| `ms-sql-server` | MS SQL Server |
| `bamboo-hr` | BambooHR |
| `facebook` | Facebook Pages |
| `linkedInV2` | LinkedIn v2 |
| `tik-tok-account` | TikTok Account |

### Streams

> **Dual-path note:** There are two streams APIs. The internal API
> (`rawso.domo.com/api/data/v1/streams`) uses the developer token and is what
> we use. There is also a public API (`api.domo.com/v1/streams`) that requires
> OAuth client credentials. Both access the same underlying streams but have
> different auth and slightly different response shapes. Use the internal path
> unless you need the public API for an external integration.

| Action | Method | Endpoint | Status |
|--------|--------|----------|--------|
| List streams | GET | `/api/data/v1/streams?limit=50` | Confirmed |
| Get single stream | GET | `/api/data/v1/streams/{streamId}` | Confirmed |
| Create stream | POST | `/api/data/v1/streams` | Requires specific payload |
| Get executions | GET | `/api/data/v1/streams/{streamId}/executions` | Confirmed |
| Change update mode | PATCH | `/v1/streams/{streamId}` | Confirmed |

### Change Dataset Update Mode
Use the public API to change a stream’s update method (REPLACE → APPEND or vice versa):
```bash
curl -X PATCH -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "https://api.domo.com/v1/streams/{streamId}" \
  -d '{"updateMethod": "APPEND"}'
```
Valid values: `REPLACE`, `APPEND`

### Push Data Upload (API streams)

Upload data programmatically to an API-type dataset:

```javascript
// 1. Create an execution (open a transaction)
const exec = await fetch('https://rawso.domo.com/api/data/v1/streams/{streamId}/executions', {
  method: 'POST',
  headers: { 'X-Domo-Developer-Token': TOKEN }
}).then(r => r.json());
// → { streamId, executionId, currentState: 'ACTIVE' }

// 2. Upload CSV data (can call multiple times with part=1,2,3...)
await fetch(`https://rawso.domo.com/api/data/v1/streams/{streamId}/executions/${exec.executionId}/part/1`, {
  method: 'PUT',
  headers: { 'X-Domo-Developer-Token': TOKEN, 'Content-Type': 'text/csv' },
  body: 'col1,col2\nvalue1,123\nvalue2,456'
});

// 3. Commit (finalize and index)
await fetch(`https://rawso.domo.com/api/data/v1/streams/{streamId}/executions/${exec.executionId}/commit`, {
  method: 'PUT',
  headers: { 'X-Domo-Developer-Token': TOKEN }
});
```

**Note:** Dataset schema must exactly match column count during upload.

## Account/Credential Endpoints

| Action | Method | Endpoint | Status |
|--------|--------|----------|--------|
| List accounts | GET | `/v1/accounts` | Confirmed |

Note: Lists connector credential accounts (OAuth tokens, API keys stored in DOMO’s credential manager). Useful for auditing which credentials are in use.

## In-App Data Fetching (ryuu.js)

For custom apps, use ryuu.js SDK instead of direct API calls:

```typescript
import Domo from 'ryuu.js';

// Dataset by manifest alias
const data = await Domo.get('/data/v1/sales');

// SQL query
const result = await Domo.post('/sql/v1/sales',
  'SELECT SUM(amount) FROM sales',
  { contentType: 'text/plain' }
);

// Multiple datasets in parallel
const [sales, customers] = await Domo.getAll(['/data/v1/sales', '/data/v1/customers']);
```

See pro-code-apps skill for full SDK reference.

## Common Patterns

### Pagination
Most list endpoints support `limit` and `offset`:
```
GET /api/data/v3/datasources?limit=50&offset=0
GET /api/data/v3/datasources?limit=50&offset=50
```

### Error Handling
| Status | Meaning | Action |
|--------|---------|--------|
| 401 | Token expired or invalid | Re-authenticate |
| 403 | Insufficient permissions / not owner | Check scope or ownership |
| 404 | Resource not found | Verify ID |
| 429 | Rate limited | Implement backoff |
| 500 | Server error | Retry with exponential backoff |

### Rawso-Specific Notes
- Cody McCaskill user ID: referenced in ETL ownership
- Jalen Stayton: manages social media connectors
- Jacob Terry: manages HCSS, Spectrum, VisionLink connectors
- Jonathan Helton: manages finance ETLs
- Morgan Mizerak: manages BambooHR and Spectrum finance ETLs

## Endpoint Index

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/data/v3/datasources` | GET | List datasets/ETLs | Confirmed |
| `/api/data/v3/datasources/{id}` | GET | Get dataset | Confirmed |
| `/api/dataprocessing/v1/dataflows` | GET | List ETLs | Confirmed |
| `/api/dataprocessing/v1/dataflows/{id}` | GET/PUT | Get/Edit ETL | Confirmed |
| `/api/dataprocessing/v1/dataflows/{id}/executions` | GET/POST | List/Trigger runs | Confirmed |
| `/api/workflow/v1/models` | GET/POST | List/Create workflows | Confirmed |
| `/api/workflow/v1/models/{id}` | GET/DELETE | Get/Delete workflow | Confirmed |
| `/api/data/v1/providers` | GET | List connectors | Confirmed |
| `/api/data/v1/streams` | GET | List streams | Confirmed |
| `/api/data/v1/streams/{id}/executions` | POST | Start data upload | Confirmed |
| `/v1/streams/{streamId}` | PATCH | Change stream update mode | Confirmed |
| `/v1/accounts` | GET | List credential accounts | Confirmed |

## Known Issues

- `POST /api/dataprocessing/v1/dataflows` returns 403 with developer token.
  Creating new ETLs requires OAuth session or Admin token.
- Stream creation (`POST /api/data/v1/streams`) requires exact payload format
  with `dataSet` key containing `name`, `description`, and `schema.columns`.

<!-- API-specific issues. /learn will add entries here. -->
