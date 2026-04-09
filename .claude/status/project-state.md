# Project State
Last updated: 2026-03-29
Last session: Toolkit Build Session 3 — All skills filled, Playwright verified and working

## Current Phase: Toolkit Build (COMPLETE)

---

## Toolkit Build Progress

### Tier 1 — Core Development Skills
- [x] **credentials** — Was already well-structured; Playwright auth now verified (see qc-visual)
- [x] **libraries** — Filled: React 18 + TS + Vite + ECharts + shadcn/ui + ryuu.js. DA CLI for scaffolding
- [x] **design-system** — Full design system: dark/light palette, chart colors, typography (Inter), KPI cards with sparklines, accessibility (WCAG 2.1), motion, state/URL, anti-patterns. Informed by 3 Figma templates + 5 UI/UX skills
- [x] **cli-setup** — Filled: Domo Apps CLI (ryuu) + DA CLI (@domoinc/da), manifest.json, dev workflow
- [x] **pro-code-apps** — Filled: ryuu.js SDK full reference, dataset connections, filters, variables, AppDB
- [x] **git-deploy** — Filled: GitHub Actions with DomoApps/domo-publish-action@v1, branching strategy, version management

### Tier 2 — Pipeline Skills
- [x] **domo-api** — Filled with verified endpoints from existing claude.md (datasets, ETLs, workflows, connectors, streams)
- [x] **connectors** — Filled: Rawso connector inventory (BambooHR, HCSS, Spectrum, VisionLink, social media), auth patterns, scheduling, troubleshooting
- [x] **magic-etl** — Filled: ETL design principles, common patterns (date spine, dedup, SCD, aggregation), SQL tile reference, debugging guide. Tile reference filled with all categories.
- [x] **datasets** — Filled: API reference (CRUD, Streams, Query), schema management, PDP (simple + dynamic), naming conventions, update methods, partitioning
- [x] **outputs** — Filled: writeback connectors, scheduled reports, export API, DOMO Publish, output validation patterns

### Tier 3 — QC Skills
- [x] **qc-visual** — Filled: Playwright setup, auth injection, screenshot tests, console error capture, responsive checks, visual regression, playwright-base.js script
- [x] **qc-data** — Filled: Row count validation, schema drift detection, completeness checks, spot checks, freshness monitoring, automated QC ETL pattern
- [x] **qc-analytical** — Already well-structured; no changes needed

### Tier 4 — Fill as Needed
- [x] **responsive** — Filled: DOMO responsive context, container queries, ECharts resize, mobile pitfalls
- [x] **domo-ai** — Filled: AI summaries, conversational analytics, narratives, intelligent alerts
- [x] **cards** — Filled: Card types, beast mode formulas, chart properties, alerts, conventions
- [x] **app-studio** — Filled: DDX framework, components, data binding, limitations, upgrade criteria

### Workflow/Session Skills (already complete)
- [x] init, resume, checkpoint, context-check, status, troubleshoot
- [x] handoff, learn, new-project
- [x] plan-dashboard, build-pipeline, build-app, full-qc, build-toolkit

---

## Key Decisions Made
- TypeScript required for all apps (ryuu.js has full TS defs, DA CLI template uses TS)
- DA CLI (@domoinc/da) for app scaffolding, not domo init
- pnpm as package manager (DA CLI default)
- Dark theme primary, light theme secondary, #F36E22 as accent only
- Inter as primary font (closest free alternative to Avenir, better tabular nums)
- #0F1117 dark background, #F8F9FB light background
- KPI cards with inline mini sparklines (color-coded per metric)
- URL must reflect dashboard state (filters, tabs, pagination)
- WCAG 2.1 accessibility baseline, prefers-reduced-motion support
- date-fns for dates, native Intl for numbers, React Context for state
- DomoApps/domo-publish-action@v1 for CI/CD
- Manual version bumps in manifest.json before merging to main

## Playwright Auth (Verified 2026-03-29)
- Global auth state: `~/.domo-auth-state.json` (shared across all projects)
- Global secrets: `~/.domo-secrets` (dev token, OAuth client ID/secret)
- DA-SID session: 8 hour TTL, auto-renews via Microsoft SSO cookies
- ESTSAUTHPERSISTENT (MS SSO): ~90 day TTL — manual login only needed every ~90 days
- Scripts: `scripts/domo-auth-setup.js` (one-time login), `scripts/domo-screenshot.js` (headless QC)
- Dev token works for API calls only, NOT for browser rendering (bootstrap 500s)
- Bundled Playwright Chromium fails on Windows — use `channel: 'msedge'`

## Known Issues
- DOMO docs pages not all navigated yet (API Reference, Querying Data, Workflows guide, etc.)
- Design system complete — may refine after first real project build

## Active Data Sources
[Will be populated during Phase 1 / init]

## ETL Output Datasets
[Will be populated during Phase 2 when ETLs are built. Format:]
[- ETL Name → Output Dataset Name — Dataset ID: `uuid` — Row count: X — Refresh: on input update]
