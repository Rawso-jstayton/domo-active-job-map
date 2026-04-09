---
name: build-app
description: >
  Build DOMO pro code apps — the Phase 3 workflow. All apps are built as
  custom code, developed locally with Claude Code, deployed to GitHub,
  and published to DOMO via CI/CD. Covers scaffolding, dataset connections,
  app logic, styling, responsive design, and per-app verification. Use when
  building apps, when the user says "build the app", "create the app",
  "start building", or at the start of Phase 3.
user-invocable: true
---

# Build App — Phase 3 Workflow

Build pro code apps according to the dashboard plan. All DOMO apps at Rawso
are built as custom code — no traditional card builder or App Studio.

## Prerequisites — HARD GATE

Before starting Phase 3, verify ALL of these. Do not proceed on assumption.

- [ ] Phase 2 data QC report exists and says PASS — read `qc-reports/data-qc-*.md` to confirm
- [ ] `plans/layout.md` exists — read it for app/view list and layout
- [ ] `plans/kpis.md` exists — read it for metric definitions
- [ ] `plans/data-mapping.md` exists — read it for dataset details
- [ ] DOMO CLI authenticated — run `domo dev` to confirm (note: `domo whoami` does NOT exist)

If any prerequisite fails, stop and tell the user what's missing.
Do not say "I'll assume Phase 2 is done" — verify it.

## Save Protocol
Follow the save protocol in `.claude/skills/checkpoint/SKILL.md`.
Save and commit after completing each app or major component.

## Model Routing
Default to Sonnet subagents for all execution. Keep Opus only for
judgment calls (build order, verification verdicts, architecture decisions).

