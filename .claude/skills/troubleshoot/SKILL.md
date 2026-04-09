---
name: troubleshoot
description: >
  Structured debugging for DOMO development issues. Checks common failure
  points for connectors, ETLs, CLI, pro code apps, data discrepancies, and
  GitHub Actions deploys. Use when something breaks, errors appear, data
  doesn't match, a card won't render, CLI fails, or the user says "help",
  "it's broken", "error", "not working", "debug", or "troubleshoot".
user-invocable: true
---

# Troubleshoot — Structured Debugging

Systematically diagnose and resolve DOMO development issues.

## Triage

Ask the user (or infer from context):

1. **What were you doing when it broke?** (first run, after a change, randomly)
2. **What's the exact error?** (copy/paste the message if possible)
3. **What changed recently?** (new deploy, schema update, credentials rotated)

Then route to the matching section below.

---

## Connector Issues

### Symptoms
- Connector shows red/failed status in DOMO
- Dataset not refreshing or stuck on last-run timestamp
- Partial data / fewer rows than expected

### Error Lookup

| Error | Cause | Fix |
|-------|-------|-----|
| `401 Unauthorized` / `403 Forbidden` | API key or OAuth token expired | Re-authenticate in DOMO Data Center → Accounts |
| `502 Bad Gateway` / `503` | Source system down | Wait and retry |
| `Connection timed out` | Source slow or network issue | Retry; contact source admin if persistent |
| `Schema mismatch` / `Column not found` | Source API changed structure | Re-discover schema in connector config |
| `Rate limit exceeded` | Too many API calls | Reduce refresh frequency |
| `Token expired` (social) | OAuth ~60 day TTL | Re-authorize in DOMO UI |

### Fix Procedure
- **Auth error:** Re-authenticate in DOMO Data Center → Accounts → Edit/Re-authorize
- **Schedule issue:** Check Data Center → Datasets → Settings tab
- **Schema change:** Re-discover in connector config, check downstream ETLs
- Full connector reference: `connectors` skill

---

## Magic ETL Issues

### Symptoms
- ETL shows red/failed, wrong row count, or empty output

### Error Lookup

| Error | Cause | Fix |
|-------|-------|-----|
| `Column not found: [name]` | Input schema changed | Update upstream connector or fix tile column reference |
| `Cannot cast [type] to [type]` | Type mismatch | Add Set Column Type tile before the failing tile |
| `Null value in non-nullable column` | Join key or field has nulls | Filter nulls or use COALESCE |
| `Divide by zero` | Denominator column has zeros | Wrap in `CASE WHEN val = 0 THEN NULL ELSE val END` |
| `Input dataset has 0 rows` | Upstream connector returned empty | Fix the connector first |
| `Timeout` / `Execution limit` | Dataset too large or ETL too complex | Filter early to reduce working set; split into stages |

### Row Count Issues
- **Too many rows:** Cross join or many-to-many. Deduplicate or verify join key uniqueness.
- **Too few rows:** Inner join dropping unmatched rows, or overly restrictive filter. Try Left join.
- **Zero rows:** Check each input has data, walk tiles left-to-right checking row counts.
- **Not running on schedule:** Check DataFlows → Settings. Try Run Now to isolate schedule vs logic.
- Full ETL reference: `magic-etl` skill

---

## CLI / Publish Issues

### Symptoms
- `domo publish` fails, `domo dev` won't start, wrong version published

### Quick Fixes
- **Auth:** `domo login` (or `domo login -i rawso.domo.com -t TOKEN` for CI)
- **Manifest errors:** See `cli-setup` skill for correct structure
- **Build failures:** `pnpm build && pnpm tsc --noEmit` — fix reported errors
- **ryuu.js import error:** Use `import Domo from 'ryuu.js'` not CDN global `domo`
- **Design not found:** Check `id` in `public/manifest.json` matches DOMO Asset Library
- **Duplicate apps in Asset Library:** Missing `id` field in manifest.json. See cli-setup skill for fix and cleanup.
- **`da apply-manifest` not found:** Run `npm install -g @domoinc/da` to install the DA CLI globally.

---

## GitHub Actions / Deploy Issues

### pnpm setup order (common)
pnpm must be installed BEFORE Node setup:
```yaml
- uses: pnpm/action-setup@v4      # ← FIRST
  with: { version: 9 }
- uses: actions/setup-node@v4     # ← then Node
  with: { node-version: '20', cache: 'pnpm' }
- run: pnpm install --frozen-lockfile
```

### Required Secrets
`DOMO_TOKEN` + `DOMO_INSTANCE` (full domain `rawso.domo.com`). See git-deploy
skill for full secrets table and credentials skill for format details.

### CI Build Failures
- **`da: not found`** — DA CLI not installed in CI. Use `npx vite build` directly, skip prebuild hooks.
- **`.tmp/manifest.json` missing** — Fresh checkout doesn't have `.tmp/`. Add `mkdir -p .tmp && cp public/manifest.json .tmp/manifest.json` before build.
- **`build` script not found** — Monorepo: `pnpm build` from root won't work. Set `working-directory` to app subdirectory.
- **Build directory not found (double path)** — Publish action doubles `working-directory` into `--build-dir`. Use absolute path: `${{ github.workspace }}/path/to/dist`

App not updating? Check Actions tab succeeded, verify design ID matches, hard-refresh (Ctrl+Shift+R).

---

## Pro Code App Issues

### Blank Screen
Check console (F12), check network for `/data/v1/` 403/404s, test with hardcoded data to isolate data vs render.

### Common Fixes
- **Empty/wrong data:** Verify alias in `Domo.get()` matches `public/manifest.json` exactly (case-sensitive)
- **Filters not updating:** Use `Domo.onFiltersUpdated` (with `-d`), not `onFiltersUpdate`
- **Works locally, breaks in DOMO:** Check CORS (use Domo.get not fetch), PDP policies, ryuu.js in dependencies (not devDependencies)
- Full app reference: `pro-code-apps` skill

---

## Data Discrepancy Issues

### Trace the Pipeline
Check row count at each stage: Source → Connector → ETL input → ETL output → Card/App.
The divergence point is where the bug is.

### Common Causes
- **Total too high:** Join creating duplicates (many-to-many). Add Group By or Deduplicate.
- **Total too low:** Inner join or restrictive filter dropping rows. Try Left join.
- **Period comparison wrong:** Date truncation or timezone (DOMO stores UTC). Check DATE_TRUNC settings.
- **Slightly off:** Different aggregation granularity between ETL and card. Check both.

---

## Decision Log

Before diving deep, check `.claude/decisions/decision-log.md` — a previous
session may have already solved or worked around this exact issue.

## Log the Resolution

When you find and fix the issue:
- Universal DOMO/library pattern → `/learn` to add to relevant skill's Known Issues
- Project-specific → add to `decision-log.md` under today's date

---

## Escalation — When Debugging Stalls

If the issue persists after 2-3 fix attempts, stop looping and escalate:

1. **Summarize what you tried** — list each fix attempt and why it didn't work
2. **Log the issue** in decision-log.md with full context
3. **Tell the user clearly** with options: try different approach, manual investigation, or skip and log
4. **If skipping** — log as "UNRESOLVED" in decision-log.md and continue
5. **If manual investigation needed** — run checkpoint, describe what to check and where

Never loop on the same fix more than twice.

---

## Known Issues

Add new issues here as they're discovered using `/learn`.
Format: **`[Error message or symptom]`** — Cause: [why it happens]. Fix: [how to resolve].
