---
name: project_design_direction
description: Rawso design system direction — dark/light themes, #F36E22 accent, modern dashboards
type: project
---

Rawso brand color is #F36E22 but it should be used as an accent/accessory color only, NOT as the primary UI color.

- **Primary theme:** Dark themed dashboards (modern, not DOMO default)
- **Secondary theme:** Light themed dashboards
- **Theming system:** shadcn/ui CSS variables drive both themes
- **Chart library:** ECharts with custom theme that matches shadcn theme
- **User will provide:** Example dashboards and themes they like when design-system skill is being filled

**Why:** The user wants modern, polished dashboards — not the typical orange-heavy brand look. #F36E22 works for CTAs, highlights, and brand moments but shouldn't dominate.

**How to apply:** When building the design-system skill, structure around shadcn/ui's dark/light theme system. Define CSS variables for both modes. Use #F36E22 sparingly as an accent.
