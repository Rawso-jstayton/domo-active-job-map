---
name: connectors
description: >
  DOMO connector setup, configuration, scheduling, and troubleshooting.
  Reference for all supported connector types, auth patterns, and data
  ingestion best practices. Use when setting up new data connections,
  configuring refresh schedules, debugging connector failures, or
  planning data pipelines in DOMO.
---

# DOMO Connectors

Reference for configuring and managing DOMO data connectors.

## Connector Types We Use

### BambooHR
- **Auth:** API key (stored in DOMO credentials manager)
- **Datasets pulled:** Employees, Time Off, Job History, Custom Fields
- **Refresh:** Daily at 6:00 AM CST
- **Owner:** Morgan Mizerak
- **Quirks:** Does not include contractor data. Custom fields require
  explicit selection in connector config. Employee photos require
  separate API call.

### HCSS e360
- **Auth:** API key with Bearer token
- **Datasets pulled:** Time cards, equipment, cost codes, projects
- **Refresh:** Every 4 hours
- **Owner:** Jacob Terry
- **Quirks:** API has known outage patterns (502/404 errors during
  maintenance windows). Connector may need manual retry after extended
  outages. Historical data can be very large — use date filters.

### Spectrum
- **Auth:** API key / service account
- **Owner:** Jacob Terry (operations), Morgan Mizerak (finance)
- **Quirks:** Separate connectors for operations vs finance data.

### VisionLink
- **Auth:** API key
- **Owner:** Jacob Terry
- **Datasets pulled:** Equipment telematics, utilization, alerts

### Social Media Connectors
- **Owner:** Jalen Stayton
- **Platforms:**
  - **Instagram Business** (provider key: `instagram-business`) — OAuth, requires Facebook Business Manager
  - **Facebook Pages** (provider key: `facebook`) — OAuth, token expires ~60 days
  - **LinkedIn v2** (provider key: `linkedInV2`) — OAuth
  - **TikTok** (provider key: `tik-tok-account`) — OAuth
  - **YouTube** (provider key: `youtube-reporting`) — OAuth. First run takes 24 hours — dataset will be empty after initial setup, which looks like a failure but is normal.
- **Refresh:** Daily
- **Quirks:** OAuth tokens for social platforms expire. Facebook/Instagram
  tokens last ~60 days. If a connector fails after weeks of working,
  check token expiration first. API rate limits may throttle large pulls.

### Microsoft OneDrive Business
- **Provider key:** `microsoft-onedrive-business`
- **Auth:** OAuth (Microsoft 365)
- **Use case:** File-based data sources (Excel, CSV uploads)

### JSON Connector
- **Provider key:** `json5`
- **Auth:** Varies (API key, Bearer token, or none)
- **Use case:** Generic REST API ingestion for sources without dedicated connectors

### MS SQL Server
- **Provider key:** `ms-sql-server`
- **Auth:** SQL credentials (username/password) or Windows auth
- **Quirks:** Requires DOMO IP whitelist on firewall. Connection string
  must specify port if non-standard.

## Setting Up a New Connector

### Via DOMO UI
1. Navigate to **Data** > **Connectors** (or Appstore > Connectors)
2. Search for the connector type by name
3. Click **Get the Data**
4. **Credentials:** Enter auth credentials (API key, OAuth login, etc.)
   - DOMO stores credentials securely — it does not store user passwords
   - For OAuth: complete the authorization flow in the popup window
5. **Configure:** Select which reports/datasets to pull
   - Choose specific tables, date ranges, or report types
   - Apply any available filters to limit data volume
6. **Schedule:** Set refresh frequency (see Scheduling section)
7. **Run:** Execute initial sync and verify row counts/schema
8. **Name:** Follow naming conventions (see Connector > ETL Handoff)

### Via API
Use the Streams API to create programmatic connectors:
```
POST /api/data/v1/streams
```
See domo-api skill for full endpoint reference.

## Update Mode: REPLACE vs APPEND

Every DOMO connector dataset has an update mode that controls how new data is written.

### REPLACE
Drops all existing data and replaces it with a fresh batch on each run. This is the
default for most connectors. Safe and simple, but loses historical granularity if
the source only provides a sliding window (e.g., Facebook's default 30-day window
means you only ever have the latest 30 days).

### APPEND
Adds new rows without removing old ones. No built-in deduplication. Use for
log/event data that only grows, or when you need to accumulate history beyond the
source's retention window.

### When APPEND Goes Wrong
If you switch a connector from REPLACE to APPEND (or it was APPEND from the start),
you can end up with duplicate data or lose historical context in unexpected ways.
Example: Instagram User Profile on REPLACE mode loses follower count history because
each refresh replaces the single row — but switching to APPEND without a
deduplication ETL creates duplicate snapshots.

### Rule of Thumb
Start with REPLACE unless you have a specific reason to accumulate. If you need
historical snapshots, build an ETL that appends daily snapshots from a REPLACE
source — this gives you accumulation with controlled deduplication.

