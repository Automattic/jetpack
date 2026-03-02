# AGENTS.md

## CRITICAL Rules

- Do not invent behavior in docs. If unsure, verify implementation and stories first.
- Do not assume wildcard exports like `./*` or `./providers/*` — they don't exist. Check the explicit exports in `package.json`.

## Changelog

Run from monorepo root:

```bash
jp changelog add js-packages/charts -s patch -t changed -e "Charts: <user-facing change>."
```

## Architecture Decisions (Do Not "Fix" These)

- Accessibility behavior (keyboard navigation, accessible tooltips) is core chart behavior, not optional polish.
- Charts are responsive by default — do not add external responsive wrappers that conflict with built-in sizing semantics.

## Documentation Workflow

- For docs tasks agents should use the skill at `.agents/skills/charts-docs.md`.
- For public chart/component docs, maintain the standard set when applicable: `[feature-name].stories.tsx` + `.docs.mdx` + `.api.mdx`. Some docs are intentionally guide-only and skip the full triplet.
- Only include animation docs when the component actually supports an `animation` prop.

## Conventions

- Preserve backward compatibility for existing public APIs unless a breaking change is explicitly requested.
- Prefer extending existing chart components/patterns over introducing new surface area.
- Reuse existing hooks/providers/utilities before adding new abstractions.
- Avoid `!important` unless there is no viable alternative and the rationale is documented.
- Add focused behavioral tests for changed behavior; avoid speculative tests for unimplemented behavior.
- Verify behavior/UI changes in Storybook using browser automation, not only unit tests.
- Include test steps and visual evidence (screenshots/GIFs) in PR descriptions for UI changes.

## Common Pitfalls

- Claiming Rollup is used for builds (it's tsup).
- Documenting props or behavior not present in stories and implementation.
- Refactoring core composition/provider patterns as if they are accidental complexity.
- Defining new chart prop interfaces that diverge from established base chart contracts (for example, not aligning with `BaseChartProps` when appropriate).
- Using ad-hoc flexbox layouts where established layout primitives (e.g. `Stack`) should be preferred.
- Accessing colors/styles directly from `theme` rather than using `getElementStyles` from `GlobalChartsProvider`.
- Responsive wrappers that conflict with component sizing semantics (fixed-height charts, resize behavior, aspect-ratio assumptions).
- Stories that don't visibly demonstrate documented behavior/props, or render clipped due to container sizing.
- Breaking MDX `<Source code={\`...\` } />` rendering by malformed/flattened indentation inside template literals.
- Tooltip styles/positioning that only work on default backgrounds or fail at chart edges.
- Using mock/placeholder series data in production code.
- Avoidable multi-pass data transformations in render paths when a single pass suffices.
- CSS layout/overflow workarounds without documenting why they're needed.

## Definition of Done

- Behavior verified in Storybook and/or tests, not only by static checks.
- Edits remain in package boundaries; avoid unrelated refactors.

Published Storybook: `https://automattic.github.io/jetpack-storybook/?path=/docs/js-packages-charts-library`
