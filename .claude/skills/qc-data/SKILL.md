---
name: qc-data
description: >
  Data quality validation — compare raw connector datasets to output datasets,
  row count validation, schema drift detection, ETL break detection, and data
  type verification. Use during Phase 2 (pipeline) after ETLs are built, when
  data discrepancies are suspected, or as part of the full-qc workflow. Also
  use when the user says "check the data", "validate", "row count", "data
  doesn't match", or "ETL is wrong".
user-invocable: true
---

# QC Data — Data Validation

Validate data integrity across the pipeline: source > connector > ETL > output.

## DOMO MCP Integration

If the `domo` MCP server is connected (`mcp__domo__*` tools available), prefer MCP
tools over manual API calls for all data validation:

| Validation Task | MCP Tool | Replaces |
|----------------|----------|----------|
| Row counts | `mcp__domo__DomoQueryDataset` with `SELECT COUNT(*)` | Manual fetch API |
| Schema checks | `mcp__domo__DomoGetDatasetSchema` | Manual schema endpoint |
| Null analysis | `mcp__domo__DomoQueryDataset` with NULL queries | Manual SQL via API |
| Spot checks | `mcp__domo__DomoQueryDataset` with specific WHERE | Manual data export |
| Freshness | `mcp__domo__DomoGetDatasetMetadata` for `updatedAt` | Manual metadata fetch |
| Find datasets | `mcp__domo__DomoSearchDatasets` | Paginated API listing |

The MCP tools handle authentication automatically. When MCP is not available,
fall back to the manual API approaches documented below.

## Validation Steps

### 1. Row Count Validation

Compare row counts at each pipeline stage.

**MCP approach (preferred):**
Use `mcp__domo__DomoQueryDataset` for each dataset in the pipeline:
```sql
SELECT COUNT(*) as row_count FROM table
```

**Manual API fallback:**
```javascript
// Get dataset row count via API
const getRowCount = async (datasetId) => {
  const response = await fetch(
    `https://rawso.domo.com/api/data/v3/datasources/${datasetId}`,
    { headers: { 'X-Domo-Developer-Token': TOKEN } }
  );
  const data = await response.json();
  return data.rows; // Row count
};
```

**Expected relationships by ETL operation:**

| Operation | Expected Output Rows |
|-----------|---------------------|
| Filter | output <= input |
| Inner Join | output <= MIN(left, right) |
| Left Join | output >= left (can be more if right has duplicates) |
| Full Outer Join | output >= MAX(left, right) |
| Group By | output <= input |
| Append/Union | output = SUM(all inputs) |
| Deduplicate | output <= input |
| 1:1 transform | output = input |

**Variance threshold:** 0% for Replace-mode datasets. For Append-mode,
allow timing variance (connector may have added rows between checks).

**Quick validation query:**
```sql
SELECT COUNT(*) as row_count FROM dataset
```

### 2. Schema Validation

Verify schemas match expected definitions:

```javascript
// Get dataset schema via API
const getSchema = async (datasetId) => {
  const response = await fetch(
    `https://rawso.domo.com/api/data/v3/datasources/${datasetId}`,
    { headers: { 'X-Domo-Developer-Token': TOKEN } }
  );
  const data = await response.json();
  return data.schema?.columns || [];
  // Each column: { name, type } where type is STRING/LONG/DOUBLE/DECIMAL/DATE/DATETIME
};
```

**Check for:**
- All expected columns present (compare against documented schema in `datasets/`)
- No unexpected columns added (schema drift from source)
- Data types correct:
  - IDs that look numeric but should be STRING (ZIP codes, SSNs)
  - Dates stored as STRING instead of DATE/DATETIME
  - Currency as DOUBLE instead of DECIMAL
- Column names haven't changed (breaks downstream cards/ETLs)

**Schema drift detection:**
Compare current schema against the documented baseline in `datasets/`.
If columns were added/removed/renamed, flag for review.

### 3. Data Completeness

Check for gaps and missing data:

**Null analysis:**
```sql
SELECT
  COUNT(*) as total_rows,
  SUM(CASE WHEN Employee_ID IS NULL THEN 1 ELSE 0 END) as null_employee_id,
  SUM(CASE WHEN Department IS NULL THEN 1 ELSE 0 END) as null_department,
  SUM(CASE WHEN Hire_Date IS NULL THEN 1 ELSE 0 END) as null_hire_date
FROM dataset
```

**Date range completeness:**
```sql
SELECT MIN(Report_Date) as earliest, MAX(Report_Date) as latest,
  COUNT(DISTINCT Report_Date) as distinct_dates,
  DATEDIFF(MAX(Report_Date), MIN(Report_Date)) + 1 as expected_dates
