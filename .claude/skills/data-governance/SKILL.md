---
name: data-governance
description: >
  Naming conventions, cost awareness, and data lifecycle management for
  DOMO + Snowflake. Covers dataset naming, ETL naming, app naming, column
  standards, refresh frequency cost implications, Snowflake compute costs,
  and dataset proliferation control. Use when creating any new dataset,
  ETL, connector, app, or GitHub repo. Also use when planning refresh
  schedules, evaluating whether a new dataset is needed, or when the user
  mentions "naming", "governance", "cost", "Snowflake credits", or
  "refresh schedule".
---

# Data Governance

Naming conventions, cost management, and data lifecycle standards for
Rawso's DOMO + Snowflake environment.

**Why this matters:** Every dataset refresh, ETL run, and Snowflake query
costs money. DOMO's backend runs on Snowflake — connector refreshes write
to Snowflake, ETLs execute as Snowflake compute, and every output dataset
is Snowflake storage. Thoughtless proliferation of datasets, schedules,
and ETLs directly increases cost.

## Naming Conventions

### Datasets

Use the pipe-delimited format for all DOMO datasets:

| Stage | Format | Example |
|-------|--------|---------|
| Raw (from connector) | `RAW \| {Source} \| {Description}` | `RAW \| Spectrum \| Job Costing` |
| Intermediate (staging) | `INT \| {Domain} \| {Description}` | `INT \| HR \| Employee Dedup` |
| Development output | `DEV \| {Domain} \| {Description}` | `DEV \| Ops \| Cost Code Health` |
| Production output | `PROD \| {Domain} \| {Description}` | `PROD \| Ops \| Cost Code Health` |

**Rules:**
- Pipe delimiter with spaces: ` | ` (not `/`, `-`, or `_`)
- Source names match the connector/system: `Spectrum`, `BambooHR`, `HCSS`, `VisionLink`
- Domain names match the business area: `Ops`, `HR`, `Finance`, `Safety`, `Social`
- Be descriptive — someone scanning Data Center should understand the dataset at a glance
- Never leave a dataset unnamed or with auto-generated names

### ETLs (DataFlows)

```
{description}.etl
```

Examples:
- `jobcostcalculations.etl`
- `employeededup.etl`
- `socialmediarollup.etl`
- `equipmentutilization.etl`

**Rules:**
- Lowercase, no spaces, no underscores
- The `.etl` suffix identifies it as a DataFlow in DOMO's Data Center
- Keep it short but descriptive
- For multi-stage pipelines, add a stage prefix: `stage1.costcodeclean.etl`, `stage2.costcodeenrich.etl`

### Apps (manifest.json `name` field)

Title Case, descriptive multi-word names:
- `Cost Code Health Index`
- `Daily Cost Code Report`
- `HCSS Safety Dashboard`
- `Social Command Center`
- `Equipment Utilization Report`

### GitHub Repos

Kebab-case with `domo-` prefix:
- `domo-cost-code-operations`
- `domo-hcss-safety`
- `domo-social-command-center`
- `domo-utilization-report`

### Dataset Aliases (in manifest.json `datasetsMapping`)

**camelCase**, short, descriptive:
- `costCodeHealth`, `foremanDetail`, `fleetUtilization`
- Social media: abbreviated platform code + camelCase: `igProfile`, `fbInsights`, `liPageStats`, `ttPosts`

### Column / Field Names

| Context | Convention | Example |
|---------|-----------|---------|
| TypeScript interfaces | camelCase | `actualPerUnit`, `utilizationPct` |
| manifest.json field aliases | camelCase | `jobCode`, `startDate` |
| Raw DOMO columns | Accept as-is from source | Don't rename in connector |
| ETL output columns | PascalCase or readable | `Total_Amount`, `Employee_Name` |

**Note:** Raw columns from connectors are inconsistent (camelCase, PascalCase,
snake_case, GUID prefixes). Never rename in the connector — rename in the
ETL where changes are version-controlled and auditable.

### Code Files

| Type | Convention | Example |
|------|-----------|---------|
| React components | PascalCase | `ScopeCard.tsx`, `DetailModal.tsx` |
| Utilities | camelCase | `dataService.ts`, `calculations.ts` |
| TypeScript interfaces | PascalCase with Row/Summary suffix | `CostCodeHealthRow`, `AssetSummary` |
| Hooks | camelCase with `use` prefix | `useDomoData.ts`, `useFilters.ts` |

### Commits

```
type(scope): description
```
Types: `feat`, `fix`, `refactor`, `docs`, `chore`, `style`, `test`
See CLAUDE.md for full convention.

## Cost Awareness

### What Costs Money

