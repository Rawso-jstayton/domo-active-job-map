# DOMO Dev Toolkit

A complete development toolkit for building DOMO dashboards and pro code apps with Claude Code. Provides 36 skills covering the full lifecycle: planning, data pipelines, app development, QC, and deployment.

**Stack:** React + Apache ECharts + shadcn/ui + Tailwind CSS
**Workflow:** Claude Code → GitHub → DOMO via CI/CD
**Audience:** Anyone building DOMO apps at Rawso — technical or not. Claude Code handles the implementation; you make the decisions.

---

## Quick Start (Existing Team Member)

If you've already completed the one-time setup below:

```bash
claude
> /new-project
```

Answer the prompts and you'll have a fully initialized project in under 2 minutes.

---

## One-Time Setup

Complete these steps once per machine before using the toolkit.

### 1. Install Prerequisites

| Tool | Install Command (Mac) | Why |
|------|----------------------|-----|
| **Node.js 18+** | `brew install node` | Required by everything |
| **Git** | Pre-installed on Mac | Version control |
| **GitHub CLI** | `brew install gh` | Create repos from template |
| **Claude Code** | `npm install -g @anthropic-ai/claude-code` | Core development tool |
| **DOMO CLI** | `npm install -g ryuu` | Local dev server and deploys |
| **Playwright browsers** | `npx playwright install` | Browser binaries for visual QC |

<details>
<summary>Linux install commands</summary>

```bash
# Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Git
sudo apt install git

# GitHub CLI
sudo apt install gh

# Claude Code
npm install -g @anthropic-ai/claude-code

# DOMO CLI
npm install -g ryuu

# Playwright browsers
npx playwright install
```
</details>

<details>
<summary>Windows install commands</summary>

```bash
# Node.js — download from https://nodejs.org
# Git
winget install git

# GitHub CLI
winget install gh

# Claude Code
npm install -g @anthropic-ai/claude-code

# DOMO CLI
npm install -g ryuu

# Playwright browsers
npx playwright install
```
</details>

### 2. Authenticate

```bash
# GitHub — follow the prompts to authenticate via browser
gh auth login

# DOMO — opens browser for OAuth login
domo login

# Claude Code — authenticate with your Claude subscription
claude
```

### 3. Configure Git Identity

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@rawso.com"
```

### 4. Verify Everything Works

```bash
node --version          # Should show v18+
gh auth status          # Should show logged in
domo ls                 # Should succeed (auth check — domo whoami doesn't exist)
claude --version        # Should show Claude Code version
```

### 5. Install Global Skills

The `/setup` and `/new-project` skills need to be available before any project
exists. Copy them to your personal Claude skills directory:

```bash
# Clone the toolkit temporarily (or skip if you already have it)
gh repo clone RAWSO-Constructors/domo-dev-toolkit /tmp/domo-toolkit

# Copy org skills to personal skills directory
mkdir -p ~/.claude/skills/setup ~/.claude/skills/new-project
cp /tmp/domo-toolkit/.claude/skills/setup/SKILL.md ~/.claude/skills/setup/SKILL.md
cp /tmp/domo-toolkit/.claude/skills/new-project/SKILL.md ~/.claude/skills/new-project/SKILL.md

