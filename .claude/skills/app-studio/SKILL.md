---
name: app-studio
description: >
  DOMO App Studio cards, DDX framework, layout configuration, interactions,
  filters, drill paths, and no-code/low-code app building. Use when creating
  App Studio cards, configuring DDX layouts, setting up card interactions,
  building drill paths, or when the user wants a custom card without full
  pro code development. Also use for "App Studio", "DDX", or "card builder".
---

# DOMO App Studio

Reference for building apps and cards in DOMO's App Studio.
Note: Rawso primarily builds pro code apps. This skill is kept as reference
for situations where low-code is more appropriate.

## What App Studio Is

App Studio is DOMO's low-code/no-code app builder for creating custom
interactive experiences without writing code. It sits between standard
DOMO cards (zero code) and pro code apps (full code).

### When to Use App Studio
- Quick internal tool that doesn't justify full app development
- Non-developer needs to build a custom view
- Prototype to validate layout/interaction before building in code
- Simple multi-view navigation (tab-like experience)

### When to Use Pro Code Instead
- Complex interactivity (custom charts, animations, complex state)
- Need full CSS control (App Studio has limited styling)
- Performance-critical apps (App Studio has overhead)
- Team needs version control and CI/CD (App Studio is in-browser only)
- Any Rawso client-facing deliverable (always pro code per our standards)

## DDX Framework

DDX (DOMO Data Experience) is the underlying framework for App Studio.

### What DDX Provides
- Drag-and-drop layout builder
- Pre-built component library (charts, tables, filters, text, images)
- Data binding to DOMO datasets
- Inter-component communication (filter propagation)
- Built-in responsiveness (limited)

### DDX Layout System
- Grid-based layout with configurable rows and columns
- Components placed in grid cells
- Cells can span multiple rows/columns
- Layout saved as JSON configuration (not CSS)

## Component Types

### Chart Components
- Bar, line, area, pie, donut, scatter, gauge, map
- Configured via properties panel (not code)
- Data bound to dataset fields via dropdown selection
- Limited chart customization compared to pro code ECharts

### Table Components
- Sortable, filterable data tables
- Column visibility and ordering
- Conditional formatting (color rules)
- Pagination for large datasets

### Filter Components
- Date range picker
- Dropdown selector (single/multi)
- Text search
- Slider (numeric range)
- Filters propagate to connected chart/table components

### Navigation Components
- Tab navigation between views
- Button links to other pages/apps
- Breadcrumb navigation

### Content Components
- Text blocks (static or dynamic)
- Images
- Embedded content (iframes)
- Spacers and dividers

## Data Binding

### Connecting Data
1. Add a dataset to the app (Data panel)
2. Drag a component onto the layout
3. In the component's properties, select the dataset
4. Map dataset columns to component fields (X axis, Y axis, category, etc.)

### Calculated Fields
- App Studio supports basic calculated fields (similar to Beast Mode)
- More limited than Beast Mode — complex calculations should be done in ETL

### Filter Interactions
- Filter components can target specific chart/table components
- Configure which components listen to which filters
- Filters work on dataset columns (not calculated fields)

## Interactions and Filters

### Click Actions
- Click on a chart element to filter other components
- Configure click action in component properties
- Can navigate to a different view on click

### Filter Propagation
- Global filters: affect all components in the app
- Targeted filters: affect only selected components
- Filter chains: Component A filters Component B, which filters Component C

### Cross-View Communication
- Filters persist across view/tab navigation
- Selected values carry forward when drilling between views

## Drill Paths

### Configuration
1. Select a component that supports drilling
2. In properties, enable drill path
3. Define hierarchy: Level 1 field > Level 2 field > Level 3 field
4. Each drill click filters to the selected value and shows the next level

### Example
Region chart > click "West" > State chart (filtered to West) >
click "California" > City chart (filtered to California)

## Limitations

### Compared to Pro Code
| Capability | App Studio | Pro Code |
|-----------|-----------|----------|
| Custom CSS | Very limited | Full control |
| JavaScript logic | None | Full React/TS |
| Chart customization | Properties panel only | Full ECharts API |
| Version control | None (in-browser only) | Git + CI/CD |
| Performance | Overhead from DDX framework | Optimized |
| Complex state | Filter propagation only | React state + URL |
| Animations | None | Full CSS/JS animations |
| Responsive control | Limited auto-behavior | Full container queries |
| Accessibility | Basic (DOMO default) | Full WCAG control |

### Other Limitations
- No code export — can't convert App Studio app to pro code
- Limited undo/redo in the builder
- No collaboration features (one editor at a time)
- Component library is fixed — can't add custom components
- Styling limited to theme colors and basic formatting
- No API access within the app (can't call external services)

## When to Upgrade to Pro Code

**Upgrade when:**
- Stakeholder requests styling/interaction that App Studio can't deliver
- Performance becomes an issue with many components
- Team needs version control and code review
- App needs external API integration
- Custom chart types or advanced interactivity required
- App will be client-facing (Rawso standard: always pro code)

**Migration path:**
- App Studio apps cannot be exported as code
- Rebuilding is required — plan for full recreation
- Preserve: data binding logic, filter configuration, layout mockups
- Take screenshots of the App Studio app as reference for the pro code rebuild
- Dataset connections remain the same (just change how you connect)

## Placing a Pro Code App Card in DOMO (Required Settings)

When a pro code app card is added to a DOMO page (or App Studio app),
specific page and card settings must be configured to prevent scrolling
and display issues. Without these, the card may have double scrollbars,
show unwanted chrome, or clip content.

### Page Settings (configure on the DOMO page itself)

Navigate to the page → Edit page → Page settings:

| Setting | Value |
|---------|-------|
| Page Width | Auto-width |
| Page Height | No Scroll |
| Page Margin Spacing | Nil |
| Page Density | Nil |

**Why:** "No Scroll" prevents DOMO from adding a scrollbar to the page when
the app fills the frame. Auto-width lets the app respond to the actual
browser width rather than a fixed page width.

### Card Settings (configure per card on the page)

Click the card's settings/options → On Page Display:

- **Title** — unchecked
- **Description** — unchecked
- **Presentation mode** — unchecked

**Why:** These add DOMO UI chrome (header bar, title text) that eats into
the card's visible area and can cause misaligned heights and double scrollbars
when the pro code app itself manages its own header/layout.

### When to Apply

Apply these settings any time a pro code custom app is placed on a DOMO page —
not just in App Studio. The settings are page-level and card-level, so they
must be configured for each page and each card instance.

## Known Issues

- App Studio apps can become sluggish with 10+ components on one view
- Filter propagation can have unexpected behavior with complex chains
- Date range filters sometimes don't respect timezone settings
- The builder UI itself can be slow on large apps
- No way to bulk-edit component properties
