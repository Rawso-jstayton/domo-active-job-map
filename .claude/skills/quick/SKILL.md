---
name: quick
description: >
  Fast-track for small tasks — bug fixes, style tweaks, label changes, config
  updates, and one-off modifications. Skips full planning but enforces
  verification. Use when the user says "quick fix", "just change", "tweak",
  "update the label", "fix this", or any task that touches 1-3 files and
  doesn't need architectural planning.
user-invocable: true
---

# Quick Task — Fast Track with Verification

For small, focused changes that don't need the full phase workflow.
Skips planning documents but still enforces quality gates.

## Model Routing
Quick tasks are small enough to run entirely on Sonnet. Dispatch the
whole task (Steps 2-5) to a single Sonnet subagent (`model: "sonnet"`)
with clear instructions. Only keep Step 1 (understanding the change)
on Opus if the request is ambiguous and needs judgment to interpret.

## When to Use This

Use `/quick` when ALL of these are true:
- The change touches 1-3 files
- No new data sources or ETL changes needed
- No architectural decisions required
- The user can describe the change in 1-2 sentences

## When NOT to Use This

Route to the full workflow instead if ANY of these are true:
- New app or major feature → `/build-app`
- New data pipeline → `/build-pipeline`
- Multiple related changes across the project → `/plan-dashboard`
- You're unsure of the impact → full workflow

If you're tempted to say "this is simple enough to skip verification" — don't.
Simple changes break things. That's exactly what verification catches.

## Steps

### Step 1: Understand the Change
Ask (or infer from context):
1. **What** needs to change? (exact behavior or appearance)
2. **Where** is it? (which app, component, or file)
3. **Why?** (bug fix, stakeholder request, design update)

If you can't answer all three, ask the user before proceeding.

### Step 2: Read Before Editing
**HARD GATE: You must read every file you intend to modify before making changes.**

- Read the target file(s)
- Check for related files that might be affected (imports, shared styles, configs)
- If the component uses data from a dataset, verify the field names are correct

### Step 3: Make the Change
- Make the minimal change needed — nothing more
- Do not refactor surrounding code
- Do not add features beyond what was asked
- Do not "improve" nearby code while you're in the file

### Step 4: Verify — HARD GATE

**You must verify before claiming the task is done. "Should work" is not acceptable.**

Verification checklist (check all that apply):
- [ ] **Build passes**: Run `pnpm build` (or equivalent) — no errors
- [ ] **No console errors**: If it's a UI change, check for runtime errors
- [ ] **Visual check**: If it's a style/layout change, confirm the render is correct
- [ ] **Data check**: If it touches data fetching or calculations, spot-check a value
- [ ] **Didn't break neighbors**: If you edited a shared file, verify other consumers still work

You MUST run at least one verification command in this message before marking done.
Do not say "this should work" or "you can verify by..." — YOU verify it, right now.

| Thought you might have | Why it's wrong |
|------------------------|----------------|
| "It's just a label change, no need to verify" | Label changes can break layouts, overflow containers, or expose localization bugs |
| "I only changed CSS, it can't break logic" | CSS changes affect responsive behavior, visibility, and interactive states |
| "The build would catch any real issues" | Builds catch syntax errors, not visual regressions or wrong data |
| "I'll let the user verify this one" | The user asked you to do the task. Verification is part of the task. |
| "It's too simple to test" | Simple changes break things. That's what verification catches. |

### Step 5: Commit
```
fix(scope): brief description of what changed
```

Use the appropriate commit type:
- `fix` — bug fixes, corrections
- `style` — visual/CSS changes
- `chore` — config, dependency, or tooling changes
- `feat` — small feature additions

### Step 6: Report
Keep it brief:
```
Done. Changed [what] in [file].
Verified: [what you checked and the result].
```

Do not summarize what the user already knows. Do not explain your reasoning
unless the user asks. Just report what changed and what you verified.

## Error Handling

If the change causes an unexpected error:
1. **Read the error** — don't guess
2. **Check what you changed** — did your edit introduce it, or was it pre-existing?
3. If your edit broke something: fix it, re-verify
4. If pre-existing: inform the user and suggest `/troubleshoot` for deeper investigation
5. Do NOT proceed with a broken build to "fix it later"
