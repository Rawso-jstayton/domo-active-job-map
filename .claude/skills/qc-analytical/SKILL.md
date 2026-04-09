---
name: qc-analytical
description: >
  Analytical QC — evaluate whether a dashboard or app answers the right
  questions and enables the right decisions. Performs gap analysis, stakeholder
  review prompts, completeness checklists, and decision-readiness assessment.
  Use during Phase 4 (QC) after visual QC passes, when reviewing a dashboard
  with a stakeholder lens, or when the user says "what's missing", "does this
  answer", "gap analysis", "review the dashboard", or "what decisions can
  we make from this".
user-invocable: true
---

# QC Analytical — Decision-Readiness Review

Evaluate whether the dashboard/app serves its intended purpose.

## Purpose

This QC layer goes beyond "does it work" (data QC) and "does it look right"
(visual QC) to ask "does it answer the right questions for the people
who will use it." This is the most valuable and most frequently skipped
quality check.

## Steps

### 1. Revisit the Original Requirements
Read the project plan from `plans/` and the stakeholder information from
`CLAUDE.md`. Remind yourself:
- Who is the primary audience?
- What decisions do they need to make?
- What KPIs/metrics were requested?
- What questions did the stakeholder originally ask?

### 2. Question Coverage Audit
For each KPI or question in the original requirements:
- Is it answered by a card/view on the dashboard?
- Is the answer clear without explanation?
- Can a non-technical stakeholder interpret it correctly?

Flag any requirements that aren't addressed.

### 3. "What Questions Does This NOT Answer?"
Look at the dashboard as a whole and identify:
- Obvious follow-up questions a stakeholder would ask that aren't answered
- Comparisons that are implied but not shown (e.g., vs last year, vs target)
- Drill-down paths that don't exist but should
- Edge cases or segments that aren't visible

### 4. "What Decisions Can We Make From This?"
For each card/view, articulate:
- What specific decision does this enable?
- Is there enough context to make that decision? (benchmarks, targets, trends)
- What action would someone take based on this data?

If a card doesn't clearly enable a decision, flag it as potentially
unnecessary or in need of additional context.

### 5. Stakeholder Simulation
Imagine you are the stakeholder. Walk through:
- Opening the dashboard for the first time — is it clear what you're looking at?
- Finding a specific answer — can you get to it in under 10 seconds?
- Noticing a problem in the data — does the dashboard surface it clearly?
- Presenting to others — could you walk someone through this easily?

### 6. Completeness Checklist
Verify:
- [ ] Every requested KPI is present
- [ ] Each card has a clear title that explains what it shows
- [ ] Date ranges are clear and consistent
- [ ] Comparison context exists (vs period, vs target, vs benchmark)
- [ ] Filters allow the stakeholder to focus on what they need
- [ ] No orphan cards (cards that don't connect to any stakeholder need)
- [ ] Layout guides the eye in a logical order
- [ ] Mobile view is usable (if applicable)

## Reporting

Save to `qc-reports/analytical-qc-[date].md`:

```markdown
# Analytical QC Report — [date]

## Dashboard/App: [name]
Stakeholder: [name, role]
Purpose: [what decisions this enables]

## Question Coverage
| Requirement | Addressed? | Card/View | Notes |
|-------------|-----------|-----------|-------|
| [KPI/question] | ✅/❌ | [card name] | [any gaps] |

## Gaps Identified
- [Question or decision not addressed]
- [Missing comparison or context]
- [Follow-up question with no answer]

## Decision Mapping
| Card | Decision It Enables | Sufficient Context? |
|------|-------------------|-------------------|
| [card] | [decision] | ✅/❌ — [what's missing] |

## Recommendations
1. [Add/modify/remove suggestion]
2. [Additional card or filter needed]
3. [Context to add]

## Overall: [READY / NEEDS WORK]
```

## After Analytical QC

If gaps are found:
- Discuss with the user which gaps to address
- Add new tasks to `project-state.md` Phase 3 (Build) or Phase 5 (Polish)
- Don't block deployment for minor gaps — note them for future iteration
