---
name: datasets
description: >
  DOMO dataset management, API reference, schema handling, PDP policies,
  fusion datasets, and partitioning. Use when creating datasets, modifying
  schemas, setting up personalized data permissions, querying datasets via
  API, debugging data issues, or planning data architecture in DOMO.
---

# DOMO Datasets

Reference for managing datasets in DOMO.

## DOMO MCP Integration

When the `domo` MCP server is connected (`mcp__domo__*` tools available), use MCP
tools for common dataset operations before falling back to manual API calls:

| Operation | MCP Tool | Notes |
|-----------|----------|-------|
| Find datasets by name | `mcp__domo__DomoSearchDatasets` | Search by keyword |
| Get dataset metadata | `mcp__domo__DomoGetDatasetMetadata` | Row count, owner, dates |
| Get dataset schema | `mcp__domo__DomoGetDatasetSchema` | Column names and types |
| Query dataset (SQL) | `mcp__domo__DomoQueryDataset` | SELECT queries against data |

MCP handles auth automatically. For CRUD operations (create, update, delete) and
the Streams API, use the manual API below — MCP doesn't cover write operations yet.

## Dataset API

**Base URL:** `https://api.domo.com/v1` (public API) or `https://rawso.domo.com/api/data/v3` (internal API)
**Auth:** See domo-api skill for authentication methods.

### CRUD Operations

| Action | Method | Endpoint | Notes |
|--------|--------|----------|-------|
| Create dataset | POST | `/v1/datasets` | Returns dataset object with ID |
| Get dataset info | GET | `/v1/datasets/{id}` | Full metadata |
| Update metadata | PUT | `/v1/datasets/{id}` | Name, description, schema |
| Delete dataset | DELETE | `/v1/datasets/{id}` | Permanent — cannot undo |
| List datasets | GET | `/v1/datasets` | Paginated; use limit/offset |
| Import data (CSV) | PUT | `/v1/datasets/{id}/data` | CSV body, replaces all data |
| Export data (CSV) | GET | `/v1/datasets/{id}/data` | Returns CSV content |
| Query dataset | POST | `/v1/datasets/query` | SQL-like query syntax |

### Create Dataset Example
```javascript
const response = await fetch('https://api.domo.com/v1/datasets', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + accessToken,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'PROD_HR_Headcount',
    description: 'Employee headcount by department, updated daily',
    schema: {
      columns: [
        { name: 'Department', type: 'STRING' },
        { name: 'Employee_Count', type: 'LONG' },
        { name: 'Report_Date', type: 'DATE' }
      ]
    }
  })
});
```

