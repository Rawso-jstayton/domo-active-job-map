---
name: cli-setup
description: >
  DOMO CLI tools — the Domo Apps CLI (ryuu) and DA CLI (@domoinc/da).
  Installation, authentication, project structure, manifest.json configuration,
  dev server proxy, and publish workflow. Use when setting up a new DOMO custom
  app project, configuring the CLI, debugging publish failures, or explaining
  the DOMO dev workflow. Also use when the user mentions manifest.json, ryuu.js,
  domo-cli, "domo dev", "domo publish", or "da new".
---

# DOMO CLI Setup

## Windows / Git Bash Known Issues

**npm global shims broken in Claude Code's Git Bash:**
`pnpm`, `domo`, `npx` fail because the shell shims use `sed`, `dirname`,
`uname` which don't exist in this environment. Use `.cmd` versions instead:
`pnpm.cmd`, `domo.cmd`, `npx.cmd`. System tools (`gh`, `git`, `node`) work fine.

**DOMO CLI path issues in Git Bash:**
`domo` commands may fail with path resolution errors in Git Bash. The CLI
works fine in PowerShell. If a domo command fails in Git Bash, try
`domo.cmd` or run it in PowerShell.

**PowerShell $_ variable conflict:**
When running `powershell -Command "..."` from bash, PowerShell's `$_`
variable gets eaten by bash's variable expansion. Use single quotes for
the outer string or escape with `\$_`. This causes stuck background tasks
if not handled.

**Connector setup is manual:** Connectors are configured in the DOMO UI,
not via CLI or API. Claude can guide the steps, but the user clicks in DOMO.

---

DOMO has two CLI tools for app development:

1. **Domo Apps CLI (`ryuu`)** — Primary CLI for publishing, managing, and developing apps
2. **DA CLI (`@domoinc/da`)** — App generator that scaffolds Vite + React + TypeScript projects

Use both together: DA CLI to create apps, Domo Apps CLI to develop and publish.

## Installation

```bash
# Prerequisites: Node.js 18+, pnpm (recommended)

# Install Domo Apps CLI (primary CLI)
npm install -g ryuu

# Install DA CLI (app generator)
pnpm add -g @domoinc/da

# Verify both
domo --version
da --version
```

Note: Homebrew and Chocolatey installation methods are deprecated. Use npm only.

> **Note:** `@domoinc/da` is an internal DOMO tool — it is not publicly
> documented. Commands and options here are based on observed behavior.
> If `da` commands fail unexpectedly, fall back to `domo init`.

## Authentication

### Interactive Login (local development)
```bash
domo login
# Prompts for: instance name, username, password
# Or choose from previously authenticated instances
```

### Token-Based Login (CI/CD)
```bash
domo login -i rawso.domo.com -t YOUR-DEVELOPER-TOKEN
```

### Token Management
```bash
# Add a stored token
domo token add -i rawso.domo.com -t YOUR-DEVELOPER-TOKEN

# Remove a stored token
domo token remove -i rawso.domo.com

# Verify current auth — `domo whoami` does NOT exist
domo dev          # starts dev server; errors immediately if not authenticated
domo ls           # lists published designs; fails if auth expired
```

### Auth Storage
- Tokens stored in `~/.domo/`
- If auth expires: `domo login` to re-authenticate
- For CI/CD: use GitHub Secrets (see credentials skill)

## Creating a New App

### With DA CLI (recommended for new apps)
```bash
da new my-app-name
cd my-app-name
pnpm install
```

This generates a complete project from `@domoinc/vite-react-template`:
- Vite + React 18 + TypeScript
- SCSS support
- Jest + Testing Library
- ESLint + Prettier
- Storybook
- Domo Toolkit integration

### With Domo Apps CLI (simpler, no build tooling)
```bash
domo init
# Prompts: design name, starter template, dataset connections
```

Starters available:
- **hello world** — basic HTML/JS/CSS app
- **manifest only** — just a manifest.json
- **basic chart** — Domo Phoenix bar chart
- **map chart** — Domo Phoenix world map
- **sugarforce** — multi-screen app with tabs, AppDB CRUD

**Recommendation:** Use `da new` for all Rawso apps. It gives us the full
Vite + React + TS stack. Only use `domo init` if you need a quick throwaway test.

## Project Structure

### DA CLI Project (our standard)
```
my-app/
├── .github/
│   └── workflows/
│       └── deploy.yml          ← CI/CD (see git-deploy skill)
├── public/
│   ├── manifest.json           ← App metadata + dataset mappings
│   └── thumbnail.png           ← App thumbnail for DOMO Asset Library
├── index.html                  ← Vite entry HTML (project root, not src/)
├── package.json
├── pnpm-lock.yaml
├── vite.config.ts              ← Vite config (base: './', outDir: 'dist')
├── tsconfig.json               ← TypeScript config
├── tailwind.config.ts          ← Tailwind + design tokens
├── src/
│   ├── main.tsx                ← React entry point
│   ├── App.tsx                 ← Root component
│   ├── globals.css             ← Tailwind + shadcn theme variables
│   ├── components/
│   │   └── ui/                 ← shadcn/ui components
│   ├── hooks/
│   ├── charts/                 ← ECharts configurations
│   └── lib/
│       └── utils.ts            ← cn() utility for shadcn
├── dist/                       ← Vite build output (published to DOMO)
├── plans/
├── qc-reports/
├── .env.example
└── .gitignore
```

**Why `public/`:** Vite copies `public/` contents into `dist/` as-is at build
time. This puts `manifest.json` and `thumbnail.png` at the root of `dist/`,
which is where `domo publish` expects them. Never put manifest.json at the
project root — it won't end up in the build output.

