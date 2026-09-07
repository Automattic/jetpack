# Charts CSS custom-property catalog

`@automattic/charts` exposes its themeable values as CSS custom properties under a single convention: `--a8c-charts-{category}-{name}`. `{category}` mirrors the WPDS token type (`color`, `dimension`, `border-radius`).

## How it resolves

`src/styles/chart-scope.scss` declares the whole catalog once, on the `GlobalChartsProvider` wrapper, via `:where(.a8c-charts-scope)`. `:where()` keeps the rule at zero specificity, so a consumer rule targeting that same element wins without `!important`. It is declared on the wrapper rather than `:root` because `@wordpress/theme`'s `ThemeProvider` emits its generated `--wpds-*` ramp as inline styles on its own wrapper div — a `:root` declaration would miss a `ThemeProvider` entirely.

Chart roots deliberately do *not* carry the `a8c-charts-scope` class. Custom properties inherit down the tree, and an element only shadows an inherited value by re-declaring it, so a chart root that re-declared the catalog would beat an override set between it and the provider — closing off the one place consumers are meant to set overrides. This inheritance rule drives every precedence question below.

Tooltips render inside the chart, so they carry the class only when no provider is above them, the same as `TrendIndicator`, `BaseTooltip` and `BaseLegend` (`useStandaloneScopeClass()`).

Inside a provider a tooltip therefore inherits the provider's inline `theme` var and any consumer rule scoped to the provider wrapper, the same as the chart it belongs to.

Each catalog entry maps to a WPDS token. Source writes the mapping bare; the LightningCSS plugin in `tsdown.config.ts` injects the WPDS spec value as a fallback into `dist/`:

```scss
:where(.a8c-charts-scope) {
	--a8c-charts-color-grid: var(--wpds-color-stroke-surface-neutral);
}
```

Charts reference the catalog bare — `stroke: var(--a8c-charts-color-grid)`. For anything that *is* a catalog role, `chart-scope.scss` is the only place its `--wpds-*` mapping is named, so design-system churn lands in one file. One kind of `--wpds-*` reference lives outside it, deliberately: **values that are not chart roles** — incidental typography, padding, gap and interaction motion read their design-system token directly at the call site, as interface chrome that should track the host's theme rather than charts-level theming.

### Precedence

Highest first:

1. The role set on any element between the chart and the provider — the closest declaration wins. A role set on the chart's *own* element reaches only what CSS paints; see "The SVG bridge".
2. The role set by a consumer rule targeting the provider wrapper. It beats the catalog default because `:where()` is zero-specificity.
3. The catalog default on the provider wrapper, resolving the mapped `--wpds-*` token.
4. The WPDS spec-value fallback, when no `--wpds-*` token is set either (SSR, jsdom, or WPDS not loaded). This is not a rare corner: WordPress itself defines no `--wpds-*` typography tokens, so in wp-admin the fallback is what renders. It is injected at build time by `@wordpress/theme`'s LightningCSS plugin.

CSS is the only route. The `theme` prop carries no colors, so there is nothing for a declaration to disagree with.

An override set **above** `GlobalChartsProvider` does not apply: the provider's own declaration on its wrapper beats a value merely inherited from an ancestor. Set overrides inside the provider tree, or target the scope class itself — `.a8c-charts-scope { --a8c-charts-color-grid: #e0e0e0; }` matches every provider wrapper on the page, including the one a bare chart mounts for itself, and outranks the zero-specificity catalog default. That rule is the replacement for a page-level `:root` override. The same rule limits `@wordpress/theme`'s `ThemeProvider` to *above* the charts provider: the catalog substitutes its `--wpds-*` tokens at the wrapper, so a `ThemeProvider` mounted between the wrapper and a chart is never consulted and CSS-painted colors keep their light-mode spec fallbacks. The JS-consumed ones do not — `getElementStyles` resolves at the chart element — so that nesting shows up as a chart whose series marks retint while its gridlines, axis and surfaces do not.

#### Broad roles and narrow ones

Some roles are deliberately narrower than the obvious name, so that moving one thing does not move four:

| Narrow role | Broad role | What the broad one also reaches |
|---|---|---|
| `--a8c-charts-color-label-axis` | `--a8c-charts-color-label` | legend labels, `.heatmap-chart__cell-value`, funnel labels, the line-chart tooltip |
| `--a8c-charts-color-background` | — | — |

`--a8c-charts-color-label-axis` *derives* from `--a8c-charts-color-label`, so setting the broad role moves every label at once and setting the narrow one moves only the SVG axis labels.

`--a8c-charts-color-surface` — the annotation label, `.x-zoom__reset`, tooltips — is a **sibling** of `--a8c-charts-color-background`, not a child. The chart's own background and the surfaces floating over it are set apart from each other often enough that one has to be able to move without the other. The consequence: no single role repaints both.

