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

- **Design tokens (WPDS).** In SCSS, use bare `var(--wpds-dimension-*)`, `var(--wpds-border-*)`, and `var(--wpds-typography-*)` instead of hardcoded px values for spacing, padding, margins, border radius, border width, font size, and font weight. Do not write a fallback — `tsdown.config.ts` loads `@wordpress/theme`'s LightningCSS plugin, which injects the spec value at build time, and an unknown token fails the build. Stylelint (`plugin-wpds/no-token-fallback-values`, `plugin-wpds/no-unknown-ds-tokens`, `plugin-wpds/no-setting-wpds-custom-properties`) enforces that on source stylesheets. Note that the spec value is sometimes itself a `var()` chain: `--wpds-color-stroke-focus` is `var(--wp-admin-theme-color, #3858e9)`, not a hex.
- **Fallbacks are injected at build time.** `@wordpress/theme` ships the LightningCSS plugin that `tsdown` runs over `dist/`. Webpack consumers of the `jetpack:src` export compile the SCSS themselves and must load the matching PostCSS plugin (`@wordpress/theme/postcss-plugins/postcss-ds-token-fallbacks`) — My Jetpack already does. A bare reference with neither plugin nor the design-system stylesheet resolves to nothing at all, and WordPress ships none. CHARTS-254 has the detail.
- **UI primitives.** Prefer `Stack` and the stable `Text` from `@wordpress/ui` over ad-hoc flexbox or raw `<span>`/`<div>` for layout and text. Do not use `__experimental*` exports from `@wordpress/components` (e.g. `__experimentalText`, `__experimentalHStack`) — use the stable `@wordpress/ui` equivalents. Exception: `__experimentalGrid` has no stable alternative yet and is acceptable to use for now.
- **Theming.** Theming flows through `@wordpress/theme`'s `ThemeProvider` (unlocked via private APIs in Storybook; see `src/stories/chart-decorator.tsx`). Do not manually override DS tokens in stories or components to achieve theming — pass a color through `ThemeProvider` instead.
- **Chart element styles.** Read chart element styles via `getElementStyles` from `GlobalChartsProvider`, not directly from `theme`. This is the supported path for color/style resolution across themes.
- **Package CSS variables.** Package-owned custom properties follow `--a8c-charts-{category}-{name}`. `TOKENS.md` is the catalog; keep its tables in step with `src/styles/chart-scope.scss` (a test enforces this).
- **One mapping point.** The catalog is emitted once on the `GlobalChartsProvider` wrapper by `chart-scope.scss`, and for anything that is a catalog role that stylesheet is the only place its `--wpds-*` mapping may be named. Values that are *not* chart roles — incidental typography and spacing, interaction motion — read their design-system token directly at the call site, as chrome that should track the host's theme rather than charts-level theming.
- **`var()` resolves in an SVG *paint* presentation attribute — `fill`, `stroke`, `stroke-width`.** Verified across the supported range rather than only at the top of it: Blink 117, WebKit 17 and Gecko 117 each resolve a chain with a fallback, without one, and with a `transparent` fallback, in an attribute and in an inline style. That clears `@wordpress/browserslist-config`, whose low end is `chrome 118` and `ios_saf 18.5-18.7` (both from its `> 1%` query, so they drift with usage). WPT's `css/css-variables/variable-presentation-attribute.html` puts it back further — passing in Safari 11, Chrome 74 and Firefox 67 — and no engine tracker carries a substitution bug for these attributes. Much of this package's older commentary says the opposite; do not reintroduce a JS resolver on that basis.
- **It is interoperable but not yet normatively specified.** SVG 2 §6.6 parses presentation attributes as CSS *values* rather than declarations, which on a strict reading leaves no room for substitution; the SVG WG resolved to allow it on 2025-11-20 (`w3c/svgwg#1031`) and the spec text is still to be written. So this rests on unanimous engine behavior, not on a citation.
- **Do NOT use `var()` in an SVG *geometry* attribute — `width`, `height`, `r`, `cx`, `cy`, `x`, `y`.** Blink dropped those silently until Chrome 145 (`crbug 40801413`), so it fails across most of the supported range while working in Safari and Firefox — the shape of bug that a local check on a current browser will never catch. Nothing here does it today. Put the geometry in an inline `style` or a stylesheet instead, where substitution has always worked. Safari additionally accepts a *unitless* substituted length where Blink and Gecko reject it, so always carry the unit inside the custom property.
- **A missed substitution is not a slightly-off color.** The attribute is invalid and ignored, so `stroke` falls back to its initial `none` — the x axis line and tick marks vanish — while `fill` on text falls back to black, which on a dark host means invisible axis labels.
- **Never resolve a paint-only color — hand visx the pointer.** The grid, axis line, tick marks and tick labels keep their `var(--a8c-charts-color-*, …)` chain all the way to the element, where it resolves natively. That is what gives an override on a chart's own class effect, keeps a theme change live with no re-render, and works under SSR. Resolving one in `useXYChartTheme` freezes it and silently undoes all three; `use-xychart-theme.test.tsx` pins the chain surviving the theme build.
- **Resolve only what is read as a *string*:** the palette (visx's `colorScale`, and `getChartColor` deriving further colors), `geoChart`'s Google Charts config, and colour math like `hexToRgba` or the heatmap's contrast decision. Those are parsed, not painted, so a `var()` chain is useless to them.
- **JS token resolution is element-scoped.** Pass the element from `useChartScopeElement()` to `resolveCssVariable`; never resolve against `document.documentElement`. Resolving at the chart's scope element is what picks up an override set inside the provider tree. That element is the wrapper the chart renders into, not the element its `className` lands on, so an override set on the chart's own class reaches only CSS-painted colors — CHARTS-255 tracks closing that gap.
- **Two consumption paths — this changes what a charts change can break.**
  `@wordpress/build` apps (premium-analytics, publicize, podcast, videopress)
  consume the Rolldown output in `dist/` and load it as a **WordPress Script
  Module** — native browser ESM, where `require` does not exist. Webpack apps
  (My Jetpack and friends) resolve source through the `jetpack:src` export
  condition instead. A change that only affects `dist/` can therefore break
  four packages this one does not import.
- **Referencing `process.env` in `src` breaks a consumer's typecheck.** Webpack
  consumers compile this package's source through `jetpack:src` under *their*
  tsconfig, and several (videopress among them) have no `@types/node`, so a bare
  `process.env.NODE_ENV` fails with `TS2591` in their build and not in ours.
  `pnpm run typecheck` here will not catch it. Declare a local
  `declare const process: { env: Record< string, string | undefined > };` in any
  file that needs it — `bar-chart/private/comparison-bars.tsx` and
  `providers/chart-context/private/theme-override-vars.ts` both do.
- **Never `deps.alwaysBundle` a package that transitively requires an external.**
  Pre-bundling is safe only for dependencies that require nothing themselves —
  `fast-deep-equal` qualifies, which is why `tsdown.config.ts` still lists it.
  Pre-bundle anything that reaches a CommonJS module requiring an external
  (`react`, above all) and Rolldown emits a dynamic-`require` shim, because it
  cannot rewrite a runtime `require` into a static ESM import. That shim throws
  during module evaluation in Script Module consumers, taking down every widget
  on the page rather than just the feature that pulled it in.
  `tools/assert-no-dynamic-require.ts` fails the build when such a shim reaches
  the ESM output; never suppress it.
- **`@wordpress/ui` is external in `dist`, and no build check can prove that is
  safe.** Correctness depends on `@wordpress/build` *bundling* `@wordpress/ui`
  rather than externalising it to `window.wp.ui`. It used to externalise it,
  which is what CHARTS-163 worked around by pre-bundling; it now bundles any
  `@wordpress/*` package that declares neither `wpScriptModuleExports` nor
  `wpScript`, and `@wordpress/ui` declares `wpScript: false`. If a future
  version reverts, `dist/index.js` keeps its clean `import … from
  "@wordpress/ui"`, the guard passes, the build passes, and every Script Module
  consumer breaks at runtime on `wp.ui` being undefined — the same blast radius
  as CHARTS-237, with no build-time signal. Verified against `@wordpress/build`
  0.18.0 (publicize, podcast, videopress) and 0.19.1-next (premium-analytics).
  Check a major bump by loading a charts screen in wp-admin, not by trusting a
  green build.

## Documentation Workflow

- For docs tasks agents should use the skill at `.agents/skills/charts-docs.md`.
- For public chart/component docs, maintain the standard set when applicable: `[feature-name].stories.tsx` + `.docs.mdx` + `.api.mdx`. Some docs are intentionally guide-only and skip the full triplet.
- Only include animation docs when the component actually supports an `animation` prop.

## Conventions

- **US English spelling everywhere** — comments, docs, story descriptions, test names, warning strings. `color`, not `colour`; `behavior`, `normalize`, `serialize`, `center`, `initialize`. The API is already US (`color`, `backgroundColor`, `labelTextColor`, `--a8c-charts-color-*`), so British spelling in a comment sits next to the US identifier it describes and reads as a typo. Older files still hold some; fix them where you are already editing, not as a sweep.
- Preserve backward compatibility for existing public APIs unless a breaking change is explicitly requested.
- Prefer extending existing chart components/patterns over introducing new surface area.
- Reuse existing hooks/providers/utilities before adding new abstractions.
- Avoid `!important` unless there is no viable alternative and the rationale is documented.
- Add focused behavioral tests for changed behavior; avoid speculative tests for unimplemented behavior.
- **Never silence `testing-library/no-node-access` (or `no-container`) in a new test.** Reach the element by role, label or `data-testid` instead — add a `data-testid` to the component if nothing else identifies it, as `GlobalChartsProvider`'s scope wrapper does with `charts-scope`. Node access (`container.firstChild`, `.parentElement`, `querySelector`) ties the assertion to a tree shape the test does not care about, so an unrelated wrapper breaks it. A disable is acceptable only for a node rendered by a third party — visx above all — which cannot be given an attribute; say so in the comment. Existing disables in the older test files predate this rule; do not copy them.
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
- Hand-writing a CSS variable fallback on a `--wpds-*` token. The LightningCSS plugin injects the spec value; a hand-written one that drifts from the spec is worse than a bare reference.
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
