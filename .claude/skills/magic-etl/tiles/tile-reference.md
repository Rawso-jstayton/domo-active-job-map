# Magic ETL Tile Reference

Comprehensive reference for every tile type in DOMO's Magic ETL v2.

## Input/Output Tiles

### DataSet Input
- **Purpose:** Load a dataset into the ETL as a source
- **Config:** Select dataset by name or ID
- **Notes:** Multiple inputs supported per ETL. Input datasets trigger ETL
  re-runs when they update (if "run on update" is enabled).

### DataSet Output
- **Purpose:** Write ETL results to an output dataset
- **Config:** Select existing dataset or create new. Choose update method:
  Replace, Append, Upsert, or Partition.
- **Notes:** Output dataset name should follow `PROD_` or `INT_` naming convention.
  Schema is defined by the columns flowing into this tile.

### Fixed Input
- **Purpose:** Add data directly onto the canvas (manual entry, paste, CSV upload, or AI-generated)
- **Use case:** Lookup tables, test data, small reference datasets

### Documents Tile
- **Purpose:** Extract structured information from document collections into dataflows

## Combine Tiles

### Join
- **Purpose:** Combine two datasets by matching columns
- **Join types:**

| Type | Returns | Use When |
|------|---------|----------|
| **Inner** | Only matching rows from both | You only want records that exist in both datasets |
| **Left Outer** | All left rows + matching right | You want all records from primary dataset, enriched with lookup data |
| **Right Outer** | All right rows + matching left | Inverse of left (rarely used — just swap inputs) |
| **Full Outer** | All rows from both, matched where possible | You need the complete picture from both datasets |
| **Left Anti** | Left rows with NO match in right | Find missing/unmatched records |
| **Right Anti** | Right rows with NO match in left | Find records in right not present in left |

- **Config:** Select join columns from each input. Multiple join conditions supported (AND logic).
- **Best practices:**
  - Put the table with unique keys as the LEFT input
  - Ensure join columns are the same data type (use Set Column Type first if needed)
  - Filter before joining to reduce row counts
  - NULL never matches NULL — use COALESCE if needed
- **Gotchas:**
  - Duplicate column names from both inputs cause issues — rename before join or select after
  - Joining on non-unique columns creates row multiplication (cartesian effect)
  - Full outer joins on large datasets are slow and memory-intensive

### Split Join
- **Purpose:** Join two datasets and split the output into matched and unmatched streams
- **Config:** Same as Join, but produces two outputs: matched rows and unmatched rows
- **Use case:** Process matched and unmatched records differently downstream

### Append Rows
- **Purpose:** Stack datasets vertically (UNION ALL)
- **Config:** Select two or more input datasets
- **Notes:** Columns are matched by name. Columns not present in all inputs
  become NULL for those rows. Column types should match across inputs.
- **Gotcha:** This is UNION ALL (keeps duplicates). For UNION DISTINCT,
  add a Remove Duplicates tile after.

### Zip Rows
- **Purpose:** Combine rows side-by-side from two datasets based on row position
  (row 1 with row 1, row 2 with row 2, etc.)
- **Notes:** Does NOT match on keys — purely positional. Use when datasets have
  the same row count and a meaningful row order.

## Filter Tiles

### Filter Rows
- **Purpose:** Keep or remove rows based on conditions
- **Config:** Add one or more conditions with AND/OR logic
- **Operators:** equals, not equals, greater than, less than, contains,
  starts with, ends with, is null, is not null, in list
- **Notes:** Multiple conditions can be combined with AND (all must match)
  or OR (any must match). Nested logic supported.
- **Gotcha:** NULL values are excluded by equality filters. To include NULLs,
  add explicit "OR is null" condition.

### Split Filter
- **Purpose:** Route rows to two different outputs based on a condition
- **Config:** Same as Filter, but produces "Yes" and "No" output streams
- **Use case:** Process qualifying vs non-qualifying records differently

### Remove Duplicates
- **Purpose:** Keep only unique rows
- **Config:** Select which columns define uniqueness
- **Notes:** When duplicates exist, keeps the FIRST occurrence (order
  depends on input order). For control over which duplicate to keep,
  use Rank & Window + Filter instead.

## Transform Tiles

### Set Column Type
- **Purpose:** Change column data types
- **Types:** STRING, LONG, DOUBLE, DECIMAL, DATE, DATETIME
- **Config:** Select column, choose target type, specify format for dates
- **Date formats:** `yyyy-MM-dd`, `MM/dd/yyyy`, `yyyy-MM-dd HH:mm:ss`, etc.
- **Critical use:** Always use before joins if column types don't match.
  STRING "123" won't join to LONG 123 without conversion.
- **Gotcha:** Invalid conversions produce NULL (e.g., "abc" to LONG → NULL)