### The SVG bridge

**A color that is only painted is not resolved at all.** The grid, axis line, tick marks and tick labels reach visx as the `var(--a8c-charts-color-*, …)` chain `private/catalog-pointers.ts` holds: `useXYChartTheme` puts the chain into the theme it builds, `buildChartTheme` passes it on, and visx writes it onto the element it paints — an inline style for the grid, a presentation attribute elsewhere. A presentation attribute is mapped to a CSS declaration, so the chain resolves there natively, in Blink, WebKit and Gecko alike.

That is what makes the role read **at the painted element** rather than snapshot at the provider wrapper: an override on a chart's own class reaches it, a theme change repaints with no re-render, and SSR emits the chain for the client to resolve on paint. Resolving such a color in JS would freeze it and undo all three, which is why nothing does.

There is no stylesheet and no class involved. In particular the axes need neither: visx takes a separate style object per axis, so each one is handed its own roles and nothing has to distinguish them after the fact.

What else crosses in JS is what something reads as a *value*: the series palette, which visx turns into its `colorScale`, and the background, which the default glyph, the area-chart band, the line-chart gradient stops, the heatmap's contrast math and `GeoChart` each consume as a concrete string.

**The tooltip used to be the one painted exception, because visx painted it outside the scope.** `@visx/tooltip` appends each portal container straight to `document.body`, where the catalog is not declared, so a chain handed to one reached only its own hardcoded fallback — never the role, never a consumer's override. Charts no longer take that route: the box renders into the chart's own wrapper and the crosshairs and glyphs are drawn into the chart SVG, both inside the scope, so a chain handed to either resolves there natively.

Two colors are still resolved before visx sees them. `htmlLabel.color`, in `useXYChartTheme`, for a reason the move does not touch: visx builds the tooltip's shadow as `` `0 1px 2px ${color}55` ``, and a `var()` chain cannot take a suffix — token streams do not merge across a substitution boundary, so the whole declaration is invalid and the tooltip renders flat. The crosshair stroke, in `AccessibleTooltip`, only still matters where a consumer supplies a `ChartScopeContext` element that is not one of the chart's own ancestors; in the ordinary tree the CSS path now reaches it.

Being resolved in JS, both then carry the bridge's limitations rather than the CSS path's: they read at the scope element, so a role declared on the chart's own class moves the gridlines but leaves the crosshair at the catalog value, and neither repaints on a theme change until something re-renders.

Where a value is *consumed* says nothing about where it is *set*. These are set the same way as every other color — `--a8c-charts-color-background`, `--a8c-charts-color-series-*` — and resolved through `getComputedStyle` against the chart's own scope element, never `document.documentElement`, so both delivery paths obey the same cascade. Each pointer carries a terminal literal (`var(--a8c-charts-color-background, #fff)`) as the last resort for SSR and jsdom, where `getComputedStyle` resolves nothing.

The scope element is the wrapper a chart is rendered into, which sits **above** the element the chart's own `className` lands on, so a role declared on that inner element is invisible to the JS bridge. `.line-chart { --a8c-charts-color-background: red }` therefore does not reach the glyph strokes, while `.line-chart { --a8c-charts-color-grid: red }` does reach the gridlines — the CSS-painted roles read at the painted element, so any ancestor of it will do. Scope a rule for a JS-resolved role to a wrapper around the chart rather than to the chart itself. CHARTS-255 tracks closing the remainder.

`GeoChart` (Google Charts) takes a resolved-hex snapshot at render, so it does not live-update on a theme change without a re-render.

## Tier 1 — semantic catalog (shared, themeable roles)

> These tables are checked against `src/styles/chart-scope.scss` by `src/styles/test/chart-scope.test.ts`. Update the stylesheet and the table together.

