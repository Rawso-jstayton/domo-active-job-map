---
name: build-toolkit
description: >
  Meta-skill for building out the DOMO dev toolkit itself. Walks through
  each skill systematically, pulling from DOMO documentation, user knowledge,
  and existing repos to fill in placeholder content. Use when the user says
  "build the toolkit", "fill in the skills", "set up the template", or
  wants to develop the toolkit skills themselves.
user-invocable: true
---

# Build Toolkit — Fill In All Skills

> **This skill is for maintaining and extending the toolkit itself — not for
> working on DOMO projects.** If you're starting or continuing a DOMO project,
> use `/init`, `/resume`, or `/plan-dashboard` instead.
>
> Use this skill when: adding a new skill, improving existing skill content,
> updating conventions, or onboarding the toolkit to a new project context.

Systematically fill in every skill in this toolkit with real content.

## Approach

This is a multi-session effort. Don't try to fill everything in one session.
Work through skills in priority order, filling each one completely before
moving to the next. Use /checkpoint between skills or when context gets warm.

## Priority Order

Fill skills in this order (most impactful first):

### Tier 1 — Build these first (needed before any project work)
1. **credentials** — Set up GitHub org secrets, DOMO CLI auth
   - This must work before anything else
   - Set up 4 GitHub org secrets with the admin
   - Verify `domo login` works
   - Discover Playwright token injection method (dev tools inspection)

2. **design-system** — Brand colors, typography, chart styling
   - Ask the user for Rawso's brand guidelines, hex codes, fonts
   - Fill in tokens/brand-colors.json and tokens/typography.json
   - Define chart styling conventions

3. **libraries** — Which libraries to use
   - Ask: charting library preference (ECharts, ApexCharts, etc.)
   - Ask: CSS framework (if any)
   - Ask: utility libraries, date library, framework choice
   - Pin specific versions

4. **cli-setup** — DOMO CLI workflow
   - Reference DOMO's updated developer documentation
   - Fill in manifest.json and ryuu.js templates with real patterns
   - Document the publish workflow
   - Verify ryuu.js library setup

5. **pro-code-apps** — Custom app development
   - Reference DOMO's domo.js SDK documentation
   - Document dataset connection patterns
   - Fill in app architecture patterns
   - Update starter templates with real patterns

6. **git-deploy** — GitHub to DOMO deployment
   - Set up GitHub Actions workflow
   - Configure automated deployment
   - Document branching and version strategy

### Tier 2 — Build these next (needed for pipeline work)
7. **domo-api** — Curated API reference
   - Start with auth endpoints
   - Add dataset query endpoints
   - Add app management endpoints
   - Document only what you actually use — this grows over time via /learn

8. **connectors** — Connector reference
   - Ask the user which connectors Rawso uses
   - Document auth, scheduling, and quirks for each
   - Reference existing HCSS e360 connector experience

9. **magic-etl** — ETL design and tile reference
   - Reference DOMO's ETL documentation
   - Fill in tiles/tile-reference.md comprehensively
   - Document common ETL patterns

10. **datasets** — Dataset management
    - Document API patterns
    - Fill in schema management and PDP sections
    - Define naming conventions

11. **outputs** — Output configuration
    - Document writeback connectors used
    - Scheduled report setup

### Tier 3 — Build these for QC capability
12. **qc-visual** — Playwright setup
    - Help user configure Playwright for their DOMO instance
    - Build out scripts/playwright-base.js with real auth flow
    - Test and verify the setup works

13. **qc-data** — Data validation procedures
    - Define specific validation queries and thresholds
    - Build reusable validation patterns

14. **qc-analytical** — already well-structured, minimal filling needed

### Tier 4 — Fill as needed
15. **responsive** — DOMO-specific responsive patterns
16. **domo-ai** — AI feature configuration
17. **cards** — Kept for reference; useful if you ever need beast mode formulas
18. **app-studio** — Kept for reference; useful if someone needs low-code option

## For Each Skill

When filling in a skill:

1. **Read the existing SKILL.md** — understand what sections need content
2. **Identify information sources:**
   - Ask the user for Rawso-specific knowledge
   - Reference DOMO's official documentation (search if available)
   - Check the existing `domo-dev-toolkit` repo for patterns to carry forward
   - Use your training knowledge of DOMO's platform
3. **Fill in section by section** — don't write the whole file at once
4. **Ask the user to verify** critical sections (especially auth, credentials, conventions)
5. **Mark TODO for unknowns** — if something needs real-world testing, mark it:
   `<!-- TODO: Verify this works in Rawso's DOMO instance -->`
6. **Save after each skill** — commit with: `docs(skills): fill in [skill-name]`

## Reference: Existing Toolkit

The user has an existing `domo-dev-toolkit` repo that may contain
patterns, code samples, or conventions worth carrying forward. Ask
the user if they want to reference it, and if so, review relevant
files before filling in skills.

## Session Management

This is a long process. After filling in 2-3 skills:
- Run /context-check
- If 🟡 or 🔴: run /checkpoint and recommend a new session
- Track which skills have been filled in project-state.md
  (add a "Toolkit Build Progress" section)

## Completion Criteria

A skill is "complete" when:
- All placeholder comments are replaced with real content
- Rawso-specific conventions are documented
- Templates and scripts are functional (not just stubs)
- The user has reviewed and approved critical sections
- TODO items are logged for anything requiring real-world testing
