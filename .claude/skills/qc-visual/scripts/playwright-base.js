// playwright-base.js — Reusable Playwright configuration for DOMO QC
// See qc-visual skill for detailed usage instructions

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const DOMO_CONFIG = {
  baseUrl: 'https://rawso.domo.com',

  auth: {
    // Global auth state file — shared across all projects
    // Created by: node scripts/domo-auth-setup.js (one-time manual login)
    // Auto-renews via Microsoft SSO cookies (~90 day lifetime)
    // DA-SID session token refreshes automatically every 8 hours
    stateFile: path.join(require('os').homedir(), '.domo-auth-state.json'),
  },

  viewports: {
    desktop: { width: 1920, height: 1080 },
    laptop: { width: 1366, height: 768 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 812 },
  },

  screenshotDir: './qc-reports/screenshots',
  renderTimeout: 15000,
  animationWait: 3000,
};

/**
 * Create an authenticated browser context for DOMO
 */
async function createDomoContext(browser) {
  const stateFile = DOMO_CONFIG.auth.stateFile;
  if (!fs.existsSync(stateFile)) {
    throw new Error(
      'No auth state found at ' + stateFile +
      '. Run: node scripts/domo-auth-setup.js'
    );
  }

  const context = await browser.newContext({
    storageState: stateFile,
    viewport: DOMO_CONFIG.viewports.desktop,
  });

  // Auto-renew DA-SID via SSO by navigating to DOMO homepage
  const page = await context.newPage();
  await page.goto(DOMO_CONFIG.baseUrl, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(3000);

  const url = page.url();
  if (url.includes('/auth/') || url.includes('/login')) {
    throw new Error(
      'SSO cookies expired (~90 days). Re-run: node scripts/domo-auth-setup.js'
    );
  }

  // Save refreshed state for next run
  await context.storageState({ path: stateFile });
  await page.close();

  return context;
}

/**
 * Navigate to a DOMO page and wait for render
 */
async function navigateAndWait(page, url) {
  await page.goto(url, { waitUntil: 'networkidle' });
  // Wait for card containers to appear
  try {
    await page.waitForSelector('[class*="card"], [class*="widget"]', {
      timeout: DOMO_CONFIG.renderTimeout,
    });
  } catch {
    // Page may not have standard card selectors (custom app)
    console.warn('No standard card selectors found — page may be a custom app');
  }
  // Allow chart animations to complete
  await page.waitForTimeout(DOMO_CONFIG.animationWait);
}

/**
 * Capture console errors during page interaction
 */
function captureConsoleErrors(page) {
  const errors = [];
  const noise = [
    'ResizeObserver loop',
    'analytics',
    'tracking',
    'feature-flag',
  ];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      const isNoise = noise.some(n => text.toLowerCase().includes(n));
      errors.push({ text, isNoise, type: 'console' });
    }
  });

  page.on('pageerror', err => {
    errors.push({ text: err.message, isNoise: false, type: 'pageerror' });
  });

  return errors;
}

/**
 * Take screenshots at all configured viewports
 */
async function screenshotAllViewports(page, name) {
  const dir = DOMO_CONFIG.screenshotDir;
  fs.mkdirSync(dir, { recursive: true });

  const results = [];
  for (const [vpName, size] of Object.entries(DOMO_CONFIG.viewports)) {
    await page.setViewportSize(size);
    await page.waitForTimeout(1000);
    const filepath = path.join(dir, `${name}-${vpName}.png`);
    await page.screenshot({ path: filepath, fullPage: true });
    results.push({ viewport: vpName, path: filepath, ...size });
  }
  return results;
}

/**
 * Screenshot individual cards on the page
 */
async function screenshotCards(page, name) {
  const dir = DOMO_CONFIG.screenshotDir;
  fs.mkdirSync(dir, { recursive: true });

  const cards = await page.locator('[class*="card"], [class*="widget"]').all();
  const results = [];
  for (let i = 0; i < cards.length; i++) {
    const filepath = path.join(dir, `${name}-card-${i}.png`);
    try {
      await cards[i].screenshot({ path: filepath });
      results.push({ index: i, path: filepath, status: 'ok' });
    } catch (err) {
      results.push({ index: i, path: null, status: 'failed', error: err.message });
    }
  }
  return results;
}

/**
 * Run a full visual QC workflow
 */
async function runVisualQC(dashboardUrl, name) {
  const browser = await chromium.launch({ channel: 'msedge' });
  const context = await createDomoContext(browser);
  const page = await context.newPage();

  // Capture errors
  const errors = captureConsoleErrors(page);

  // Navigate
  await navigateAndWait(page, dashboardUrl);

  // Screenshots
  const viewportResults = await screenshotAllViewports(page, name);
  // Reset to desktop for card screenshots
  await page.setViewportSize(DOMO_CONFIG.viewports.desktop);
  await page.waitForTimeout(1000);
  const cardResults = await screenshotCards(page, name);

  await browser.close();

  return {
    errors,
    viewports: viewportResults,
    cards: cardResults,
    actionableErrors: errors.filter(e => !e.isNoise),
  };
}

module.exports = {
  DOMO_CONFIG,
  createDomoContext,
  navigateAndWait,
  captureConsoleErrors,
  screenshotAllViewports,
  screenshotCards,
  runVisualQC,
};