### Add Formula Column
- **Purpose:** Create a new calculated column
- **Syntax:** Uses DOMO's expression language (similar to MySQL)
- **Common formulas:**
  ```
  CONCAT(`First_Name`, ' ', `Last_Name`)
  CASE WHEN `Status` = 'Active' THEN 1 ELSE 0 END
  DATEDIFF(`End_Date`, `Start_Date`)
  ROUND(`Amount` * `Rate`, 2)
  IFNULL(`Department`, 'Unassigned')
  YEAR(`Hire_Date`)
  UPPER(TRIM(`Name`))
  ```
- **Notes:** Backtick column names with spaces. Formula creates a NEW column;
  use Rename/Replace to overwrite an existing column.

### Date Operations
- **Purpose:** Extract or manipulate date components
- **Operations:**
  - Extract: Year, Month, Day, Hour, Minute, Day of Week, Week of Year
  - Calculate: Date Diff, Date Add, Date Subtract
  - Format: Convert date to string in specified format
  - Truncate: Round date to start of day/week/month/quarter/year
- **Gotcha:** Date operations on NULL dates return NULL.
  DOMO's week starts on Sunday by default.

### Text Operations
- **Purpose:** String manipulation without writing formulas
- **Operations:** Uppercase, Lowercase, Trim, Left, Right, Substring,
  Replace, Split, Pad, Concatenate
- **Use case:** Quick transforms; for complex string logic, use Formula or SQL tile.

### Value Mapper
- **Purpose:** Map input values to output values (lookup table)
- **Config:** Define mapping pairs: "A" → "Active", "I" → "Inactive"
- **Notes:** Supports a default value for unmatched inputs. Useful for
  code-to-description translations.

### Constant Column
- **Purpose:** Add a column with a fixed value for every row
- **Config:** Column name + value
- **Use case:** Tagging data source (e.g., `Source` = "BambooHR") before appending datasets

### Split Column
- **Purpose:** Split a single column into multiple columns based on a delimiter
- **Config:** Source column, delimiter character, number of output columns
- **Use case:** Splitting "City, State" into separate columns

### Replace Text
- **Purpose:** Search and replace text within string columns
- **Config:** Column, search string, replacement string

### Calculator
- **Purpose:** Basic arithmetic operations between columns (+, -, *, /)
- **Use case:** Quick math without writing a formula expression

### Combine Columns
- **Purpose:** Merge values from multiple columns into one with a separator
- **Config:** Select columns, choose delimiter
- **Use case:** Creating composite keys, full names from first + last

## Aggregate Tiles

### Group By
- **Purpose:** Aggregate data by one or more group columns
- **Config:** Select group columns + aggregate functions per value column
- **Aggregations:** SUM, COUNT, AVG, MIN, MAX, COUNT DISTINCT,
  FIRST, LAST, MEDIAN, STDDEV, VARIANCE
- **Notes:** Every non-grouped column must have an aggregate function.
  NULL values in group columns create their own group.
- **Performance:** COUNT(DISTINCT) on large datasets is slow. If possible,
  deduplicate first and use COUNT.

### Rank & Window
- **Purpose:** Add ranking or window calculations
- **Functions:**
  - **Rank functions:** ROW_NUMBER, RANK, DENSE_RANK, NTILE
  - **Value functions:** LAG, LEAD, FIRST_VALUE, LAST_VALUE
  - **Running calculations:** Running SUM, Running COUNT, Running AVG
- **Config:** Partition By (groups) + Order By (sort within groups)
- **Common use:** Deduplication (ROW_NUMBER partitioned by key, filter rank=1),
  period-over-period comparisons (LAG), running totals.

### Pivot
- **Purpose:** Rotate rows into columns
- **Config:** Row identifier column, pivot column (values become column headers),
  value column + aggregate function
- **Use case:** Turn monthly rows into Jan/Feb/Mar columns
- **Gotcha:** Too many unique values in the pivot column creates too many
  columns (limit: reasonable is < 50 pivot values)

### Unpivot
- **Purpose:** Rotate columns into rows (reverse of pivot)
- **Config:** Select columns to unpivot, name for the key column and value column
- **Use case:** Transform wide format (Jan, Feb, Mar columns) to long format
  (Month, Value columns)

## Scripting Tiles

### SQL Tile
- **Dialect:** MySQL-flavored (also supports basic Redshift syntax)
- **Supported:** SELECT, JOIN, subqueries, window functions, aggregations
- **NOT supported:** CTEs (`WITH ... AS`), stored procedures, variables, non-SELECT statements
- **CAST types:** Use LONG (not BIGINT), STRING (not VARCHAR), DOUBLE (not FLOAT), DECIMAL, DATE, DATETIME
- **Input tables:** Referenced by their tile input names (appear as table names)
- **Best for:** Complex transformations that would require 5+ visual tiles
- See main SKILL.md for full function reference.

### R Script Tile (Beta)
- **Purpose:** Run R code for statistical analysis
- **Libraries:** Standard R libraries available
- **Use case:** Statistical models, advanced analytics
- **Performance:** Slower than visual tiles

### Python Script Tile (Beta)
- **Purpose:** Run Python code for data science
- **Libraries:** pandas, numpy, scikit-learn available
- **Use case:** ML scoring, complex parsing, API calls within ETL

