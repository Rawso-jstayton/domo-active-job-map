---
name: build-pipeline
description: >
  Data pipeline workflow — connector setup, optional ETL, dataset validation,
  and data QC. Covers Phase 2 of the project lifecycle. Supports multiple
  architectures: full ETL pipeline, client-side calculation (no ETLs), or
  existing datasets only. Use when setting up data, when the user says
  "build the pipeline", "set up the data", "ETL", "connect the data",
  or at the start of Phase 2.
user-invocable: true
---

# Build Pipeline — Phase 2 Workflow

Set up the data layer for the project. This phase adapts to the architecture
chosen during planning — not every project needs ETLs.

## Architecture Paths

Read `plans/data-mapping.md` to determine which path applies:

**Path A: Full ETL Pipeline** — connector → ETL → output → validate
Use when: data needs server-side transformation, joins, aggregation, or
scheduled processing before apps consume it.

**Path B: Client-Side Calculation** — connector → validate → app handles logic
Use when: raw datasets are sufficient and calculations happen in the app.
Skip Steps 2-3 (ETL design/build) entirely.

**Path C: Existing Datasets Only** — verify → document → validate
Use when: datasets already exist in DOMO (from other connectors or teams).
Skip Step 1 (connector setup) for those sources.

Most projects are a mix — some sources need connectors, some already exist,
some need ETLs, some don't. Handle each source according to what it needs.

## Prerequisites
- Phase 1 (Plan) must be complete
- Read `plans/data-mapping.md` for data source details
- Read `plans/kpis.md` for what calculations are needed

## Save Protocol
Follow the save protocol in `.claude/skills/checkpoint/SKILL.md`.
**Batch state updates at milestones** (end of connector setup, end of ETL build,
end of QC) — not after every individual sub-step.

## Model Routing
Default to Sonnet subagents for all execution (writing docs, running commands,
creating QC reports). Keep Opus only for architecture decisions, ETL design
approval, QC failure diagnosis, and phase gate verification.

**Lean subagent prompts:** Pass specific context needed — don't load full skills.
E.g., "Document dataset schema for [X]. Read `datasets` skill for format."

## Steps

### Step 1: Connector Audit

**Before building anything, audit every data source.** Don't trust the
discovery report alone — query live datasets via the DOMO API to validate.

Read `.claude/skills/connectors/SKILL.md` for connector reference.
Read `.claude/skills/validate-connectors/SKILL.md` for validation procedure.

For each data source in `plans/data-mapping.md`, check:

