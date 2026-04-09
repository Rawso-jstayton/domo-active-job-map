---
name: handoff
description: >
  Generate a human-readable handoff document for transferring project ownership
  or presenting to a stakeholder. Different from checkpoint — this produces a
  document written for humans who weren't in the session. Use when the user says
  "hand this off", "write a summary for [person]", "prepare for review",
  "document this for the team", "write it up for the stakeholder", or
  "I need to pass this to someone".
user-invocable: true
---

# Handoff — Human-Readable Project Summary

Generate a summary for someone picking up this project or reviewing it
for the first time. The goal is that they understand what was built, why,
what works, and how to continue — without needing to ask follow-up questions.

## Steps

### 1. Identify the Audience

Ask the user: "Who is this for?" before writing anything. The answer
changes the tone and technical depth significantly:

| Audience | Tone | Technical depth |
|----------|------|----------------|
| Executive / stakeholder | Plain language, outcome-focused, no jargon | Low — mention tools by name but don't explain them |
| Incoming developer | Direct, task-oriented, assume DOMO familiarity | High — include file paths, dataset IDs, CLI commands |
| Internal team member | Conversational, context-focused | Medium — explain decisions, not mechanics |

### 2. Read All State
- `.claude/status/project-state.md` — current progress
- `.claude/decisions/decision-log.md` — key decisions and rationale
- Root `CLAUDE.md` — project context, stakeholders, data sources

### 3. Generate Handoff Document

Save to `plans/handoff-[date].md` using this structure:

```markdown
# [Project Name] — Handoff
Date: [date]
Prepared for: [name/role]
Prepared by: [developer name]

## What This Project Is
[2-3 sentences. Plain language. What problem does it solve, for whom,
and what does it show? Avoid technical terms unless audience is technical.]

## Current Status
[One paragraph. What phase is it in? What works right now? Is it deployed?
What's the last thing that was completed?]

## What's Been Built
[Bulleted list of concrete deliverables. Each item: name + one-line description.
For technical audiences: include dataset IDs, file paths, app URLs.]

## Key Decisions Made
[3-5 bullets. Each: the decision + the reason it was made. Written in plain
language. Pull from decision-log.md. Focus on non-obvious choices that the
next person would wonder about.]

## What's Left To Do
[Organized by phase. Each item: what it is + rough effort (hours/days, not
story points). Be honest about unknowns.]

## Known Issues & Risks
[Anything the next person MUST know. Connector quirks, data gaps, a feature
that's stubbed but not built, a stakeholder concern that wasn't resolved.]

## How To Continue
[Practical instructions for picking it up:
- Where to find the code (GitHub repo URL or path)
- How to authenticate (domo login command)
- What command to run first
- Who to contact with questions (name + what they own)]
```

### 4. Tone Principles

**For executives:** Lead with outcomes, not process. "The dashboard is live
and shows real-time headcount by department" not "we built a React app that
calls /data/v1/ via ryuu.js." Use the business domain language, not the tech
stack language.

**For developers:** Be explicit. Include the exact commands, file names,
dataset IDs, and repo paths they need. Don't make them hunt.

**For team members:** Explain the "why" behind choices. They know the domain
— they need the context and decisions that happened in this session.

**Always:** Write as if you won't be there to answer questions. Anticipate
the top 3 things someone would ask and answer them in the document.

### 5. Present to User

Show the handoff document and ask: "Anything to add or adjust before sharing?"

Common things to check:
- Is the audience right? (Would an exec actually read this?)
- Are any sensitive details included that shouldn't be shared?
- Are the "What's Left" estimates realistic?
