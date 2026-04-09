---
name: pro-code-apps
description: >
  DOMO pro code custom app architecture using React + TypeScript + Apache
  ECharts + shadcn/ui. Covers dataset connections via ryuu.js SDK, app
  lifecycle, filters, variables, responsive patterns, and deployment. Use
  when building custom DOMO apps, connecting to datasets from code, using
  Domo.get/Domo.post, creating interactive data applications, or debugging
  custom app issues. Also use when the user mentions "DDX", "custom app",
  "pro code", "domo.js", or "ryuu.js".
---

# DOMO Pro Code Apps

Reference for building custom DOMO applications.

**Stack:** React 18 + TypeScript + Apache ECharts + shadcn/ui + Tailwind CSS
See `libraries` skill for full stack details, versions, and configuration.
See `cli-setup` skill for project setup and CLI commands.

## Architecture Overview

Custom apps run inside DOMO as **iframe sandboxes**:

```
┌─ DOMO Dashboard Page ──────────────────────────┐
│                                                  │
│  ┌─ Card (iframe) ────────────────────────────┐ │
│  │  Your React app runs here                   │ │
│  │  - Has access to datasets mapped in public/manifest.json │ │
│  │  - Can listen for page filter changes       │ │
│  │  - Can update page variables                │ │
│  │  - Can navigate within DOMO                 │ │
│  │  - Can communicate with other apps on page  │ │
│  └─────────────────────────────────────────────┘ │
│                                                  │
│  ┌─ Another Card ─────────────────────────────┐ │
│  │  Native DOMO card or another custom app     │ │
│  └─────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

**What your app CAN do:**
- Fetch data from datasets mapped in manifest.json
- Query datasets with SQL via `/sql/v1/` endpoint
- Listen for page-level filter and variable changes
- Send filter/variable updates to the page
- Communicate with other custom apps on the same page
- Navigate to other DOMO pages/profiles
- Access AppDB, Workflows, Code Engine (with proxyId)
- Detect platform (desktop vs mobile) and respond

**What your app CANNOT do:**
- Access the parent page DOM
- Make direct external HTTP requests (must go through DOMO proxy)
- Access datasets not mapped in manifest.json

## ryuu.js SDK Reference

**Full API reference with code examples:** Read `references/sdk-reference.md` when writing code.

**Key methods (quick reference):**
- `Domo.get('/data/v1/{alias}')` — fetch dataset by manifest alias
- `Domo.getAll([...urls])` — parallel fetch multiple datasets
- `Domo.post('/sql/v1/{alias}', sql, { contentType: 'text/plain' })` — SQL query
- `Domo.env.userId`, `.platform`, `.pageId` — environment context
- `Domo.onFiltersUpdated(cb)` — listen for page filter changes (returns unsubscribe fn)
- `Domo.onDataUpdated(cb)` — listen for dataset refresh
- `Domo.requestFiltersUpdate(filters, true)` — update page filters
- `Domo.navigate(url, newTab?)` — navigate (required — `<a href>` doesn't work in iframes)

**Critical gotchas:**
- Use `onFiltersUpdated` (with `-d`), NOT `onFiltersUpdate` — deprecated alias silently fails
- External URLs require domain whitelisting in DOMO Admin first
- AppDB/DataStore requires `collections` + `proxyId` in manifest.json

## Dataset Connection Patterns

### Manifest Wiring
1. Add dataset to `datasetsMapping` in `public/manifest.json` with an alias
2. Fetch in code with `Domo.get('/data/v1/{alias}')`
3. Field aliases map DOMO column names to clean JS property names

### Multiple Datasets
```typescript
// Load all data on mount
const [jobs, employees, safety] = await Domo.getAll([
  '/data/v1/jobs',
  '/data/v1/employees',
  '/data/v1/safety',
]);
```

### When to Join in ETL vs App
- **ETL (preferred):** Pre-join in Magic ETL when data relationships are stable.
  Produces a single flat dataset — simpler app code, faster loads.
- **App:** Join client-side only when the join depends on user interaction
  (e.g., user selects a job, then load related cost codes).

### Custom React Hook
A reusable `useDomoData<T>(alias)` hook pattern is in `references/sdk-reference.md`.

## Navigation: Tabs, Not Router

DOMO custom apps run inside an iframe — the URL bar is never visible to users.
This means `react-router-dom` is the wrong tool for in-app navigation. Users
can't see or bookmark routes, and browser back/forward doesn't work as expected.

**Use shadcn `Tabs` for multi-view navigation.** It's simpler, works naturally
in the iframe context, and doesn't fight DOMO's hosting model.

Only use `HashRouter` if you specifically need deep-linking via `Domo.navigate()`
from other cards on the page (rare).

## Scaffolding Into an Existing Repo

`da new` creates a new directory — it doesn't work for repos already created
by `/new-project`. For existing repos, manually set up the Vite + React + TS
config:

```bash
# From the project root (already a git repo)
pnpm init
pnpm add react react-dom ryuu.js
pnpm add -D typescript vite @vitejs/plugin-react @types/react @types/react-dom