| Check | How |
|-------|-----|
| **Update mode** | REPLACE or APPEND? Wrong mode = lost history or duplicates |
| **Date range** | What range is the connector pulling? (e.g., yesterday-30 is Facebook's default — only 30 days!) |
| **Row count** | Query via API: is it reasonable for the data type? |
| **Key columns populated** | Sample recent rows via API — nulls/zeros may indicate deprecation |
| **Last updated** | Is the connector actually running? |
| **Schema** | Do column names/types match what the plan expects? |

Write findings to `qc-reports/connector-audit.md`. This audit is a standard
Phase 2 deliverable, not optional.

### Step 2: Data Source Setup

**Note:** Connectors are configured in the DOMO UI, not via CLI or API.
Claude can guide you through the steps, but you'll need to do the clicking
in DOMO. For sources that already exist as datasets in DOMO, skip connector
setup and go straight to documentation.

For each data source in the plan:

**If new connector needed:**
- Walk the user through connector setup in DOMO UI
- Confirm auth credentials are valid
- Verify the correct datasets/reports are selected
- Set update mode (REPLACE vs APPEND) — document the choice and why
- Set date range appropriately (extend defaults if historical data needed)
- Confirm refresh schedule
- Run an initial sync (or verify last successful sync)

**If dataset already exists in DOMO:**
- Verify the dataset exists and has recent data
- Confirm row count and schema match expectations

**For all sources, document in `datasets/[source-name].md`:**
- Dataset ID (UUID format, e.g., `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)
- Column names and types
- Row count
- Update mode (REPLACE / APPEND) and rationale
- Refresh schedule (or "static" / "manual")
- Date range setting (if applicable)
- Source type: new connector | existing dataset | webform | manual upload

Update project-state.md: data source setup complete.

### Step 3: ETL Design (if applicable)

**Skip this step if the architecture is client-side calculation or no
transformations are needed.** Log in decision-log.md: "No ETLs needed —
[reason: client-side calculation / raw data sufficient / etc.]"

Read `.claude/skills/magic-etl/SKILL.md` for ETL patterns.

For each ETL needed:
- Plan the transformation logic based on KPI definitions
- Choose tiles (reference `.claude/skills/magic-etl/tiles/tile-reference.md`)
- Document the ETL design in `etls/[etl-name].md`:
  - Input datasets
  - Transformation steps (in order)
  - Output schema
  - Expected row count behavior (same, fewer, more than input)

Present ETL design to user for approval before building.
Update project-state.md: ETL design task complete.

### Step 4: ETL Build (if applicable)

**Skip if no ETLs were designed in Step 3.**

Build the ETL(s) according to the approved design.

For each ETL:
- Create in DOMO (user does this in DOMO UI with Claude's guidance)
- Configure each tile
- Run the ETL
- Verify output dataset is created
- Document the output dataset in `datasets/[output-name].md`

Update project-state.md: ETL build task(s) complete.

**Important: "ETLs built" is NOT the same as "ETLs validated."** Building
means the ETL runs without errors and produces an output dataset. Validation
(Step 6) means the output data is actually correct. Do not mark Phase 2
complete after this step — validation is required.

### Step 5: Output Configuration
- Verify all datasets (raw + any ETL outputs) have correct schemas
- Set up any PDP policies needed (reference datasets skill)
- Configure any writeback connectors if applicable
- Ensure all datasets referenced in `plans/data-mapping.md` are documented

Update project-state.md: output configuration complete.

### Step 6: Data QC
Read `.claude/skills/qc-data/SKILL.md` for QC procedures.

Run the data QC process adapted to the architecture:
- **All architectures:** Schema validation, data completeness, spot check accuracy
- **With ETLs:** Row count validation at each pipeline stage
- **Without ETLs:** Row count validation on raw datasets only
- **Existing datasets:** Verify data freshness and expected row counts

Save QC report to `qc-reports/data-qc-[date].md`.
Update project-state.md: data QC task complete.

If QC fails:
- **Read the QC report** — identify which specific check failed
- **Auto-load troubleshoot skill** — read `.claude/skills/troubleshoot/SKILL.md`
  and route to the matching section
- Fix the root cause, not the symptom
- Re-run the specific QC check that failed
- Do not proceed to Phase 3 until data QC passes

### Phase Boundary — HARD GATE

**Phase 2 is NOT complete until ALL applicable items are verified:**

- [ ] Connector audit completed (`qc-reports/connector-audit.md` exists)
- [ ] Every data source from `plans/data-mapping.md` is accessible in DOMO
- [ ] All datasets have documented schemas in `datasets/`
- [ ] Architecture decision is logged (ETL / client-side / hybrid)
- [ ] If ETLs: all ETLs are built, running, and producing output datasets
- [ ] If ETLs: ETL output data has been **validated** (not just "ETL ran successfully")
- [ ] If no ETLs: decision logged in decision-log.md with rationale
- [ ] Data QC report exists at `qc-reports/data-qc-*.md` with PASS verdict
- [ ] project-state.md shows all Phase 2 tasks checked

**Items marked "if ETLs" are skipped when the architecture doesn't use them.**
The gate adapts to the architecture chosen — don't force ETL items when there
are no ETLs.

**If a gate item fails — auto-recover:**
- Missing dataset doc → create it now from DOMO Data Center
- ETL not producing data → load troubleshoot skill, route to Magic ETL Issues
- Data QC failed → fix the issue, re-run QC, do not proceed until PASS
Do not stop and wait. Fix what's broken, then re-check the gate.

| Thought you might have | Why it's wrong |
|------------------------|----------------|
| "Data looks fine, QC is a formality" | QC catches null keys, timezone bugs, and schema drift that look fine at a glance |
| "We can fix data issues during app build" | Data bugs found during build cost 3x more time than catching them now |
| "No ETLs means Phase 2 is trivial" | Documenting schemas and validating data quality matters regardless of ETLs |

Once all applicable items are verified, Phase 2 is complete.

**Auto-transition:** Commit all pipeline files, update project-state.md, then
ask the user: "Data layer is set up and validated. Want to continue to
Phase 3 (build apps), or stop here and resume later?" If they want to continue,
load and execute `/build-app` directly — do not make them type the command.
