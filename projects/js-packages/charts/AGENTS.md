# AGENTS.md

Package-specific guidance for AI agents working in `projects/js-packages/charts`.

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

## WordPress UI + Theme Integration

The package is migrating to WordPress UI and Theme as its defaults. When adding or changing code, follow these defaults unless the task explicitly says otherwise:

- **Design tokens (WPDS).** In SCSS, use `var(--wpds-dimension-*, <fallback>)`, `var(--wpds-border-*, <fallback>)`, and `var(--wpds-typography-*, <fallback>)` instead of hardcoded px values for spacing, padding, margins, border radius, border width, font size, and font weight. Fallbacks must match the WPDS spec value for that token — do not invent fallback values.
- **UI primitives.** Prefer `Stack` and the stable `Text` from `@wordpress/ui` over ad-hoc flexbox or raw `<span>`/`<div>` for layout and text. Do not use `__experimental*` exports from `@wordpress/components` (e.g. `__experimentalText`, `__experimentalHStack`) — use the stable `@wordpress/ui` equivalents. Exception: `__experimentalGrid` has no stable alternative yet and is acceptable to use for now.
- **Theming.** Theming flows through `@wordpress/theme`'s `ThemeProvider` (unlocked via private APIs in Storybook; see `src/stories/chart-decorator.tsx`). Do not manually override DS tokens in stories or components to achieve theming — pass a color through `ThemeProvider` instead.
- **Chart element styles.** Read chart element styles via `getElementStyles` from `GlobalChartsProvider`, not directly from `theme`. This is the supported path for color/style resolution across themes.

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
- Prefer charts-scoped PR titles (e.g. `Charts: ...`, `CHARTS-###: ...`).
- Include test steps and visual evidence (screenshots/GIFs) in PR descriptions for UI changes.

## Common Pitfalls

- Misstating the build tool: builds use `tsdown` (powered by Rolldown), not tsup or plain Rollup/webpack.
- Documenting props or behavior not present in stories and implementation.
- Refactoring core composition/provider patterns as if they are accidental complexity.
- Defining new chart prop interfaces that diverge from established base chart contracts (for example, not aligning with `BaseChartProps` when appropriate).
- Using ad-hoc flexbox layouts where established layout primitives (e.g. `Stack` from `@wordpress/ui`) should be preferred.
- Accessing colors/styles directly from `theme` rather than using `getElementStyles` from `GlobalChartsProvider`.
- Hardcoding px values in SCSS for spacing, borders, or typography where a WPDS token (`--wpds-dimension-*`, `--wpds-border-*`, `--wpds-typography-*`) exists.
- CSS variable fallback values that diverge from the WPDS spec for that token.
- Using `__experimental*` exports from `@wordpress/components` (e.g. `__experimentalText`, `__experimentalHStack`) instead of the stable `@wordpress/ui` equivalents. (`__experimentalGrid` is excepted — no stable alternative exists yet.)
- Manually overriding DS tokens in stories or components to achieve theming instead of passing a color through `@wordpress/theme`'s `ThemeProvider`.
- Responsive wrappers that conflict with component sizing semantics (fixed-height charts, resize behavior, aspect-ratio assumptions).
- Updating `.docs.mdx` without the corresponding `.api.mdx` when API docs are affected.
- Not checking CSF file references in `.docs.mdx` when changing or removing stories.
- Stories that don't visibly demonstrate documented behavior/props, or render clipped due to container sizing.
- Breaking MDX `<Source code={\`...\` } />` rendering by malformed/flattened indentation inside template literals.
- Tooltip styles/positioning that only work on default backgrounds or fail at chart edges.
- Using mock/placeholder series data in production code.
- Avoidable multi-pass data transformations in render paths when a single pass suffices.
- CSS layout/overflow workarounds without documenting why they're needed.

## Definition of Done

- Behavior verified in Storybook and/or tests, not only by static checks.
- Edits remain in package boundaries; avoid unrelated refactors.

## References

- Published Storybook: `https://automattic.github.io/jetpack-storybook/?path=/docs/js-packages-charts-library`
