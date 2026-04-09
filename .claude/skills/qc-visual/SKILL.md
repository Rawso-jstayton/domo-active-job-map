---
name: qc-visual
description: >
  Visual QC using Playwright — screenshot dashboards and apps, check browser
  console for errors, verify responsive layouts, run visual regression tests,
  and validate rendered output matches expectations. Use during Phase 4 (QC),
  when checking a finished card/app visually, or when the user says "check
  how it looks", "screenshot", "visual test", "console errors", or
  "Playwright".
---

# QC Visual — Playwright Visual Testing

Use Playwright to visually validate DOMO dashboards and apps.

## Playwright Setup

### Installation
```bash
pnpm add -D @playwright/test
npx playwright install chromium
```

### Authentication (Verified 2026-03-29)

DOMO's web UI requires a browser session — developer tokens and OAuth tokens
only work for API calls, not for rendering dashboards in a browser.

**How it works:**
- Microsoft SSO cookies (`ESTSAUTHPERSISTENT`) auto-renew the DOMO session
- DOMO session cookie (`DA-SID`) expires every 8 hours but auto-renews via SSO
- SSO cookies last ~90 days — manual login needed only once per ~90 days
- Auth state is stored globally at `~/.domo-auth-state.json` (shared across projects)

**Initial setup (one-time):**
```bash
node scripts/domo-auth-setup.js
```
Opens Edge browser, you log in via Microsoft SSO/MFA, script auto-detects
login and saves cookies to `~/.domo-auth-state.json`.

**Subsequent runs (fully automated):**
```typescript
const context = await browser.newContext({
  storageState: path.join(os.homedir(), '.domo-auth-state.json'),
});
// Navigate to DOMO homepage first to trigger SSO auto-renewal
await page.goto('https://rawso.domo.com/');
// Then navigate to target dashboard
await page.goto('https://rawso.domo.com/page/DASHBOARD_ID');
```

**Key DOMO session cookies:**
- `DA-SID-prod5-mmmm-0035-9760` — DOMO session (HMAC-signed, 8h TTL, auto-renews)
- `PLAY_SESSION` — Play Framework session
- `ESTSAUTHPERSISTENT` — Microsoft SSO persistent token (~90 day TTL)

**What does NOT work for browser rendering:**
- `X-Domo-Developer-Token` header — authenticates API calls but `/api/domoweb/bootstrap` returns 500
- OAuth Bearer token — redirects to login page
- Any cookie injection without SSO — DA-SID is HMAC-signed and can't be forged

### Base Configuration
See `scripts/playwright-base.js` for reusable config with auth, viewports,
screenshot helpers, and console capture.

## Test Types

### Screenshot Tests
Capture full-page and individual card screenshots:

```typescript
// Wait for dashboard to fully render
await page.waitForSelector('.dashboard-card', { timeout: 15000 });
await page.waitForTimeout(3000); // Allow chart animations to complete

// Full dashboard screenshot
await page.screenshot({
  path: `qc-reports/screenshots/${dashboardName}-full.png`,
  fullPage: true,
});

// Individual card screenshots
const cards = await page.locator('.dashboard-card').all();
for (let i = 0; i < cards.length; i++) {
  await cards[i].screenshot({
    path: `qc-reports/screenshots/${dashboardName}-card-${i}.png`,
  });
}
```

**Save to:** `qc-reports/screenshots/`

### Console Error Check
Capture and review browser console for JavaScript errors:

```typescript
const errors: string[] = [];
page.on('console', msg => {
  if (msg.type() === 'error') {
    errors.push(`[ERROR] ${msg.text()}`);
  }
});
page.on('pageerror', err => {
  errors.push(`[PAGE ERROR] ${err.message}`);
});

// Navigate and wait for render
await page.goto(dashboardUrl);
await page.waitForLoadState('networkidle');
```

**Acceptable DOMO noise errors (ignore these):**
- `ResizeObserver loop limit exceeded` — benign browser warning
- Internal DOMO analytics/tracking errors
- Feature flag related warnings

**Flag these errors:**
- `TypeError` or `ReferenceError` in app code
- `Failed to fetch` or `net::ERR_*` for data API calls
- Any error from the app's own JavaScript bundle

