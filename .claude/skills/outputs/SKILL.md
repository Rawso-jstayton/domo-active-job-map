---
name: outputs
description: >
  DOMO output configuration — writeback connectors, scheduled exports, and
  output datasets. Use when setting up data exports from DOMO, configuring
  writeback to external systems, scheduling report delivery, or planning
  the output stage of a data pipeline.
---

# DOMO Outputs

Reference for configuring data outputs and exports from DOMO.

## Which Output Approach to Use

| Need | Approach |
|------|----------|
| Push DOMO data to an external system (S3, Snowflake, Sheets, etc.) | Writeback connector |
| Email a dashboard or card on a schedule | Scheduled Report |
| Give a stakeholder a one-time data export | Manual export (CSV/Excel from UI) |
| Pull data from DOMO into another system via code | Dataset Export API |
| Share dashboards across DOMO instances | DOMO Publish |
| Surface data to a custom app within DOMO | PROD_ output dataset + ryuu.js |

The most common output pattern at Rawso: ETL → PROD_ dataset → pro code app.
Writeback connectors are used when external systems need DOMO data (e.g.,
pushing processed HR data back to Spectrum, or exporting to a data warehouse).

## Writeback Connectors

Writeback connectors push DOMO datasets OUT to external systems (the reverse
of standard connectors which pull data IN).

### What They Do
- Take a DOMO dataset as input
- Push data to a third-party storage, database, or application
- Can be scheduled on a recurring basis
- Bi-directional data flow: connectors pull in, writeback pushes out

### Available Writeback Destinations

**Cloud Storage:**
- Amazon S3
- Google Cloud Storage
- Azure Blob Storage
- Box
- Dropbox
- SFTP

**Databases:**
- Amazon Redshift
- Amazon Aurora
- Google BigQuery
- Snowflake
- Microsoft SQL Server
- MySQL
- PostgreSQL

**Applications:**
- Salesforce
- HubSpot
- Google Sheets
- Microsoft Excel Online

**Other:**
- Firebase
- Elasticsearch
- Custom API (via JSON writeback)

### Setting Up a Writeback Connector
1. Navigate to **Data** > **Connectors** > search "Writeback"
2. Select the destination (e.g., "Amazon S3 Writeback")
3. **Credentials:** Configure auth for the destination system
4. **Select dataset:** Choose the DOMO dataset to push
5. **Configure mapping:** Map dataset columns to destination fields (if applicable)
6. **Schedule:** Set how often to push (manual, hourly, daily, etc.)
7. **Test:** Run once and verify data arrives at destination

### Custom Writeback
For destinations without a built-in connector:
- Use **Build Your Own Writeback Connector** (DOMO developer feature)
- Or use the DOMO API to export data + a DOMO Workflow to push to external API
- Or use Code Engine functions for custom push logic

## Scheduled Reports

### Email Delivery
DOMO can email cards and dashboards on a schedule:

1. Navigate to the card or dashboard
2. Click **Share** > **Schedule Delivery**
3. Configure:
   - **Recipients:** Email addresses or DOMO groups
   - **Frequency:** Daily, Weekly, Monthly, or custom cron
   - **Format:** Inline (card image in email body) or attachment
   - **Attachment formats:** PDF, CSV, Excel
4. Set time and timezone
5. Enable/disable

### Export Formats
| Format | Best For | Notes |
|--------|----------|-------|
| **PDF** | Executive summaries, printable reports | Card rendered as image |
| **CSV** | Raw data for external analysis | All rows, no formatting |
| **Excel** | Formatted data for business users | Includes headers, basic formatting |
| **PowerPoint** | Presentation-ready slides | Dashboard cards as slides |

### Manual Export
From any card or dataset:
- **Card:** Click card menu > **Export** > choose format
- **Dataset:** Data Center > select dataset > **Export** > CSV or Excel
- **API:** `GET /v1/datasets/{id}/data` with `Accept: text/csv` header