| Role | Maps to | Fallback |
|---|---|---|
| `--a8c-charts-color-series-1` | `--wp-admin-theme-color` | `var(--wpds-color-foreground-interactive-brand, var(--wp-admin-theme-color, #3858e9))` |
| `--a8c-charts-color-grid` | `--wpds-color-stroke-surface-neutral` | `#dbdbdb` |
| `--a8c-charts-color-axis-x` | `--wpds-color-stroke-surface-neutral` | `#dbdbdb` |
| `--a8c-charts-color-tick-x` | `--wpds-color-stroke-surface-neutral` | `#dbdbdb` |
| `--a8c-charts-color-axis-y` | _(none — unpainted unless a consumer sets it)_ | `none` |
| `--a8c-charts-color-tick-y` | _(none — unpainted unless a consumer sets it)_ | `none` |
| `--a8c-charts-color-label` | `--wpds-color-foreground-content-neutral` | `#1e1e1e` |
| `--a8c-charts-color-label-secondary` | `--wpds-color-foreground-content-neutral-weak` | `#707070` |
| `--a8c-charts-color-label-inverse` | `--wpds-color-foreground-interactive-neutral-strong` | `#f0f0f0` |
| `--a8c-charts-color-label-background` | _(none — transparent by default, no WPDS fit)_ | `transparent` |
| `--a8c-charts-color-label-axis` | _(derives from `--a8c-charts-color-label`)_ | — |
| `--a8c-charts-color-annotation` | `--wpds-color-foreground-content-neutral` | `#1e1e1e` |
| `--a8c-charts-color-trend-up` | `--wpds-color-foreground-content-success-weak` | `#008030` |
| `--a8c-charts-color-trend-down` | `--wpds-color-foreground-content-error-weak` | `#cc1818` |
| `--a8c-charts-color-trend-neutral` | `--wpds-color-foreground-content-neutral-weak` | `#707070` |
| `--a8c-charts-color-background` | `--wpds-color-background-surface-neutral-strong` | `#fff` |
| `--a8c-charts-color-surface` | `--wpds-color-background-surface-neutral-strong` | `#fff` |
| `--a8c-charts-color-surface-secondary` | `--wpds-color-background-surface-neutral-weak` | `#f4f4f4` |
| `--a8c-charts-color-track` | `--wpds-color-background-track-neutral-weak` | `#f0f0f0` |
| `--a8c-charts-color-tooltip-surface` | _(none — translucent dark surface, no WPDS fit)_ | `rgb(0 0 0 / 85%)` |

The x axis and tick roles share grid's WPDS token but stay distinct roles, so the three can be themed independently.

### One pair of roles per axis

Each axis names itself: `--a8c-charts-color-axis-x` / `-tick-x` paint the x axis, `--a8c-charts-color-axis-y` / `-tick-y` the y. The y pair resolves to `none`, so by default that axis carries tick labels and nothing else. Declare either to paint it:

```css
.my-dashboard {
	--a8c-charts-color-axis-y: #dbdbdb;
	--a8c-charts-color-tick-y: #dbdbdb;
}
```

**There is deliberately no broad `--a8c-charts-color-axis` covering both.** It would have to mean one of two things, and neither is true: that setting it moves both axes — which cannot hold while the y side defaults to unpainted — or that it moves only x, which is a name that misleads exactly once per consumer, and silently. The tick *labels* are a different matter and do share a role (`--a8c-charts-color-label-axis`), because both axes label identically.

Gridlines also stay on one role, `--a8c-charts-color-grid`: visx paints rows and columns from a single style object, so the grid is genuinely one thing rather than two.

The terminal `none` in each chain is explicit rather than load-bearing: `stroke` already starts at `none`, so an undeclared role paints nothing either way.

**It would be load-bearing on a `fill`.** A `var()` naming an undeclared property with no fallback is invalid at computed-value time, which drops the declaration rather than leaving it absent — and `fill` starts at *black*. That is why `--a8c-charts-color-label-background` carries a terminal `transparent`: without it, an undeclared role would put a black plate behind every pie label. Give any role read by a `fill` a terminal literal, even when the intent is "paint nothing".

### The series palette

The five `--a8c-charts-color-series-*` slots are the palette. `GlobalChartsProvider` resolves them once, at its wrapper, and seeds its color cache with whatever resolves; charts generate accessible colors beyond the seeds, so five slots is a cap on *seeds*, not on series. A slot that resolves to nothing is skipped and the palette compacts — set only slots 1 and 3 and the palette is two colors, in that order.

Only slot 1 is declared in the catalog, and it names `--wp-admin-theme-color` first, so series colors follow the WordPress admin color scheme with no host configuration. Slots 2 to 5 are names a consumer can declare, nothing more — the catalog leaves them undeclared so an unset slot resolves to nothing and compacts out, rather than repeating a color nobody chose.

The design system's brand token is the next leg rather than the first, because it only reaches the admin color scheme when a WPDS **root provider** is on the page. Measured on a live WordPress 7.1 wp-admin dashboard, `<html data-wpds-root-provider>` carries the whole generated ramp inline, derived from `--wp-admin-theme-color`. Where no root provider boots, the token falls back to the plain stylesheet rule — a static `#3858e9` with no reference to the admin color. So on WP 7.1 either order happens to work; everywhere else (WP 7.0.x, a page without a root provider, Calypso, SSR) only this one does.

Leading with the admin color costs nothing, because `@wordpress/theme` writes `--wp-admin-theme-color` from a provider's own accent — its legacy wp-admin override — alongside the `--wpds-*` ramp. A provider accent therefore still wins.

