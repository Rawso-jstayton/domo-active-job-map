# CLI Commands & Manifest Reference

Read this file when you need exact command syntax or manifest configuration details.

## Optional Manifest Fields

### AppDB Collections
```json
{
  "collections": [
    {
      "name": "CommentsTable",
      "schema": {
        "columns": [
          { "name": "user", "type": "STRING" },
          { "name": "comment", "type": "STRING" }
        ]
      },
      "syncEnabled": true
    }
  ]
}
```
Requires `proxyId` in manifest.

### Workflow Mapping
```json
{
  "workflowMapping": [
    {
      "alias": "myWorkflow",
      "parameters": [
        { "aliasedName": "input1", "type": "number", "list": false, "children": null }
      ]
    }
  ]
}
```
Requires `proxyId` in manifest.

### proxyId
Required for AppDB, Workflows, and Code Engine access during local dev.
```json
{
  "proxyId": "XXXXXXXX-XXXX-4XXX-XXXX-XXXXXXXXXXXX"
}
```
**Finding the proxyId:**
1. Publish the app at least once
2. Create a card from the app design in DOMO
3. Right-click the card → Inspect Element
4. Find the `<iframe>` containing your app
5. The ID between `//` and `.domoapps` in the iframe URL is your proxyId

**Warning:** proxyIds are tied to cards. If you delete the card, get a new one.

### Ignore List
```json
{
  "ignore": ["src/**/*", "node_modules/**/*", "*.test.tsx"]
}
```
Files matching these patterns are excluded from `domo publish`. `node_modules` always ignored.

### Auto-Generated id
```json
{
  "id": "abc123-def456-..."
}
```
Added automatically on first `domo publish`. This is the Design ID — never changes.

### DA CLI Manifest Overrides (multi-environment)
```bash
da manifest rawso.prod "Production environment"
da manifest rawso.dev "Development environment"
da apply-manifest rawso.prod
```
Overrides can set different `id` and `proxyId` per environment.

## Development Workflow

```bash
# 1. Authenticate (once per session, or if token expires)
domo login

# 2. Start local dev server
pnpm dev              # Vite dev server (hot reload, fast builds)
# In a separate terminal:
domo dev              # Proxies /data/v1/* requests to your DOMO instance

# 3. Develop — Vite hot-reloads, domo dev proxies data

# 4. Build for DOMO
pnpm build            # Outputs to dist/

# 5. Publish to DOMO
domo publish          # Uploads dist/ contents to DOMO

# 6. Verify in DOMO — open the card in your browser
```

### domo dev Options
| Option | Description |
|--------|-------------|
| `-u, --userId` | Impersonate a specific user (for PDP testing) |
| `-e, --external` | Expose dev server on public IP |

### Proxy Behavior
`domo dev` intercepts `/data/v1/*`, `/sql/v1/*`, `/domo/*` and proxies to your
DOMO instance. For AppDB/Workflows/Code Engine, you need `proxyId` in manifest.

## Publishing

```bash
domo publish            # Upload dist/ to DOMO
domo publish -g         # Publish and open Asset Library
domo ls                 # List all published designs
domo download -i ID     # Download a design
domo delete ID          # Soft delete (reversible)
domo undelete ID        # Restore deleted design
```

- `domo publish` overwrites current version (dev deploy)
- `domo release -v VERSION` locks a version for Appstore submission
- See git-deploy skill for branching/version strategy

## Asset Design IDs
- Every app has a unique Design ID (`id` in manifest.json)
- Created on first publish, never changes even if repo renamed
- Find in DOMO: Asset Library → app → URL contains the ID
- Each card based on your design is an "App Instance" with its own data wiring

## Corporate Proxy
```bash
domo proxy proxy.company.com 8080      # Set proxy
domo proxy proxy.company.com 8080 -a   # With auth
domo proxy -r                          # Remove proxy
```
