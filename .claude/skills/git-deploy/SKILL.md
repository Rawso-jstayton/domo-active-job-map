---
name: git-deploy
description: >
  GitHub-to-DOMO deployment workflow — Git-based development, GitHub Actions
  CI/CD, DOMO CLI publish automation, versioning, and branching strategy.
  Dev deploys (frequent, overwrite current version) vs release deploys (new
  DOMO version, rollback capable). Use when deploying apps to DOMO, setting
  up GitHub Actions, configuring CI/CD, or when the user mentions "deploy",
  "publish", "GitHub Actions", "CI/CD", "push to DOMO", "release", or "version".
---

# Git-Based Deployment to DOMO

All DOMO pro code apps are developed locally, pushed to GitHub, and deployed
to DOMO via CI/CD. No apps are built directly in DOMO's UI.

## Branching Strategy

Branches determine deployment behavior automatically — no manual decision needed:

```
feature/*  →  develop  →  main
   │              │          │
   │         Dev Deploy   Release Deploy
   │        (overwrite)   (new version)
   │              │          │
   └── local ─────┘          └── stakeholder-ready
       dev too
```

**`feature/*` branches** — individual work. No auto-deployment.
Push here while building. Merge to develop when ready to test in DOMO.

**`develop` branch** — dev deploys. Push or merge here triggers GitHub Actions
that publishes to DOMO, **overwriting the current app version**. Fast, no
version clutter. Used for Playwright QC against real data.

**`main` branch** — release deploys. Merge here (via PR from develop) triggers
GitHub Actions that publishes to DOMO as a **new version**. Creates a permanent
snapshot with rollback capability.

### Solo vs Parallel Development

**One person, sequential work (most Rawso projects):** Use a single working
branch (`develop`). Feature branches add merge overhead without benefit when
one person is doing sequential tasks. Push directly to develop for dev deploys.

**Multiple people, parallel work:** Use `feature/*` branches per person or
per app. Merge to develop when each piece is ready. This prevents one person's
WIP from blocking another's deploy.

Don't default to feature branches just because the plan has multiple phases —
branching strategy should match the team size, not the task count.

### Local Preview Without CI

CI only triggers on `develop` (and `main`). To preview changes without
pushing through the full CI pipeline:

- **`domo dev`** — starts a local dev server with DOMO data proxy. Best for
  rapid iteration. No build or deploy needed.
- **`domo publish`** — manual publish directly from your machine. Skips CI
  but updates the live app. Good for one-off tests.
- **`workflow_dispatch` trigger** — add to deploy.yml if you want on-demand
  deploys from any branch via GitHub's "Run workflow" button:
  ```yaml
  on:
    workflow_dispatch:
    push:
      branches: [develop]
  ```

## Two Types of Deployment

### Dev Deploy
- **Trigger:** Push to `develop` branch (or local `domo publish` during rapid iteration)
- **DOMO behavior:** Overwrites current app version — no new version created
- **When:** Multiple times per session during Phases 3, 4, and 5
- **Purpose:** Get it live so Playwright can QC against real DOMO data
- **Code quality:** Messy is fine — console.logs, TODOs, WIP code expected

```bash
# Via GitHub Actions (push to develop)
git push origin develop

# Or local for fastest iteration (skips CI)
domo publish
```

### Release Deploy
- **Trigger:** Merge PR from `develop` → `main`
- **DOMO behavior:** Creates a NEW app version — previous version preserved
- **When:** Once at end of project (Phase 6), after all QC including code QC
- **Purpose:** Production-ready deployment for stakeholders
- **Code quality:** Clean — code QC passed, no dead code, no console.logs

```bash
# Via GitHub PR: develop → main
# GitHub Actions automatically:
#   1. Builds production bundle
#   2. Publishes to DOMO
#   3. Runs domo release to lock version
#   4. Creates git tag (v1.0.0, v1.1.0, etc.)
```

## DOMO App Versioning

### Version Strategy

```
manifest.json version  ←→  git tag  ←→  DOMO app version
      "1.0.0"              v1.0.0         Version 1
      "1.1.0"              v1.1.0         Version 2
      "1.2.0"              v1.2.0         Version 3
```

