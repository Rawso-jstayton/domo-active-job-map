# Engineering Standards

Accessibility, motion, state management, dark mode, performance, and anti-patterns.

## Accessibility (WCAG 2.1 Baseline)

Accessibility is non-negotiable. shadcn/ui's Radix primitives handle much
of this, but custom components must follow these rules:

### Semantic HTML First
- Use `<button>` for actions, `<a>` for navigation — never `<div onClick>`
- Use `<table>`, `<thead>`, `<th>` for data tables — not div grids
- Use `<label>` tied to every `<input>` — or `aria-label` if visually hidden
- Icon-only buttons require `aria-label` (e.g., `aria-label="Export CSV"`)
- Logical heading hierarchy: `<h1>` → `<h2>` → `<h3>`, never skip levels
- Decorative icons get `aria-hidden="true"`

### Keyboard Navigation
- All interactive elements must be keyboard-accessible
- Visible focus ring: `focus-visible:ring-2 ring-[var(--ring)]` — never
  apply `outline-none` without a visible replacement
- Prefer `:focus-visible` over `:focus` (avoids showing rings on mouse click)
- Use `:focus-within` for compound controls (filter groups, search bars)
- Data tables: arrow key navigation between cells when focused
- Escape key closes modals, dropdowns, and popovers

### Screen Readers & Live Updates
- Async updates (toast notifications, validation errors, data refreshes)
  use `aria-live="polite"`
- Chart summaries: provide a text description of chart data via `aria-label`
  or a visually hidden summary paragraph
- Loading states: `aria-busy="true"` on the container, announce completion

### Color Contrast
- Minimum **4.5:1** for body text, **3:1** for large text (18px+)
- Never convey meaning through color alone — pair with icons, patterns, or text
  (e.g., trend arrows + color, not just red/green)
- Test both themes against WCAG contrast requirements

---

## Motion & Animation

### Respect User Preferences
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Performance Rules
- Animate only `transform` and `opacity` (GPU-composited properties)
- Never use `transition: all` — list specific properties explicitly
- Make animations interruptible (don't block interaction during transitions)
- Keep transitions short: `150ms` for micro-interactions, `300ms` for
  panel/page transitions

### Dashboard-Specific Motion
- **Page load:** Stagger card entrance with 50ms delays, fade + slight translateY
- **Chart rendering:** Bars grow from zero, lines draw left-to-right, donuts
  fill clockwise — use ECharts' built-in animation config
- **Hover states:** `150ms` transition on card borders, button backgrounds
- **Data refresh:** Subtle pulse or fade when data updates, not jarring reloads
- **Skeleton loaders:** Use animated shimmer placeholders matching card
  dimensions while data loads

---

## State & URL Management

### URL Reflects Dashboard State
Filters, active tabs, pagination, time periods, and expanded panels must
be reflected in URL query parameters. This enables:
- Shareable dashboard views with specific filter states
- Browser back/forward navigation between filter changes
- Bookmarkable report configurations

```
/dashboard?period=30d&tab=performance&page=2&sort=revenue:desc
```

### Implementation
- Sync filter state to URL via `useSearchParams` or equivalent
- Debounce URL updates for rapidly-changing inputs (search, sliders)
- Deep-link all stateful UI — if a user refreshes, they should see
  the same view they left

### Destructive Actions
- Require confirmation dialog OR provide an undo window (toast with undo button)
- Never silently delete or overwrite data

---

## Dark Mode Implementation

Beyond color tokens, dark mode requires explicit engineering:

```css
html.dark {
  color-scheme: dark; /* Fixes scrollbars, native inputs, select elements */
}
```

- Set `<meta name="theme-color" content="#0F1117">` to match `--background`
- Native `<select>` needs explicit `background-color` and `color` for Windows
- Test in both themes during development — never "add dark mode later"
- Store theme preference in `localStorage`, respect `prefers-color-scheme`
  as default, allow manual override

---

## Performance & Data Tables

### Virtualization
- **Virtualize tables exceeding 50 rows** — use `@tanstack/react-virtual`
  or equivalent. Never render 500+ DOM rows.
- Virtualize long dropdown option lists (>30 items)

### Images & Layout Stability
- All `<img>` elements need explicit `width` and `height` attributes
- Lazy load below-fold content; prioritize above-fold KPI cards
- Use skeleton placeholders sized to match final content dimensions

### Touch & Mobile
- Apply `touch-action: manipulation` to prevent 300ms double-tap delay
- Use `overscroll-behavior: contain` on modal/drawer overlays
- Respect `env(safe-area-inset-*)` for device notches

---

## Implementation Anti-Patterns

Flag these during code review — they indicate quality issues:

| Anti-Pattern | Fix |
|---|---|
| `<div onClick>` | Use `<button>` or `<a>` |
| `outline-none` without focus replacement | Add `focus-visible:ring-*` |
| `transition: all` | List specific properties |
| `user-scalable=no` / `maximum-scale=1` | Remove — don't disable zoom |
| `onPaste` + `preventDefault` | Never block paste on inputs |
| Images without `width`/`height` | Add explicit dimensions |
| Hardcoded date/number formats | Use `Intl.*` or `date-fns` |
| Large arrays rendered without virtualization | Virtualize at 50+ items |
| Inputs without `<label>` | Add label or `aria-label` |
| Icon buttons without `aria-label` | Add descriptive label |
| `#000000` or `#FFFFFF` hardcoded | Use CSS variable tokens |
| Color-only meaning (red/green with no icon) | Add icon or text alongside |