## manifest.json

The manifest file defines your app's metadata, dataset connections, and
integrations. It lives in the `public/` directory (Vite copies it to `dist/`
at build time).

### Required Fields

```json
{
  "name": "My Dashboard App",
  "version": "1.0.0",
  "size": {
    "width": 4,
    "height": 3
  },
  "fullpage": true,
  "datasetsMapping": []
}
```

### Size Reference (DOMO card units)

| Card Size | Width (px) | Height (px) |
|-----------|-----------|-------------|
| 6         | 1400      | 1700        |
| 5         | 1165      | 1410        |
| 4         | 930       | 1120        |
| 3         | 695       | 830         |
| 2         | 460       | 540         |
| 1         | 225       | 250         |

**Tip:** Use `"fullpage": true` for all Rawso apps. This makes the iframe
responsive to the browser window. You handle responsive layout with Tailwind.

### Dataset Mapping

```json
{
  "datasetsMapping": [
    {
      "alias": "sales",
      "dataSetId": "5168da8d-1c72-4e31-ba74-f609f73071dd",
      "fields": [
        { "alias": "amount", "columnName": "Sales Amount" },
        { "alias": "name", "columnName": "Client Name" },
        { "alias": "startDate", "columnName": "Contract Initiation Date" }
      ]
    }
  ]
}
```

- **alias** — Name used in code: `Domo.get('/data/v1/sales')`
- **dataSetId** — Found in DOMO URL: `rawso.domo.com/datasources/{dataSetId}/details`
- **fields** — Column aliases (optional; if empty, all columns returned with original names)

### Optional Manifest Fields
AppDB collections, workflow mapping, proxyId, ignore list, and DA CLI
manifest overrides — read `references/commands.md` when configuring these.

## Development Workflow
`pnpm dev` (Vite hot reload) + `domo dev` (proxies DOMO data) → `pnpm build` → `domo publish`.
Full commands, options, and proxy details in `references/commands.md`.

## Publishing
`domo publish` uploads `dist/` to DOMO. `domo publish -g` opens Asset Library.
Version, release, download, and delete commands in `references/commands.md`.

### First Publish — Design ID (CRITICAL)

**`domo publish` creates a NEW app design every time if `manifest.json` has no
`id` field.** This is the #1 cause of duplicate apps in the DOMO Asset Library.

After the very first publish, DOMO assigns a Design ID. You MUST capture it
and add it to `public/manifest.json` immediately:

1. Run `domo publish` for the first time
2. Run `domo ls` to see published designs — note the ID for your app
3. Add `"id": "DESIGN_ID_HERE"` to `public/manifest.json`
4. Commit: `fix(manifest): add design ID from first publish`
5. All subsequent publishes now update the SAME app instead of creating duplicates

```json
{
  "name": "My Dashboard App",
  "id": "abc123-def456-...",
  "version": "1.0.0",
  ...
}
```

**If you already have duplicates:** See "Cleaning Up Duplicate Apps" below.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `domo publish` fails with auth error | Run `domo login` again |
| `domo dev` shows no data | Verify `domo login` succeeded, check manifest aliases |
| White screen after publish | Check browser console, verify manifest.json is valid |
| Design not found | Check `id` in manifest.json matches the design in DOMO |
| Proxy not working for AppDB/Workflows | Add `proxyId` to manifest.json |
| Token expired in CI/CD | Verify token format — alphanumeric, 20+ characters |

## Scaffolding Into an Existing Repo

`da new` creates a new directory — it can't scaffold into an existing repo
(like one created by `/new-project`). For existing repos, set up manually:

```bash
# From the project root
pnpm init
pnpm add react react-dom ryuu.js
pnpm add -D typescript vite @vitejs/plugin-react @types/react @types/react-dom

# Create standard config files:
# - vite.config.ts (with react plugin, base: './', outDir: 'dist')
# - tsconfig.json + tsconfig.node.json (composite: true for node config)
# - public/manifest.json (DOMO app metadata + dataset mappings)
# - public/thumbnail.png (app thumbnail for DOMO Asset Library)
# - index.html (at project root, not src/)
# - src/main.tsx, src/App.tsx, src/globals.css
# - tailwind.config.ts

# Install shadcn/ui
npx shadcn@latest init

# Verify the setup
pnpm dev          # Should start Vite dev server
pnpm build        # Should output to ./dist
domo dev          # Should proxy DOMO data to local dev server
```

The project structure should match the "DA CLI Project (our standard)" layout
documented above. Copy configs from a working project or the toolkit template.

## Cleaning Up Duplicate Apps

If `domo publish` was run multiple times without a Design ID in manifest.json,
you'll have orphaned app designs in DOMO's Asset Library.

**To clean up:**
1. Run `domo ls` to list all published designs with IDs
2. Identify which design is the CORRECT one (most recent, or the one cards reference)
3. Delete orphans: `domo delete DESIGN_ID` (soft delete — reversible)
4. To permanently remove: an admin can purge from the DOMO Asset Library UI
5. Add the correct Design ID to `public/manifest.json` to prevent recurrence

**Tip:** `domo undelete DESIGN_ID` can recover a soft-deleted design.

## Known Issues

- **`da apply-manifest` requires global install:** The DA CLI's `da apply-manifest`
  command (used by some prebuild scripts) requires `npm install -g @domoinc/da`.
  If not globally installed, the prebuild step fails. Workaround: manually copy
  `public/manifest.json` to `.tmp/manifest.json` before builds.
- **`domo whoami` does not exist:** There is no dedicated auth-check CLI command.
  Use `domo dev` or `domo ls` to verify auth status.

<!-- CLI-specific issues. /learn will add entries here. -->
