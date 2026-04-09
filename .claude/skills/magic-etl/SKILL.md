---
name: magic-etl
description: >
  DOMO Magic ETL design, tile reference, best practices, and debugging.
  Comprehensive reference for all ETL tile types, join strategies, data
  transformation patterns, and scripting tiles. Use when building ETLs,
  debugging transform failures, designing data pipelines, comparing
  raw vs output data, or planning data transformations in DOMO.
---

# DOMO Magic ETL

Reference for building and maintaining DOMO Magic ETL dataflows.

> **March 2026 update:** DOMO announced a redesigned Magic ETL experience
> (new canvas UI, updated tile library). The interface may look different from
> older screenshots. Core tile logic and SQL behavior is unchanged. If you see
> UI elements that don't match this skill, you're likely on the new canvas.

## ETL Design Principles

### Naming Conventions
```
ETL_{Purpose}_{Output}
```
Examples:
- `ETL_Staging_BambooHR_Employees`
- `ETL_Transform_TimeCards_Weekly`
- `ETL_Output_HeadcountDashboard`

For multi-stage pipelines:
```
ETL_Stage1_CleanRaw_{Source}
ETL_Stage2_Join_{Domain}
ETL_Stage3_Output_{Dashboard}
```

### When to Split vs Chain ETLs
| Scenario | Approach |
|----------|----------|
| Simple transform (< 10 tiles) | Single ETL |
| Multiple input sources needing joins | Single ETL with multiple inputs |
| Reusable staging (same clean data feeds multiple outputs) | Separate staging ETL + output ETL |
| Complex pipeline (20+ tiles) | Split into stages for debuggability |
| Different refresh schedules needed | Separate ETLs |

### Update Methods
| Method | Behavior | Best For |
|--------|----------|----------|
| **Replace** | Drops all data, replaces with new batch | Most ETLs; default |
| **Append** | Adds new rows, no deduplication | Log/event data that only grows |
| **Upsert** | Matches on key, updates existing, inserts new | Records that change over time |
| **Partition** | Replaces only matching partition slice | Large datasets where only recent periods change |

### Performance Guidelines
- Keep ETLs under 20 tiles when possible
- Filter early — reduce row count before joins
- Join on indexed/unique columns when possible
- Avoid multiple full outer joins in sequence (row explosion)
- Use SQL tile for complex logic instead of chaining 10+ formula tiles
- Test with a date-filtered subset before running on full data

### Documentation Standards
- Add a description to every ETL (Settings > Description)
- Annotate complex tiles with notes (right-click > Add Note)
- Name tiles descriptively: "Join Employees + Departments" not "Join 1"

## Common Patterns

### Date Spine Pattern
Create a continuous date range to fill gaps in sparse data:
1. **Input:** Any dataset with a date column
2. **SQL tile:** Generate date spine:
   ```sql
   SELECT DATE_ADD('2020-01-01', INTERVAL seq DAY) AS `Date`
   FROM (
     SELECT @row := @row + 1 AS seq
     FROM input_table, (SELECT @row := -1) r
     LIMIT 2000
   ) dates
   ```
3. **Left Join:** Date spine (left) to your data (right) on date column
4. Result: One row per day, nulls where no data exists

### Deduplication Pattern
Remove duplicate records keeping the most recent:
1. **Rank & Window tile:** Partition by unique key, order by date DESC
2. **Filter tile:** Keep only rank = 1
3. Result: One row per unique key (most recent version)

Alternative with SQL tile:
```sql
SELECT * FROM (
  SELECT *, ROW_NUMBER() OVER (
    PARTITION BY `Employee_ID`
    ORDER BY `Updated_Date` DESC
  ) AS rn
  FROM input
) ranked
WHERE rn = 1
```

### Slowly Changing Dimensions
Track historical changes to reference data:
1. **Input:** Current snapshot from connector
2. **Join:** Current vs previous output (left join on business key)
3. **Formula tile:** Compare columns, flag changes
4. **Filter:** Split into changed vs unchanged records
5. **Set values:** Add `Effective_Date`, `Expiry_Date`, `Is_Current` columns
6. **Append:** Combine with historical records

