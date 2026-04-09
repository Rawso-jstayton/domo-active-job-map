---
name: status
description: >
  Show current project progress without modifying anything. Displays phase
  completion, current task, remaining work, and what's blocking or next.
  Use when the user asks "where are we", "what's done", "show progress",
  "project status", "what's left", "what phase are we in", or just wants
  an overview of the current project state.
user-invocable: true
---

# Status — Project Progress Overview

Read and display project state, then interpret what it means.

## Steps

### 1. Read Project State

Read `.claude/status/project-state.md`.

If the file doesn't exist: tell the user "No project state found —
run `/init` to set up this project, or `/resume` if one was in progress."
Stop here.

### 2. Calculate Progress

Count completed vs total tasks across all phases.

### 3. Display Summary

```
📊 [Project Name] — Status

Phase 1: Plan       [✅ Complete | 🔨 In Progress (3/5 tasks) | ⏳ Not Started]
Phase 2: Pipeline   [✅ | 🔨 | ⏳]
Phase 3: Build      [✅ | 🔨 | ⏳]
Phase 4: QC         [✅ | 🔨 | ⏳]
Phase 5: Polish     [✅ | 🔨 | ⏳]
Phase 6: Deploy     [✅ | 🔨 | ⏳]

Overall: X of Y tasks complete
Active task: [task description]
Known issues: [count, or "none"]
```

### 4. Interpret the State

After the raw status, add a brief interpretation — what does this mean
for the project right now? One short paragraph, not a list. Focus on:

- **What's blocking progress** (if anything is stuck or has known issues)
- **What the natural next step is** based on the current phase
- **Any risk or concern** worth flagging (e.g., QC failed and wasn't resolved,
  or the project is in a late phase but has open issues)

Examples of good interpretation:

> "Pipeline is complete and data QC passed. The app is in active development
> in Phase 3. Once the current build task finishes, you'll be ready for a
> dev deploy and Phase 4 QC. No blockers."

> "Phase 2 has 2 tasks incomplete and a known issue with the HCSS connector.
> Recommend resolving the connector issue before continuing — it will block
> data QC in Phase 2 and everything downstream."

> "All 6 phases are complete. The project is deployed. If this is the final
> state, consider running `/handoff` to document the project for future
> reference."

### 5. Read-Only

Do not modify any files or automatically start the next task.
If the user wants to continue, they'll ask or run a workflow skill.