## Utility Tiles

### Select Columns
- **Purpose:** Choose which columns to keep (drop the rest)
- **Config:** Check/uncheck columns
- **Best practice:** Use after joins to remove duplicate/unnecessary columns.
  Reduces data volume for downstream tiles.

### Alter Columns (Rename)
- **Purpose:** Rename columns
- **Config:** Old name → New name mapping
- **Best practice:** Rename to human-readable names before the output tile.
  Follow column naming conventions (no SQL reserved words, descriptive names).

### Dynamic Unpivot
- **Purpose:** Unpivot columns matching a pattern
- **Config:** Regex or prefix/suffix pattern for columns to unpivot
- **Use case:** When column names change dynamically (e.g., dates as column headers)

### Collapse Columns
- **Purpose:** Combine multiple columns into one
- **Config:** Select columns, choose delimiter
- **Use case:** Creating composite keys, concatenating address fields

### Order
- **Purpose:** Sort data by one or more columns (ascending or descending)
- **Notes:** Place before Limit tile for "top N" queries

### Limit
- **Purpose:** Restrict output to a specified number of rows
- **Use case:** Top N queries (combine with Order), testing with subset

### JSON Expander
- **Purpose:** Break down JSON from a single column into multiple columns
- **Config:** Navigable hierarchy — expand nested objects/arrays into flat columns
- **Use case:** API response data, nested connector output

### Meta Select
- **Purpose:** Dynamically rename columns, filter by name or type, apply expressions across columns
- **Use case:** When column names aren't known in advance or change between runs

### Schema
- **Purpose:** Access schema information (column names, types) within the dataflow

## Data Science Tiles

### AI Text Generation
- **Purpose:** Process text fields using AI to summarize, categorize, or extract information
- **Use case:** Classify support tickets, extract entities, summarize descriptions

### Forecast
- **Purpose:** Generate time-series predictions
- **Config:** Date column, value column, forecast periods
- **Notes:** Simple built-in forecasting — for advanced models, use Python/R tiles

### Outlier Detection
- **Purpose:** Flag statistical outliers
- **Config:** Select numeric column, set threshold (standard deviations)
- **Output:** Original data + outlier flag column

## API Action Type → UI Tile Name Mapping

When building ETLs programmatically via the dataprocessing API, tiles use
internal action type names that differ from the UI. Key mappings:

| API Action Type | UI Tile Name | Notes |
|----------------|-------------|-------|
| `LoadFromVault` | DataSet Input | `dataSourceId` = dataset UUID |
| `PublishToVault` | DataSet Output | `dataSource.guid` = output UUID |
| `SQL` | SQL Tile | `statements[]`, dialect = `MAGIC` |
| `SelectValues` | Alter Columns / Select Columns | `fields[]` for rename/select |
| `MergeJoin` | Join | Throws DP-0008 if column names overlap |
| `Filter` | Filter Rows | Does NOT support IS_NOT_NULL |
| `GroupBy` | Group By | Aggregate enum: `COUNT_ALL` (not `COUNT`) |
| `WindowAction` | Rank & Window | LAG uses `type: "OFFSET"` + `amount` field |
| `Denormaliser` | Pivot | Group column + pivot column + value column |
| `Normalizer` | Unpivot | |
| `NormalizeAll` | Dynamic Unpivot | |
| `ExpressionEvaluator` | Add Formula Column | |
| `SetColumnType` | Set Column Type | |
| `AddConstants` | Constant Column | |
| `ConcatFields` | Combine Columns | |
| `DateCalculator` | Date Operations | |
| `Metadata` | Schema | |
| `Unique` | Remove Duplicates | |
| `Order` | Order | |

## Notes on Tile Behavior

### Null Propagation
- `NULL + 5 = NULL`, `CONCAT(NULL, 'text') = NULL`
- Use IFNULL() or COALESCE() to handle NULLs in calculations
- Group By: NULLs form their own group
- Join: NULL never matches NULL
- Filter: `col = 'x'` excludes NULLs; add `OR col IS NULL` to include them
- Sort: NULLs sort first in ascending order

### Type Coercion
- Implicit coercion happens in some contexts but is unreliable
- Always explicitly set column types before joins or comparisons
- STRING "123" ≠ LONG 123 for join purposes
- DATE "2024-01-15" ≠ STRING "2024-01-15" for comparison

### Date Handling
- Internal format: `yyyy-MM-dd` for DATE, `yyyy-MM-dd HH:mm:ss` for DATETIME
- Week starts on Sunday (default)
- DATEDIFF returns days (not hours/minutes)
- Timezone: DOMO stores dates in UTC internally. Display timezone is user-specific.
- Date arithmetic: use DATE_ADD/DATE_SUB, not direct number addition

### String Comparison
- Case-sensitive by default in filters and joins
- Use UPPER() or LOWER() on both sides for case-insensitive matching
- Leading/trailing whitespace affects matching — TRIM() first
- Empty string '' ≠ NULL
