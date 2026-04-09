---
name: credentials
description: >
  Credential and secret management across DOMO projects. Covers the
  ~/.domo-secrets machine file, per-repo GitHub secrets, DOMO CLI auth,
  DOMO API auth, and Playwright auth. Use when setting up auth, when CLI
  auth expires, when deploying via GitHub Actions, or when the user mentions
  "credentials", "secrets", "auth", "login", "token", "client ID", or
  "environment variables".
---

# Credentials & Secret Management

How credentials are stored, accessed, and used across all DOMO projects.

## Architecture

```
~/.domo-secrets          ← Machine-level credential file (never committed)
~/.domo-auth-state.json  ← Playwright Microsoft SSO cookies (~90 day TTL)
~/.domo-auth-state.meta.json ← Expiration metadata: {"created":"...","expires":"..."}
~/.domo/                 ← DOMO CLI auth (managed by `domo login`)

Per repo (GitHub Secrets):
  DOMO_INSTANCE, DOMO_TOKEN, DOMO_CLIENT_ID, DOMO_CLIENT_SECRET
  ← Pushed by /new-project from ~/.domo-secrets via `gh secret set`
```

**Why per-repo secrets instead of org secrets:** The team doesn't have a
GitHub org secrets license. Instead, `/new-project` reads credentials from
`~/.domo-secrets` and pushes them to each new repo as individual secrets.
Values never appear in the conversation — they flow directly from the file
to `gh secret set`.

## ~/.domo-secrets (Machine Credential Store)

Created by `/setup` with placeholders, then filled in by the user in their
own text editor. Never pasted into this conversation.

```bash
# DOMO Machine Credentials
# DO NOT COMMIT — keep this file on your local machine only
DOMO_INSTANCE=rawso
DOMO_TOKEN=your-developer-token
DOMO_CLIENT_ID=your-client-id
DOMO_CLIENT_SECRET=your-client-secret
```

### DOMO_INSTANCE Format by Context

The instance value format differs depending on where it's used:

| Context | Expected Format | Example |
|---------|----------------|---------|
| `~/.domo-secrets` | Instance name only | `rawso` |
| GitHub Secrets (for Actions) | Full domain | `rawso.domo.com` |
| `domo login -i` (CLI) | Full domain | `rawso.domo.com` |
| DOMO API base URL | Full URL | `https://rawso.domo.com` |
| Playwright navigation | Full URL | `https://rawso.domo.com/page/...` |

`/new-project` reads `DOMO_INSTANCE=rawso` from `~/.domo-secrets` and should
append `.domo.com` when pushing to GitHub secrets. If this step is missed,
the GitHub Action will fail with "instance not found."

**How `/new-project` uses it:**

```bash
source ~/.domo-secrets
gh secret set DOMO_INSTANCE      --repo RAWSO-Constructors/[PROJECT-NAME] --body "$DOMO_INSTANCE"
gh secret set DOMO_TOKEN         --repo RAWSO-Constructors/[PROJECT-NAME] --body "$DOMO_TOKEN"
gh secret set DOMO_CLIENT_ID     --repo RAWSO-Constructors/[PROJECT-NAME] --body "$DOMO_CLIENT_ID"
gh secret set DOMO_CLIENT_SECRET --repo RAWSO-Constructors/[PROJECT-NAME] --body "$DOMO_CLIENT_SECRET"
```

Verify with `gh secret list --repo RAWSO-Constructors/[PROJECT-NAME]`.

## Getting the Credential Values

### DOMO Developer Token (DOMO_TOKEN)

1. Log into DOMO as admin
2. Navigate to Admin → Authentication → Access Tokens
3. Click "Generate access token"
4. Name it "Claude Dev Token"
5. Save the token — it's shown only once

### DOMO API Client (DOMO_CLIENT_ID + DOMO_CLIENT_SECRET)

1. Go to Admin → Authentication → API Clients (or developer.domo.com)
2. Create a new client named "Rawso Dev"
3. Grant scopes: `data`, `dashboard`, `user` (add more as needed)
4. Save Client ID and Client Secret — secret is shown only once

## How Each Secret Is Used

### CLI Deploys (DOMO_INSTANCE + DOMO_TOKEN)
```yaml
# GitHub Actions
- run: domo login -i ${{ secrets.DOMO_INSTANCE }} -t ${{ secrets.DOMO_TOKEN }}
- run: domo publish
```

### Direct API Calls (DOMO_CLIENT_ID + DOMO_CLIENT_SECRET)
```bash
# Get a bearer token (~1 hour expiry)
curl -u $DOMO_CLIENT_ID:$DOMO_CLIENT_SECRET \
  "https://api.domo.com/oauth/token?grant_type=client_credentials&scope=data dashboard user"
```

### Playwright Visual QC (Verified 2026-03-29)

DOMO's web UI requires a real browser session via Microsoft SSO — API tokens
and OAuth bearer tokens do NOT work for rendering dashboards in a browser.

**What works:** Microsoft SSO cookies persist for ~90 days and auto-renew
the DOMO session. Auth state is stored globally at `~/.domo-auth-state.json`
(shared across all projects on the machine).