Precedence for a series color, highest first:

1. `options.stroke` on that series, resolved at the chart element. This is the per-series override.
2. A CSS declaration of `--a8c-charts-color-series-N`, on the usual catalog rules above.
3. The catalog default, which exists only for slot 1.

The palette is resolved per provider, so one `ColorCache` and one group-to-color map serve every chart under it and siblings agree on what a group is colored. Two consequences. A slot set on a *chart's own* element does not apply — the palette was resolved at the provider wrapper before that element existed; use `options.stroke` for a per-chart color. And the palette is read once, when the provider mounts, so a slot changed at runtime needs the provider to remount before it is seen.

## Non-color roles

| Role | Maps to | Fallback |
|---|---|---|
| `--a8c-charts-motion-duration-entrance` | `--wpds-motion-duration-xl` | `400ms` |
| `--a8c-charts-motion-easing-entrance` | `--wpds-motion-easing-expressive` | `cubic-bezier(0.25, 0, 0, 1)` |
| `--a8c-charts-border-radius-bar` | `--wpds-border-radius-md` | `4px` |
| `--a8c-charts-border-radius-cell` | `--wpds-border-radius-sm` | `2px` |
| `--a8c-charts-border-radius-leaderboard-bar` | _(none — pill shape, no WPDS radius fits)_ | `9999px` |
| `--a8c-charts-dimension-leaderboard-row-gap` | `--wpds-dimension-gap-md` | `12px` |
| `--a8c-charts-dimension-leaderboard-column-gap` | `--wpds-dimension-gap-xs` | `4px` |
| `--a8c-charts-elevation-xs` | _(none — `--wpds-elevation-*` removed in theme 1.0.0)_ | `0 1px 1px 0 #00000008, 0 1px 2px 0 #00000005, 0 3px 3px 0 #00000005, 0 4px 4px 0 #00000003` |
| `--a8c-charts-elevation-sm` | _(none — `--wpds-elevation-*` removed in theme 1.0.0)_ | `0 1px 2px 0 #0000000d, 0 2px 3px 0 #0000000a, 0 6px 6px 0 #00000008, 0 8px 8px 0 #00000005` |

The motion pair carries the one-shot reveal a data mark plays on first paint, across all six charts that animate in. It deliberately does **not** cover interaction motion: hover and transition timings read `--wpds-motion-*` directly, as interface chrome rather than a chart role.

The elevation fallbacks hold the values their removed `--wpds-elevation-*` tokens used to resolve to, until a replacement exists.

## Tier 2 — component-specific variables

Instance styling knobs, on the same convention but not shared semantic roles: `--a8c-charts-dimension-leaderboard-bar-hover-inset`, `--a8c-charts-color-heatmap-*`, `--a8c-charts-dimension-heatmap-*`, `--a8c-charts-heatmap-cell-intensity`, `--a8c-charts-color-zoom-selection`, `--a8c-charts-color-zoom-selection-stroke`.

| Role | Maps to | Fallback |
|---|---|---|
| `--a8c-charts-color-zoom-selection` | `--wpds-color-background-interactive-brand-strong` | `var(--wp-admin-theme-color, #3858e9)` |
| `--a8c-charts-color-zoom-selection-stroke` | `--wpds-color-stroke-interactive-brand` | `var(--wp-admin-theme-color, #3858e9)` |

The zoom selection roles' translucency is not part of the role — it lives in `fill-opacity` / `stroke-opacity`, so an override sets an opaque color and keeps the intended transparency.

`--a8c-charts-heatmap-cell-intensity` is the one variable without a `{category}` segment: it holds a unitless 0–1 scalar consumed inside `color-mix()`, not a color.

The heatmap Tier-2 variables and `--a8c-charts-dimension-leaderboard-bar-hover-inset` are **component-emitted** — set from JS per render, or in the component's own stylesheet — rather than on the provider wrapper. They are deliberately absent from `chart-scope.scss` and are not consumer override points in the same sense as the catalog above.

## Removed override variables

These names no longer resolve. Set the replacement instead:

| Removed | Set instead |
|---|---|
| `--charts-trend-up-color` | `--a8c-charts-color-trend-up` |
| `--charts-trend-down-color` | `--a8c-charts-color-trend-down` |
| `--charts-trend-neutral-color` | `--a8c-charts-color-trend-neutral` |
| `--a8c--charts--leaderboard--bar--border-radius` | `--a8c-charts-border-radius-leaderboard-bar` |
| `--a8c-charts-color-focus` | `--wpds-color-stroke-focus` |
| `--a8c-charts-color-label-on-fill` | `--a8c-charts-color-label-inverse` |
