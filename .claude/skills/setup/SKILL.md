---
name: setup
description: >
  One-time machine setup for DOMO development. Installs and configures
  every tool needed: Node.js, pnpm, Git, GitHub CLI, DOMO CLI, and
  Playwright browsers. Also creates ~/.domo-secrets with DOMO credentials
  and captures Playwright DOMO auth state. Run once per machine before
  creating any projects. Re-run after ~90 days to refresh auth.
  Use when the user says "set up my machine", "first time setup",
  "onboarding", "install the tools", "I'm new", or "my auth expired".
user-invocable: true
distribution: org-skill
---

# Setup — One-Time Machine Setup

Install and configure everything needed for DOMO development.
Run this once per machine. Re-run when Playwright auth expires (~90 days).

**Distribution: ORG SKILL** — Uploaded via Claude org admin settings.
Available before any project repo exists.

---

## Step 1: Detect Operating System

```bash
uname -s
echo $OS
```

- `Darwin` → Mac
- `MINGW64_NT-...` or `$OS = Windows_NT` → Windows (Git Bash)
- `Linux` → Linux

Store the OS — it determines which install commands to use.
Supported: **Mac**, **Windows**. Linux included as fallback.

---

## Step 2: Check What's Already Installed

Run all checks silently. Collect results, then show one status report.

**Windows note:** In Claude Code's Git Bash, npm global packages (pnpm, domo,
npx) have broken shell shims. Use `.cmd` versions for those ONLY:
- `pnpm.cmd`, `domo.cmd`, `npx.cmd` — npm globals, need .cmd on Windows
- `gh`, `git`, `node`, `npm` — system installs (winget/installer), work as-is

**Important:** Use `;` not `&&` to chain checks — each check is independent
and should run even if a previous one fails.

**If the user says a step is already done or not needed, skip it.** Some checks
give false negatives (e.g., domo ls returns ambiguous errors). Trust the user
if they confirm something is working.

```bash
node --version ; \
npm --version ; \
pnpm.cmd --version 2>/dev/null || pnpm --version 2>/dev/null ; \
git --version ; \
git config --global user.name ; \
git config --global user.email ; \
gh --version 2>/dev/null ; \
gh auth status 2>/dev/null ; \
gh repo view RAWSO-Constructors/domo-dev-toolkit --json name 2>/dev/null ; \
domo.cmd --version 2>/dev/null || domo --version 2>/dev/null ; \
npx.cmd playwright --version 2>/dev/null || npx playwright --version 2>/dev/null ; \
[ -f ~/.domo-secrets ] && ! grep -q "PASTE_" ~/.domo-secrets && echo "secrets_ok" || echo "secrets_missing" ; \
cat ~/.domo-auth-state.meta.json 2>/dev/null
```

Show the results:

```
🔍 Checking your machine...

  Node.js 18+          ✅ v20.11.0
  npm                  ✅ v10.2.4
  pnpm                 ❌ Not installed
  Git                  ✅ v2.43.0
  Git identity         ❌ Not configured
  GitHub CLI           ✅ v2.45.0
  GitHub auth          ❌ Not authenticated
  Org access           ⏭️  Skipped (not authenticated)
  DOMO CLI             ❌ Not installed
  DOMO auth            ⏭️  Skipped (CLI not installed)
  Playwright browsers  ❌ Not installed
  DOMO secrets file    ❌ Not configured
  Playwright DOMO auth ❌ Not configured

  7 things to set up — starting now...
```

Symbols:
- ✅ Already done
- ❌ Needs setup — will handle now
- ⚠️ Expiring soon — will refresh
- ⏭️ Skipped — depends on something not yet installed

If everything shows ✅, the machine is fully ready. Skip to the end.

---

## Step 3: Install and Configure Everything Missing

Work through each failing item in order. Run each install, verify it
worked, then move on. Don't list commands for the user to run — execute
them directly. Steps that need user action are called out explicitly.

### Node.js

**Mac** — install Homebrew first if missing, then Node:
```bash
brew --version 2>/dev/null || /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install node
```

**Windows:**
```bash
winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
```
After install, open a new terminal so `node` is in PATH, then verify:
```bash
node --version
```

### pnpm

Same on all platforms — runs after Node is confirmed:
```bash
npm install -g pnpm
```

### Git

Usually pre-installed. If missing:

**Mac:**
```bash
xcode-select --install
```
A system dialog will appear — tell the user to click Install and wait.

**Windows:**
```bash
winget install Git.Git --silent --accept-package-agreements --accept-source-agreements
```
After install, open a new terminal so `git` is in PATH.

### Git Identity

Ask the user: "What name and email should appear on your commits?"
Then run:
```bash
git config --global user.name "Their Name"
git config --global user.email "their@email.com"
```

### GitHub CLI

**Mac:**
```bash
brew install gh
```

**Windows:**
```bash
winget install GitHub.cli --silent --accept-package-agreements --accept-source-agreements
```
After install, open a new terminal so `gh` is in PATH.

### GitHub CLI Auth

First check if already authenticated:
```bash
gh auth status 2>/dev/null
```

If `gh auth status` shows logged in, skip ahead — no user action needed.

