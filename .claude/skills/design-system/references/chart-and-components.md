# Chart Styling & Component Patterns

Detailed visual specs for chart types, layout, components, spacing, and number formatting.

## Chart Styling

### Axis Formatting
- **X-axis labels:** 12px, `--foreground-tertiary`, horizontal preferred.
  Rotate 45° only if labels would overlap.
- **Y-axis labels:** 12px, `--foreground-tertiary`. Abbreviate numbers
  (`10k`, `1.2M`, `$56K`). Always include unit.
- **Grid lines:** Horizontal only. `--border-subtle` color at 40% opacity.
  No vertical grid lines. No axis lines (clean floating grid).
- **Zero line:** `--border` at 80% opacity if data crosses zero.

### Tooltips
- Background: `--card-elevated`
- Border: `--border`
- Border radius: `8px`
- Text: `--foreground` for values, `--foreground-secondary` for labels
- Shadow: `0 4px 12px rgba(0,0,0,0.3)` (dark), `0 4px 12px rgba(0,0,0,0.1)` (light)
- Always show the data value + series name + formatted date/category

### Legends
- Position: **top-right** of chart area or **inline** above the chart
- Style: Colored circle (8px) + label text, spaced 16px apart
- Interactive: Clicking a legend item toggles series visibility

### Specific Chart Types

**Bar Charts:**
- Border radius: `4px` top corners (or all corners for horizontal)
- Bar width: 60-70% of available category space
- Gap between grouped bars: `4px`
- Stacked bars: no gap between segments, `1px` white separator
- **Active/hover highlight:** Selected bar uses full chart color; unselected
  bars dim to `--muted` (30-40% opacity of chart color). Floating label
  shows value above the active bar in a rounded pill with chart color bg.

**Line Charts:**
- Line width: `2px` (primary series), `1.5px` (secondary)
- Point dots: `4px` diameter, shown on hover only (not always visible)
- Area fill: gradient from `30% opacity` at top to `0%` at bottom

**Donut Charts:**
- Inner radius: 65-70% of outer radius
- Segment gap: `2px`
- Center content: KPI value or year label in `--foreground`, 18-24px bold

**KPI Cards:**
- Layout: Label top, large value bottom-left, mini sparkline bottom-right
- Large value: 32px bold, `--foreground`
- Label above: 12px, `--foreground-tertiary`, with colored status dot (8px circle)
  matching the metric's chart color
- Trend badge: below value, colored text with arrow icon, 12px bold
  - Up: `+10.3% ↗` in `--success` green
  - Down: `-3.2% ↘` in `--error` red
  - Flat: `+0%` in `--muted-foreground`
- **Mini sparkline** (recommended): 48-60px tall, 80-100px wide, positioned
  to the right of the value. Single-color line matching the metric's status
  dot color. No axis, no labels, no dots — just the trend shape. Line width `1.5px`.
- Card border: `1px solid var(--border)`. Selected/active card uses
  accent or metric color border to indicate focus.

---

## Layout

### Dashboard Grid
- Max content width: `1440px` centered, or full-width with `30px` side padding
- Card gap: `20px` (both horizontal and vertical)
- Outer padding: `30px` (desktop), `16px` (mobile)
- Column system: 12-column grid, cards span 3/4/6/12 columns

### Card Design
- Background: `--card`
- Border: `1px solid var(--border)` — subtle, not heavy
- Border radius: `12px`
- Internal padding: `20px` (desktop), `16px` (mobile)
- No drop shadows in dark mode (depth comes from color layers).
  Light mode: `0 1px 3px rgba(0,0,0,0.06)` only on elevated cards.
- Card header: title (16px semi-bold) + optional action/filter on the right

### Sidebar Navigation (when applicable)
- Width: `260px` expanded, `72px` collapsed
- Background: `--card` (dark theme) or a darker shade
- Nav items: icon (20px) + label (14px), `48px` row height
- Active item: accent-colored left border or pill background
- Group dividers: `--border-subtle` with `24px` vertical spacing

### Page Structure Pattern
Standard dashboard layout from top to bottom:
1. **Header:** Page title + breadcrumbs + user/actions (right-aligned)
2. **KPI row:** 3-4 KPI cards in a single row
3. **Chart section:** 1-2 charts side by side (50/50 or 60/40 split)
4. **Data table:** Full-width, with search + export actions
5. **Pagination:** Bottom of table, centered

---

## Component Patterns

### Time Period Filters
- Pill/tab group: `30 days | 7 days | 24 hours` or `12 month | 30 days | 7 days | 24 hours`
- Active tab: `--primary` background, white text
- Inactive tab: `--secondary` background, `--foreground-secondary` text
- Position: top-right of the chart card, inline with the card title

### Data Tables
- Header row: `--foreground-secondary` text, `12px` uppercase tracked,
  `--border-subtle` bottom border, no background fill
- Body rows: `14px`, `--foreground` text, `48px` min row height
- Row dividers: `--border-subtle`, no zebra striping
- Hover state: `--muted` background
- Sortable columns: header text + `↕` icon, active sort shows `↑` or `↓`
- Row actions: text link in `--info` color (e.g., "Details")
- Star ratings: `#FBBF24` (amber) filled, `--muted-foreground` unfilled

### Buttons
- Follow shadcn/ui button variants: `default`, `secondary`, `outline`, `ghost`, `destructive`
- Default (primary): `--primary` background (`#F36E22`), white text
- Border radius: `8px`
- Height: `36px` (default), `32px` (sm), `40px` (lg)

### Inputs & Selects
- Background: `--input`
- Border: `1px solid var(--border)`, `--ring` on focus
- Border radius: `8px`
- Height: `36px`
- Placeholder: `--muted-foreground`

### Search Bar
- Full-width within its container
- Leading search icon in `--muted-foreground`
- Placeholder: "Search..." in `--muted-foreground`
- No border by default (background only), border on focus

---

## Spacing System

Use a **4px base unit**. Common values:

| Token  | Value | Usage                              |
|--------|-------|------------------------------------|
| `xs`   | 4px   | Icon-to-text gap, tight padding    |
| `sm`   | 8px   | Inline element spacing             |
| `md`   | 12px  | Related element groups             |
| `base` | 16px  | Default component padding          |
| `lg`   | 20px  | Card gaps, section spacing         |
| `xl`   | 24px  | Section dividers                   |
| `2xl`  | 32px  | Page section breaks                |
| `3xl`  | 48px  | Major layout sections              |

---

## Number Formatting

| Type       | Format                  | Example          |
|------------|------------------------|------------------|
| Currency   | `$X,XXX.XX`            | `$56,423.32`     |
| Large num  | Abbreviate at 10K+     | `1.26M`, `46K`   |
| Percentage | One decimal, with sign | `+12.7%`, `-3.2%`|
| Counts     | Comma separated        | `1,256,014`      |
| Dates      | `MMM DD, YYYY`         | `Mar 28, 2026`   |
| Short date | `MM/DD/YYYY`           | `03/28/2026`     |
| Axis dates | `Jan`, `Feb`, etc.     | Abbreviated month|

Use `Intl.NumberFormat` for all formatting. Use `date-fns` `format()` for dates.
