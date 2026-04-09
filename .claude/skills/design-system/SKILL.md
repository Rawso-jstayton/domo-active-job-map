---
name: design-system
description: >
  Rawso brand kit, color palette, typography, chart styling, layout patterns,
  and component design standards. Use when styling any DOMO card, app, or
  dashboard. Must be read before creating any visual output. Also use when
  the user mentions "brand", "colors", "styling", "design", "look and feel",
  "theme", or "brand kit".
---

# Rawso Design System

Visual design standards for all DOMO dashboards and applications.
Built on **shadcn/ui** + **Tailwind CSS** with **CSS custom properties** for theming.

> **Philosophy:** Every project should feel cohesive but have room to breathe.
> This system defines the shared foundation — palette, typography scale, spacing,
> and component patterns — while leaving chart color sequences, accent usage,
> and layout density flexible per project. Cohesion comes from the system;
> character comes from the project.

**Reference files (read when needed):**
- `references/chart-and-components.md` — Chart type specs, layout grid, component patterns, spacing, number formatting
- `references/engineering.md` — Accessibility, motion, state/URL management, dark mode, performance, anti-patterns

---

## Theme Architecture

Dark theme is primary. Light theme is secondary. Both must be supported.
Use shadcn/ui's CSS variable approach — define tokens in `:root` (light)
and `.dark` (dark), and reference via `hsl(var(--token-name))` in components.

```css
/* Apply .dark to <html> or <body> for dark mode (default) */
/* Toggle to remove .dark for light mode */
```

---

## Brand Colors

**Full color values:** Read `tokens/brand-colors.json` when you need exact hex values.

### Key Rules (always in context)
- **Rawso Orange `#F36E22`** — Brand accent. Use sparingly: primary CTAs,
  active nav indicators, key highlights. Never as a background fill or
  chart area color.
- **Dark theme is primary.** Tokens: `--background`, `--card`, `--card-elevated`,
  `--border`, `--foreground`, `--muted`, `--primary`, `--secondary`, etc.
- **Both themes required.** Light theme uses the same token names with lighter values.
- **Semantic colors:** `--success` (green), `--warning` (amber), `--error` (red), `--info` (blue)
- **Status badges:** Use semantic color at 15% opacity background + colored text.
  Trends: green `↗`/`▲` up, red `↘`/`▼` down.

---

## Chart Colors

**Sequence values:** In `tokens/brand-colors.json` → `chartSequence` array.
Use in order: Cyan, Coral, Violet, Amber, Emerald, Pink, Sky, Orange.

### Rules
- **Never** use `#F36E22` (brand accent) as a series color — accent only.
- **Single-series default:** Cyan (`#22D3EE`). Area charts: gradient fill 40%→0% opacity.
- **Max 6 series** per chart. Group into "Other" if more needed.
- **Two-series:** positions 1+2 (Cyan+Coral) or 1+3 (Cyan+Violet).
- **Positive/negative splits:** use `--success`/`--error`, not chart colors.

---

## Typography

**Full type scale:** Read `tokens/typography.json` when you need exact sizes/weights.

- **Primary font:** Inter. **Monospace:** JetBrains Mono (for data tables).
- Use `font-variant-numeric: tabular-nums` on all numeric columns.
- KPI values: right-align or center, never left-align. All-caps only for labels.
- Truncate long text with ellipsis, never wrap card titles.

---

## Do's and Don'ts

### DO:
- Use semantic colors for trend indicators (green=up, red=down)
- Left-align text, right-align numbers in tables
- Keep chart backgrounds transparent (let `--card` show through)
- Use the chart color sequence in order — don't cherry-pick
- Provide both dark and light mode for every component
- Use `tabular-nums` for any numeric column
- Abbreviate large numbers on axes and in KPI cards
- Use subtle borders, not heavy shadows, for card separation in dark mode
- Let whitespace/dark space do the work — don't over-decorate

### DON'T:
- Don't use `#F36E22` as a chart series fill color (accent only)
- Don't use more than 6 series in a single chart
- Don't use 3D effects, gradients on bars, or decorative chart elements
- Don't use pie charts with more than 5 slices (use donut or bar instead)
- Don't mix font families within a single view
- Don't center-align body text or table data
- Don't use pure black (`#000000`) — use `--background` tokens instead
- Don't use pure white (`#FFFFFF`) text in dark mode — use `--foreground` (`#F4F4F5`)
- Don't hard-code colors — always reference CSS variables/tokens
- Don't add borders AND shadows to the same card

---

## Design Philosophy

> **Avoid generic AI aesthetics.** Every dashboard should have a clear
> visual identity — not look like a default template with swapped colors.
> Choose a direction for each project (data-dense analyst tool vs. clean
> executive summary vs. operational monitoring) and let that direction
> inform density, whitespace, typography weight, and interaction patterns.
> The design system provides the shared foundation; the project provides
> the character.

---

## Applying to shadcn/ui

When initializing a new project with shadcn/ui, configure `globals.css`
to use these tokens. The variable names above map directly to shadcn's
expected token names. Override in your theme:

```css
.dark {
  --background: 225 14% 7%;        /* #0F1117 */
  --foreground: 240 5% 96%;        /* #F4F4F5 */
  --card: 225 14% 11%;             /* #171921 */
  --card-foreground: 240 5% 96%;
  --primary: 22 90% 54%;           /* #F36E22 */
  --primary-foreground: 0 0% 100%;
  --secondary: 225 14% 19%;        /* #2A2D37 */
  --secondary-foreground: 240 5% 91%;
  --muted: 225 14% 15%;            /* #22242C */
  --muted-foreground: 240 4% 46%;  /* #71717A */
  --accent: 22 90% 54%;            /* #F36E22 */
  --accent-foreground: 0 0% 100%;
  --border: 225 14% 19%;           /* #2A2D37 */
  --input: 225 14% 19%;
  --ring: 22 90% 54%;              /* #F36E22 */
  --radius: 0.5rem;
}
```

See the **libraries** skill for the full tech stack and shadcn/ui setup.

---

## Known Issues

<!-- Design-specific issues. /learn will add entries here. -->
