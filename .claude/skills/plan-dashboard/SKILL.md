---
name: plan-dashboard
description: >
  Full planning workflow for a DOMO dashboard or app — requirements gathering,
  KPI definition, layout planning, and data source mapping. Use at the start
  of any new dashboard project, when the user says "plan", "new dashboard",
  "what should we build", or at the beginning of Phase 1.
user-invocable: true
---

# Plan Dashboard — Phase 1 Workflow

Walk through the complete planning process for a new dashboard or app.

## Save Protocol
Follow the save protocol in `.claude/skills/checkpoint/SKILL.md`:
- Auto-update `project-state.md` after each step
- Log decisions to `decision-log.md`
- On user pause: run full checkpoint

## Steps

### Step 1: Requirements Gathering
If not already captured in CLAUDE.md (via /init), ask:
- Who will use this dashboard? (roles, technical level)
- What decisions should it help them make?
- What questions do they currently struggle to answer?
- How often will they look at it? (daily, weekly, monthly)
- Are there existing reports or dashboards to replace/improve?
- Any must-have features? (specific charts, drill-downs, exports)

Save responses to project-state.md and decision-log.md.

### Step 2: KPI / Metric Definition
For each metric:
- Name and definition (exactly how it's calculated)
- Data source and relevant fields
- Time grain (daily, weekly, monthly, YTD)
- Comparison context (vs prior period, vs target, vs benchmark)
- Who cares about this metric and why

Save to `plans/kpis.md`.
Update project-state.md: Phase 1, task 2 complete.

### Step 3: Data Source Mapping
**Data sources are discovered iteratively.** Start with what's known now.
New sources often surface during KPI definition ("we need GL data for that")
or layout planning ("that card needs a different dataset"). Update
`plans/data-mapping.md` each time a new source is identified — this is
normal, not a sign that planning was incomplete.

For each known data source:
- System name and source type (new connector | existing DOMO dataset | webform | manual)
- Key tables/datasets and what they contain
- Relevant fields for the identified KPIs
- Join keys between data sources
- Refresh frequency needed
- Any known data quality issues
- Dataset ID if already known (UUID, e.g., `a1b2c3d4-...`)

Save to `plans/data-mapping.md`.
Update project-state.md: Phase 1, task 3 complete.

### Step 4: Layout Planning
Based on KPIs and audience:
- Propose view structure (e.g., leadership vs operational)
- For each view:
  - Card list with type (KPI tile, bar chart, line chart, table, etc.)
  - Layout grid position (top-left is most important)
  - Card size (full width, half, quarter)
  - Filter interactions between cards
- Consider information hierarchy: what do they see first?

Save to `plans/layout.md`.
Update project-state.md: Phase 1, task 4 complete.

### Step 5: Plan Review
Present the complete plan to the user:
- KPI summary
- Data source summary
- Layout mockup (text-based or simple diagram)
- Any assumptions or open questions

Ask for approval before proceeding to Phase 2.

Save final plan to `plans/dashboard-plan.md`.
Update project-state.md: Phase 1 complete ✅.

### Phase Boundary — HARD GATE

**Phase 1 is NOT complete until ALL of these are verified:**

- [ ] `plans/kpis.md` exists and contains at least one fully defined metric
- [ ] `plans/data-mapping.md` exists with dataset IDs, join keys, and refresh schedules
- [ ] `plans/layout.md` exists with view structure, card list, and grid positions
- [ ] `plans/dashboard-plan.md` exists as the approved combined plan
- [ ] User has explicitly approved the plan (do not self-approve)
- [ ] All open questions from planning are resolved or logged in decision-log.md
- [ ] project-state.md shows all Phase 1 tasks checked

**You must verify each item above before marking Phase 1 complete.**
Do not say "planning looks complete" — check each file exists and has content.

**If a gate item fails — auto-recover:**
- Missing plan file → go back to the step that creates it and complete it now
- User hasn't approved → present the plan and ask for approval
- Open questions remain → list them and resolve with the user
Do not stop and wait. Fix what's missing, then re-check the gate.

Once all items are verified, Phase 1 is complete.

### Parallel Phase Design (Larger Projects)

For larger dashboards with multiple data sources or views, phases don't have
to be strictly sequential. Parallel work can cut project time significantly.

**How to parallelize:**
1. **Define interfaces first** — agree on dataset schemas, component props,
   and data shapes before splitting work. Write TypeScript interfaces in a
   shared `types/` file.
2. **Use mock data** — build UI components against mock data while the pipeline
   is still being set up. Replace mocks with real `Domo.get()` calls once
   datasets are live.
3. **Own separate files/branches** — each parallel workstream should modify
   different files to avoid merge conflicts. One branch for pipeline work,
   another for UI scaffolding.
4. **Merge at integration** — when both streams are ready, integrate and do
   QC against real data.

**When to parallelize:** Multiple independent data sources, clear separation
between views, or when pipeline setup will take time and UI scaffolding can
proceed with known schemas.

**When NOT to:** Small projects, unclear data shapes, or when the KPIs are
still being discovered (you need the data to define the metrics).

**Auto-transition:** Commit all plan files, update project-state.md, then ask
the user: "Planning is done. Want to continue to Phase 2 (pipeline), or
stop here and resume later?" If they want to continue, load and execute
`/build-pipeline` directly — do not make them type the command.
