---
name: discover
description: >
  Discover existing DOMO datasets and connectors before planning or building.
  Queries the DOMO API to inventory what data already exists, documents schemas,
  identifies gaps, and writes a discovery report. Run this before /plan-dashboard
  to avoid duplicate connector setup and surface reusable data. Use when the user
  says "what data do we have", "check existing datasets", "discover", "inventory",
  "what's already in DOMO", "search for datasets", or at the start of any project
  where existing data might exist. Also use when transitioning from init to planning
  if the user indicated they have existing connectors or datasets.
user-invocable: true
---

# Discover — Dataset & Connector Inventory

Inventory what already exists in DOMO before building anything new. This saves
hours of manual research and prevents creating duplicate connectors or datasets.

## When to Run

- After `/init`, before `/plan-dashboard` (recommended for all projects)
- When the user says "what data do we have?" or "check existing datasets"
- At the start of Phase 2 if discovery wasn't done during planning
- Whenever someone says "I think we already have that data"

## Prerequisites

Requires DOMO API access via one of:

1. **DOMO MCP Server (preferred)** — If the `domo` MCP server is connected, use its
   native tools directly. No manual auth needed — the MCP server handles authentication.
2. **Manual API** — Fallback if MCP is not available. Requires credentials:
   ```bash
   source ~/.domo-secrets
   # Need: DOMO_CLIENT_ID and DOMO_CLIENT_SECRET (for API)
   # Or: DOMO_TOKEN (for direct token auth)
   ```

## Steps

### Step 1: Get API Access

**If DOMO MCP is available (check for `mcp__domo__*` tools):** Skip this step entirely.
The MCP server authenticates automatically using its configured developer token.

**If MCP is not available (fallback):**
```bash
# Using client credentials
curl -s -u "$DOMO_CLIENT_ID:$DOMO_CLIENT_SECRET" \
  "https://$DOMO_INSTANCE.domo.com/oauth/token?grant_type=client_credentials&scope=data%20dashboard%20user" \
  | jq -r '.access_token'
```
Store the token for subsequent calls. Token expires in ~1 hour.

### Step 2: Search for Existing Datasets

**MCP approach (preferred):**
Use `mcp__domo__DomoSearchDatasets` with relevant search terms. This searches by
dataset name and returns matching IDs and names. Run multiple searches for different
terms related to the project (e.g., "HR", "employee", "headcount").

**Manual API fallback:**
```bash
# List all datasets (paginated, 50 at a time)
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://api.domo.com/v1/datasets?limit=50&offset=0" \
  | jq '.[] | {id, name, rows, columns, createdAt, updatedAt, owner: .owner.name}'
```

**Search strategies:**
- Search by name keyword: filter results for terms related to the project
- Search by owner: find all datasets owned by the connector owner
- Search by data source type: look for RAW_ prefix naming convention

### Step 3: Inspect Dataset Schemas

For each relevant dataset found:

**MCP approach (preferred):**
Use `mcp__domo__DomoGetDatasetMetadata` for metadata (row count, owner, dates)
and `mcp__domo__DomoGetDatasetSchema` for column names and types. Run these in
parallel for multiple datasets.

**Manual API fallback:**
```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://api.domo.com/v1/datasets/{DATASET_ID}" \
  | jq '{name, rows, columns, schema: .schema.columns}'
```

Document:
- Dataset ID (UUID)
- Column names and types
- Row count and last updated timestamp
- Owner and refresh schedule
- Whether it's a RAW connector output, ETL output, or manual upload

### Step 4: Check Connector Health

For datasets connected to external sources, verify:
- Is the connector still active? (check `updatedAt` — stale dates = broken connector)
- Are key columns populated? (sample a few rows)
- Has the row count changed recently? (compare to expected refresh cadence)

**MCP approach (preferred):**
Use `mcp__domo__DomoQueryDataset` to sample data:
```sql
SELECT * FROM table LIMIT 5
```
Use `mcp__domo__DomoGetDatasetMetadata` to check `updatedAt` timestamps.

**Manual API fallback:**
```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://api.domo.com/v1/datasets/{DATASET_ID}/data?limit=5"
```

### Step 5: Write Discovery Report

Save findings to `datasets/discovery-report.md`:

```markdown
# Dataset Discovery Report
Generated: [date]

## Summary
- Datasets found: X
- Connectors active: X
- Potential reuse: X datasets
- Gaps identified: X

## Existing Datasets

### [Dataset Name]
- **ID:** `uuid-here`
- **Owner:** Name
- **Rows:** X | **Last updated:** date
- **Columns:** col1 (type), col2 (type), ...
- **Status:** Active / Stale / Broken
- **Reusable for this project:** Yes / No / Partial
- **Notes:** Any observations

## Gaps
- [Data needed but not found in DOMO]
- [Connector exists but missing needed columns]
- [Dataset exists but schema doesn't match needs]

## Recommendations
- [Which existing datasets to reuse]
- [Which new connectors to set up]
- [Which ETLs to build vs skip]
```

### Step 6: Update Project State

- Add discovered dataset IDs to `plans/data-mapping.md` (if it exists)
- Update `project-state.md` with discovery results
- Log key findings in `decision-log.md`

## Integration with Planning

When `/plan-dashboard` runs after discovery:
- The data mapping step (Step 3) should reference the discovery report
- Known dataset IDs and schemas reduce research time significantly
- Gaps from the discovery report become the pipeline work list

## Known Limitations

- The DOMO API returns max 50 datasets per page — pagination is required for
  large instances. Loop with increasing `offset` until fewer than `limit` results.
- Dataset search is name-based only — there's no content/column search via API.
  You have to fetch schemas individually.
- Connector status isn't directly available via the public API. Infer health from
  `updatedAt` timestamps and row counts.
