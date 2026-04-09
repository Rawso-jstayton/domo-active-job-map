/**
 * domo-auth-setup.js — One-time manual login to capture DOMO auth state.
 *
 * Usage: node scripts/domo-auth-setup.js
 *
 * Opens a browser window to rawso.domo.com.
 * Log in manually (SSO, MFA, whatever your instance uses).
 * The script auto-detects when login completes and saves cookies.
 *
 * Subsequent test scripts reuse this saved state — no manual login needed
 * until the session expires.
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const DOMO_URL = 'https://rawso.domo.com';
// Global auth state — shared across all projects
const STATE_FILE = path.join(require('os').homedir(), '.domo-auth-state.json');

async function main() {
  console.log('Opening browser — log in to DOMO manually...\n');

  const browser = await chromium.launch({
    headless: false,
    channel: 'msedge',
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(DOMO_URL);

  console.log('Waiting for login to complete...');
  console.log('(Auto-detects when you reach a DOMO dashboard page)\n');

  // Wait until we're on a DOMO page that isn't auth/login
  // Poll the URL until it looks like we're logged in
  let attempts = 0;
  const maxAttempts = 300; // 5 minutes
  while (attempts < maxAttempts) {
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    // Logged in: URL is on rawso.domo.com and NOT an auth/login page
    if (
      currentUrl.includes('rawso.domo.com') &&
      !currentUrl.includes('/auth/') &&
      !currentUrl.includes('/login') &&
      !currentUrl.includes('login.microsoftonline') &&
      !currentUrl.includes('sso')
    ) {
      // Double-check by waiting for page to settle
      await page.waitForTimeout(3000);
      const settledUrl = page.url();
      if (
        settledUrl.includes('rawso.domo.com') &&
        !settledUrl.includes('/auth/') &&
        !settledUrl.includes('/login')
      ) {
        console.log(`Login detected! Current URL: ${settledUrl}`);
        break;
      }
    }
    attempts++;
    if (attempts % 10 === 0) {
      console.log(`  Still waiting... (${attempts * 2}s, current: ${currentUrl.substring(0, 60)})`);
    }
  }

  if (attempts >= maxAttempts) {
    console.error('Timed out waiting for login. Try again.');
    await browser.close();
    process.exit(1);
  }

  // Save auth state (cookies + localStorage)
  await context.storageState({ path: STATE_FILE });

  // Dump cookies for inspection
  const cookies = await context.cookies();
  console.log('\n--- Session Cookies ---');
  for (const cookie of cookies) {
    const val = cookie.value.length > 20 ? cookie.value.substring(0, 20) + '...' : cookie.value;
    console.log(`  ${cookie.name} = ${val} (domain: ${cookie.domain})`);
  }

  console.log(`\nAuth state saved to ${STATE_FILE}`);
  console.log('You can now run: node scripts/domo-screenshot.js <dashboard-url>');

  await browser.close();
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