## Date Range Settings

Many connectors have configurable date ranges that control how far back data is
pulled on each refresh.

- **Facebook default is `yesterday-30`** — only 30 days of data! This must be
  manually extended in connector settings if you need historical data. Nearly every
  Facebook dataset ships with this default.
- Date range directly affects data coverage and costs (wider range = more API
  calls = slower refresh).
- Common formats: `yesterday-30`, `yesterday-90`, `yesterday-365`, `yesterday-730`.
- **Always check and document the date range setting during connector setup**
  (Phase 2 connector audit). Record the setting in the dataset documentation
  under `datasets/`.

## Auth Patterns

### OAuth (Social, Microsoft, Google)
- User authorizes via browser popup during connector setup
- Token stored in DOMO's credential manager
- **Token refresh:** Most OAuth tokens auto-refresh. Facebook/Instagram
  tokens expire ~60 days and require manual re-authorization.
- Re-auth: Dataset > Settings > Credentials > Re-connect

### API Key / Bearer Token (HCSS, BambooHR, custom APIs)
- Key entered during connector setup, stored encrypted in DOMO
- No expiration unless the source rotates keys
- If key is rotated at source, update in DOMO: Dataset > Settings > Credentials

### Service Account (SQL Server, databases)
- Username/password stored in DOMO credential manager
- Requires network access (DOMO cloud IPs must be whitelisted)
- DOMO IP ranges: check https://knowledge.domo.com for current list

### Credential Management
- All credentials stored in DOMO's encrypted credential store
- Credentials are per-account, not per-dataset (one credential can serve multiple datasets)
- Admin > Authentication > Manage Credentials to audit
- When a team member leaves: reassign connector ownership before deactivating their account

## Scheduling Best Practices

### Setting a Schedule
1. Navigate to the dataset > **Settings** > **Scheduling**
2. **Basic:** Choose frequency: Manual, Every 15 min, Hourly, Daily, Weekly, Monthly
3. **Advanced:** Schedule by specific months, days of month, or days of week.
   Combine multiple update times (e.g., weekdays at 6 AM and 6 PM).
4. Set specific time and timezone (always use CST for consistency)
5. Configure retry behavior (DOMO retries failed runs automatically)
6. Enable failure notifications
- Minimum interval: 15 minutes (faster requires DOMO account team)
- Schedule times are stored in UTC but displayed in local timezone

### Schedule Guidelines
| Data Type | Recommended Frequency | Notes |
|-----------|----------------------|-------|
| Financial/HR | Daily (6:00 AM CST) | Before business hours |
| Operational (HCSS) | Every 4 hours | Near-real-time for field ops |
| Social media | Daily (early morning) | API rate limits; overnight processing |
| Static reference data | Weekly or manual | Only when source changes |
| Real-time dashboards | Every 15 min | Use sparingly — costs compute |

### Schedule Dependencies
When connectors feed ETLs, the ETL should be triggered AFTER the connector
completes, not at a fixed time. DOMO supports this via:
- **DataFlow triggers:** Set ETL to run "when input dataset updates"
- **Timed offset:** Schedule ETL 30-60 min after connector (less reliable)

**Dependency chains:**
```
[Connector] runs at 6:00 AM
  → triggers [Staging ETL] (runs on dataset update)
    → triggers [Output ETL] (runs on staging update)
      → [Dashboard cards] auto-refresh
```

### Monitoring & Alerts
- **Per-dataset failure emails:** Dataset > wrench icon > "Send email only
  when this dataset fails to update"
- **Dataset status page:** Data Center > select dataset > History tab
  - Shows run history, success/failure, row counts per run
- **DomoStats connector:** Provides a live dataset tracking all dataset/dataflow
  health metrics. Build a card showing failed datasets, set a DOMO alert when
  failure count > 0. Best centralized monitoring approach.
- **Governance Toolkit:** (Enterprise) Audit execution time, last refresh,
  error state across all datasets and DataFlows
- **Alert-based monitoring (recommended):**
  1. Enable DomoStats connector (or Governance Datasets for enterprise)
  2. Build a card showing failed datasets/dataflows
  3. Set a DOMO alert on that card (failure count > 0)
  4. Configure alert to send email or Slack/Teams notification
- **DataFlow notifications:** NOT enabled by default. Must enable per-DataFlow
  in Data Center settings.

## Common Issues

### Token/Auth Expiration
- **Symptom:** Connector that worked for weeks suddenly fails
- **Cause:** OAuth token expired (especially Facebook/Instagram ~60 days)
- **Fix:** Re-authorize: Dataset > Settings > Credentials > Re-connect

### Network/Firewall Blocks
- **Symptom:** Connection timeout or refused
- **Cause:** Source system firewall not whitelisting DOMO IPs
- **Fix:** Add DOMO cloud IP ranges to source firewall allowlist

