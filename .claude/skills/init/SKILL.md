---
name: init
description: >
  Initialize a new project from the DOMO dev toolkit template. Sets up
  CLAUDE.md with project details, initializes project-state.md, and
  scaffolds directories. Use at the start of any new project, when the
  user says "new project", "set up", "initialize", describes what they
  want to build, or when project-state.md is still templated. Also
  triggered when CLAUDE.md still has the toolkit template header.
user-invocable: true
---

# Init — New Project Setup

Walk the user through setting up a new project conversationally.

## Conversational Entry
Users may not say "init" or "new project." They might say:
- "I need a headcount dashboard"
- "Build me an app that shows sales by region"
- "We need to track equipment utilization"

If the user describes what they want and the project isn't initialized yet
(CLAUDE.md still has the toolkit template header, or `project-state.md` is
still templated), treat it as an init request. Extract as much info as you
can from their message, then ask only for what's missing — don't re-ask
things they already told you.

## Steps

### 1. Gather Project Information
Extract from what the user already said, then ask ONLY for what's missing.
Ask conversationally, not as a numbered form. Group remaining questions into
one natural message.

**Required (ask only if not already provided):**
- What's the project name?
- What type? (dashboard, pro-code app, app-studio card, ETL pipeline, or mixed)
- Who's the primary stakeholder? (name and role)
- What's the goal — what problem does this solve or what decisions does it enable?
- What data sources will we use? (name, type, any known dataset IDs)
  **Note:** Data sources are often discovered iteratively during planning.
  Capture what's known now — more can be added during Phase 1 and Phase 2.
  Don't block on having a complete list.
- **Do you already have connectors set up in DOMO?** (which ones, are they active?)
- **Are there existing datasets we should use?** (dataset names or IDs if known)
  If the user has existing data, suggest running `/discover` before planning
  to inventory what's already available. This avoids duplicate connector setup
  and surfaces data that can be reused.

**If dashboard or app:**
- Are there multiple views/audiences? (e.g., leadership vs operational)
- Any specific KPIs or metrics already identified?

**If ETL/pipeline:**
- What's the source system and destination?
- Refresh frequency needed?

### 2. Update CLAUDE.md
Replace **everything above the first `---` line** in the root `CLAUDE.md`
with the project-specific header below. The toolkit template header ships
with generic content — replace it wholesale, don't try to find brackets.
Keep the "How This Toolkit Works" section (everything after the `---`)
unchanged.

**Write this header** (fill in values from Step 1):

```markdown
# DOMO Project: {project name}

{One paragraph: what this project is, who the stakeholder is, what problem it solves}

## Data Sources

Data sources are discovered iteratively — start with what's known, add more during planning.
- {dataset name} — Dataset ID: {UUID or "TBD"}, refresh: {daily/hourly/static}, source: {connector/existing/webform}

## Project Type

{dashboard | pro-code-app | app-studio | etl-pipeline | mixed}

## Stakeholder(s)

- {Name} — {Role} — {What they need from this project}

## Commands

```bash
pnpm dev                   # Start local dev server with DOMO proxy
pnpm build                 # Production build
domo publish               # Deploy to DOMO (or use CI/CD via git push)
npm run domo:auth          # Capture Playwright auth state (first time / expiry)
npm run domo:screenshot    # Screenshot a dashboard at desktop/tablet/mobile
```

## Gotchas

- **Windows npm globals need `.cmd`:** `pnpm.cmd`, `domo.cmd`, `npx.cmd` — but NOT `gh`, `git`, `node`
- **Playwright auth expires ~90 days:** Re-run `npm run domo:auth` when screenshots fail with auth errors
- **DOMO CLI auth (`domo login`) is NOT used** — this toolkit uses DOMO_TOKEN from `~/.domo-secrets`
{Add any project-specific gotchas discovered during setup}

## Project-Specific Decisions

None yet — decisions will be logged as they arise.
```

### 3. Initialize Project State
Update `.claude/status/project-state.md`:
- Set "Current Phase: 1 — Plan"
- Update Phase 1 tasks if the user has already completed any planning
- Add data sources to the "Active Data Sources" section
- Set "Last updated" to current timestamp
- Set "Last session" to "Project initialized"

### 4. Create Initial Decision Log Entry
Add to `.claude/decisions/decision-log.md`:
```
## [today's date]
- **Project initialized:** [project type] for [stakeholder]. Goal: [goal summary]
- **Data sources:** [list sources and any known IDs or refresh schedules]
```

### 5. Confirm and Auto-Continue
Show the user a brief summary, then offer to start immediately:
```
Project initialized: [name]
Type: [type] | Stakeholder: [name] | Data sources: [count]

Want to start planning now?
```

**If yes** (or anything affirmative like "let's go", "sure", "yeah"):
Load and execute `/plan-dashboard` (or `/build-pipeline` for ETL-only
projects) directly — do not make them type the command.

**If no** (or "not now", "later", "I need to do something else first"):
Acknowledge and let them know they can say "start planning" or run
`/plan-dashboard` whenever they're ready. Do not push — just commit
the initialization and wait for their next instruction.

**If they redirect** ("actually, let's set up the data first"):
Follow their lead. Route to the appropriate skill for what they asked.

### 6. Commit
Stage all files modified during initialization, then commit:
```bash
git add CLAUDE.md .claude/status/project-state.md .claude/decisions/decision-log.md
git commit -m "feat(init): initialize [project-name] project"
```