FROM dataset
```
If `distinct_dates < expected_dates`, there are gaps in the time series.

**Category completeness:**
```sql
SELECT Department, COUNT(*) as cnt
FROM dataset
GROUP BY Department
ORDER BY cnt
```
Verify all expected departments/categories are present. Compare against
a known-good reference list.

**Foreign key integrity:**
```sql
-- Find orphaned records (detail references that don't match master)
SELECT d.Department_ID, COUNT(*) as orphaned_rows
FROM detail_dataset d
LEFT JOIN master_dataset m ON d.Department_ID = m.Department_ID
WHERE m.Department_ID IS NULL
GROUP BY d.Department_ID
```

### 4. Data Accuracy Spot Checks

Verify specific known records against source:

1. **Pick 3-5 specific records** with known values from the source system
2. **Query the output dataset** for those records
3. **Compare field by field** — do values match?

```sql
-- Spot check specific employee
SELECT * FROM dataset WHERE Employee_ID = '12345'
```

**Aggregation verification:**
```sql
-- Compare detail sum to aggregated total
SELECT SUM(Amount) as detail_total FROM detail_dataset
-- Should match:
SELECT Total_Amount FROM summary_dataset WHERE Period = '2024-Q1'
```

**Cross-reference totals:**
Pull the same metric from the source system's own reports and compare
against the DOMO output. Discrepancies indicate ETL logic issues.

### 5. ETL Logic Verification

Validate specific transformation results:

**Join multiplication check:**
```sql
-- If row count increased after a join, check for duplicates in join key
SELECT join_key, COUNT(*) as cnt
FROM right_table
GROUP BY join_key
HAVING COUNT(*) > 1
```

**Filter verification:**
```sql
-- Verify no excluded records slipped through
SELECT COUNT(*) FROM output_dataset WHERE Status = 'Inactive'
-- Should be 0 if the ETL filters out inactive records
```

**Calculation spot check:**
```sql
-- Verify a computed field
SELECT
  Raw_Amount,
  Tax_Rate,
  Computed_Tax,
  ROUND(Raw_Amount * Tax_Rate, 2) as Expected_Tax,
  CASE WHEN ABS(Computed_Tax - ROUND(Raw_Amount * Tax_Rate, 2)) > 0.01
    THEN 'MISMATCH' ELSE 'OK' END as Status
FROM output_dataset
LIMIT 10
```

**Type conversion check:**
```sql
-- Find values that failed type conversion (became NULL)
SELECT * FROM output_dataset
WHERE Numeric_Column IS NULL
AND Source_Text_Column IS NOT NULL
LIMIT 10
```

### 6. Data Freshness Check

Verify data is current:

```javascript
const getLastUpdated = async (datasetId) => {
  const response = await fetch(
    `https://rawso.domo.com/api/data/v3/datasources/${datasetId}`,
    { headers: { 'X-Domo-Developer-Token': TOKEN } }
  );
  const data = await response.json();
  return data.updatedAt; // ISO timestamp
};
```

**Freshness rules:**
| Pipeline Type | Max Acceptable Staleness |
|--------------|------------------------|
| Daily refresh | 26 hours (allows for schedule variance) |
| 4-hour refresh | 5 hours |
| Real-time | 30 minutes |

If stale, check: connector schedule, ETL trigger, upstream failures.

## Reporting

Save to `qc-reports/data-qc-[date].md`:

```markdown
# Data QC Report — [date]

## Pipeline: [connector] > [ETL] > [output]
Dataset IDs: [source] > [intermediate] > [output]

### Row Counts
| Stage | Count | Expected | Status |
|-------|-------|----------|--------|
| Source/Connector | X | X | PASS/FAIL |
| ETL Output | X | X | PASS/FAIL |

### Schema Check
| Column | Expected Type | Actual Type | Status |
|--------|--------------|-------------|--------|
| [name] | [type] | [type] | PASS/FAIL |
Drift detected: [yes/no, details]

### Completeness Check
- Null analysis: [results]
- Date range: [earliest] to [latest], [gaps found?]
- Categories: [all present? / missing: X, Y]

### Spot Check Results
| Record | Field | Expected | Actual | Status |
|--------|-------|----------|--------|--------|
| [ID] | [field] | [value] | [value] | PASS/FAIL |

### Freshness
| Dataset | Last Updated | Threshold | Status |
|---------|-------------|-----------|--------|
| [name] | [timestamp] | [max age] | PASS/FAIL |

### Overall: [PASS / FAIL]
[Summary and any issues found]
```

## When Data QC Fails

1. **Identify the stage** where the discrepancy first appears
2. **Check the stage before it** — is the input to the failing stage correct?
3. **Trace the issue:**
   - If connector stage: check connectors skill > Common Issues
   - If ETL stage: check magic-etl skill > Debugging ETLs
   - If schema drift: check if source system changed
4. **Fix and re-run:**
   - Fix the root cause (connector config, ETL logic, source issue)
   - Re-run the pipeline
   - Re-run data QC to verify fix
5. **Log the issue** in decision-log.md with cause and resolution

## Automated Data QC

For ongoing monitoring (not just one-time QC):

1. **Build a QC ETL** that runs after each pipeline refresh:
   - Input: output dataset
   - SQL tile: run row count, null checks, freshness queries
   - Output: QC metrics dataset
2. **Build a QC card** on the metrics dataset showing pass/fail status
3. **Set a DOMO alert** on the QC card to notify when any check fails
4. See connectors skill > DomoStats for centralized monitoring

## Known Issues

- DOMO API row counts may lag slightly behind actual data for very large datasets
- Query API has SQL syntax limitations — some subqueries not supported
- Freshness checks via API return the metadata update time, which may differ
  from the actual data refresh completion time by a few minutes
