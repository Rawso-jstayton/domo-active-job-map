---
name: project_stack_decisions
description: Confirmed tech stack — Vite, React, ECharts, shadcn/ui, Tailwind CSS
type: project
---

Confirmed stack decisions (2026-03-27):
- **Build tool:** Vite (user confirmed)
- **Framework:** React (functional components, hooks only)
- **Charting:** Apache ECharts + echarts-for-react
- **UI components:** shadcn/ui (copied into project, customizable)
- **CSS:** Tailwind CSS (required by shadcn)
- **Icons:** lucide-react
- **TypeScript:** TBD — user wants recommendation based on DOMO research
- **Utilities (date, HTTP, state):** TBD — user wants recommendation

**Why:** User confirmed Vite. Other choices were pre-established in libraries skill template. TS and utilities deferred until DOMO docs are reviewed.

**How to apply:** Use this stack for all new DOMO pro code apps. Don't suggest alternatives from the "not to use" list in libraries skill.
