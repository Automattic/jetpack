# Charts CSS custom-property catalog

`@automattic/charts` exposes its themeable values as CSS custom properties under a
single convention: `--a8c-charts-{category}-{name}`. `{category}` mirrors the WPDS
token type (`color`, `dimension`, `border-radius`).

## How it resolves

`src/styles/chart-scope.module.scss` declares the whole catalog on one class, and every
chart scope carries it: the responsive container that wraps ten of the eleven public
charts, the conversion-funnel root, the `GlobalChartsProvider` wrapper, portal-rendered
tooltips, and the standalone `BaseTooltip` / `BaseLegend` / `TrendIndicator` components.

Each entry maps to a WordPress design-system token with the WPDS spec value as its
fallback:

```scss
.scope {
	--a8c-charts-color-grid: var(--wpds-color-stroke-surface-neutral, #dbdbdb);
}
```

Because the class sits on the chart element itself rather than on `:root`, a
`ThemeProvider` scoped to a subtree retints the charts inside it.

Charts reference the catalog bare — `stroke: var(--a8c-charts-color-grid)`. The
`--wpds-*` mapping for a role lives in `chart-scope.module.scss`. The one exception is
the three trend-colour deprecated aliases: `trend-indicator.module.scss` predates this
catalog and still carries its own copy of the same `--wpds-*` fallback behind
`--charts-trend-*-color` (see "Public override variables" below) — redundant with the
catalog default, since the class already defines the role before that fallback would
ever be reached, but not yet cleaned up.

### Precedence

An instance override wins, then the emitted catalog default, then the mapped `--wpds-*`
token, then the spec fallback:

1. `--a8c-charts-color-grid` set on the chart element or any ancestor — including the
   value `GlobalChartsProvider` writes from a `theme` prop override.
2. The catalog default emitted by `.scope`.
3. The mapped `--wpds-*` token.
4. The spec-value fallback.

### The SVG bridge

visx and Google Charts apply colours as SVG presentation attributes, where `var()` does
not resolve. Those colours are resolved in JS through `getComputedStyle` against the
chart's own scope element — never `document.documentElement` — so both delivery paths
obey the same cascade. The JS theme in `themes.ts` therefore holds a bare catalog pointer
with a terminal literal (`var(--a8c-charts-color-grid, #dbdbdb)`); the literal is the last
resort for SSR and jsdom, where `getComputedStyle` resolves nothing.

`GeoChart` (Google Charts) takes a resolved-hex snapshot at render, so it does not
live-update on a theme change without a re-render.

## Tier 1 — semantic catalog (shared, themeable roles)

| Role | Maps to `--wpds-*` | Fallback |
|---|---|---|
| `--a8c-charts-color-grid` | `--wpds-color-stroke-surface-neutral` | `#dbdbdb` |
| `--a8c-charts-color-axis` | `--wpds-color-stroke-surface-neutral` | `#dbdbdb` |
| `--a8c-charts-color-tick` | `--wpds-color-stroke-surface-neutral` | `#dbdbdb` |
| `--a8c-charts-color-label` | `--wpds-color-foreground-content-neutral` | `#1e1e1e` |
| `--a8c-charts-color-label-secondary` | `--wpds-color-foreground-content-neutral-weak` | `#707070` |
| `--a8c-charts-color-label-inverse` | `--wpds-color-foreground-interactive-neutral-strong` | `#f0f0f0` |
| `--a8c-charts-color-label-on-fill` | _(none — white-on-series-fill, no WPDS fit)_ | `#FFFFFF` |
| `--a8c-charts-color-annotation` | `--wpds-color-foreground-content-neutral` | `#1e1e1e` |
| `--a8c-charts-color-trend-up` | `--wpds-color-foreground-content-success-weak` | `#008030` |
| `--a8c-charts-color-trend-down` | `--wpds-color-foreground-content-error-weak` | `#cc1818` |
| `--a8c-charts-color-trend-neutral` | `--wpds-color-foreground-content-neutral-weak` | `#707070` |
| `--a8c-charts-color-background` | `--wpds-color-background-surface-neutral-strong` | `#fff` |
| `--a8c-charts-color-surface-secondary` | `--wpds-color-background-surface-neutral-weak` | `#f4f4f4` |
| `--a8c-charts-color-track` | `--wpds-color-background-track-neutral-weak` | `#f0f0f0` |
| `--a8c-charts-color-tooltip-surface` | _(none — translucent dark surface, no WPDS fit)_ | `rgba(0,0,0,0.85)` |
| `--a8c-charts-color-focus` | `--wpds-color-stroke-focus` | `var(--wp-admin-theme-color, #3858e9)` |

`--a8c-charts-color-axis` (axis line) and `--a8c-charts-color-tick` (tick marks)
resolve to the same value as `--a8c-charts-color-grid` by default. They are kept as
distinct roles so axis, tick marks, and gridlines can be themed independently; each
maps directly to its own `--wpds-*` token rather than chaining through `grid`.

`--a8c-charts-color-focus` keeps a `var(--wp-admin-theme-color, …)` layer between the
`--wpds-*` token and the spec hex, so a wp-admin colour scheme still tints the focus
ring in contexts where WPDS is not loaded.

## Non-colour roles

