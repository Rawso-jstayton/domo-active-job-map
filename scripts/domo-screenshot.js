/**
 * domo-screenshot.js — Fully automated DOMO dashboard screenshots.
 *
 * Usage: node scripts/domo-screenshot.js <dashboard-url> [name]
 *
 * Auth: Uses saved browser state from domo-auth-setup.js.
 * Microsoft SSO cookies auto-renew the DOMO session — no manual login
 * needed for ~90 days after initial setup.
 *
 * If auth expires: re-run node scripts/domo-auth-setup.js
 *
 * Outputs:
 *   - Screenshots at desktop/tablet/mobile viewports
 *   - Console error report
 *   - Saved to qc-reports/screenshots/
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Global auth state — shared across all projects (next to ~/.domo-secrets)
const STATE_FILE = path.join(require('os').homedir(), '.domo-auth-state.json');
const SCREENSHOT_DIR = path.join(__dirname, '..', 'qc-reports', 'screenshots');
const DOMO_INSTANCE = 'rawso';

const VIEWPORTS = {
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 812 },
};

const NOISE_PATTERNS = [
  'ResizeObserver loop',
  'analytics',
  'tracking',
  'mixpanel',
  'pendo',
  'feature-flag',
];

async function ensureAuth(context, page) {
  // Navigate to DOMO homepage to trigger SSO auto-reauth if DA-SID expired
  await page.goto(`https://${DOMO_INSTANCE}.domo.com/`, {
    waitUntil: 'networkidle',
    timeout: 60000,
  });
  await page.waitForTimeout(3000);

  const url = page.url();
  if (url.includes('/auth/') || url.includes('/login') || url.includes('login.microsoftonline')) {
    // SSO cookies expired — need manual re-login
    return false;
  }

  // Check for DA-SID cookie
  const cookies = await context.cookies();
  const daSid = cookies.find(c => c.name.startsWith('DA-SID'));
  if (!daSid) return false;

  // Save refreshed auth state for next run
  await context.storageState({ path: STATE_FILE });

  return true;
}

async function main() {
  const url = process.argv[2];
  const name = process.argv[3] || 'domo-dashboard';

  if (!url) {
    console.error('Usage: node scripts/domo-screenshot.js <dashboard-url> [name]');
    process.exit(1);
  }

  if (!fs.existsSync(STATE_FILE)) {
    console.error('No auth state found. Run first: node scripts/domo-auth-setup.js');
    process.exit(1);
  }

  console.log(`Screenshotting: ${url}`);
  console.log(`Name: ${name}\n`);

  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const browser = await chromium.launch({ channel: 'msedge' });
  const context = await browser.newContext({
    storageState: STATE_FILE,
    viewport: VIEWPORTS.desktop,
  });
  const page = await context.newPage();

  // Ensure auth is valid (auto-renews via SSO if needed)
  console.log('Checking auth...');
  const authed = await ensureAuth(context, page);
  if (!authed) {
    console.error('\nSSO cookies expired (~90 days). Re-run: node scripts/domo-auth-setup.js');
    await browser.close();
    process.exit(1);
  }
  console.log('Auth OK (DA-SID valid)\n');

  // Capture console errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      const isNoise = NOISE_PATTERNS.some(p => text.toLowerCase().includes(p));
      errors.push({ text, isNoise });
    }
  });
  page.on('pageerror', err => {
    errors.push({ text: err.message, isNoise: false });
  });

  // Navigate to target dashboard
  console.log('Loading dashboard...');
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);

  const currentUrl = page.url();
  if (currentUrl.includes('/auth/') || currentUrl.includes('/login')) {
    console.error('\nFailed to load dashboard — redirected to login.');
    await browser.close();
    process.exit(1);
  }

  console.log(`Page loaded: ${currentUrl}\n`);

  // Screenshot at each viewport
  for (const [vpName, size] of Object.entries(VIEWPORTS)) {
    await page.setViewportSize(size);
    await page.waitForTimeout(1500);
    const filepath = path.join(SCREENSHOT_DIR, `${name}-${vpName}.png`);
    await page.screenshot({ path: filepath, fullPage: true });
    console.log(`  [${vpName}] ${size.width}x${size.height} -> ${filepath}`);
  }

  await browser.close();

  // Report console errors
  const actionable = errors.filter(e => !e.isNoise);
  const noise = errors.filter(e => e.isNoise);

  console.log('\n--- Console Errors ---');
  console.log(`  Total: ${errors.length} (${actionable.length} actionable, ${noise.length} noise)`);
  if (actionable.length > 0) {
    console.log('\n  Actionable errors:');
    for (const err of actionable) {
      console.log(`    - ${err.text.substring(0, 200)}`);
    }
  }

  // Write report
  const reportPath = path.join(__dirname, '..', 'qc-reports', `visual-qc-${name}.md`);
  const report = `# Visual QC Report — ${new Date().toISOString().split('T')[0]}

## Dashboard: ${name}
URL: ${url}

### Console Errors
- Total: ${errors.length} (${actionable.length} actionable, ${noise.length} noise)
${actionable.map(e => `- ${e.text.substring(0, 200)}`).join('\n') || '- None'}

### Screenshots
| Viewport | Size | File |
|----------|------|------|
${Object.entries(VIEWPORTS).map(([vp, s]) => `| ${vp} | ${s.width}x${s.height} | screenshots/${name}-${vp}.png |`).join('\n')}

### Overall: ${actionable.length === 0 ? 'PASS' : 'NEEDS REVIEW'}
`;

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, report);
  console.log(`\nReport saved: ${reportPath}`);
  console.log(`Result: ${actionable.length === 0 ? 'PASS' : 'NEEDS REVIEW'}`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
