---
name: context-check
description: >
  Check current session health and recommend whether to continue or checkpoint.
  Use when the user asks "how's context", "should I clear", "context check",
  "how much room do we have", "are you still following", or anytime the user
  wants to gauge whether the session is getting long. Also auto-recommended
  by workflow skills after extended work.
user-invocable: true
---

# Context Check — Session Health Monitor

Evaluate the current session's health and recommend whether to keep going
or checkpoint. The goal is to catch context degradation before it causes
mistakes — not after.

## Why This Matters

As a session grows, earlier context gets compressed or dropped. This matters
because decisions made early in the session (stakeholder requirements, data
model choices, design decisions) directly affect later work. If those fade,
work can drift from the plan without either party noticing. A checkpoint
preserves state explicitly so the next session starts clean.

## Steps

### 1. Count Session Activity

Review the conversation history and tally:
- Files created or modified
- Skills or reference docs loaded into context
- Workflow steps completed
- Back-and-forth exchanges (user messages)
- Phases worked through

### 2. Check Warning Signs

Flag if ANY of these are true:

**Quantitative indicators:**
- More than 10 files created or modified this session
- More than 5 skills or reference docs loaded
- More than one full phase completed
- More than ~40 back-and-forth exchanges

**Qualitative indicators (these matter more than the counts):**
- You feel uncertain about something that was discussed earlier in the session
- You find yourself re-reading files you already read earlier to refresh context
- A user question makes you realize you've lost track of a decision that was made
- You're not confident you could summarize the key decisions from the first half
  of the conversation without re-reading it

These qualitative signals are more reliable than the numbers. A session with
10 exchanges that covered complex architecture decisions can be "warmer" than
one with 40 exchanges of simple back-and-forth.

### 3. Rate and Recommend

**🟢 FRESH** — No warning signs triggered
> "Plenty of room. Keep going."

**🟡 WARM** — 1-2 warning signs triggered, or mild qualitative uncertainty
> "Getting long. Consider checkpointing after the current task finishes —
> especially before starting a new phase."

**🔴 HOT** — 3+ warning signs, OR any strong qualitative signal
> "Recommend saving now. Finish the current substep, then run `/checkpoint`
> before starting anything new. Quality will degrade if we push further."

**🔴 HOT — mid-task:** If HOT is reached while you're in the middle of
something, finish the current atomic step (complete the file you're editing,
finish the sentence you're on), then checkpoint. Never stop mid-task to
checkpoint — complete the smallest natural unit first.

### 4. Output Format

Keep it concise:
```
Session health: [🟢 FRESH | 🟡 WARM | 🔴 HOT]

Activity: [N] files modified, [N] skills loaded, ~[N] exchanges
Current task: [description], step [N] of [M]
Phase progress: [what's been done this session]

Recommendation: [specific advice — what to do next]
```

## Limitations

Claude cannot directly measure token usage. This assessment uses proxy
indicators and self-assessed confidence. These are reliable heuristics
but not exact measurements. When in doubt, err toward recommending a
checkpoint — a false alarm costs 2 minutes; a missed signal can cost
significant rework.
