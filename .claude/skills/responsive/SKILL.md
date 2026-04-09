---
name: responsive
description: >
  Responsive design patterns specific to DOMO's card and app contexts.
  Covers breakpoints, mobile considerations, DOMO embed behavior, and
  card grid responsiveness. Use when building any visual output that needs
  to work across screen sizes, when the user mentions "mobile", "responsive",
  "tablet", "breakpoints", or when QC flags responsive issues.
---

# Responsive Design for DOMO

Responsive patterns that work within DOMO's specific constraints.

## DOMO's Responsive Context

DOMO handles responsiveness differently than standard web apps because
content renders inside DOMO's own layout system:

- **Dashboard pages** use a grid layout that DOMO controls. Cards auto-resize
  within their grid cells. You control the grid placement, not the pixel dimensions.
- **Pro code apps** render inside an iframe within a DOMO card container.
  The iframe dimensions change based on the card's grid position and the
  user's viewport. Your app must respond to the container size, not the viewport.
- **Mobile DOMO app** renders dashboards in a single-column stack.
  Cards stack vertically at full width. Your app has no control over this.
- **Embeds** (DOMO Everywhere / iframe embeds) inherit the embed container's
  dimensions. Use container-relative sizing, not viewport units.

### What DOMO Handles Automatically
- Dashboard grid responsiveness (card placement/stacking)
- Mobile app card stacking
- Standard chart card responsive behavior (built-in DOMO charts)

### What You Must Handle (Pro Code Apps)
- Internal layout of your custom app within the card container
- Chart sizing within your app (ECharts resize)
- Table layout at narrow widths
- Text truncation and overflow
- Touch targets for mobile

## Breakpoints

### Real-World Device Targets

Design and test for these four screen sizes. All widths refer to the
**card container width** (not the viewport), since apps render inside iframes.
A full-width card on a 34" monitor will have a much wider container than
the same card on a laptop.

| Device | Viewport Width | Full-width Card Container | Design Notes |
|--------|---------------|--------------------------|--------------|
| iPhone (SE–15 Pro Max) | 375–430px | ~375–430px | Single column, large touch targets (44px min), hide secondary columns in tables |
| iPad / iPad Pro | 768–1024px | ~768–1024px | 2-column KPI row, condensed charts, touch-friendly |
| Laptop (13"–15") | 1280–1440px | ~1200–1380px | Standard 3–4 column KPI row, full chart layout |
| 34" ultrawide monitor | 2560–3440px | ~2400–3200px | Full layout with side panels, higher info density, larger charts |

> **Note:** These are for full-width cards. Half-width cards on a laptop
> (~640px container) behave like an iPad. Adjust card span in DOMO's grid
> to match the intended layout density per device.

### Pro Code Apps (inside DOMO card container)
Since apps render inside a card container (not the full viewport),
use container width, not viewport width:

| Container Width | Context | Approach |
|----------------|---------|----------|
| < 430px | iPhone / mobile DOMO app | Single column, simplified, large touch targets |
| 430–768px | Small card or narrow tablet | Condensed layout, 2-col max |
| 768–1200px | iPad / half-width desktop card | Standard layout, 2–3 KPI columns |
| 1200–1800px | Laptop full-width card | Full layout, 4 KPI columns, side panels |
| > 1800px | 34" monitor full-width card | High-density layout, expanded charts, wider tables |

### Dashboard Grid
DOMO dashboards use a 12-column grid system:
- Full width: 12 columns
- Half width: 6 columns
- Third width: 4 columns
- Quarter width: 3 columns

Cards snap to grid positions. On mobile, all cards become 12 columns (stacked).

## CSS Patterns

### Container Queries (Preferred)
Container queries respond to the card container size, not the viewport.
This is the correct approach for DOMO pro code apps:

```css
.app-container {
  container-type: inline-size;
}

@container (max-width: 600px) {
  .kpi-grid { grid-template-columns: 1fr; }
  .chart-container { min-height: 200px; }
}

@container (min-width: 601px) and (max-width: 1000px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
}

@container (min-width: 1001px) {
  .kpi-grid { grid-template-columns: repeat(4, 1fr); }
}
```