# Clean up (optional — the toolkit repo isn't needed locally)
rm -rf /tmp/domo-toolkit
```

This makes `/setup` and `/new-project` available in Claude Code from any
directory, even when you're not inside a project repo. These skills are also
uploaded as org skills in the Claude admin console for the desktop app.

### 6. Get Org Access (ask your admin)

- [ ] Added to Rawso GitHub org with repo write access
- [ ] DOMO user account created with appropriate permissions
- [ ] `/new-project` skill shows up when typing `/` in Claude Code

### Admin Setup (one-time, not per developer)

Each project repo needs these GitHub secrets for CI/CD deployment:

```
DOMO_INSTANCE          ← DOMO instance name (e.g., rawso)
DOMO_TOKEN             ← Developer token for CLI deploys
```

These are pushed automatically by `/new-project` from `~/.domo-secrets`.
See the `credentials` skill for full setup instructions.

---

## Creating a New Project

```bash
claude
> /new-project
```

Claude will ask for a project name and description, create the GitHub repo from this template, clone it, set up branches, and walk you through project initialization.

## Resuming Work

```bash
cd your-project-directory
claude
> /resume
```

Claude reads your saved project state and picks up where you left off.

## Project Lifecycle

Every project follows six phases. Skills guide you through each one.

| Phase | What Happens | Key Skills |
|-------|-------------|------------|
| **1. Plan** | Requirements, KPIs, layout design | `/plan-dashboard` |
| **2. Pipeline** | Connectors, ETLs, data validation | `/build-pipeline` |
| **3. Build** | React apps, styling, data binding | `/build-app` |
| **4. QC** | Data, visual, and analytical review | `/full-qc` |
| **5. Polish** | AI summaries, alerts, interactions, code cleanup | `/qc-code` |
| **6. Deploy** | Release to production, stakeholder walkthrough | `/handoff` |

## Available Commands

Type `/` in Claude Code to see all available skills. Here's the full list:

### Session Management
| Command | Purpose |
|---------|---------|
| `/resume` | Pick up where you left off |
| `/checkpoint` | Save progress and prepare to stop |
| `/status` | See project progress |
| `/context-check` | Check if session is getting long (🟢🟡🔴) |

### Project Management
| Command | Purpose |
|---------|---------|
| `/new-project` | Create a new project from template (org skill) |
| `/init` | Set up project details interactively |
| `/handoff` | Generate summary for stakeholder or team member |
| `/learn` | Capture knowledge into skills for future projects |
| `/troubleshoot` | Structured debugging when something breaks |

### Quick Tasks
| Command | Purpose |
|---------|---------|
| `/quick` | Fast-track for small changes (skips planning, enforces verification) |

### Workflows
| Command | Purpose |
|---------|---------|
| `/plan-dashboard` | Phase 1: Full planning workflow |
| `/build-pipeline` | Phase 2: Connector → ETL → output → validate |
| `/build-app` | Phase 3: Build React apps with QC loop |
| `/full-qc` | Phase 4: Data + visual + analytical QC |
| `/qc-code` | Phase 5: Pre-release code cleanup (once) |

### Auto-Loading Skills (no command needed)
These load automatically when Claude detects they're relevant:

connectors, magic-etl, datasets, outputs, domo-ai, domo-api, cli-setup,
pro-code-apps, app-studio, cards, libraries, design-system, responsive,
credentials, git-deploy, qc-data, qc-visual, qc-analytical

### Meta
| Command | Purpose |
|---------|---------|
| `/build-toolkit` | Fill in skill content (toolkit development only) |

---

## Deployment Model

**Dev deploys** (frequent, during development):
Push to `develop` branch → overwrites current DOMO app version → used for Playwright QC against real data.

**Release deploys** (once, end of project):
Merge to `main` → creates new DOMO app version → tagged, rollback capable.

See the `git-deploy` skill for full details.

---

## Project Structure

```
your-project/
├── CLAUDE.md                    ← Project description and routing
├── .claude/
│   ├── status/
│   │   ├── project-state.md     ← Phase tracking and task progress
│   │   └── session-handoff.md   ← Resume context between sessions
│   ├── decisions/
│   │   └── decision-log.md      ← Decisions and learnings
│   └── skills/                  ← All 36 skills (auto-discovered)
├── plans/                       ← Dashboard plans, KPIs, layouts
├── apps/                        ← React pro code apps
├── cards/                       ← Standard DOMO cards (if any)
├── etls/                        ← ETL documentation
├── datasets/                    ← Dataset schemas
└── qc-reports/                  ← QC results and screenshots
```

---

## Troubleshooting Setup

**`gh: command not found`** — GitHub CLI not installed. Run `brew install gh` (Mac).

**`domo: command not found`** — DOMO CLI not installed. Run `npm install -g ryuu`.

**`domo login` fails** — Check your network connection and DOMO instance URL. Try clearing auth: `rm -rf ~/.domo` then `domo login` again.

**`/new-project` not visible** — The skill needs to be in your personal skills directory. Run the "Install Global Skills" step above to copy it to `~/.claude/skills/`. The org skill in the Claude admin console works for the desktop app but may not show up in the VS Code extension.

**`gh repo create` fails with permission error** — You haven't been added to the GitHub org yet. Ask your admin.

**Playwright browsers not installed** — Run `npx playwright install` to download browser binaries. The Playwright library itself is installed per-project via `pnpm install`.

**Node version too old** — Run `node --version`. If below 18, upgrade: `brew upgrade node` or use nvm.