## Data Export API

### Export Dataset as CSV
```
GET https://api.domo.com/v1/datasets/{datasetId}/data?includeHeader=true&fileName=export.csv
Headers:
  Authorization: Bearer {token}
  Accept: text/csv
```

### Export with Query (filtered export)
```javascript
const result = await fetch('https://api.domo.com/v1/datasets/query', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + accessToken,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    dataSetId: 'abc-123',
    sql: "SELECT * FROM table WHERE Report_Date >= '2024-01-01'"
  })
});
```

### SDK Export Methods
- **Python:** `domo.ds_export(dataset_id)` or `domo.ds_export_to_file(dataset_id, filepath)`
- **PHP:** `$domo->exportDataSet($id, $includeHeader)`

## Output Datasets

### Naming Convention
```
PROD_{Domain}_{Description}
```
Output datasets are the final, clean, card/app-ready datasets:
- `PROD_HR_HeadcountByDepartment`
- `PROD_Ops_EquipmentUtilization`
- `PROD_Finance_MonthlyBudgetVsActual`

### How Outputs Differ from Raw/Intermediate
| Aspect | RAW_ | INT_ | PROD_ |
|--------|------|------|-------|
| Source | Connector | ETL (staging) | ETL (final) |
| Consumers | ETLs only | Other ETLs | Cards, apps, reports |
| Schema | As-is from source | Cleaned, typed | Final, documented |
| PDP | Usually none | Usually none | Applied if needed |
| Naming | Source-oriented | Process-oriented | Business-oriented |

### Retention
- RAW_ datasets: retained as long as connector is active
- INT_ datasets: retained as long as pipeline is active
- PROD_ datasets: retained indefinitely (unless project is decommissioned)
- TEMP_ datasets: audit monthly, delete if unused

## DOMO Publish

Share data and content across DOMO instances (multi-instance deployments):

### What It Does
- Push dashboards, cards, and datasets from one DOMO instance to another
- Useful for: parent company sharing with subsidiaries, agencies sharing with clients
- Maintains data freshness — published content updates when source updates

### Setup
1. **Sender instance:** Navigate to Publish > create a Publication
2. Select content to publish (dashboards, cards, datasets)
3. **Receiver instance:** Accept the subscription
4. Configure mapping (users, groups, access)

### Considerations
- Requires both instances to have Publish feature enabled
- PDP policies do NOT transfer — must be reconfigured on receiver
- Schema changes on sender can break receiver content
- Network latency affects refresh timing

Rawso does not currently use DOMO Publish. Document specifics here via `/learn` when first used.

## Pipeline Output Validation

Before any output goes to production, verify:

### Row Count Check
```
Source row count → ETL output row count
```
Expected relationships depend on ETL logic (see magic-etl skill for details).

### Schema Validation
- All expected columns present
- Column types correct (especially dates and numbers)
- No unexpected nulls in required columns

### Data Freshness
- Output dataset `lastUpdated` timestamp is recent
- Compare against connector last-run time
- Alert if output is stale (> 24 hours for daily pipelines)

### Cross-Reference with Source
- Spot-check specific records: same values in source and output?
- Aggregate check: do totals match between source and output?
- Date range check: does output cover expected time period?

### Automated Validation
Set up a validation ETL or DOMO alert:
- Card that shows "last updated" timestamp for each critical dataset
- Alert when any PROD_ dataset is > 24 hours stale
- Row count trend card to detect unexpected drops

## Known Issues

- Writeback connectors require separate licensing in some DOMO plans
- Scheduled report emails may land in spam — whitelist DOMO's sending domain
- CSV exports from the API require the `Accept: text/csv` header or you get 406
- Large dataset exports (millions of rows) may timeout via API — use Streams API
  to export in chunks instead
- DOMO Publish does not sync PDP policies — must be manually configured on
  each receiving instance
