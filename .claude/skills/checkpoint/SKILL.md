---
name: checkpoint
description: >
  Save all progress and prepare for a clean session end. Updates project state,
  writes session handoff, and commits files. Use when the user says "save",
  "checkpoint", "pause", "stop", "let's stop here", "save and clear", or when
  context-check recommends stopping. Also triggered automatically at phase
  boundaries.
user-invocable: true
---

# Checkpoint — Save and Prepare for New Session

Save all current progress so the next session can resume cleanly.

## Steps

1. **Finish the current substep**
   Do not stop mid-file-edit or mid-operation. Complete the smallest
   atomic unit of work that leaves files in a consistent state.

2. **Update project state**
   Edit `.claude/status/project-state.md`:
   - Mark completed tasks with `[x]`
   - Update "Current Phase" if a phase boundary was crossed
   - Update "Last updated" timestamp
   - Update "Last session" with a one-line summary of what was accomplished
   - Add any new data sources, known issues, or tasks discovered

3. **Write session handoff**
   Edit `.claude/status/session-handoff.md` with:
   - Timestamp and reason for checkpoint
   - Exact task and step in progress (or "between tasks" if at a boundary)
   - List of all files created or modified this session
   - Decisions made this session (brief summary, details are in decision-log)
   - Specific files and skills the next session should load to resume

4. **Log any pending decisions**
   If there are decisions made this session not yet logged, add them to
   `.claude/decisions/decision-log.md` now.

5. **Commit all files**
   Stage and commit everything with a descriptive message:
   ```
   checkpoint: [brief description of where we stopped]
   ```

6. **Report to user**
   ```
   ✅ Checkpoint saved.

   Progress: [what was accomplished this session]
   Stopped at: [current task/step]
   Files committed: [count] files

   To continue: Start a new Claude Code session in this directory
   and run /resume.

   Starting a fresh session ensures Claude loads your project
   state cleanly without leftover context.
   ```

## Auto-Checkpoint at Phase Boundaries

When a workflow skill completes the final task of a phase, it should
run this checkpoint protocol automatically and inform the user:
```
Phase [N] complete. Good time for a fresh session.
[checkpoint summary]
```

## Save Protocol (Referenced by All Workflow Skills)

All workflow skills include this save behavior at each major step:

**At natural milestones** (end of a phase step, before a transition, when
the user pauses — NOT after every single sub-step):
- Update completed task checkboxes in `project-state.md`
- Save any output files to their proper directories
- Log any decisions to `decision-log.md`

Batching reduces tool-call overhead. Don't update state after every file
edit — wait for a meaningful milestone.

**On user-initiated pause (any of: "save", "checkpoint", "pause", "stop"):**
- Run the full checkpoint protocol above

**On context-check 🔴 HOT recommendation:**
- Complete the current substep
- Run the full checkpoint protocol above
- Recommend starting a new session