| Role | Maps to `--wpds-*` | Fallback |
|---|---|---|
| `--a8c-charts-border-width-focus` | `--wpds-border-width-focus` | `var(--wp-admin-border-width-focus, 2px)` |
| `--a8c-charts-motion-duration-series` | `--wpds-motion-duration-xl` | `400ms` |
| `--a8c-charts-motion-easing-series` | `--wpds-motion-easing-expressive` | `cubic-bezier(0.25, 0, 0, 1)` |
| `--a8c-charts-border-radius-bar` | `--wpds-border-radius-md` | `4px` |
| `--a8c-charts-border-radius-cell` | `--wpds-border-radius-sm` | `2px` |
| `--a8c-charts-border-radius-leaderboard-bar` | _(none — pill shape, no WPDS radius fits)_ | `var(--a8c--charts--leaderboard--bar--border-radius, 9999px)` |
| `--a8c-charts-elevation-xs` | _(none — `--wpds-elevation-*` removed in theme 1.0.0)_ | `0 1px 1px 0 #00000008, 0 1px 2px 0 #00000005, 0 3px 3px 0 #00000005, 0 4px 4px 0 #00000003` |
| `--a8c-charts-elevation-sm` | _(none — `--wpds-elevation-*` removed in theme 1.0.0)_ | `0 1px 2px 0 #0000000d, 0 2px 3px 0 #0000000a, 0 6px 6px 0 #00000008, 0 8px 8px 0 #00000005` |

`--a8c-charts-border-width-focus` sizes the keyboard focus ring on leaderboard and
heatmap chart elements, mirroring `--a8c-charts-color-focus`'s `--wp-admin-*` fallback
layer.

`--a8c-charts-motion-duration-series` and `--a8c-charts-motion-easing-series` carry the
series entrance animation shared by bar, area, line, leaderboard, and conversion-funnel
charts (the "rise" / "stretch" keyframes).

`--a8c-charts-border-radius-bar` sizes the conversion-funnel bar corners.
`--a8c-charts-border-radius-cell` sizes heatmap cells and the heatmap legend swatch —
the heatmap grid's own keyboard focus ring stays on the raw `--wpds-border-radius-sm`
token, since it's chrome rather than a cell.

`--a8c-charts-border-radius-leaderboard-bar` is a pill shape with no WPDS radius fit.
Its deprecated alias, `--a8c--charts--leaderboard--bar--border-radius`, is read as the
catalog entry's own inner fallback rather than at each call site — see "Public
override variables" below.

`--a8c-charts-elevation-xs` carries the zoom reset button's shadow.
`--a8c-charts-elevation-sm` carries tooltip and popover shadows (the conversion-funnel
tooltip, the line-chart annotation popover, and `BaseTooltip`). Neither has a
`--wpds-*` mapping: `@wordpress/theme` 1.0.0 removed the whole `--wpds-elevation-*`
group without a replacement, so each fallback holds the value its removed
`--wpds-elevation-*` token used to resolve to.

## Tier 2 — component-specific variables

Instance styling knobs, on the same convention but not shared semantic roles:
`--a8c-charts-dimension-leaderboard-bar-hover-inset`,
`--a8c-charts-color-heatmap-*`, `--a8c-charts-dimension-heatmap-*`,
`--a8c-charts-heatmap-cell-intensity`,
`--a8c-charts-color-zoom-selection`, `--a8c-charts-color-zoom-selection-stroke`.

| Role | Maps to `--wpds-*` | Fallback |
|---|---|---|
| `--a8c-charts-color-zoom-selection` | `--wpds-color-background-interactive-brand-strong` | `#3858e9` |
| `--a8c-charts-color-zoom-selection-stroke` | `--wpds-color-stroke-interactive-brand` | `#3858e9` |

The zoom selection roles carry the drag-to-zoom rectangle's fill and border. Their
translucency is not part of the role: it lives in the `fill-opacity` /
`stroke-opacity` properties, so overriding either role sets an opaque colour and
keeps the intended transparency.

`--a8c-charts-heatmap-cell-intensity` is the one variable without a `{category}`
segment: it holds a unitless 0–1 scalar consumed inside `color-mix()`, not a colour.

The heatmap Tier-2 variables (`--a8c-charts-color-heatmap-*`,
`--a8c-charts-dimension-heatmap-*`, `--a8c-charts-heatmap-cell-intensity`) and
`--a8c-charts-dimension-leaderboard-bar-hover-inset` are **component-emitted** —
the heatmap chart sets its variables from JS per render, and the leaderboard chart
defines its hover-inset variable in its own stylesheet — rather than by `.scope`.
They are deliberately absent from `chart-scope.module.scss` and are not consumer
override points in the same sense as the catalog above.

## Public override variables

These are documented, supported override points. Deprecated names still work — they
are read as an inner fallback behind the new name:

| New | Deprecated alias |
|---|---|
| `--a8c-charts-color-trend-up` | `--charts-trend-up-color` |
| `--a8c-charts-color-trend-down` | `--charts-trend-down-color` |
| `--a8c-charts-color-trend-neutral` | `--charts-trend-neutral-color` |
| `--a8c-charts-border-radius-leaderboard-bar` | `--a8c--charts--leaderboard--bar--border-radius` |
