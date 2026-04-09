---
name: full-qc
description: >
  Full quality check workflow — orchestrates data QC, visual QC (Playwright),
  and analytical QC (decision-readiness review) in sequence. Covers Phase 4
  of the project lifecycle. Use when the user says "run full QC", "quality
  check", "test everything", "is this ready", or at the start of Phase 4.
user-invocable: true
---

# Full QC — Phase 4 Workflow

Run all three QC layers in sequence to validate the complete dashboard/app.

## Prerequisites — HARD GATE

Before starting Phase 4, verify ALL of these. Do not proceed on assumption.

- [ ] Phase 3 build is complete — check project-state.md for all Phase 3 tasks checked
- [ ] Every app passes `pnpm build` with zero errors
- [ ] Apps are deployed and accessible in DOMO
- [ ] Playwright auth state is captured (needed for visual QC screenshots)

If any prerequisite fails, stop and tell the user what's missing.

## Save Protocol
Follow the save protocol in `.claude/skills/checkpoint/SKILL.md`.

## Model Routing
Default to Sonnet subagents for all execution (screenshots, report writing,
data queries, console checks). Keep Opus only for verdict decisions
(PASS/FAIL), gap categorization, stakeholder simulation, and phase gate.

## QC Sequence

Run these in order. Each must pass before proceeding to the next.
If any layer fails, fix the issues and re-run that layer before continuing.

### Layer 1: Data QC (Re-verification)
Read and follow `.claude/skills/qc-data/SKILL.md`.

Even though data QC was run in Phase 2, re-run it now because:
- ETL changes may have been made during card building
- New beast modes or calculations may have been added
- Data may have refreshed since Phase 2

Focus areas for re-verification:
- Row counts still match
- Any new calculated fields produce correct values
- Beast mode calculations match expected results
- Filtered views show correct subsets

Save report to `qc-reports/data-qc-final-[date].md`.
Update project-state.md: "Data QC (final)" complete.

If data QC fails:
- Fix the issue (may require returning to Phase 2 or 3)
- Re-run data QC
- Do not proceed until passing

### Layer 2: Visual QC
Read and follow `.claude/skills/qc-visual/SKILL.md`.

Run the full visual QC suite:
1. Console error check — capture and review all browser errors
2. Full dashboard screenshot — desktop viewport
3. Individual card screenshots — each card at default size
4. Responsive check — screenshot at tablet and mobile viewports
5. Visual regression — compare against baseline if available

Save report to `qc-reports/visual-qc-[date].md`.
Save screenshots to `qc-reports/screenshots/`.
Update project-state.md: "Visual QC" complete.

If visual QC fails:
- Categorize issues: blocking vs cosmetic
- Fix blocking issues immediately
- Log cosmetic issues for Phase 5 (Polish)
- Re-run visual QC for blocking fixes
- Can proceed with cosmetic issues logged

### Layer 3: Analytical QC
Read and follow `.claude/skills/qc-analytical/SKILL.md`.

Run the full analytical review:
1. Question coverage audit — every KPI addressed?
2. Gap analysis — what questions aren't answered?
3. Decision mapping — what decisions can be made?
4. Stakeholder simulation — walk through as the end user
5. Completeness checklist

Save report to `qc-reports/analytical-qc-[date].md`.
Update project-state.md: "Analytical QC" complete.

If analytical QC finds gaps:
- Categorize: must-fix before launch vs future enhancement
- Must-fix items → add tasks to Phase 3 or Phase 5
- Future items → log in decision-log.md for next iteration
- Discuss prioritization with user

## QC Summary Report
After all three layers, generate a combined report at
`qc-reports/full-qc-summary-[date].md`:

```markdown
# Full QC Summary — [date]

## Dashboard/App: [name]

### Data QC: [PASS / FAIL]
[one-line summary]

### Visual QC: [PASS / FAIL / PASS WITH NOTES]
- Console errors: [count]
- Responsive: [pass/fail per viewport]
[one-line summary]

### Analytical QC: [READY / NEEDS WORK]
- KPI coverage: [X of Y]
- Gaps found: [count]
[one-line summary]

### Overall Verdict: [READY TO DEPLOY / NEEDS FIXES / MAJOR REWORK]

### Action Items
1. [Must-fix items, if any]
2. [Polish items for Phase 5]
3. [Future enhancements logged]
```

## Anti-Rationalization Guards

These apply throughout the entire QC process. If you catch yourself thinking
any of these, STOP and follow the correction.

| Thought you might have | Why it's wrong |
|------------------------|----------------|
| "Data QC passed in Phase 2, no need to re-run" | ETL changes during build, new calculations, and data refreshes can all introduce bugs since Phase 2 |
| "Screenshots look fine, skip the console check" | Visual correctness doesn't mean no JavaScript errors. Silent errors cause intermittent failures. |
| "This gap is minor, mark analytical QC as PASS" | Minor gaps compound. Log them now or they become "why didn't we catch this?" later. |
| "The user is in a hurry, skip Layer 3" | Analytical QC is what separates a dashboard from a useful dashboard. It takes 10 minutes. |
| "I'll mark this PASS WITH NOTES instead of FAIL" | If it needs notes, it needs fixes. Be honest about the verdict. |
| "Visual QC failed but it's just cosmetic" | Cosmetic issues are visual issues. Log them for Phase 5, but don't pretend QC passed clean. |

## Phase Boundary — HARD GATE

**Phase 4 is NOT complete until ALL of these are verified:**

- [ ] Data QC report exists at `qc-reports/data-qc-final-*.md` with verdict
- [ ] Visual QC report exists at `qc-reports/visual-qc-*.md` with verdict
- [ ] Analytical QC report exists at `qc-reports/analytical-qc-*.md` with verdict
- [ ] Combined report exists at `qc-reports/full-qc-summary-*.md`
- [ ] All blocking issues are resolved (not just logged)
- [ ] Cosmetic/future items are logged in decision-log.md
- [ ] project-state.md shows all Phase 4 tasks checked

**You must read each QC report and confirm its verdict before marking Phase 4 complete.**

**If a gate item fails — auto-recover:**
- QC report missing → run that QC layer now (data, visual, or analytical)
- Blocking issue unresolved → fix it, re-run the failed QC layer
- Combined report missing → generate it from the individual layer reports
Do not stop and wait. Fix what's incomplete, then re-check the gate.

Once all items are verified, Phase 4 is complete.

**Auto-transition:** Commit QC reports, update project-state.md, then route
based on the QC verdict:
- **READY TO DEPLOY** → ask: "QC passed clean. Want to run code cleanup
  (`/qc-code`) and deploy, or stop here?" If yes, proceed directly.
- **NEEDS FIXES** → fix issues automatically, re-run failed QC layers,
  then re-evaluate.
- **MAJOR REWORK** → tell the user what needs reworking and which phase
  to return to. Do not auto-start — this needs user input.
