---
name: cards
description: >
  Beast mode calculations, chart properties, card interactions, and
  visualization best practices for standard DOMO cards. Rawso primarily
  builds pro code apps — use this skill specifically for beast mode
  formula syntax, card-level alerts, or when a native card is the right
  tool. Triggers on "beast mode", "card builder", "chart type",
  "visualization", "calculated field", or "card alert".
---

# DOMO Cards

Reference for standard DOMO card creation and configuration.

> **Rawso builds pro code apps, not standard DOMO cards.** This skill is
> the reference for two things standard cards do that pro code apps don't:
> **Beast Mode calculated fields** and **card-level alerts**. If you need
> visualization logic, use the `design-system` and `pro-code-apps` skills.
> If you genuinely need a native card (e.g., a quick metric for a stakeholder
> or an alert on a dataset), this skill covers it fully.

## When to Use a Native Card vs Pro Code App

| Use native card | Use pro code app |
|-----------------|-----------------|
| Simple KPI or summary number | Complex interactivity or custom layout |
| Quick alert on a dataset metric | Cross-dataset joins in the UI layer |
| Stakeholder needs an email-deliverable card | Custom filtering logic or variables |
| Beast Mode is sufficient for the calculation | Need ryuu.js SDK (Domo.get, filters, variables) |
| One-off metric, not worth a full build cycle | Part of a designed dashboard system |

## Card Types

### KPI / Summary Number
- **When to use:** Single metric at a glance
- **Config:** Value field, comparison period (vs previous period/year),
  trend arrow, summary number format
- **Best for:** Executive dashboards, top-of-page metrics

### Bar Chart
- **When to use:** Comparing categories or discrete values
- **Variants:** Vertical, horizontal, stacked, grouped, waterfall
- **When horizontal:** Category labels are long text
- **When stacked:** Showing part-to-whole within categories

### Line Chart
- **When to use:** Trends over time (continuous data)
- **Config:** Date axis, value axis, multi-series for comparison
- **Variants:** Line, area, stepped, smoothed
- **When area:** Emphasizing volume/magnitude over trend shape

### Pie / Donut
- **When to use:** Part-to-whole with 2-5 segments
- **When NOT to use:** More than 6 segments, similar-sized segments,
  comparing across time. Prefer bar charts in most cases.

### Table
- **When to use:** Detailed data, many dimensions, drill-down starting point
- **Config:** Sorting, conditional formatting, column visibility
- **Best practice:** Keep to 5-7 columns max. Use conditional formatting
  to highlight important values.

### Gauge / Radial
- **When to use:** Progress toward a known target
- **Config:** Min/max ranges, color bands, target line
- **Note:** Only effective when the target is clear and meaningful

### Map
- **When to use:** Geographically distributed data
- **Variants:** Choropleth (filled regions), bubble map, lat/long points
- **Needs:** Geography column (state, country, ZIP) or lat/long coordinates

### Scatter Plot
- **When to use:** Relationship between two numeric variables
- **Config:** X axis, Y axis, optional size/color dimensions
- **Best for:** Correlation analysis, outlier detection

### Combo Chart
- **When to use:** Two related metrics with different scales
  (e.g., revenue bars + margin % line)
- **Config:** Primary and secondary Y axes

## Beast Mode Calculations

Beast Modes are calculated fields defined at the card or dataset level.
They use SQL-like syntax and compute at query time.

### Syntax Basics
- SQL-like expressions (similar to MySQL)
- Backtick column names: `` `Column Name` ``
- Single-quote strings: `'Active'`
- Beast Modes can reference other Beast Modes

### Common Patterns

**Year-over-Year:**
```sql
SUM(CASE WHEN YEAR(`Date`) = YEAR(CURDATE()) THEN `Revenue` ELSE 0 END)
-
SUM(CASE WHEN YEAR(`Date`) = YEAR(CURDATE()) - 1 THEN `Revenue` ELSE 0 END)
```

**Percentage of Total:**
```sql
SUM(`Revenue`) / SUM(SUM(`Revenue`)) OVER ()
```

**Running Total:**
```sql
SUM(SUM(`Revenue`)) OVER (ORDER BY `Date` ROWS UNBOUNDED PRECEDING)
```

**Conditional Aggregation:**
```sql
SUM(CASE WHEN `Status` = 'Active' THEN 1 ELSE 0 END) / COUNT(*) * 100
```

**Date Calculations:**
```sql
DATEDIFF(CURDATE(), `Hire_Date`) / 365.25  -- Tenure in years
DATE_FORMAT(`Date`, '%Y-%m')                -- Year-Month grouping
LAST_DAY(`Date`)                            -- End of month
```