### Schema Drift
- **Symptom:** Connector pulls different columns than expected, or ETL breaks
- **Cause:** Source system added/removed/renamed columns
- **Fix:** Update connector config to match new schema. Update downstream
  ETLs and cards. Check Beast Mode calculations that reference changed columns.

### Rate Limiting (API-based connectors)
- **Symptom:** Partial data, HTTP 429 errors in connector logs
- **Cause:** Source API rate limits exceeded
- **Fix:** Reduce refresh frequency, add date filters to limit data volume,
  or contact source provider for higher rate limits.

### Duplicate Data
- **Symptom:** Row counts growing unexpectedly
- **Cause:** Connector set to APPEND mode instead of REPLACE
- **Fix:** Check dataset update method (Replace vs Append). For append-mode
  connectors, add deduplication in the downstream ETL.

### HCSS-Specific Issues
- 502/404 errors during maintenance windows (usually brief)
- Retry manually or wait for next scheduled run
- If persistent, check HCSS system status page

## Connector > ETL Handoff

### Naming Conventions for Connector Output Datasets
```
RAW | {Source} | {ReportName}
```
Examples:
- `RAW | BambooHR | Employees`
- `RAW | HCSS | TimeCards`
- `RAW | Instagram | Post Metrics`
- `RAW | Spectrum | Equipment`

See data-governance skill for full naming standards.

### Schema Expectations
Before building ETLs on connector output:
1. **Verify row count** — does it match the source?
2. **Check column types** — DOMO may auto-detect incorrectly (e.g., ZIP codes as numbers)
3. **Document the schema** — save to `datasets/` directory in the project
4. **Note update method** — Replace or Append affects ETL design
5. **Check for nulls** — identify which columns can be null

### What NOT to Do
- Don't build cards directly on RAW_ datasets — always ETL first
- Don't rename columns in the connector — do it in the ETL
- Don't filter data in the connector if you might need the filtered data later

## Platform API Deprecations & Breaking Changes

Track platform-side changes that affect DOMO connector data. When a source
API deprecates a field, the connector still runs but returns nulls or zeros
for that field — it doesn't error. This makes deprecations invisible until
someone notices bad data.

### Active Deprecations

| Platform | Change | Date | Impact |
|----------|--------|------|--------|
| Facebook (Meta) | `impressions` metric deprecated | Nov 2025 | Returns 0; use `page_media_view` (page-level) or `post_media_view` (post-level) instead |
| Facebook (Meta) | June 2026 deprecation wave — additional metric deprecations expected | Jun 2026 | Details TBA; monitor Meta developer changelog |
| Instagram (Meta) | `impressions` metric deprecated | Mar-Apr 2025 | Returns 0; use `views` instead |

### How to Handle
1. Check this table before building any pipeline on social connector data
2. If a KPI depends on a deprecated field, flag it during planning (Phase 1)
3. Document the replacement metric in `plans/kpis.md` with the deprecation reason
4. When a new deprecation is discovered, add it here via `/learn`

## Connector Column Gotchas

Connector column names and semantics aren't always obvious. Document surprises here.

- **LinkedIn `followerCounts_organicFollowerCount`:** Contains daily gains
  (deltas), NOT cumulative totals. To get total followers, you must sum this
  column over time or use a separate API call.
- **Instagram/Facebook:** The DOMO connector joins multiple API endpoints
  into a single dataset (e.g., post metrics + page metrics). Column prefixes
  indicate the source endpoint.
- **Facebook Page Posts `Type` column values:** `video_inline` (videos+reels),
  `album` (carousels), `photo`, `cover_photo`. Reels are `video_inline` with
  `/reel/` in the permalink.
- **Instagram `media_product_type`:** Distinguishes REELS from FEED posts.
  Both can be `media_type=VIDEO` — use `media_product_type` to tell them apart.
- **YouTube Reporting Connector first run takes 24 hours** — dataset will be
  empty after initial setup. This is normal behavior, not a failure.
- **SharePoint connectors** — refresh is currently manual only. The "Update Now"
  button in DOMO doesn't trigger an actual SharePoint data pull.

## Accessing DOMO Connector Documentation

DOMO's support/knowledge base pages are rendered behind Salesforce Community
infrastructure. Web scraping or fetching returns only CSS/framework code, not
actual content. To get connector documentation:
- **Preferred:** Search DOMO Community forum threads (community.domo.com)
- **Alternative:** Use Playwright with full browser rendering
- **Fallback:** Query a working DOMO dataset's schema via the API to reverse-engineer column meanings

## Provider Keys Reference

| Provider Key | Connector |
|-------------|-----------|
| `instagram-business` | Instagram Business |
| `facebook` | Facebook Pages |
| `linkedInV2` | LinkedIn v2 |
| `tik-tok-account` | TikTok |
| `youtube-reporting` | YouTube Reporting |
| `microsoft-onedrive-business` | Microsoft OneDrive Business |
| `json5` | JSON Connector |
| `ms-sql-server` | MS SQL Server |