If not authenticated, tell the user to run it themselves. **Do NOT run
`gh auth login` from Claude Code** — it backgrounds the command and the
one-time code/URL get buried in a temp file.

```
GitHub CLI needs to authenticate. Open a separate terminal and run:

  gh auth login --web -p https

Follow the prompts, complete the browser login, then come back and
tell me when it's done.
```

Wait for the user to confirm. Then verify:
```bash
gh auth status 2>/dev/null
```

### GitHub Org Access

Run the check:
```bash
gh repo view RAWSO-Constructors/domo-dev-toolkit --json name 2>/dev/null
```
If this fails, tell the user: "You need access to the RAWSO-Constructors
GitHub org. Ask your admin to add you, then run `/setup` again."
This is the one thing that can't be automated — an admin has to act first.
Do not proceed past this point until org access is confirmed.

### DOMO CLI

```bash
npm install -g ryuu
npm install -g @domoinc/da
domo --version
da --version
```

**DA CLI (`@domoinc/da`)** is the app scaffolder used by `da new` and `da apply-manifest`. Some project prebuild scripts depend on it being globally installed.

### DOMO CLI Auth

`domo login` is interactive and only needed for local dev server (`domo dev`)
and manual publishes. The toolkit deploys via GitHub Actions using the
DOMO_TOKEN from `~/.domo-secrets`, not CLI auth.

**Skip this step for now.** The DOMO_TOKEN (set up in the secrets file step
below) is what matters. If the user later needs `domo dev` for local testing,
they can run `domo login` in their own terminal at that point.

Tell the user:
```
DOMO CLI auth is optional — the toolkit uses your DOMO access token
(set up next) for deploys. If you need to run `domo dev` for local
testing later, you can run `domo login` in your terminal then.
Skipping for now.
```

### Playwright Browsers

```bash
npx playwright install
```
Tell the user: "Downloading browser binaries for visual QC — this may take a minute."
Fully automated, no user input needed.

### DOMO Secrets File

This file stores the credentials that every new project repo will need.
**Tokens must never be pasted into this chat.** Claude creates the file
with placeholders; the user fills it in their own text editor.

Check if the file already exists with values filled in:
```bash
[ -f ~/.domo-secrets ] && ! grep -q "PASTE_" ~/.domo-secrets && echo "ok"
```

If missing or still has placeholders, create/overwrite it:
```bash
cat > ~/.domo-secrets << 'EOF'
# DOMO Machine Credentials
# DO NOT COMMIT — keep this file on your local machine only
# Created: REPLACE_WITH_TODAY
DOMO_INSTANCE=rawso
DOMO_TOKEN=PASTE_YOUR_TOKEN_HERE
EOF
```

Then tell the user (do not ask them to paste values in chat):

```
Open ~/.domo-secrets in your text editor and fill in the DOMO_TOKEN value.
Do not paste it here — edit the file directly.

Where to find it:
- DOMO_TOKEN: DOMO → Admin → Authentication → Access Tokens → Generate
  Name it "Claude Dev Token". Copy the token once — it's shown only once.

Come back here when the file is saved.
```

Wait for the user to confirm they've filled it in. Then verify without
displaying the values:
```bash
grep -q "PASTE_" ~/.domo-secrets && echo "still_has_placeholders" || echo "looks_good"
```

If placeholders remain, tell the user and wait again. Do not proceed until
all three values are filled in.

Finally, update the creation date in the file:
```bash
TODAY=$(date +%Y-%m-%d)
sed -i "s/REPLACE_WITH_TODAY/$TODAY/" ~/.domo-secrets
```

### Playwright DOMO Auth

This captures a browser session so Playwright can load DOMO dashboards
for visual QC screenshots. Uses Microsoft SSO — cookies persist ~90 days.

**Note:** The auth setup script (`scripts/domo-auth-setup.js`) lives in
project repos created from the template — it doesn't exist yet during
first-time setup. **Skip this step during initial setup.** It will be
run automatically the first time visual QC is needed in a project.

Tell the user:
```
Playwright DOMO auth will be set up when you first need visual QC
in a project. Skipping for now — everything else is ready.
```

If the user has already created a project and wants to set up auth now,
they should run the script from their project directory:
```bash
cd ~/path/to/their/project
node scripts/domo-auth-setup.js
```

After auth is captured, write the expiration metadata (today + 90 days).
Use Node for date math since GNU `date -d` and BSD `date -v` both have
portability issues:
```bash
CREATED=$(date +%Y-%m-%d)
EXPIRES=$(node -e "const d=new Date();d.setDate(d.getDate()+90);console.log(d.toISOString().split('T')[0])")
echo "{\"created\":\"$CREATED\",\"expires\":\"$EXPIRES\"}" > ~/.domo-auth-state.meta.json
```

---

## Step 4: Final Verification

Re-run the Step 2 checks. Show the same status format with all items ✅.
If anything still fails, diagnose and retry before calling setup complete.

End with: "Your machine is ready. Run /new-project to create your first project."

---

## Re-running After Auth Expiry

When Playwright DOMO auth expires (~90 days), re-run `/setup`.
The tool install checks will all pass immediately and be skipped.
Only the "Playwright DOMO Auth" step will run, capturing a fresh session
and updating the expiration date in `~/.domo-auth-state.meta.json`.