**Initial setup (one-time per ~90 days):**
```bash
node scripts/domo-auth-setup.js
```
Opens Edge (Windows) or Chrome (Mac), you log in via Microsoft SSO/MFA,
script saves cookies to `~/.domo-auth-state.json`.

Expiration is tracked in `~/.domo-auth-state.meta.json`:
```json
{"created": "2026-03-29", "expires": "2026-06-27"}
```
`/new-project` checks this file on every run and warns if expired or expiring soon.
`/setup` refreshes both files when re-run.

**In Playwright tests (fully automated after initial setup):**
```typescript
import * as os from 'os';
import * as path from 'path';

const context = await browser.newContext({
  storageState: path.join(os.homedir(), '.domo-auth-state.json'),
});

// Navigate to homepage first — triggers SSO auto-renewal if DA-SID expired
await page.goto('https://rawso.domo.com/');
// Then navigate to target dashboard
await page.goto('https://rawso.domo.com/page/DASHBOARD_ID');
```

**Key cookies (auto-managed, do not forge):**
- `DA-SID-prod5-mmmm-0035-9760` — DOMO session (HMAC-signed, 8h TTL, auto-renews via SSO)
- `ESTSAUTHPERSISTENT` — Microsoft SSO persistent token (~90 day TTL)
- `PLAY_SESSION` — Play Framework session

**What does NOT work for browser auth:**
- OAuth bearer token injection — redirects to login page
- `X-Domo-Developer-Token` header — authenticates API calls but not web UI rendering
- DA-SID cookie injection without SSO — it's HMAC-signed and can't be forged

See `scripts/domo-auth-setup.js` and `qc-visual/SKILL.md` for full implementation.

## DOMO CLI Auth (Local Development)

Each developer authenticates locally with their own account:

```bash
domo login       # interactive, opens browser
domo dev         # verify — gives clear "not authenticated" error if expired
```

**`domo whoami` does NOT exist.** There is no dedicated auth-check command.
The most reliable way to verify DOMO CLI auth is `domo dev` — it immediately
errors if not authenticated. Alternatively, `domo ls` lists published designs
and will fail if auth is expired.

Token stored in `~/.domo/`. If auth expires:
```bash
domo login       # re-authenticate
```

Non-interactive (CI/CD):
```bash
domo login -i rawso.domo.com -t ${{ secrets.DOMO_TOKEN }}
```

## Token Scope Limitations

| Token Type | Scope |
|-----------|-------|
| Developer Token (DOMO_TOKEN) | Publish apps, `domo dev` proxy — NOT dataset queries |
| OAuth Client (CLIENT_ID + SECRET) | Dataset queries, streams, full REST API — NOT `domo dev` |
| Playwright SSO Cookies | Browser rendering only — NOT API calls |

For dataset queries (QC scripts, data validation): use OAuth client, not developer token.


## Credential Usage by Skill

| Skill | Credentials | Source |
|-------|------------|--------|
| cli-setup | DOMO CLI auth | `~/.domo/` via `domo login` |
| pro-code-apps | Dataset access | DOMO CLI (proxied via `domo dev`) |
| git-deploy | Deploy auth | Repo secret: `DOMO_INSTANCE` + `DOMO_TOKEN` |
| domo-api | REST API calls | Repo secret: `DOMO_CLIENT_ID` + `DOMO_CLIENT_SECRET` |
| qc-visual | Playwright auth | `~/.domo-auth-state.json` (local) or repo secrets (CI) |
| connectors | Connector keys | DOMO UI (stored in DOMO's credential store) |

## Security Rules

- NEVER store credentials in any committed file
- NEVER put credentials in SKILL.md, CLAUDE.md, or decision-log.md
- NEVER paste credentials into the Claude conversation
- NEVER hardcode credentials in app code
- `~/.domo-secrets` lives on your machine only — it is not in any repo
- `.gitignore` must include: `.env`, `.env.*`, `.domo/`, `playwright/.auth/`
- Rotate the API client secret if ever accidentally exposed
- Developer token and API client should use minimum required scopes

## Initial Setup Checklist

Run `/setup` to complete all of these automatically.

**Per developer (one-time per machine):**
- [ ] Node.js, pnpm, Git, GitHub CLI installed and authenticated
- [ ] DOMO CLI installed and authenticated (`domo login`)
- [ ] `~/.domo-secrets` created and filled with real values
- [ ] Playwright browsers installed (`npx playwright install`)
- [ ] `domo-auth-setup.js` run — `~/.domo-auth-state.json` saved
- [ ] `~/.domo-auth-state.meta.json` written with expiration date

**Per project (automated by `/new-project`):**
- [ ] Four repo secrets pushed from `~/.domo-secrets` via `gh secret set`

## Known Issues

- **ryuu developer token cannot access data query API:** The token stored in `~/.config/configstore/ryuu/rawso.domo.com.json` is scoped to app development. Both `/api/oauth2/v1/token` and `/api/content/v1/token` reject it for data API access. Use an OAuth client (Client ID + Client Secret) for dataset queries.

<!-- Credential-related issues. /learn will add entries here. -->
