---
name: resume
description: >
  Resume work from a previous session. Reads project state, session handoff,
  and decision log to restore context and continue where you left off.
  Use this at the start of every returning session, when the user says
  "continue", "pick up where we left off", "resume", "keep going",
  "what were we doing", "let's work on the project", or starts a new session
  in an existing project. Also auto-trigger when the project is already
  initialized (CLAUDE.md has no [bracketed] placeholders) and the user's
  first message is vague or project-related.
user-invocable: true
---

# Resume Previous Session

Restore context from the last session and prepare to continue work.
The user may not say "resume" — they might just say "hey" or "let's go"
in an initialized project. If CLAUDE.md is filled in and project-state.md
exists, treat any session-opening message as a resume request.

## Steps

1. **Read project state**
   Read `.claude/status/project-state.md` to understand the full project picture:
   - What phase are we in?
   - What's been completed?
   - What's in progress?
   - What's remaining?

2. **Read session handoff** (if it exists)
   Read `.claude/status/session-handoff.md` for granular resumption details:
   - What specific task was in progress?
   - What's the exact next step?
   - What files need to be loaded?

3. **Read decision log**
   Read `.claude/decisions/decision-log.md` for context on past decisions.
   Focus on recent entries — these are most likely to be relevant.

4. **Load recommended context**
   If the handoff specifies files or skills to load, read them now.

5. **Check credential status**
   Run these checks silently and report any issues:

   ```bash
   # DOMO CLI auth (needed for Phase 2+)
   # Note: `domo whoami` does NOT exist. Use `domo dev` which gives a clear
   # "not authenticated" error if auth is expired.
   domo dev 2>&1 | head -5 || echo "DOMO_CLI_AUTH=EXPIRED"

   # Git auth (needed always)
   gh auth status 2>&1 || echo "GH_AUTH=EXPIRED"

   # Check for ~/.domo-secrets (needed for Playwright QC)
   test -f ~/.domo-secrets && echo "DOMO_SECRETS=OK" || echo "DOMO_SECRETS=MISSING"
   ```

   Only report issues — don't list credentials that are fine.
   If something is expired or missing, tell the user what to run:
   - DOMO CLI expired → `domo login`
   - GitHub CLI expired → `gh auth login`
   - ~/.domo-secrets missing → run `/setup` or create manually

   If all credentials are fine, say nothing about them.

6. **Summarize to the user**
   Present a concise status update:
   ```
   Project: [name]
   Phase: [current phase] — [phase description]
   Last session: [what was accomplished]
   In progress: [current task, if any]
   Next step: [specific next action]
   [Credential warnings, if any]

   Ready to continue?
   ```

7. **Auto-continue**
   After presenting the summary, immediately offer to continue:
   "Ready to continue with [next step]. Go ahead, or want to do something else?"
   If the user says yes (or anything affirmative), load the relevant skill
   and start working — do not wait for them to type a slash command.
   Only pause for explicit redirection.

## If No Handoff Exists

If `session-handoff.md` is empty or templated (hasn't been written yet),
fall back to `project-state.md` and identify the next incomplete task.
Present the project status and ask the user what they'd like to work on.

## If No Project State Exists

If `project-state.md` is still templated (project hasn't been initialized),
suggest running `/init` to set up the project first.