| Action | Cost Driver | Impact |
|--------|------------|--------|
| Connector refresh | Snowflake write (rows ingested) | Per-row storage + write compute |
| ETL execution | Snowflake compute (query time) | Proportional to data volume + complexity |
| Dataset storage | Snowflake storage (rows × columns) | Ongoing monthly cost |
| Card/app queries | Snowflake compute (read queries) | Every dashboard load = query |
| Beast Mode calculations | Snowflake compute at query time | Repeated on every card view |

### Refresh Frequency Decision Guide

Before setting a schedule, ask: **How fresh does this data actually need to be?**

| Data Type | Max Staleness | Recommended Schedule | Cost Notes |
|-----------|--------------|---------------------|------------|
| Financial reporting | End of prior business day | Daily (6:00 AM) | Overnight batch = 1 run/day |
| Operational metrics (HCSS) | 4 hours | Every 4 hours | 6 runs/day — justified by field ops need |
| Social media metrics | 24 hours | Daily (early morning) | API rate limits make sub-daily pointless |
| Static reference data | Weeks/months | Weekly or manual only | Don't schedule what doesn't change |
| Real-time dashboards | 15 minutes | Every 15 min | **Expensive** — only if truly needed |

**Rule of thumb:** If nobody would notice a 4-hour delay, don't refresh every 15 minutes.

### ETL Cost Reduction

1. **Filter early** — Reduce row count before joins. A filter tile before
   a join is vastly cheaper than filtering after.
2. **Avoid unnecessary full outer joins** — These produce the maximum rows.
   Use inner or left joins when the business logic allows it.
3. **Push calculations to ETL, not Beast Mode** — A calculation done once
   in the ETL costs compute once per refresh. The same calculation as a
   Beast Mode runs on every single card view by every user.
4. **Pre-aggregate where possible** — If a dashboard only shows monthly
   totals, don't feed it daily detail rows. Aggregate in the ETL.
5. **Reuse staging datasets** — If multiple dashboards need the same
   cleaned/joined data, build one staging ETL that outputs a shared
   `INT |` dataset, then build lightweight output ETLs on top.
6. **Limit SQL tile complexity** — Window functions over large datasets
   (1M+ rows) are expensive. Partition and filter first.

### Dataset Proliferation Control

**Before creating a new dataset, ask:**

1. Does a dataset with this data already exist? (Check Data Center)
2. Can an existing ETL output be reused or extended?
3. Do I really need a separate DEV and PROD dataset, or can I use one
   with a status column?
4. Is this a one-time analysis or an ongoing need? (One-time = don't
   schedule, or use manual refresh)

**Shared datasets are better than duplicates.** Three apps reading from
one `PROD | Ops | Variance Detail` dataset is cheaper than three separate
ETLs producing nearly identical outputs. The survey of Rawso projects shows
this pattern already — `variances` dataset is shared across 3 apps,
`costCodeHealth` across 2.

### Output Dataset Lifecycle

| Stage | When to Create | When to Promote | When to Delete |
|-------|---------------|-----------------|----------------|
| `DEV \|` | During development | After stakeholder sign-off | After PROD is stable |
| `PROD \|` | After QC passes | N/A — this is production | Only if dashboard is decommissioned |
| `INT \|` | When multiple outputs share logic | N/A — stays as shared staging | When no downstream ETLs reference it |

**Never leave orphan datasets.** When decommissioning a dashboard:
1. Identify all datasets it used (check manifest.json)
2. Check if other dashboards also use them (Data Center → lineage)
3. Only delete datasets with zero downstream consumers
4. Disable the connector schedule before deleting

### Snowflake-Specific Notes

- DOMO uses Snowflake as its backend warehouse (Adrenaline mode)
- Every DOMO dataset = a Snowflake table
- ETL tiles compile to Snowflake SQL queries
- Connector refreshes = Snowflake INSERT/REPLACE operations
- Card queries = Snowflake SELECT with compute
- Large datasets (1M+ rows) with complex Beast Modes are the most
  expensive pattern — pre-aggregate in ETL instead
- Partitioned updates (only refresh recent data) are cheaper than
  full REPLACE for large historical datasets

## Governance Checklist

Use this when reviewing any new pipeline or dashboard:

- [ ] Dataset names follow `RAW | / INT | / DEV | / PROD |` convention
- [ ] ETL names follow `{description}.etl` convention
- [ ] Refresh schedules match actual business freshness needs
- [ ] No duplicate datasets — checked Data Center for existing sources
- [ ] Calculations done in ETL, not Beast Mode (where possible)
- [ ] Joins are filtered first — row count reduced before join tiles
- [ ] Shared staging datasets reused (not duplicated per dashboard)
- [ ] Connector failure notifications enabled
- [ ] Output dataset has at least one downstream consumer
- [ ] DEV datasets are cleaned up after PROD promotion

## Known Issues

<!-- Governance-related issues. /learn will add entries here. -->