### Aggregation Pattern
Roll up detail to summary:
1. **Group By tile:** Select group columns + aggregate functions
2. Common aggregations: SUM, COUNT, AVG, MIN, MAX, COUNT DISTINCT
3. **Rename columns:** Make aggregated column names readable
   (e.g., `SUM_Amount` → `Total_Amount`)

### Incremental Append with Dedup
Handle append-mode sources without duplicates:
1. **Input:** Append-mode connector dataset
2. **Rank & Window:** Partition by primary key, order by load date DESC
3. **Filter:** Keep rank = 1
4. **Output:** Replace mode (full refresh of deduped data)

## Scripting Tiles

### SQL Tile
MySQL-flavored syntax. SELECT only (no INSERT/UPDATE/DELETE). Supports
JOINs, subqueries, window functions, all standard aggregate/string/date/numeric functions.
Backtick column names with spaces: `` SELECT `My Column` FROM input ``

**CTEs (WITH ... AS) do NOT work** in Magic ETL's SQL tile despite being valid
MySQL 8 syntax. Use subqueries instead:
```sql
-- DON'T: WITH cte AS (SELECT ...) SELECT * FROM cte
-- DO: SELECT * FROM (SELECT ...) AS subquery
```

**CAST types are NOT standard SQL names.** Use these DOMO-specific types:

| DOMO Type | NOT This | Notes |
|-----------|----------|-------|
| `LONG` | ~~BIGINT~~ / ~~INT~~ | Integer type |
| `STRING` | ~~VARCHAR~~ / ~~TEXT~~ | Text type |
| `DOUBLE` | ~~FLOAT~~ | Decimal type |
| `DECIMAL` | | Fixed-precision decimal |
| `DATE` | | Date only |
| `DATETIME` | | Date + time |

Example: `CAST(\`Amount\` AS LONG)` not `CAST(\`Amount\` AS BIGINT)`

**Not supported:** Stored procedures, variables (SET @var), non-SELECT statements, CTEs (WITH).

**When to use SQL vs visual tiles:** Complex CASE WHEN (3+ conditions), multiple
window functions, or pivoting → SQL. Simple filter/join/rename → visual tiles.

### R / Python Scripting Tiles (Beta)
Python (pandas, numpy) and R available. Data I/O via `domomagic` API.
**Gotchas:** LONG→DOUBLE type coercion (NumPy NULL ints), no outbound HTTP, slower than visual tiles.

## Debugging ETLs

### Built-in Debugging Features
- **Run to Here:** Execute dataflow only up to a selected tile (skip downstream)
- **Disable Tiles:** Temporarily turn off a tile without removing it (like commenting out code)
- **Row Count Observability:** Shows row counts at each stage in the canvas

### Reading Execution Logs
1. Open ETL > **Versions** tab > click a run
2. Each tile shows row count in/out — look for unexpected drops
3. Failed tile is highlighted red with error message

### Common Errors and Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| "Column not found" | Schema changed upstream | Re-map input dataset; check connector |
| "Type mismatch" | Joining STRING to LONG | Add Set Column Type tile before join |
| "Null value in non-null column" | Output schema expects non-null | Add COALESCE() or filter nulls before output |
| "Out of memory" | Too much data in one tile | Filter earlier; split into stages |
| "Duplicate column name" | Two inputs have same column name | Rename before join, or use Select Columns after |
| Run hangs / very slow | Full outer join on large datasets | Filter before join; use inner join if possible |

### Type Mismatch Troubleshooting
DOMO column types: STRING, LONG, DOUBLE, DECIMAL, DATE, DATETIME
- **Join keys must match type** — if one side is STRING and other is LONG, add Set Column Type before join
- **Date comparisons** — ensure both sides are DATE/DATETIME, not STRING
- **Number formatting** — "$1,234.56" is a STRING, not a number. Use formula to strip formatting.

### Null Handling
- `NULL + anything = NULL` in formulas
- `NULL` in a GROUP BY creates its own group
- JOINs: NULL never matches NULL (use COALESCE to handle)
- Filter: `WHERE col = 'value'` excludes NULLs. Use `WHERE col = 'value' OR col IS NULL` to include.
- IFNULL(col, default) or COALESCE(col1, col2, default) to replace nulls