**Subagent prompts should be lean:** Pass only the specific context needed
(e.g., "Build a React component for [X] using ECharts. Read
`pro-code-apps/references/sdk-reference.md` for API patterns and
`design-system/tokens/brand-colors.json` for colors.") — do NOT tell
subagents to load entire skill files.

## Skills (read on-demand, not pre-loaded)
- `pro-code-apps` — architecture + `references/sdk-reference.md` for API
- `cli-setup` — manifest.json structure
- `design-system` — brand rules + `tokens/` for values
- `libraries` — stack decisions + `templates/standard-deps.json`
- `responsive` — breakpoint patterns
- `credentials` — if auth issues arise

## Steps

### Step 1: Review the Build Queue
Read the app/view list from `plans/layout.md`. For each app:
- App name and purpose
- Which datasets it connects to (alias mapping)
- Visualizations and interactivity needed
- Calculations done app-side vs pre-computed in ETL

Present the build order to the user. Suggest:
1. Simplest app/view first (validates data connection and dev workflow)
2. Data-heavy apps next (builds on established patterns)
3. Most interactive/complex apps last (most iteration needed)

### Step 2: Scaffold Each App

#### 2a. Project Setup
- Create app directory: `apps/[app-name]/`
- Copy starter templates from `cli-setup/templates/`:
  - public/manifest.json → configure with app name, design ID, dataset mappings
  - ryuu.js → configure with DOMO instance URL
- Copy app starter from `.claude/skills/pro-code-apps/templates/`:
  - index.html, App.jsx, globals.css
- Initialize package.json if using npm dependencies
- Apply design tokens from `.claude/skills/design-system/tokens/` to CSS variables

#### 2b. Verify Dev Environment
- Confirm credentials are available (check credentials skill)
- Run `domo dev` to verify local dev server connects
- Confirm dataset proxy works (data flows from DOMO to local app)
- If this is the first app, this step validates the entire dev toolchain

### Step 3: Build Each App

#### 3a. Data Layer
- Configure `public/manifest.json` dataset mappings (alias, dataset ID, fields)
- Implement data fetching with domo.js (domo.get with query params)
- Handle loading states, error states, empty data states
- If multiple datasets: implement all connections, verify each
- Verify data renders correctly before investing in styling
- Log any data issues or surprises to decision-log.md

#### 3b. App Logic and Visualization
- Implement the core visualization using preferred charting library
- Build interactivity: filters, drill-down, tab navigation
- Implement calculations done app-side
- Handle filter events from DOMO dashboard (domo.onFiltersUpdate)
- Handle edge cases: no data, single data point, extreme values

#### 3c. Styling
- Apply design system (colors, typography, spacing from design-system skill)
- Style all components consistently
- Apply chart styling per design system conventions
- Verify all text is readable, colors meet contrast requirements

#### 3d. Responsive Design
- Apply responsive patterns from responsive skill
- Test at DOMO's card sizes (full width, half, quarter)
- Verify charts resize and re-render correctly
- Verify touch-friendly on mobile (if applicable)
- Handle text truncation and overflow gracefully

### Step 4: Per-App Verification — HARD GATE

**You must verify each item before marking an app complete. "Should work" is not acceptable.**

Run verification commands and report results — do not claim success without evidence.

- [ ] **Data is correct** — spot-check at least 3 values against the source dataset
- [ ] **All KPIs addressed** — cross-reference `plans/kpis.md`, check each metric off
- [ ] **Design system applied** — compare colors, fonts, spacing to design-system tokens
- [ ] **Responsive** — verify at 3+ sizes (full width, half, quarter)
- [ ] **No console errors** — check browser dev tools, report what you find
- [ ] **Loading and error states** — trigger each state, confirm it renders
- [ ] **Filter interactions** — test filter propagation, confirm data updates
- [ ] **Build passes** — run `pnpm build` and confirm zero errors

If verification fails:
- Fix the issue
- Re-verify the specific failure
- Do not proceed until passing

| Thought you might have | Why it's wrong |
|------------------------|----------------|
| "The chart renders, so the data must be right" | Charts can render beautifully with wrong data. Spot-check actual values. |
| "I applied the design system, no need to verify" | Token names change, CSS specificity overrides. Visual check catches this. |
| "Responsive is fine, I used Tailwind breakpoints" | DOMO cards have their own sizing context. Tailwind breakpoints don't map 1:1. |
| "I'll skip verification on this simple app" | Simple apps break in simple ways. Verification takes 2 minutes. Debugging takes 30. |
| "The build passes so it works" | Builds catch syntax errors. They don't catch wrong data, wrong colors, or broken filters. |
| "I'll let the user check the visual stuff" | Visual verification is part of building. The user asked you to build the app, not half-build it. |

### Step 5: Save and Commit
After each app passes verification:
- Commit all app files: `feat(apps): add [app-name]`
- Update project-state.md: mark app as complete
- Log any decisions to decision-log.md
- Push to GitHub (triggers deployment if CI/CD is configured)

### Error Handling — During Any Build Step

If you encounter an error at any point during the build:

1. **Read the error message** — don't guess at the cause
2. **Auto-load troubleshoot skill** — read `.claude/skills/troubleshoot/SKILL.md`
   and route to the matching section:
   - Build/publish errors → CLI / Publish Issues
   - Blank screen or render errors → Pro Code App Issues
   - Data not showing or wrong → Data Discrepancy Issues
   - Deploy not updating → GitHub Actions / Deploy Issues
3. **Follow the structured debugging process** — do not skip steps
4. **Fix and re-verify** before continuing with the build
5. **Log the issue and fix** in decision-log.md for future reference

Do not proceed past a broken app. Fix it or flag it to the user.

### Step 6: Integration Check
After all apps are built:
- Review the full dashboard — do apps work together?
- Check filter propagation across apps/cards
- Verify navigation and drill paths between views
- Check the information hierarchy matches the plan
- Verify deployment via GitHub Actions succeeded (see git-deploy skill)

### Phase Boundary — HARD GATE

**Phase 3 is NOT complete until ALL of these are verified:**

- [ ] Every app from `plans/layout.md` is built and committed
- [ ] Every app passes its Step 4 verification checklist (above)
- [ ] `pnpm build` succeeds with zero errors for every app
- [ ] Integration check (Step 6) is complete — apps work together
- [ ] GitHub Actions deploy succeeded (check Actions tab) OR apps deployed via `domo publish`
- [ ] project-state.md shows all Phase 3 tasks checked

**You must run `pnpm build` and check its output before marking Phase 3 complete.**

**If a gate item fails — auto-recover:**
- App missing → go back to Step 2-3 and build it now
- Verification failed → fix the specific failure, re-run Step 4 for that app
- Build fails → load troubleshoot skill, route to CLI / Publish Issues
- Deploy failed → check GitHub Actions logs, fix and re-push
- Integration check fails → fix cross-app issues (filters, navigation), re-verify
Do not stop and wait. Fix what's broken, then re-check the gate.

Once all items are verified, Phase 3 is complete.

**Auto-transition:** Commit all app files, update project-state.md, then ask
the user: "All apps are built and deployed. Want to continue to Phase 4
(full QC), or stop here and resume later?" If they want to continue,
verify Playwright auth exists, then load and execute `/full-qc` directly —
do not make them type the command.