- **Dev deploys** do NOT increment the version. They overwrite the current live version.
- **Release deploys** increment the version. Bump manifest.json before merging to main.

### Version Numbering Convention
- **Major (X.0.0):** New dashboard/app or complete rebuild
- **Minor (0.X.0):** New features, new views, new data sources
- **Patch (0.0.X):** Bug fixes, styling adjustments, data corrections

### Version Bump Process
Manual — developer updates `version` in manifest.json before merging to main.
Commit convention: `release(app-name): bump to 1.1.0`

## GitHub Actions Workflows

### Recommended: Using DOMO CLI Directly

> **Why not the GitHub Action?** `DomoApps/domoapps-publish-action@v2.0.0`
> has a `working-directory` / `--build-dir` double-pathing bug. The CLI
> approach is simpler and proven across all Rawso projects.

**Monorepo note:** If the app is in a subdirectory (e.g., `apps/my-app/`),
set `working-directory` on steps and use `vite build` directly — don't rely
on `pnpm build` from the repo root or `da apply-manifest` (not installed in CI).

```yaml
# .github/workflows/deploy.yml
name: Deploy to DOMO

on:
  push:
    branches: [develop]
  pull_request:
    branches: [main]
    types: [closed]

env:
  APP_DIR: apps/my-app  # Change to '.' for root-level apps

jobs:
  dev-deploy:
    if: github.event_name == 'push' && github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ${{ env.APP_DIR }}
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
          cache-dependency-path: ${{ env.APP_DIR }}/pnpm-lock.yaml

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Prepare manifest and build
        run: |
          mkdir -p .tmp && cp public/manifest.json .tmp/manifest.json
          npx vite build

      - name: Install DOMO CLI and deploy
        run: |
          npm install -g ryuu
          domo login -i ${{ secrets.DOMO_INSTANCE }} -t ${{ secrets.DOMO_TOKEN }}
          cd dist && domo publish

  release-deploy:
    if: >
      github.event_name == 'pull_request' &&
      github.event.pull_request.merged == true &&
      github.event.pull_request.base.ref == 'main'
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ${{ env.APP_DIR }}
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
          cache-dependency-path: ${{ env.APP_DIR }}/pnpm-lock.yaml

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Prepare manifest and build
        run: |
          mkdir -p .tmp && cp public/manifest.json .tmp/manifest.json
          npx vite build

      - name: Install DOMO CLI, deploy, and tag release
        run: |
          npm install -g ryuu
          domo login -i ${{ secrets.DOMO_INSTANCE }} -t ${{ secrets.DOMO_TOKEN }}
          cd dist && domo publish
          VERSION=$(node -p "require('./manifest.json').version")
          domo release -v "$VERSION"
          cd ..
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git tag "v$VERSION"
          git push origin "v$VERSION"
```

### Alternative: Using Domo Publish Action

Not recommended — has known bugs (see Known Issues). If you must use it,
pin to `@v2.0.0` (not `@v2`) and use absolute paths for `--build-dir`:

```yaml
      - uses: DomoApps/domoapps-publish-action@v2.0.0
        with:
          domo-instance: ${{ secrets.DOMO_INSTANCE }}
          domo-token: ${{ secrets.DOMO_TOKEN }}
          build-dir: ${{ github.workspace }}/apps/my-app/dist
```

### Required GitHub Secrets

Set at the **repository level** (pushed by `/new-project` from `~/.domo-secrets`):

| Secret | Value | Format |
|--------|-------|--------|
| `DOMO_INSTANCE` | `rawso.domo.com` | **Full domain** — the GitHub Action expects this, not just `rawso` |
| `DOMO_TOKEN` | Developer access token | DOMO Admin → Auth → Access Tokens |

> **Format mismatch:** `~/.domo-secrets` stores `rawso` but Actions expects
> `rawso.domo.com`. See credentials skill for format details.
> If deploys fail with "instance not found", check this first.

## First Deploy — Design ID Setup (CRITICAL)

**`domo publish` creates a NEW app every time without an `id` in manifest.json.**
Do the first publish locally, capture the Design ID, add it to manifest, then
commit. See cli-setup skill for full steps and duplicate cleanup.

## Post-Deploy Verification