### Row Count Validation
After every ETL run, verify:
1. Input row count (from connector dataset)
2. Output row count (from ETL output)
3. Expected relationship:
   - Filter: output <= input
   - Join (inner): output <= MIN(left, right)
   - Join (left): output >= left
   - Join (full outer): output >= MAX(left, right)
   - Group By: output <= input
   - Append: output = SUM(all inputs)

## Tile Reference

For a comprehensive reference of all ETL tile types, their parameters,
and usage examples, read `.claude/skills/magic-etl/tiles/tile-reference.md`.

## ETL > Output Handoff

### Output Dataset Naming
```
PROD | {Domain} | {Description}
```
Examples:
- `PROD | HR | Headcount By Department`
- `PROD | Ops | Equipment Utilization`
- `PROD | Finance | Monthly Spend`

Use `DEV |` prefix during development, promote to `PROD |` after QC.
See data-governance skill for full naming standards and cost guidance.

### Before Building on ETL Output
1. Run the ETL at least once successfully
2. Verify row count matches expectations
3. Check column types (especially dates and numbers)
4. Document the schema in `datasets/` directory
5. Set up failure notifications on the ETL
6. Note the refresh schedule and dependencies

## Social Media ETL Patterns

### Pivoting Unpivoted Connector Data (Denormaliser/Pivot Tile)

Many DOMO connectors output data in long/unpivoted format (one row per metric
per record). Use the Pivot tile to convert to wide format.

**Instagram Post Analytics:** One row per metric per `media_id`. Pivot:
- Group by: `media_id`
- Pivot column: metric name column
- Value column: metric value column

**LinkedIn Video Stats:** 4 rows per video (`VIDEO_VIEW`, `VIEWER`,
`TIME_WATCHED`, `TIME_WATCHED_FOR_VIDEO_VIEWS`). Pivot grouped by `ugcPost`.

### Facebook Multi-Dataset Architecture

Facebook connectors produce multiple datasets that need joining:
- **Page Posts** — base post data. `Object Id` format: `PageID_PostID`
- **Lifetime Metrics** — engagement metrics, joined on post ID
- **Video Metrics** — video-specific metrics, `Object Id` is bare VideoID
- **Video Insights** — detailed video analytics

**Key:** The `Object Id` column in Page Posts links to Videos/Video Insights
but uses different ID formats (PageID_PostID vs bare VideoID). Split the
composite ID before joining.

### Facebook Post Type Classification

`Type` column values in Page Posts:
- `video_inline` — videos AND reels
- `album` — carousels
- `photo` — single image posts
- `cover_photo` — cover photo updates

To distinguish reels from regular videos: check for `/reel/` in the permalink.

### Instagram Post Type Classification

`media_product_type` distinguishes REELS from FEED posts. Both can have
`media_type=VIDEO` — you must use `media_product_type` to tell them apart.

## Known Issues

- `POST /api/dataprocessing/v1/dataflows` returns 403 with developer token.
  Creating new ETLs via API requires OAuth session or Admin token.
  Edit existing ETLs via API works with developer token (if you own the ETL).
- Magic ETL v2 is the current version. V1 ("old Magic ETL") is deprecated.
  All new ETLs should use v2. V1 tiles have slightly different behavior.
- SQL tile: column names are case-sensitive. Always use backticks.
- SQL tile: CTEs and CAST gotchas — see Scripting Tiles section above.
- Large ETLs (50+ tiles) can become unresponsive in the UI. Split into stages.
- **MergeJoin (Join tile) throws `DP-0008` if column names overlap** between
  left and right inputs. Pre-rename overlapping columns with a SelectValues
  (Alter Columns) tile before joining.
- **Filter tile does not support `IS_NOT_NULL`** as a condition type. Workaround:
  use "not equals" (NE) with an empty string, or use a SQL tile with
  `WHERE col IS NOT NULL`.
- **GroupBy tile uses `COUNT_ALL`** as the aggregate type enum in the API,
  not `COUNT`. When building ETLs programmatically, use `COUNT_ALL`.
- **WindowAction (Rank & Window) LAG** uses `type: "OFFSET"` and an `amount`
  field in the API — not a field called `offset`.
- **WindowAction cumulative SUM may not work via API** — if it fails silently,
  fall back to a SQL tile with `SUM(...) OVER (ORDER BY ... ROWS UNBOUNDED PRECEDING)`.

<!-- Additional ETL issues. /learn will add entries here. -->
