---
name: validate-connectors
description: >
  Validate DOMO connector health before building a data pipeline. Checks whether
  connectors are active, columns are still populated, refresh schedules are running,
  and platform APIs haven't deprecated fields. Run this at the start of Phase 2
  (pipeline) to catch data issues before they become app bugs. Use when the user
  says "are connectors working", "validate the data", "check connectors", "is the
  data fresh", "validate connectors", or before building any ETL or app that depends
  on connector data. Also use when a dashboard shows unexpected zeros or nulls that
  might be caused by upstream connector issues.
user-invocable: true
---

# Validate Connectors — Pre-Pipeline Health Check

Before building any pipeline or app, verify that the data feeding it is healthy.
Connector issues are Phase 2's biggest risk — a silently broken connector means
everything downstream produces wrong results.

## When to Run

- Start of Phase 2 (before building ETLs)
- When data looks wrong (unexpected zeros, nulls, or missing rows)
- After a long gap between project sessions (connectors may have broken)
- When building on social media data (platform API deprecations are common)

## Prerequisites

- DOMO API credentials (see credentials skill)
- Dataset IDs for connector outputs (from `/discover` report or `plans/data-mapping.md`)
- Knowledge of which connectors feed the project (from connectors skill)

## Validation Checks

### Check 1: Freshness — Is Data Still Updating?

```bash
TOKEN=$(curl -s -u "$DOMO_CLIENT_ID:$DOMO_CLIENT_SECRET" \
  "https://$DOMO_INSTANCE.domo.com/oauth/token?grant_type=client_credentials&scope=data" \
  | jq -r '.access_token')

# Check last update time
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://api.domo.com/v1/datasets/{DATASET_ID}" \
  | jq '{name, updatedAt, rows}'
```

**Freshness criteria:**
| Schedule | Stale if older than |
|----------|-------------------|
| Every 15 min | 1 hour |
| Hourly | 4 hours |
| Every 4 hours | 12 hours |
| Daily | 48 hours |
| Weekly | 10 days |

If `updatedAt` is older than expected, the connector is likely broken.

### Check 2: Row Count — Is Data Volume Reasonable?

Compare current row count to expected:
- For REPLACE-mode connectors: row count should be roughly stable
- For APPEND-mode connectors: row count should grow over time
- A sudden drop to 0 rows = connector auth failure (common with OAuth tokens)
- A sudden spike = possible duplicate ingestion

### Check 3: Column Population — Are Key Fields Filled?

```bash
# Sample recent data
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://api.domo.com/v1/datasets/{DATASET_ID}/data?limit=20" \
  | head -30
```

Check that critical columns have actual values, not all nulls or zeros.
Platform API deprecations often manifest as columns that used to have data
but now return 0 or null (the connector doesn't error — it just gets empty values).

### Check 4: Deprecation Cross-Reference

Check the connectors skill's "Platform API Deprecations & Breaking Changes"
table for any fields used by this project. Known deprecations as of this writing:

| Platform | Deprecated Field | Date | Replacement |
|----------|-----------------|------|-------------|
| Facebook | `impressions` | Nov 2025 | `page_media_view` (page) or `post_media_view` (post) |
| Facebook | Additional metrics (TBA) | Jun 2026 | Monitor Meta developer changelog |
| Instagram | `impressions` | Mar-Apr 2025 | `views` |

If the project's KPIs depend on deprecated fields, flag immediately — this
requires a KPI redefinition, not just a code fix.

### Check 5: Schema Consistency

Compare the current dataset schema to what's documented in `datasets/` or
`plans/data-mapping.md`. Look for:
- New columns added (usually harmless)
- Columns removed (breaks ETLs and app code)
- Column type changes (e.g., string to number — breaks Beast Modes)
- Column name changes (breaks everything downstream)

## Validation Report

Write results to `qc-reports/connector-validation.md`:

```markdown
# Connector Validation Report
Generated: [date]
Project: [project name]

## Summary
- Connectors checked: X
- Healthy: X | Stale: X | Broken: X
- Deprecated fields in use: X

## Results

### [Connector Name] — [Dataset Name]
- **Dataset ID:** `uuid`
- **Status:** Healthy / Stale / Broken
- **Last updated:** [date] ([X hours/days ago])
- **Row count:** X (expected: ~Y)
- **Key columns populated:** Yes / No — [details]
- **Deprecated fields:** None / [list]
- **Schema drift:** None / [details]
- **Action needed:** None / [what to do]
```

## What to Do When Validation Fails

| Issue | Action |
|-------|--------|
| Stale data (auth expired) | Re-authorize: DOMO UI > Dataset > Settings > Credentials > Re-connect |
| Zero rows | Check connector logs in DOMO. Likely auth failure. |
| Key columns all null/zero | Check deprecation table. May need alternative metric. |
| Schema changed | Update `data-mapping.md`, check downstream ETLs |
| Unexpected row count | Check connector mode (Replace vs Append), look for duplicates |

## Auto-Continue

After validation completes:
- If all connectors healthy: "Connectors validated. Ready to build pipeline."
- If issues found: Present the report and ask user how to proceed before
  continuing to ETL/app work.

Update `project-state.md` with validation results.
