# Decision Log

Decisions and learnings discovered during this project. Referenced by `/resume` at session start.

---

## 2026-03-29
- **Playwright auth:** Microsoft SSO cookie persistence is the solution. `ESTSAUTHPERSISTENT` (~90d TTL) auto-renews `DA-SID` (8h TTL) without manual login. Developer tokens authenticate API calls but cause `/api/domoweb/bootstrap` to 500 — cannot be used for browser rendering.
- **Global auth state:** `~/.domo-auth-state.json` stores browser session globally, shared across all DOMO projects. `~/.domo-secrets` stores dev token + OAuth creds. Neither lives in the repo.
- **Edge required:** Playwright's bundled Chromium fails with `spawn UNKNOWN` on Windows 11. Using `channel: 'msedge'` (installed Edge) works reliably.
- **Toolkit complete:** All 33 skills filled across 4 tiers. Tiers 2-4 filled in this session. Playwright scripts written and verified with real DOMO dashboard screenshots.

## 2026-03-28
- **Font:** Inter as primary font — closest free alternative to Avenir (used in admin dashboard reference), superior tabular number support and OpenType features
- **Dark palette:** #0F1117 background, #171921 card, #1E2029 elevated, #2A2D37 borders — dark-blue-gray undertone, not pure neutral
- **Light palette:** #F8F9FB background, #FFFFFF card — clean, not yellowish
- **Chart colors:** 8-color ordered sequence (cyan #22D3EE, coral #F87171, violet #A78BFA, amber #FBBF24, emerald #34D399, pink #F472B6, sky #38BDF8, orange #FB923C). Chosen for contrast against both themes. Max 6 series per chart.
- **Accent rule:** #F36E22 never used as chart series fill — reserved for CTAs, focus rings, highlighted data points only
- **KPI sparklines:** Inline mini sparklines in KPI cards (48-60px tall, color-coded per metric). Pattern from Pondox dashboard reference.
- **Accessibility:** WCAG 2.1 baseline. Semantic HTML first, ARIA second. prefers-reduced-motion mandatory. 4.5:1 contrast minimum. Never color-only meaning.
- **URL state:** Dashboard filters, tabs, pagination, sort must be reflected in URL query params for shareability and deep-linking
- **Dark mode engineering:** color-scheme: dark on html, meta theme-color, explicit select element styling for Windows
- **Virtualization:** Tables 50+ rows must use @tanstack/react-virtual or equivalent

<!-- New entries are added at the top, grouped by date -->
<!-- Format:
## YYYY-MM-DD
- **Topic:** Decision made and rationale
-->
