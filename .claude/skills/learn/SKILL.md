---
name: learn
description: >
  Capture a new piece of knowledge and add it to the appropriate skill file.
  Use when the user discovers something during development that should be
  permanently recorded — a DOMO quirk, a library gotcha, a pattern that works,
  a limitation discovered. Triggered by "remember this", "add this to the
  skill", "learn", "note this for future projects", or when the user shares
  a tip or workaround.
user-invocable: true
---

# Learn — Capture Knowledge Into Skills

When the user shares knowledge that should persist across projects, add it
to the right place in the toolkit.

## Steps

### 1. Understand the Knowledge
Clarify with the user if needed:
- What's the fact, pattern, or limitation?
- Is this project-specific or universal across DOMO projects?

### 2. Route to the Right Location

**If project-specific** (applies only to this project):
→ Add to `.claude/decisions/decision-log.md` under today's date

**If universal** (applies to all DOMO projects):
→ Identify the most relevant skill and add it there

Routing guide:
- Connector behavior → `.claude/skills/connectors/SKILL.md`
- ETL tile behavior or gotcha → `.claude/skills/magic-etl/SKILL.md`
- Dataset API quirk → `.claude/skills/datasets/SKILL.md`
- Output/writeback issue → `.claude/skills/outputs/SKILL.md`
- DOMO AI behavior → `.claude/skills/domo-ai/SKILL.md`
- CLI issue → `.claude/skills/cli-setup/SKILL.md`
- Pro code app pattern → `.claude/skills/pro-code-apps/SKILL.md`
- App Studio limitation → `.claude/skills/app-studio/SKILL.md`
- Card/chart behavior → `.claude/skills/cards/SKILL.md`
- Library tip → `.claude/skills/libraries/SKILL.md`
- Design/styling → `.claude/skills/design-system/SKILL.md`
- Responsive issue → `.claude/skills/responsive/SKILL.md`
- QC-related → appropriate qc skill

### 3. Add the Knowledge
Add it to the appropriate section of the target skill. If no section fits,
add a "Known Issues" or "Learned Patterns" section.

Format:
```markdown
- **[Brief title]:** [Description of the fact/pattern/limitation and when it matters]
```

### 4. Confirm
Tell the user:
```
Added to [skill-name]: "[brief description]"
[Show the line that was added]
```

### 5. Propagation Reminder
If this is a universal learning added to a skill file, remind the user:
"This is saved in the toolkit for this project. To apply it to other projects,
update the same skill in your template repo (domo-dev-toolkit) when
you get a chance."
