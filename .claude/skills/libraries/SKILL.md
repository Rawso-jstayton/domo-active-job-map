---
name: libraries
description: >
  Preferred libraries, frameworks, and version pins for DOMO development.
  Rawso uses React 18 + TypeScript + Apache ECharts + shadcn/ui + Vite as
  the standard stack, scaffolded via the DA CLI (@domoinc/da). Use when
  starting any new app, choosing dependencies, importing libraries, or when
  Claude needs to know what technology to use. Always reference this skill
  before adding any dependency to a project.
---

# Preferred Libraries

Standard tech stack for all DOMO pro code apps at Rawso.

## Core Stack

### Framework: React + TypeScript
- React 18 + TypeScript — **required** for all apps. No exceptions.
- Build tool: Vite (via DA CLI template `@domoinc/vite-react-template`)
- Scaffold new apps: `da new my-app-name` (or manual setup — see `cli-setup` skill)
- Functional components and hooks only (no class components)

### DOMO SDK: ryuu.js
- **Package:** `ryuu.js` — `import Domo from 'ryuu.js'`
- The only HTTP client for DOMO data — do NOT use fetch/axios for datasets
- See `pro-code-apps` skill and its `references/sdk-reference.md` for full API

### DOMO Toolkit (optional)
- **Package:** `@domoinc/toolkit` — AppDB, Code Engine, Workflows, SQL, AI clients

### Charting: Apache ECharts
- **Packages:** `echarts`, `echarts-for-react`
- Chart colors: load from `design-system/tokens/brand-colors.json` → `chartSequence`
- We use ECharts (not DOMO Phoenix) for full theme control

### UI Components: shadcn/ui
- Components copied into project (not npm imported) — we own and customize them
- Theme CSS variables mapped to Rawso tokens in `pro-code-apps/templates/globals.css`

### CSS: Tailwind CSS
- Required by shadcn/ui. Use Tailwind utilities, not separate CSS files.
- Exception: ECharts internal styling (handled by ECharts theme)

## Utility Libraries

### Date Handling
- **Package:** `date-fns` — tree-shakeable, functional API
- Import only what you use: `import { format, parseISO } from 'date-fns'`

### Number Formatting
- Use native `Intl.NumberFormat` — no extra dependency needed

### Icons
- **Package:** `lucide-react` — default icon set, pairs with shadcn/ui

## Libraries NOT to Use

Do not use these — Claude should never suggest or install them:
- **Chart.js / Recharts / D3 (for charts)** — ECharts is the standard
- **Material UI / Ant Design / Chakra** — shadcn/ui is the standard
- **Bootstrap / Bulma** — Tailwind is the standard
- **jQuery** — not needed with React
- **Moment.js** — deprecated, use date-fns
- **styled-components / Emotion** — use Tailwind utilities
- **axios** — use ryuu.js for DOMO data, native fetch for anything else

## Standard Dependencies

**Pinned versions:** See `templates/standard-deps.json`.
Key packages: react 18, ryuu.js, echarts 5, lucide-react, date-fns 4, tailwind 3, vite 6.
Note: shadcn components are copied in, not listed as dependencies.

## Build Configuration

### Integration with DOMO CLI
- `domo dev` proxies API requests to DOMO during local dev
- `domo publish` uploads the `dist/` directory to DOMO
- `manifest.json` must be in root — references dataset aliases
- Local dev: run `pnpm dev` for Vite + `domo dev` for DOMO data proxy

## Version Pinning Policy

- Pin exact major.minor in package.json (use ^ for patch updates)
- Lock file (`pnpm-lock.yaml`) must be committed
- Update quarterly or for security patches
- Test in DOMO context after any dependency update
- **Package manager:** pnpm

## ECharts Integration Patterns

### Tree-Shaking (Required for Production)

ECharts is large (~800KB). Import only what you use:

```typescript
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import {
  TitleComponent, TooltipComponent, GridComponent,
  LegendComponent, DataZoomComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
  BarChart, LineChart, PieChart,
  TitleComponent, TooltipComponent, GridComponent,
  LegendComponent, DataZoomComponent,
  CanvasRenderer
]);
```

### Responsive Charts with ResizeObserver

DOMO cards resize when the dashboard layout changes. ECharts doesn't auto-resize.

```typescript
useEffect(() => {
  const chart = echarts.init(chartRef.current);
  const observer = new ResizeObserver(() => chart.resize());
  observer.observe(chartRef.current);
  return () => { observer.disconnect(); chart.dispose(); };
}, []);
```

### Theme Switching

Load Rawso brand colors from the design system and apply as an ECharts theme:

```typescript
import brandColors from '@/tokens/brand-colors.json';

echarts.registerTheme('rawso', {
  color: brandColors.chartSequence,
  // ... additional theme overrides
});

// Use the theme when initializing
const chart = echarts.init(el, 'rawso');
```

### Sparkline Pattern

For inline KPI sparklines (small charts without axes or labels):

```typescript
const sparklineOption = {
  grid: { top: 0, right: 0, bottom: 0, left: 0 },
  xAxis: { show: false, type: 'category' },
  yAxis: { show: false, type: 'value' },
  series: [{ type: 'line', smooth: true, symbol: 'none', data: values }],
  tooltip: { show: false },
};
```

## Build Gotchas

- **pnpm + esbuild:** Add `"pnpm": { "onlyBuiltDependencies": ["esbuild"] }` to
  package.json. Without this, Vite's esbuild dependency fails its postinstall step.
- **tsconfig.node.json:** Needs `"composite": true` when using TypeScript project
  references (standard Vite template). `noEmit` cannot be used in the referenced config.

## Known Issues

<!-- Library-specific issues in DOMO context. /learn will add entries here. -->