### Responsive Checks
Test at multiple viewports:

| Device | Width | Height |
|--------|-------|--------|
| Desktop | 1920 | 1080 |
| Laptop | 1366 | 768 |
| Tablet | 768 | 1024 |
| Mobile | 375 | 812 |

```typescript
const viewports = [
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 812 },
];

for (const vp of viewports) {
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.waitForTimeout(1000); // Allow layout to settle
  await page.screenshot({
    path: `qc-reports/screenshots/${name}-${vp.name}.png`,
    fullPage: true,
  });
}
```

**Check for:**
- Text overflow or clipping
- Cards not stacking properly on mobile
- Charts too small to read
- Horizontal scroll appearing when it shouldn't
- Touch targets too small on mobile (min 44x44px)

### Visual Regression
Compare current vs baseline screenshots:

```typescript
import { expect } from '@playwright/test';

// First run: saves as baseline automatically
// Subsequent runs: compares against baseline
await expect(page).toHaveScreenshot(`${name}-baseline.png`, {
  maxDiffPixelRatio: 0.01,  // 1% pixel difference threshold
  threshold: 0.2,           // Per-pixel color threshold
});
```

**Update baselines** when intentional changes are made:
```bash
npx playwright test --update-snapshots
```

### Data Rendering Verification
Verify data displays correctly without manual checking:

```typescript
// Check KPI card values are non-empty
const kpiValues = await page.locator('.kpi-value').allTextContents();
for (const val of kpiValues) {
  expect(val.trim()).not.toBe('');
  expect(val).not.toContain('Error');
  expect(val).not.toContain('No Data');
}

// Check charts rendered (have SVG or canvas content)
const charts = await page.locator('canvas, svg.echarts').count();
expect(charts).toBeGreaterThan(0);
```

## Test Workflow

Standard visual QC flow:

1. **Authenticate** with DOMO (token or cookie injection)
2. **Navigate** to dashboard/app URL
3. **Wait** for all cards to render (network idle + explicit waits)
4. **Console check** — capture errors during render
5. **Full screenshot** — desktop viewport
6. **Card screenshots** — each card individually
7. **Responsive test** — screenshot at each viewport
8. **Visual regression** — compare against baselines (if they exist)
9. **Data check** — verify KPI values are non-empty, charts rendered
10. **Generate report** — save to `qc-reports/`

## Reporting

Save to `qc-reports/visual-qc-[date].md`:

```markdown
# Visual QC Report — [date]

## Dashboard/App: [name]
URL: [url]
Tested by: Claude Code

### Console Errors
- [count] errors found ([count] noise, [count] actionable)
- [list actionable errors with source and message]

### Screenshots
- Desktop: qc-reports/screenshots/[name]-desktop.png
- Tablet: qc-reports/screenshots/[name]-tablet.png
- Mobile: qc-reports/screenshots/[name]-mobile.png
- Cards: qc-reports/screenshots/[name]-card-[0-N].png

### Responsive Check
| Viewport | Status | Notes |
|----------|--------|-------|
| Desktop (1920x1080) | PASS/FAIL | [notes] |
| Tablet (768x1024) | PASS/FAIL | [notes] |
| Mobile (375x812) | PASS/FAIL | [notes] |

### Visual Regression
- [PASS / FAIL / NO BASELINE]
- Diff percentage: [X%] (threshold: 1%)

### Data Rendering
- KPI values present: [PASS/FAIL]
- Charts rendered: [PASS/FAIL]
- Loading errors: [PASS/FAIL]

### Overall: [PASS / FAIL]
```

## Known Issues

- **Auth (2026-03-29):** DA-SID expires every 8 hours but auto-renews via
  Microsoft SSO cookies (~90 day lifetime). Global state at `~/.domo-auth-state.json`.
  Re-run `domo-auth-setup.js` only when SSO cookies expire (~every 90 days).
- DOMO dashboards use iframe embedding for cards — may need to switch to
  `page.frameLocator()` to access card content.
- Chart animations can cause screenshot flicker — add explicit wait after
  navigation (2-3 seconds) before capturing.
- DOMO's single-page app routing may require explicit `waitForURL` after navigation.
