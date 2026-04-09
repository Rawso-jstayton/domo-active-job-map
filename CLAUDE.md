# DOMO Dev Toolkit

A Claude Code skill library and project template for building DOMO dashboards and pro code apps at Rawso. This repo is the **template** — `/new-project` clones it to create new projects, and `/init` fills in the project-specific header.

## Commands

```bash
npm run domo:auth          # One-time: open browser to rawso.domo.com, capture Playwright auth state
npm run domo:screenshot    # Screenshot a DOMO dashboard at desktop/tablet/mobile viewports
npx playwright install     # Install browser binaries (first time only)
```

## Architecture

```
domo-dev-toolkit/
├── CLAUDE.md              ← This file — toolkit identity + operational instructions
├── .claude/skills/        ← 38 skills (auto-discovered by Claude Code)
├── .claude/status/        ← project-state.md + session-handoff.md
├── .claude/decisions/     ← decision-log.md
├── scripts/               ← domo-auth-setup.js, domo-screenshot.js (Playwright)
├── apps/                  ← React pro code apps (scaffolded per project)
├── cards/                 ← Standard DOMO cards
├── datasets/              ← Dataset schemas and documentation
├── etls/                  ← ETL documentation
├── plans/                 ← Dashboard plans, KPIs, layouts
└── qc-reports/            ← QC results and screenshots
```

## Prerequisites

Run `/setup` for full installation. Requires: Node.js 18+, pnpm, Git, GitHub CLI (`gh`), DOMO CLI (`ryuu`), Playwright browsers, and `~/.domo-secrets` with DOMO_INSTANCE and DOMO_TOKEN.

## DOMO MCP Server

