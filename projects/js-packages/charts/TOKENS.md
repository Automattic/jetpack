# Charts CSS custom-property catalog

`@automattic/charts` exposes its themeable values as CSS custom properties under a
single convention: `--a8c-charts-{category}-{name}`. `{category}` mirrors the WPDS
token type (`color`, `dimension`, `border-radius`, `border-width`).

## How it resolves today

Nothing emits these variables at runtime yet (that is CHARTS-203). Each reference in
the library carries its default inline as a fallback:

```scss
stroke: var(--a8c-charts-color-grid, var(--wpds-color-stroke-surface-neutral, #dbdbdb));
```

So an `--a8c-charts-*` variable you set on a chart container wins; otherwise the
mapped `--wpds-*` token wins; otherwise the spec-value hex wins. Setting any
`--a8c-charts-*` variable on a chart ancestor overrides that role.

## Tier 1 — semantic catalog (shared, themeable roles)

| Role | Maps to `--wpds-*` | Fallback |
|---|---|---|
| `--a8c-charts-color-grid` | `--wpds-color-stroke-surface-neutral` | `#dbdbdb` |
| `--a8c-charts-color-label` | `--wpds-color-foreground-content-neutral` | `#1e1e1e` |
| `--a8c-charts-color-label-secondary` | `--wpds-color-foreground-content-neutral-weak` | `#707070` |
| `--a8c-charts-color-label-inverse` | `--wpds-color-foreground-interactive-neutral-strong` | `#f0f0f0` |
| `--a8c-charts-color-trend-up` | `--wpds-color-foreground-content-success-weak` | `#008030` |
| `--a8c-charts-color-trend-down` | `--wpds-color-foreground-content-error-weak` | `#cc1818` |
| `--a8c-charts-color-trend-neutral` | `--wpds-color-foreground-content-neutral-weak` | `#707070` |
| `--a8c-charts-color-background` | `--wpds-color-background-surface-neutral-strong` | `#fff` |
| `--a8c-charts-color-surface-secondary` | `--wpds-color-background-surface-neutral-weak` | `#f4f4f4` |
| `--a8c-charts-color-track` | `--wpds-color-background-track-neutral-weak` | `#f0f0f0` |
| `--a8c-charts-color-focus` | `--wpds-color-stroke-focus` | `#3858e9` |

## Tier 2 — component-specific variables

Instance styling knobs, on the same convention but not shared semantic roles:
`--a8c-charts-border-radius-leaderboard-bar`,
`--a8c-charts-dimension-leaderboard-bar-hover-inset`,
`--a8c-charts-color-zoom-*`, `--a8c-charts-color-heatmap-*`,
`--a8c-charts-dimension-heatmap-*`, `--a8c-charts-heatmap-cell-intensity`,
`--a8c-charts-border-width-focus`.

`--a8c-charts-heatmap-cell-intensity` is the one variable without a `{category}`
segment: it holds a unitless 0–1 scalar consumed inside `color-mix()`, not a colour.

The heatmap Tier-2 variables (`--a8c-charts-color-heatmap-*`,
`--a8c-charts-dimension-heatmap-*`, `--a8c-charts-heatmap-cell-intensity`) are
**component-emitted** — the chart sets them from JS per render — not consumer
override points. `--a8c-charts-border-width-focus` is a genuine override point,
honoured by both the leaderboard and heatmap focus rings.

## Public override variables

These are documented, supported override points. Deprecated names still work — they
are read as an inner fallback behind the new name:

| New | Deprecated alias |
|---|---|
| `--a8c-charts-color-trend-up` | `--charts-trend-up-color` |
| `--a8c-charts-color-trend-down` | `--charts-trend-down-color` |
| `--a8c-charts-color-trend-neutral` | `--charts-trend-neutral-color` |
| `--a8c-charts-border-radius-leaderboard-bar` | `--a8c--charts--leaderboard--bar--border-radius` |
