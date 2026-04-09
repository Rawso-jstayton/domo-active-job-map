---
name: qc-code
description: >
  Code quality audit and cleanup — runs ONCE before final release deployment,
  not during iterative development. Removes dead code, unused imports, console
  statements, cleans dependencies, and optimizes bundle. Use only when the
  dashboard/app is functionally complete and all other QC has passed. Trigger
  when the user says "clean up the code", "code review", "prep for release",
  "final cleanup", or at the end of Phase 5.
  DO NOT run this during iterative dev deploys — only before release.
user-invocable: true
---

# QC Code — Pre-Release Code Cleanup

One-time code quality audit before final release. Run this AFTER all visual,
data, and analytical QC is complete and the app is functionally done.

**Do NOT run during iterative development.** Dev deploys are expected to have
console.logs, TODOs, and work-in-progress code. This skill is for the final
cleanup before handing off to stakeholders.

## Prerequisites
- Phase 4 (QC) fully passed
- Phase 5 (Polish) complete
- No more functional changes expected

## Steps

### 1. Dead Code Scan

For each app in `apps/`:

**Unused imports:**
- Scan every file for import statements
- Check if each imported symbol is actually used in the file
- Flag unused imports for removal
- Common in React: importing components during iteration that get replaced

**Unused components:**
- Check if every component file in the project is imported somewhere
- Check if every exported function/component is referenced
- Flag orphaned files

**Unused variables and functions:**
- Scan for declared variables never read
- Scan for functions defined but never called
- Be careful with: event handlers passed as props (may look unused in the
  file but are used in JSX), and exports consumed by other files

**Unreachable code:**
- Code after return statements
- Conditions that are always true/false
- Dead branches in if/else chains

### 2. Cleanup

**Console statements:**
- Remove all `console.log`, `console.debug`, `console.info`
- Keep `console.error` and `console.warn` (these are intentional error handling)
- If a console.log seems intentional (monitoring, analytics), convert to
  a proper logging pattern or add a comment explaining why it stays

**Commented-out code:**
- Remove commented-out code blocks
- If code was commented out "just in case," it's in git history — delete it
- Exception: comments that explain WHY something was done a certain way
  (these are documentation, not dead code)

**TODOs and FIXMEs:**
- Catalog all TODO/FIXME/HACK/XXX comments
- For each: is it resolved? Remove the comment.
- Still open? Either fix it now or move it to decision-log.md as a known
  issue for future iteration. Remove the in-code comment either way.

**Hardcoded values:**
- Check for hardcoded dataset IDs (should come from manifest.json alias)
- Check for hardcoded colors (should use Tailwind/design-system tokens)
- Check for hardcoded URLs or instance-specific values
- Check for placeholder text ("APP_NAME", "TODO", "REPLACE")

### 3. Dependency Audit

**package.json cleanup:**
- For each dependency: is it imported anywhere in the codebase?
- Flag unused packages for removal
- Check devDependencies vs dependencies classification
- Run `npm ls --depth=0` to check for issues

**shadcn components:**
- Were any components added (`npx shadcn add ...`) but never used?
- Check `components/ui/` against actual imports

**ECharts modules:**
We use full ECharts imports (`import * as echarts from 'echarts'`) via
`echarts-for-react`. For bundle size optimization in large apps, switch to
modular imports from `echarts/core` and register only the chart types and
components actually used. Check if the app imports from `echarts/core` or
`echarts` — if the former, verify no unused chart types are registered.

### 4. Code Quality Review

**Duplication:**
- Are there utility functions duplicated across apps?
  → Extract to a shared utils file
- Are ECharts option configs repeated?
  → Extract to a shared chart config using design-system tokens
- Are data fetching patterns repeated?
  → Should be using the shared useDomoData hook

**Component size:**
- Flag any component over ~200 lines
- Consider splitting into smaller, focused components
- Extract complex logic into custom hooks

**Tailwind usage:**
- Check for inline `style={}` that should be Tailwind classes
- Check for CSS-in-JS patterns that should be Tailwind
- Verify responsive classes are applied per responsive skill conventions

**Error handling:**
- Does every data fetch have error handling?
- Are there React error boundaries around major sections?
- Do loading states exist for async operations?

### 5. Bundle Analysis (Optional)

If bundle size matters for performance:
```bash
# With Vite
npx vite-bundle-visualizer

# Or generic
npx source-map-explorer dist/**/*.js
```

Flag:
- Dependencies contributing disproportionate bundle size
- ECharts if full library is imported vs modular
- Large utility libraries where only one function is used

### 6. Apply Fixes

For each finding:
- **Auto-fixable** (unused imports, console.logs): fix immediately
- **Judgment needed** (component splitting, dedup): present to user,
  fix with approval
- **Risk of breakage** (removing "unused" code that might be used
  dynamically): flag for manual review, don't auto-remove

After all fixes:
- Run the app locally (`domo dev`) to verify nothing broke
- Dev deploy and run Playwright visual QC one more time to confirm

### 7. Report

Save to `qc-reports/code-qc-[date].md`:

```markdown
# Code QC Report — [date]

## Summary
- Files scanned: [count]
- Issues found: [count]
- Issues fixed: [count]
- Issues deferred: [count]

## Removed
- [N] unused imports
- [N] unused components/files
- [N] console.log statements
- [N] commented-out code blocks
- [N] unused npm dependencies

## Refactored
- [Description of any structural improvements]

## Deferred
- [Issues noted but not fixed, with reasoning]

## Bundle Impact
- Before: [size]
- After: [size]
- Reduction: [percentage]

## Final Verification
- Local dev server: [pass/fail]
- Dev deploy: [pass/fail]
- Playwright visual QC: [pass/fail]
```

### 8. Commit
```
chore(cleanup): pre-release code QC — remove dead code, clean dependencies
```

Update project-state.md: Code QC complete.
App is ready for release deployment (Phase 6).