### ResizeObserver (for chart libraries)
ECharts and other chart libraries need explicit resize calls:

```typescript
useEffect(() => {
  const observer = new ResizeObserver(() => {
    chartInstance?.resize();
  });
  if (containerRef.current) {
    observer.observe(containerRef.current);
  }
  return () => observer.disconnect();
}, [chartInstance]);
```

### Flexbox/Grid Patterns
```css
/* Responsive KPI row — wraps naturally */
.kpi-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
.kpi-card {
  flex: 1 1 200px; /* Grows, shrinks, min 200px before wrapping */
  min-width: 0;     /* Prevents flex items from overflowing */
}

/* Responsive grid with auto-fit */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}
```

### Avoid Viewport Units
```css
/* BAD — viewport units don't work correctly inside DOMO iframes */
.container { width: 100vw; height: 100vh; }

/* GOOD — percentage of container */
.container { width: 100%; height: 100%; }
```

## Chart Responsiveness

### ECharts Resize
```typescript
// Auto-resize on container change
const chartRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const chart = echarts.init(chartRef.current);
  const ro = new ResizeObserver(() => chart.resize());
  ro.observe(chartRef.current);
  return () => { ro.disconnect(); chart.dispose(); };
}, []);
```

### Simplify at Small Sizes
```typescript
const getChartOptions = (width: number) => ({
  legend: { show: width > 500 },
  xAxis: {
    axisLabel: {
      rotate: width < 600 ? 45 : 0,
      fontSize: width < 400 ? 10 : 12,
    },
  },
  // Reduce data labels at small sizes
  series: [{
    label: { show: width > 700 },
  }],
});
```

### Mobile-Friendly Tooltips
- Use `tooltip.confine: true` in ECharts to prevent tooltips from
  overflowing the container
- Increase tooltip `padding` on touch devices
- Consider `tooltip.triggerOn: 'click'` for mobile (no hover)

## Testing Responsive Layouts

### During Development
1. **Browser dev tools:** Resize the DOMO card preview in dev server
2. **DOMO preview:** Use DOMO's built-in card size toggle (S, M, L, XL)
3. **Mobile preview:** Open dashboard URL in mobile browser simulator

### QC Phase
See qc-visual skill for Playwright viewport testing at:
- Desktop: 1920x1080
- Laptop: 1366x768
- Tablet: 768x1024
- Mobile: 375x812

### DOMO Mobile App Testing
The DOMO mobile app renders dashboards differently:
- Cards stack in a single column
- Card height is fixed (not scrollable within the card)
- Touch interactions replace hover
- Test by opening the dashboard in the DOMO mobile app on a real device

## Common Pitfalls

- **Fixed pixel widths:** Never use `width: 800px` — always use percentages
  or `min-width`/`max-width` constraints
- **Viewport units in iframes:** `100vw`/`100vh` refer to the outer page,
  not the card container. Use `100%` instead.
- **Charts not resizing:** ECharts/ApexCharts won't auto-resize. You must
  call `.resize()` on container dimension changes via ResizeObserver.
- **Overflow hidden clipping tooltips:** If the card has `overflow: hidden`,
  tooltips get clipped. Use `tooltip.confine: true` in ECharts.
- **Table horizontal scroll on mobile:** Use `overflow-x: auto` on table
  containers. Consider hiding less-important columns at narrow widths.
- **Text overflow:** Long labels/titles without `text-overflow: ellipsis`
  break layouts. Always add overflow handling to text containers.
- **Touch targets too small:** Buttons and interactive elements must be
  at least 44x44px on mobile. WCAG 2.5.5 guideline.
- **Hover-dependent interactions:** Don't rely on hover for critical
  functionality — mobile has no hover. Use click/tap alternatives.

## Known Issues

- DOMO's card container dimensions are not communicated to the app via
  any standard API. Use ResizeObserver on the root element.
- The DOMO mobile app's card height is fixed and may clip content.
  Design for a reasonable minimum height (400-500px).
- `prefers-reduced-motion` is respected by modern browsers within DOMO
  iframes — always support it per the design-system skill.
