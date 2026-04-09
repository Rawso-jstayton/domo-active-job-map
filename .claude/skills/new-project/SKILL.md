---
name: new-project
description: >
  Create a new DOMO project from the toolkit template. Verifies prerequisites
  are installed, then creates a GitHub repo, clones it locally, pushes DOMO
  credentials as repo secrets, sets up branches, installs dependencies, and
  hands off to /init. Use when the user says "new project", "start a new
  dashboard", "create a new app", or "new domo project". Requires /setup to
  have been run on this machine first.
user-invocable: true
distribution: org-skill
---

# New Project — Create From Template

Create a new DOMO project repo from the toolkit template.
Assumes `/setup` has already been run on this machine.

**Distribution: ORG SKILL** — Uploaded via Claude org admin settings.
Available before any project repo exists. All other toolkit skills
travel with project repos.

---

## Step 1: Quick Sanity Check

Run these checks silently before asking anything. This is a fast existence
check only — not a full install flow. If anything is missing, stop and
redirect to `/setup`.

**Windows note:** Only npm global packages need `.cmd`: `pnpm.cmd`, `domo.cmd`,
`npx.cmd`. System tools (`gh`, `git`, `node`) work as-is — do NOT use `gh.cmd`.

Use `;` so all checks run independently. If the user says something is already
set up, skip it.

```bash
node --version ; \
pnpm.cmd --version 2>/dev/null || pnpm --version 2>/dev/null ; \
git --version ; \
gh auth status 2>/dev/null ; \
domo.cmd --version 2>/dev/null || domo --version 2>/dev/null ; \
gh repo view RAWSO-Constructors/domo-dev-toolkit --json name 2>/dev/null ; \
[ -f ~/.domo-secrets ] && ! grep -q "PASTE_" ~/.domo-secrets && echo "secrets_ok" || echo "secrets_missing"
```

**If everything passes:** Show a one-liner and move straight to Step 2:
```
✅ Environment ready — let's create your project.
```

**If tools are missing:**
```
⚠️  Some tools aren't set up yet — run /setup first.
```

**If secrets file is missing or has placeholders:**
```
DOMO credentials not configured — run /setup first.
```

Do not attempt to fix any of these here. `/setup` owns all of that.
Playwright DOMO auth is NOT checked here — it's deferred to when visual
QC is first needed inside a project.

---

## Step 2: Gather Project Info

Ask the user:
- What should the project be called?
  - Suggest format: `domo-[descriptive-name]` (e.g., `domo-hr-dashboard`)
- One-line description for the GitHub repo

---

## Step 3: Create the Repo

**IMPORTANT:** The repo clones into the CURRENT WORKING DIRECTORY. Before
cloning, confirm you're in the right place. The user's cwd is where the
project folder will be created.

```bash
# Show where we are — this is where the folder will land
pwd
```

If the cwd looks wrong (e.g., Desktop instead of a projects folder), ask
the user: "The project will be created in [cwd]. Is that right, or should
I create it somewhere else?" Adjust with `cd` before proceeding.

```bash
gh repo create RAWSO-Constructors/[PROJECT-NAME] \
  --template RAWSO-Constructors/domo-dev-toolkit \
  --clone \
  --private \
  --description "[user's description]"
```

Confirm the clone succeeded:
```bash
ls [PROJECT-NAME]/
```

---

## Step 4: Push Credentials to Repo Secrets

Read from `~/.domo-secrets` and push each value as a GitHub repo secret.
Only DOMO_INSTANCE and DOMO_TOKEN are used by the toolkit — nothing else.
The values are read from the file and passed directly to `gh secret set` —
they are never displayed in this conversation.

Note: `gh secret set` produces NO output on success. That's normal.

```bash
source ~/.domo-secrets
gh secret set DOMO_INSTANCE --repo RAWSO-Constructors/[PROJECT-NAME] --body "$DOMO_INSTANCE"
gh secret set DOMO_TOKEN --repo RAWSO-Constructors/[PROJECT-NAME] --body "$DOMO_TOKEN"
```

Verify both were set:
```bash
gh secret list --repo RAWSO-Constructors/[PROJECT-NAME]
```

Expected output: two secrets listed — DOMO_INSTANCE, DOMO_TOKEN.

---

## Step 5: Set Up the Project

```bash
cd [PROJECT-NAME]
```

### Fix branch references
The template uses `master` as default branch. If the deploy workflow
references `main`, fix it to match:
```bash
grep -r "branches:.*main" .github/workflows/ 2>/dev/null
```
If found, replace `main` with `master` in the deploy workflow file.

### Verify deploy.yml references the correct GitHub Action
```bash
grep -r "domo-publish-action\|domoapps-publish-action" .github/ 2>/dev/null
```
If it references `DomoApps/domo-publish-action@v1` (wrong), fix it:
replace with `DomoApps/domoapps-publish-action@v2`.

### Commit any fixes made above
If either the branch name or action name was fixed:
```bash
git add -A
git commit -m "fix(deploy): correct branch name and action reference"
git push
```

### Set up develop branch and install dependencies
```bash
git checkout -b develop
git push -u origin develop
pnpm.cmd install 2>/dev/null || pnpm install
```

Verify branches:
```bash
git branch -a
```

---

## Step 6: Hand Off

```
Project created: RAWSO-Constructors/[PROJECT-NAME]
Location: [full path to PROJECT-NAME folder]
Branches: master, develop
Secrets: DOMO_INSTANCE, DOMO_TOKEN
Dependencies: installed
Deploy workflow: [verified / fixed]

Next step: open a NEW Claude Code session in
the project folder, then describe what you want to build
(or run /init if you prefer).

Open: [full path to PROJECT-NAME folder]
```

Tell the user exactly what to do:
- In the Claude Code desktop app: File → Open Folder → navigate to `[PROJECT-NAME]`
- In the CLI: open a new terminal in `[PROJECT-NAME]/` and run `claude`
- Then run `/init` in that new session to configure the project

Do NOT run `/init` in the current session — this session is in `domo-apps/`
and doesn't have the project's skills loaded. The new session will pick up
the full toolkit automatically.

---

## First-Time User Notes

If this is someone's first project (they just finished `/setup`),
add this to the handoff message:

```
💡 First time? After opening the new session and running /init:

   /status          — see project progress anytime
   /context-check   — check if your session is getting long
   /checkpoint      — save your work before stopping
   /resume          — pick up where you left off (new sessions)
   /plan-dashboard  — start planning when you're ready
```