### Export Dataset Example
```javascript
const csv = await fetch(`https://api.domo.com/v1/datasets/${datasetId}/data?includeHeader=true&fileName=export.csv`, {
  headers: {
    'Authorization': 'Bearer ' + accessToken,
    'Accept': 'text/csv'  // Required — returns 406 without this
  }
}).then(r => r.text());
```

### Query API
```javascript
const result = await fetch('https://api.domo.com/v1/datasets/query', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + accessToken,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    dataSetId: 'abc-123-def',
    sql: 'SELECT Department, COUNT(*) as cnt FROM table GROUP BY Department'
  })
});
```

**Supported SQL:** SELECT, WHERE, GROUP BY, ORDER BY, HAVING, LIMIT,
JOINs (within same dataset), aggregate functions, CASE WHEN.
**Not supported:** DDL statements, stored procedures, subqueries in some contexts.

### Streams API (Large Datasets)
For datasets > 50MB, use the Streams API for chunked uploads:
1. Create execution: `POST /api/data/v1/streams/{streamId}/executions`
2. Upload parts: `PUT .../executions/{execId}/part/{partNum}` (CSV body)
3. Commit: `PUT .../executions/{execId}/commit`

Two modes: **REPLACE** (overwrite all data) or **APPEND** (add to existing).
Parts can be uploaded in parallel and retried individually.
See domo-api skill for full endpoint reference.

## Schema Management

### Column Types
| Type | Use For | Examples |
|------|---------|---------|
| STRING | Text, codes, IDs that aren't numeric | Names, status codes, UUIDs |
| LONG | Whole numbers | Counts, IDs (numeric), years |
| DOUBLE | Decimal numbers | Amounts, percentages, rates |
| DECIMAL | Precise decimal (financial) | Currency amounts needing exact precision |
| DATE | Dates without time | `2024-01-15` |
| DATETIME | Dates with time | `2024-01-15 14:30:00` |

### Column Naming Rules
- Max 64 characters (including spaces)
- **Never** use SQL reserved words: DATE, Year, Month, Day, Order, Group, Select, Table, Index
  - Instead use: `Report_Date`, `Fiscal_Year`, `Month_Name`, `Sort_Order`
- Use descriptive names: `Shipping_Date` not just `Date`
- Underscores for multi-word names in raw/ETL datasets
- Spaces acceptable in output datasets for display (e.g., "Employee Count")

### Schema Change Impact
Changing column names or types can break:
- **Downstream cards** — chart mappings reference column names
- **Beast Mode calculations** — formulas reference column names
- **ETLs** — input mappings expect specific columns
- **PDP policies** — filter on specific column names

**Safe schema change process:**
1. Identify all downstream consumers (cards, ETLs, Beast Modes)
2. Use Beast Mode Manager to audit formula dependencies
3. Make the change
4. Update all downstream references
5. Test each card/ETL

### Schema at Creation vs Modification
- Schema defined at dataset creation (via API or connector)
- Adding columns: generally safe — downstream consumers ignore extra columns
- Removing columns: breaks anything referencing the removed column
- Renaming columns: same impact as remove + add (breaks references)
- Type changes: may break cards/ETLs expecting the old type

## Personalized Data Permissions (PDP)

### When to Use PDP
- Multiple user roles need different data visibility on the same dataset
- Sensitive data (salary, PII) should only be visible to authorized users
- Client-specific data in a multi-tenant dataset
- Regional data that should be filtered by user's territory

### Policy Types

**Row Policies** — Filter rows so users/groups only see applicable data:
- Define a column + value(s) that determine visibility
- Users assigned to a policy see only rows matching their policy values
- Multiple policies on the same user: user sees the UNION of all policy rows

**Column Masking** — Hide some or all data in a column:
- Mask PII columns (SSN, salary) from unauthorized users
- Partial masking available (show last 4 digits)

### Simple PDP Setup
1. Navigate to dataset > **PDP** tab
2. Enable PDP (toggle on)
3. Create a policy: name it, select filter column, set filter value(s)
4. Assign users or groups to the policy
5. Test: use "View As" to verify what each user sees

### Dynamic PDP
Uses Trusted Attributes from user profiles for automatic filtering:
1. Admin defines Trusted Attributes in Admin Settings
2. Lock the attributes (required before use in PDP)
3. On the dataset, create a Dynamic PDP policy:
   - Select dataset column (e.g., `Region`)
   - Map to user attribute (e.g., `user.region`)
4. DOMO auto-filters: each user sees only rows where dataset column matches their attribute

**Custom attributes:** Support multi-valued attributes (IdP-driven or manually set).
**User List Attributes:** Allow list-based matching for complex access patterns.

### PDP Best Practices
- Admin users see ALL data by default (even with PDP enabled)
- Always test with "View As" for non-admin users
- PDP affects alerts — alert triggers respect the alert owner's PDP policies
- Document PDP policies in the dataset description
- Don't rely on PDP alone for truly sensitive data — consider separate datasets

### PDP Automation
For large-scale PDP management:
- Create a configuration dataset defining policies
- Use DOMO's Governance Toolkit for automated PDP management
- Jobs run on schedule or when config dataset updates
- Can also manage via API (JavaScript/Node.js scripts)

## Fusion Datasets

> **DEPRECATED:** DataFusion is deprecated. Use Magic ETL for all new data combining tasks.

**What it was:**
- **Add Columns** — join two+ datasets by matching columns (like SQL join)
- **Add Rows** — union datasets by stacking rows

**Replacement:** Magic ETL Join tile (for Add Columns) or Append Rows tile (for Add Rows).
For simple column lookups, Dataset Views may also work.

## Filesets

Rawso does not currently use DOMO Filesets. All data comes through
connectors or API. If file-based ingestion is needed in the future:
- Filesets support CSV, Excel, and other file uploads as data sources
- Can be scheduled or manual
- Integrate with ETLs as input datasets

## Dataset Update Methods

| Method | Behavior | Best For |
|--------|----------|----------|
| **Replace** | Drops all data, replaces with new | Default; small-medium datasets |
| **Append** | Adds new rows, no dedup | Log/event data that only grows |
| **Upsert** | Match on key, update existing, insert new | Records that change occasionally |
| **Partition** | Replace only matching partition slice | Large datasets, only recent periods change |

### Partition Details
- Data divided by a partition column value (day, month, year)
- New data matching an existing partition replaces that partition
- New partition values are appended
- Max 1,500 partitions per dataset
- Enables faster queries and reduces ETL run times

## Dataset Naming Conventions

| Prefix | Meaning | Example |
|--------|---------|---------|
| `RAW_` | Raw connector output, no transforms | `RAW_BambooHR_Employees` |
| `INT_` | Intermediate (ETL staging output) | `INT_Staged_TimeCards` |
| `DEV_` | Under development/audit | `DEV_HeadcountCalc` |
| `PROD_` | Production-ready, used for cards/apps | `PROD_HR_Headcount` |
| `TEMP_` | Test/ad-hoc, review periodically | `TEMP_JoinTest_March` |

### Naming Rules
- Use underscores, not spaces
- No date ranges in names (they go stale with automated schedules)
- No `/` or `\` in names
- Include a description: what data, update frequency, owner
- Always designate a dataset owner

## Known Issues

- `Accept: text/csv` header is **required** when exporting via API.
  Without it, DOMO returns HTTP 406.
- COUNT(DISTINCT) and SUM(DISTINCT) are processing-intensive and slow
  cards on large datasets. Deduplicate in ETL instead.
- Column names matching SQL reserved words cause issues in Beast Mode
  and Query API. Always use descriptive names.
- Schema changes on connector datasets can silently break downstream ETLs
  if column names change. Monitor connector schemas after source system updates.