# Copy standard configs from the toolkit template or a working project:
# - vite.config.ts (base: './', outDir: 'dist')
# - tsconfig.json, tsconfig.node.json (composite: true)
# - index.html (at project root, not src/)
# - public/manifest.json (with dataset mappings)
# - public/thumbnail.png (app thumbnail for DOMO)
# - src/main.tsx, src/App.tsx, src/globals.css
# - tailwind.config.ts
```

Then install shadcn/ui components as needed (`npx shadcn@latest init`).
See `cli-setup` skill for full project structure reference.

## App Patterns

### Single-View Dashboard
Simple app showing one dataset with charts and KPIs.
Good for: Executive summaries, department overviews.

### Multi-Tab Dashboard
Tabbed navigation with different views of the same or related data.
Use shadcn `Tabs` component. Good for: Comprehensive dashboards.

### Interactive Explorer
Filters, drill-down, and dynamic visualization updates.
Use `Domo.requestFiltersUpdate()` to sync with page filters.

### Form/Input App
Uses AppDB for CRUD operations. Lets users input data that gets
stored and can be used by other cards/ETLs.

## Responsive Design

- Always set `"fullpage": true` in manifest.json
- Use Tailwind responsive classes (`sm:`, `md:`, `lg:`)
- Check platform: `Domo.env.platform === 'mobile'`
- DOMO card sizes affect initial dimensions (see cli-setup size chart)
- See responsive skill for detailed breakpoints

## AppDB: proxyId Required After First Publish

AppDB (DataStore) persistence and manual data entry features require a `proxyId`
in `public/manifest.json`. This ID ties the app to a specific DOMO card instance.

**The proxyId does NOT exist until the app is published and placed on a card.**

### Setup Flow
1. Publish the app at least once (`domo publish`)
2. Create a card from the app design in DOMO
3. Right-click the card → Inspect Element
4. Find the `<iframe>` containing your app
5. The ID between `//` and `.domoapps` in the iframe URL is your proxyId
6. Add to `public/manifest.json`: `"proxyId": "XXXXXXXX-XXXX-4XXX-XXXX-XXXXXXXXXXXX"`
7. Republish

**Without proxyId:** Read-only features work (dataset queries, calculations),
but AppDB writes, Workflow triggers, and Code Engine calls will fail silently.

**proxyIds are tied to cards.** If you delete the card, you need a new proxyId.

## Debugging

### Browser Console
Apps run in iframes — make sure you're inspecting the right frame:
1. Right-click inside the card → Inspect
2. Console may show the parent frame — switch to the app's iframe context

### Common Errors
| Error | Cause | Fix |
|-------|-------|-----|
| 404 on data fetch | Wrong alias or dataset not mapped | Check manifest.json aliases |
| 403 on data fetch | User doesn't have PDP access | Check PDP policies in DOMO |
| Empty data array | Dataset has no rows, or field mapping mismatch | Verify dataset has data, check column names |
| CORS errors | Trying to fetch external URLs directly | Use DOMO proxy or API endpoints |
| White screen | JS error before render | Check console for errors |

### Network Tab
All dataset requests go through DOMO's proxy as `/data/v1/{alias}`.
During `domo dev`, these are proxied to your DOMO instance.
In production, they're handled by DOMO's infrastructure.

## Domo Toolkit Library

For advanced features, use `@domoinc/toolkit` alongside ryuu.js:

```typescript
import { AppDBClient, SqlClient, WorkflowClient, AIClient } from '@domoinc/toolkit';
```

Available clients: AppDBClient, DomoClient, CodeEngineClient, WorkflowClient,
FileClient, GroupClient, IdentityClient, SqlClient, UserClient, AIClient.

## Known Issues

<!-- Pro code app issues. /learn will add entries here. -->