After every deploy, open the card in DOMO and verify: no white screen, data
renders, no console errors, one interaction works. Takes 30 seconds — catches
dataset wiring, PDP, and manifest issues that CI can't.

## Development → Deploy Flow

```
LOCAL DEVELOPMENT
   Code with Claude Code
   Test with `domo dev` (local, proxied data)
        │
        ▼
FIRST DEPLOY (once)
   `domo publish` locally → capture Design ID → add to manifest → commit
        │
        ▼
DEV DEPLOY (repeated)
   ┌──────────────────────────────────┐
   │ Push to develop                  │
   │      ↓                           │
   │ GitHub Actions: build + publish  │
   │ (overwrite current DOMO version) │
   │      ↓                           │
   │ Playwright QC against live DOMO  │
   │      ↓                           │
   │ Issues found? → fix → push again │
   └──────────────────────────────────┘
        │
        ▼ (all QC passed)
CODE QC (once)
   qc-code skill — cleanup, remove dead code
        │
        ▼
RELEASE DEPLOY (once)
   ┌──────────────────────────────────┐
   │ Bump version in manifest.json   │
   │ PR: develop → main              │
   │      ↓                           │
   │ GitHub Actions:                  │
   │   1. Build production bundle     │
   │   2. Publish to DOMO             │
   │   3. Lock version (domo release) │
   │   4. Create git tag              │
   │      ↓                           │
   │ Post-deploy verification         │
   │ Stakeholder walkthrough          │
   └──────────────────────────────────┘
```

## Repository Structure

See cli-setup skill for full project structure. Key deploy-relevant files:
`public/manifest.json` (Design ID + datasets), `dist/` (build output),
`.github/workflows/deploy.yml` (CI/CD).

## Rolling Back

**Option 1: DOMO UI** — In the Asset Library, previous versions are preserved
after release deploys. Cards can reference specific versions.

**Option 2: Git revert**
```bash
git revert HEAD          # Revert the merge commit on main
git push origin main     # Triggers release deploy of reverted code
```

**Option 3: Redeploy previous tag**
```bash
git checkout v1.1.0      # Previous known-good version
domo publish             # Manual deploy of that version
```

## Checklists

### Dev Deploy (quick, every iteration)
- [ ] Code compiles / builds without errors
- [ ] Push to develop (or local `domo publish`)
- [ ] App loads in DOMO (no white screen)
- [ ] Data renders (not empty/error state)

### Release Deploy (thorough, once)
- [ ] All QC passed: data, visual, analytical, code
- [ ] manifest.json version bumped
- [ ] PR from develop → main created and reviewed
- [ ] PR merged → GitHub Actions deploys
- [ ] `domo release` locked the version
- [ ] Git tag created (vX.Y.Z)
- [ ] App works correctly in DOMO with real data
- [ ] Stakeholder walkthrough completed
- [ ] Update project-state.md: Phase 6 complete

## Known Issues

### GitHub Action Bugs
- **Tag resolution:** `@v2` does NOT resolve — pin to `@v2.0.0`
- **v1 → v2 breaking change:** Input renamed `domo-access-token` → `domo-token`. Old name silently passes with no auth.
- **`working-directory` + `--build-dir` double-pathing:** The action passes `working-directory` as `--build-dir`, doubling the path (e.g., `dist/dist/`). Fix: use absolute paths via `${{ github.workspace }}/path/to/dist`

### CI Environment Gotchas
- **`da apply-manifest` not available in CI:** The DA CLI isn't installed in GitHub Actions runners. Prebuild scripts that call `da apply-manifest` will fail. Fix: `mkdir -p .tmp && cp public/manifest.json .tmp/manifest.json` then run `npx vite build` directly.
- **`.tmp/manifest.json` missing:** Fresh CI checkouts don't have the `.tmp/` directory. The `da apply-manifest` prebuild step creates it locally but it's gitignored. Fix: create it explicitly in the workflow.
- **`pnpm build` from repo root fails in monorepos:** If the app is in a subdirectory, `pnpm build` from root won't find a build script. Fix: set `working-directory` on the job or use `npx vite build` from the app directory.
- **Template deploy.yml must be tested end-to-end** before shipping to new projects.

<!-- Additional deployment issues. /learn will add entries here. -->