The DOMO MCP server (from [DomoApps/domo-mcp-server](https://github.com/DomoApps/domo-mcp-server)) provides native tool access for dataset operations. Configured in `.mcp.json` (gitignored — contains token). When connected, prefer MCP tools over manual API calls:

| Tool | Purpose |
|------|---------|
| `DomoSearchDatasets` | Find datasets by name |
| `DomoGetDatasetMetadata` | Row count, owner, timestamps |
| `DomoGetDatasetSchema` | Column names and types |
| `DomoQueryDataset` | SQL queries against datasets |
| `DomoListRoles` | List instance roles |
| `DomoCreateRole` | Create new roles |
| `DomoListRoleAuthorities` | Role permissions |

**Limitation:** MCP is read-only for datasets. For CRUD (create/update/delete), Streams API, connectors, ETLs, and app publishing — use manual API or CLI.

**Server location:** `~/Desktop/domo-apps/domo-mcp-server/` (Python 3.11+, pip deps installed)

## Gotchas

- **Windows npm globals need `.cmd`:** `pnpm.cmd`, `domo.cmd`, `npx.cmd` — but NOT `gh`, `git`, `node`
- **Playwright auth expires ~90 days:** Re-run `npm run domo:auth` when screenshots fail with auth errors
- **Template vs project:** This repo is the template. Don't fill in the `[bracketed]` sections in `/init` here — those are for cloned projects
- **DOMO CLI auth (`domo login`) is NOT used** by this toolkit — we use DOMO_TOKEN from `~/.domo-secrets` instead
- **ryuu.js v5 filter listener:** Use `onFiltersUpdated` (with `-d`). The old form `onFiltersUpdate` silently fails — no error, just never fires
- **pnpm build + esbuild:** Add `"pnpm": { "onlyBuiltDependencies": ["esbuild"] }` to package.json or Vite's esbuild dependency fails its postinstall step
- **tsconfig.node.json needs `"composite": true`:** Required when using TypeScript project references (standard Vite template pattern). `noEmit` can't be used in the referenced config
- **DOMO connector docs are behind Salesforce Community renderer:** Web scraping/fetching returns only CSS, not content. Use community forum threads or Playwright with browser rendering instead
- **LinkedIn `followerCounts_organicFollowerCount`:** This column contains daily gains (deltas), NOT cumulative totals. The DOMO connector joins follower stats + share stats into one dataset, which isn't obvious
- **DOMO_INSTANCE format varies by context:** `~/.domo-secrets` stores just the instance name (`rawso`). GitHub secrets and the DOMO CLI expect the full domain (`rawso.domo.com`). The GitHub Action also expects the full domain
- **`domo whoami` doesn't exist:** use `domo dev` or `domo ls` to check auth
- **`domo publish` without Design ID creates duplicates:** after first publish, add `"id"` from `domo ls` to manifest
- **ETL SQL: no CTEs, CAST uses LONG/STRING/DOUBLE** (not BIGINT/VARCHAR/FLOAT)
- **AppDB needs proxyId:** publish app, place on card, extract ID from card's iframe URL
- **DA CLI must be global:** `npm install -g @domoinc/da` (needed for `da apply-manifest`)
- **Dev token can't query data API:** use OAuth client for dataset queries
- **Facebook default date range is 30 days:** extend `yesterday-30` in connector settings
- **CI: `da apply-manifest` not in CI runners:** use `mkdir -p .tmp && cp public/manifest.json .tmp/` then `npx vite build` directly
- **CI: publish action doubles `working-directory` into `--build-dir`:** use absolute path via `${{ github.workspace }}`

---

## How This Toolkit Works

### Conversational First
Users do NOT need to know slash commands. Claude should detect intent from
natural language and route to the right skill automatically.

**User says → Claude does:**
- "I need a dashboard for headcount" → run init workflow, then plan-dashboard
- "set up the data pipeline" / "connect the data" → run build-pipeline workflow
- "build the app" / "start building" → run build-app workflow
- "let's keep going" / "continue" / "resume" → run resume workflow
- "fix the chart color" / "change the label" → run quick workflow
- "is the data right?" / "test it" / "run QC" → run appropriate QC workflow
- "something's broken" / "it's not working" → run troubleshoot workflow
- "I'm done for now" / "save" / "stop" → run checkpoint workflow
- "what's left?" / "where are we?" → run status workflow
- "I learned something" / "remember this" → run learn workflow
- "what data do we have?" / "check existing datasets" → run discover workflow
- "are connectors working?" / "validate the data" → run validate-connectors workflow

Slash commands (`/init`, `/resume`, `/quick`, etc.) are **shortcuts for power
users**, not the primary interface. If a user types a natural sentence, figure
out what they need and do it.

### Session Start (Every Session — Automatic)
At the start of EVERY session, before doing anything else, silently run:
```bash
git pull --ff-only 2>/dev/null || true
```
This ensures the local repo has the latest changes from teammates.
Do not report the pull unless there were conflicts. Just do it and move on.

### Session Flow
- **New project:** Claude asks a few questions, then starts building
- **Discovery first:** Before planning, run `/discover` to check what datasets and connectors already exist in DOMO — saves hours of manual research
- **Returning:** Claude reads saved state, shows where you left off, and continues
- **During work:** Claude auto-transitions between phases — the user just says "yes, keep going"
- **Parallel phases:** For larger projects, phases can run in parallel — define interfaces first, use mock data, own separate files/branches
- **Stopping:** Claude saves all state so the next session picks up cleanly

### Model Routing (Automatic — User Never Sees This)
Default to Sonnet. Escalate to Opus only when the task requires judgment
that Sonnet can't handle. Credits are finite — optimize aggressively.

**Sonnet (subagents via Agent tool with `model: "sonnet"`) — default for all execution:**
- Code generation: new files, components, TypeScript, CSS, configs
- Code edits: bug fixes, style changes, feature additions, refactoring
- File updates: manifest.json, dataset docs, ETL docs, QC reports, state files
- Running builds: `pnpm build`, `domo publish`, `pnpm tsc`
- Troubleshooting execution: following structured debug steps from troubleshoot skill
- Code cleanup: dead code, unused imports, formatting
- Applying user feedback to existing files (when the change is clearly specified)

**Opus (main thread) — only for irreversible judgment calls:**
- Initial project planning and requirements gathering
- Architecture decisions with multiple viable paths
- Phase boundary hard gate verification (pass/fail decisions)
- QC verdicts: deciding PASS vs FAIL (not writing the report)
- Diagnosing ambiguous bugs (root cause analysis, not executing fixes)
- User-facing conversations where misunderstanding has real cost

**Rule of thumb:** If the task has clear instructions or a skill to follow →
Sonnet. If you're choosing between approaches or making a judgment call
that's hard to undo → Opus. When in doubt, try Sonnet first.

### Quality Guardrails (Automatic — User Never Sees These)
- **Verification before completion** — never claim done without running a verification command
- **Hard gates at phase boundaries** — every phase has a checklist that must pass before moving on
- **Read before edit** — always read files before modifying them
- **Error paths lead to troubleshoot** — when something breaks, follow structured debugging
- **Credential checks on resume** — expired auth is caught before you waste time

### Skills
38 skills live in `.claude/skills/` — Claude discovers them automatically.
Detect user intent from natural language and load the right skill. Type `/`
to see all available commands, or just describe what you need.

### Conventions
- All commits: `type(scope): description`
- Plans → `plans/` | Apps → `apps/` | Datasets → `datasets/` | ETLs → `etls/` | QC → `qc-reports/`
- State tracking: `.claude/status/project-state.md` + `session-handoff.md`
- Decisions: `.claude/decisions/decision-log.md`
- Batch state updates at milestones, not after every sub-step