**Null Handling:**
```sql
IFNULL(`Department`, 'Unassigned')
COALESCE(`Preferred_Name`, `First_Name`, 'Unknown')
```

**String Manipulation:**
```sql
CONCAT(`First_Name`, ' ', `Last_Name`)
UPPER(LEFT(`Department`, 1))  -- First letter capitalized
```

### Beast Mode Scope
- **Card-level:** Only available on that card. Travels with the card.
- **Dataset-level:** Available to all cards using that dataset.
  Copied when card switches datasets.
- Use dataset-level for reusable calculations; card-level for one-offs.

### Performance Notes
- `COUNT(DISTINCT)` and `SUM(DISTINCT)` are slow on large datasets.
  Deduplicate in the ETL instead.
- Avoid nested aggregations when possible.
- Beast Modes compute at query time — complex formulas slow down card rendering.

## Chart Properties

### Axis Formatting
- Number format: use DOMO's built-in formatters (K, M, B abbreviations)
- Date axis: auto-grouping (day/week/month) or explicit
- Axis labels: rotate if overlapping; hide if chart is small

### Color Rules
- Follow design-system skill color palette
- Use conditional coloring sparingly (red/green for threshold comparisons)
- Never use color as the only differentiator (accessibility)

### Data Labels
- Show on bar/pie charts when few data points (< 8)
- Hide when many data points (clutter)
- Format: match axis format (same abbreviations)

### Tooltips
- Always include: metric name, value, date/category
- Format numbers consistently with axis

## Card Interactions

### Filters
- **Page-level filters:** Apply across all cards on a dashboard page
- **Card-level filters:** Apply only within the card's Analyzer view
- **Filter cards:** Dedicated filter selector cards (date range, dropdown)

### Drill Paths
- Configure drill hierarchies: Region > State > City > Store
- Each drill level filters the card to the selected value
- Drill paths work across card types

### Card-to-Card Linking
- Click a value on one card to filter related cards
- Configure via Interaction settings on the card

## Card Alerts

### Alert Types
| Type | Triggers When |
|------|--------------|
| **Threshold** | Metric crosses a defined value (>, <, =) |
| **Change** | Metric changes by amount or percentage |
| **Trend** | Metric trends up/down for N consecutive periods |
| **Intelligent** | AI detects anomaly from learned patterns |

### Configuration
1. Open card > alert bell icon (or Card Options > Alerts)
2. Choose alert type
3. Configure rule (metric, operator, threshold)
4. Set recipients (email, Buzz, Slack, mobile push)
5. Set frequency (every occurrence, daily digest)

### Conventions
- All stakeholder-facing dashboards must have threshold alerts on critical KPIs
- Alert recipients documented in project plans
- Alert thresholds discussed with stakeholders during planning phase
- Data refresh failure alerts configured separately (see connectors skill)

## Conventions

### Titles
- Clear, descriptive: "Monthly Revenue by Region" not "Chart 1"
- Include the metric and primary dimension
- Don't include the date range in the title (it changes with filters)

### Descriptions
- Add a description to every card explaining what it shows and why
- Include: data source, update frequency, calculation methodology if complex

### Colors
- Per design-system skill: use the 8-color chart sequence
- #F36E22 for accents only, never as a chart series color

## Known Issues

- **Beast Mode `COUNT(DISTINCT)` performance degrades on datasets > 1M rows**
  Workaround: Deduplicate in the ETL instead — add a Group By tile that
  counts distinct values and output as a pre-aggregated column. Reference
  the pre-computed column in your Beast Mode or card directly.

- **Drill paths don't preserve page-level filters in all card types**
  Workaround: Use card-to-card interactions (Interaction settings) instead
  of drill paths when page-level filter preservation is critical. For
  drill-heavy dashboards, test each card type's drill behavior before
  committing to the layout.

- **Card alerts on Beast Mode fields may have delayed triggering**
  Workaround: For time-sensitive alerts, create an ETL that computes the
  Beast Mode calculation as a real column in the output dataset, then set
  the alert on that column instead. Alerts on physical columns trigger
  reliably on each data refresh.

- **Map cards require clean geography data — misspellings cause missing regions**
  Workaround: Add a standardization step in the ETL (e.g., a lookup table
  or Value Mapper tile) that normalizes geography values before they reach
  the output dataset. Common fixes: state abbreviations → full names,
  trim whitespace, fix known misspellings.
