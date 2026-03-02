# AGENTS.md

This file is the package-specific source of truth for AI coding agents working in `projects/js-packages/charts`.

## Project Scope

`@automattic/charts` is a React + TypeScript charting library used across Automattic products.

Key implementation details agents usually miss:

- Build system is `tsup`.
- Package exports are explicit subpath exports in `package.json`.
- Styling is primarily Sass-based CSS Modules (`*.module.scss`) compiled via tsup plugins.
- The docs workflow uses paired Storybook docs files (`.docs.mdx` + `.api.mdx`).

## CRITICAL Rules

- CRITICAL: Keep this file focused on package-specific facts and workflows that are hard to infer from code search.
- CRITICAL: Do not invent behavior in docs. If unsure, verify implementation and stories first.
- CRITICAL: Do not assume wildcard exports. Follow the explicit exports in `projects/js-packages/charts/package.json`.

## Commands

Run these from `projects/js-packages/charts` unless noted otherwise.

```bash
# Build + type safety
pnpm run build
pnpm run typecheck

# Tests
pnpm run test
pnpm run test-coverage

# Storybook (delegates to ../storybook)
pnpm run storybook
```

Changelog command (run from monorepo root):

```bash
jp changelog add js-packages/charts -s patch -t changed -e "Charts: <user-facing change>."
```

## Architecture Decisions (Do Not "Fix" These)

- Charts are built around composition patterns (for example, chart components with attached subcomponents).
- Theme values and chart element styles flow through `GlobalChartsProvider` and related provider hooks.
- Accessibility behavior (keyboard navigation, accessible tooltips) is part of chart behavior, not optional polish.
- CSS Modules are intentionally used for scoped styles and stable local class handling.
- Charts are responsive by default.

## Documentation Workflow

Before changing chart docs or stories, read:

- `projects/js-packages/charts/docs/ai-documentation-guide.md`
- `projects/js-packages/charts/docs/feature-documentation.mdx.template`
- `projects/js-packages/charts/docs/feature-api-documentation.mdx.template`

Docs standards:

- For public chart/component docs, maintain the standard docs set when applicable:
  - `[feature-name].stories.tsx`
  - `[feature-name].docs.mdx` (usage, examples, behavior, accessibility)
  - `[feature-name].api.mdx` (API reference only; no usage examples)
- Some docs are intentionally guide-only or scope-specific (for example introduction, provider docs, or focused feature guides) and may not use the full triplet.
- MUST keep props/types in docs aligned with implementation.
- MUST include animation docs only when the component actually supports an `animation` prop.

For docs-heavy tasks with many repeated steps, agents may use the optional skill:

- `.agents/skills/charts-docs.md`

## Conventions

### Code and APIs

- Preserve backward compatibility for existing public APIs unless a breaking change is explicitly requested.
- Prefer extending existing chart components/patterns over introducing new surface area.
- Reuse existing hooks/providers/utilities before adding new abstractions.

### Styling

- Follow existing CSS Module + Sass patterns.
- Use existing chart theme integration patterns instead of ad-hoc color/style logic.
- Avoid `!important` unless there is no viable alternative and the rationale is documented.

### Testing

- Use Jest + Testing Library patterns already present in this package.
- Add focused behavioral tests for changed behavior (interaction, rendering state, accessibility behavior).
- For behavior or UI changes, verify in Storybook using browser automation (browser MCP) against relevant stories/states, not only unit tests.
- Avoid speculative tests for behavior not implemented in code.

### PR and Changelog

- Prefer charts-scoped PR titles consistent with current repo patterns (e.g. `Charts: ...`, `CHARTS-###: ...`).
- Include a changelog entry for user-facing changes under `projects/js-packages/charts/changelog/`.
- Include test steps and outcomes in PR descriptions.
- Include visual evidence (screenshots/GIFs) for visible UI changes.

## Common Pitfalls

- Claiming Rollup is used for charts builds.
- Referring to wildcard exports like `./*` or `./providers/*` (which don't exist). Use explicit exports like `./providers` instead.
- Updating `.docs.mdx` without the corresponding `.api.mdx` when API docs are affected.
- Not checking CSF file references in `.docs.mdx` when changing or removing stories.
- Documenting props or behavior not present in stories and implementation.
- Refactoring core composition/provider patterns as if they are accidental complexity.
- Using ad-hoc flexbox layouts where established shared layout primitives/patterns (for example, `Stack`) should be preferred.
- Accessing colors and styles directly from the `theme` rather than using `getElementStyles` from the `GlobalChartsProvider`.
- Defining new chart prop interfaces that diverge from established base chart contracts (for example, not aligning with `BaseChartProps` when appropriate).
- Implementing responsive wrappers that conflict with component sizing semantics (fixed-height charts, resize behavior, or aspect-ratio assumptions).
- Adding stories that do not visibly demonstrate the documented behavior/props, or stories that render clipped due to container sizing.
- Tooltip styles/positioning that only work on default backgrounds or fail at chart edges (for example, shadows fading to opaque white instead of transparent).
- Using mock/placeholder series data in production code.
- Introducing avoidable multi-pass data transformations in render paths when a single pass is sufficient.
- Adding CSS layout/overflow workarounds without documenting why the workaround is needed.

## Definition of Done

Before handing off, verify:

- Guidelines: changes follow this file, root monorepo guidance, and charts docs standards.
- Build/tests: `pnpm run typecheck` and relevant tests pass for modified behavior.
- Behavior verification: changed chart behavior is validated in Storybook and/or tests, not only by static checks.
- Safe scope: edits remain in package boundaries and avoid unrelated refactors.

## References

- Root repo guidance: `AGENTS.md`
- Package docs guide: `projects/js-packages/charts/docs/ai-documentation-guide.md`
- Package readme: `projects/js-packages/charts/README.md`
- Published Storybook docs: `https://automattic.github.io/jetpack-storybook/?path=/docs/js-packages-charts-library`
