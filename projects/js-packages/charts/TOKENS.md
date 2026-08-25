# Charts CSS custom-property catalog

`@automattic/charts` exposes its themeable values as CSS custom properties under a single convention: `--a8c-charts-{category}-{name}`. `{category}` mirrors the WPDS token type (`color`, `dimension`, `border-radius`).

## How it resolves

`src/styles/chart-scope.scss` declares the whole catalog once, on the `GlobalChartsProvider` wrapper, via `:where(.a8c-charts-scope)`. `:where()` keeps the rule at zero specificity, so a consumer rule targeting that same element wins without `!important`. It is declared on the wrapper rather than `:root` because `@wordpress/theme`'s `ThemeProvider` emits its generated `--wpds-*` ramp as inline styles on its own wrapper div — a `:root` declaration would miss a `ThemeProvider` entirely.

Chart roots deliberately do *not* carry the `a8c-charts-scope` class. Custom properties inherit down the tree, and an element only shadows an inherited value by re-declaring it, so a chart root that re-declared the catalog would beat an override set between it and the provider — closing off the one place consumers are meant to set overrides. This inheritance rule drives every precedence question below.

Portal-rendered tooltips carry the class unconditionally, because a React portal renders outside the provider's DOM tree and would otherwise inherit nothing. `TrendIndicator`, `BaseTooltip` and `BaseLegend` carry it only when no provider is above them (`useStandaloneScopeClass()`).

That unconditional class has a cost: a portal tooltip re-declares the catalog on itself, so it sees only the catalog *default*, never an instance override — both the provider's inline `theme` var and a consumer rule scoped to the provider wrapper live on an ancestor the portal is not a descendant of. A bare `.a8c-charts-scope { … }` rule does reach it, matching the tooltip's own class directly.

Each catalog entry maps to a WPDS token with the WPDS spec value as its fallback:

```scss
:where(.a8c-charts-scope) {
	--a8c-charts-color-grid: var(--wpds-color-stroke-surface-neutral, #dbdbdb);
}
```

Charts reference the catalog bare — `stroke: var(--a8c-charts-color-grid)`. For anything that *is* a catalog role, `chart-scope.scss` is the only place its `--wpds-*` mapping is named, so design-system churn lands in one file. One kind of `--wpds-*` reference lives outside it, deliberately: **values that are not chart roles** — incidental typography, padding, gap and interaction motion read their design-system token directly at the call site, as interface chrome that should track the host's theme rather than charts-level theming.

### Precedence

Highest first:

1. The role set on any element between the chart and the provider — the closest declaration wins. A role set on the chart's *own* element reaches only what CSS paints; see "The SVG bridge".
2. The role set by a consumer rule targeting the provider wrapper. It beats the catalog default because `:where()` is zero-specificity.
3. The theme layer `GlobalChartsProvider` writes inline from a `theme` prop override — see below.
4. The catalog default on the provider wrapper, resolving the mapped `--wpds-*` token.
5. The WPDS spec-value fallback, when no `--wpds-*` token is set either (SSR, jsdom, or WPDS not loaded). This is not a rare corner: WordPress itself defines no `--wpds-*` typography tokens, so in wp-admin the fallback is what renders. It is written by hand — see `src/styles/test/wpds-fallbacks.test.ts`, which checks each one against the installed `@wordpress/theme`.

A CSS declaration of a role therefore beats a `theme` prop override *anywhere* it is set, the wrapper included — the prop writes a variable the role reads, not the role itself, and a role declared in CSS never reads it.

An override set **above** `GlobalChartsProvider` does not apply: the provider's own declaration on its wrapper beats a value merely inherited from an ancestor. Set overrides inside the provider tree, or target the scope class itself — `.a8c-charts-scope { --a8c-charts-color-grid: #e0e0e0; }` matches every provider wrapper on the page, including the one a bare chart mounts for itself and the one a portal tooltip carries, and outranks the zero-specificity catalog default. That rule is the replacement for a page-level `:root` override. The same rule limits `@wordpress/theme`'s `ThemeProvider` to *above* the charts provider: the catalog substitutes its `--wpds-*` tokens at the wrapper, so a `ThemeProvider` mounted between the wrapper and a chart is never consulted and CSS-painted colours keep their light-mode spec fallbacks. The JS-painted ones do not — `getElementStyles` resolves at the chart element — so that nesting shows up as a chart whose SVG marks retint while its gridlines and surfaces do not.

#### The theme layer

Each role a `theme` prop field can override is declared reading a `*-theme` variable first:

```scss
:where(.a8c-charts-scope) {
	--a8c-charts-color-grid: var(--a8c-charts-color-grid-theme, var(--wpds-color-stroke-surface-neutral, #dbdbdb));
}
```

`GlobalChartsProvider` writes `--a8c-charts-color-grid-theme` inline from `theme.gridStyles.stroke`. Publishing the consumer's value one layer out is what keeps the catalog default reachable: a value that is invalid at computed-value time — `var(--wpds-color-stroke-surface-neutral)` with no fallback, in a host that never loaded the WPDS stylesheet — invalidates only the theme layer, and the role still resolves its mapped token. Written as the role itself, that same value made the role guaranteed-invalid, and that propagates to every bare `var(--a8c-charts-color-grid)` read site: `stroke` computed to `unset`, so the gridlines disappeared rather than degrading to the spec grey.

A value that reads the role it would override is not published at all. The role reads its theme layer, so such a value closes a cycle through the catalog entry, and CSS marks *every* custom property in a cycle invalid — the role's own fallback is not used, and the token resolves to nothing. `withCatalogPointers` restores the theme field to the catalog pointer whether or not the value was published, so visx never paints a literal the CSS side cannot see.

`src/styles/test/chart-scope.test.ts` pins which roles carry the layer, from the same list the provider maps fields with.

#### A `theme`-prop override keeps the reach of the field it was set from

A role is a shared name, so publishing an override as a custom property could widen it — `theme={ { svgLabelSmall: { fill: 'purple' } } }` recolouring legend labels, heatmap cell values, funnel labels and the line-chart tooltip along with the SVG axis labels it names.

It doesn't, because a mapped field publishes a role read by exactly the elements that field already controlled. Where the obvious role has wider readership, one side or the other gets a role of its own:

| Theme field | Publishes | Kept off it | How |
|---|---|---|---|
| `svgLabelSmall.fill` | `--a8c-charts-color-label-axis` | legend labels, `.heatmap-chart__cell-value`, funnel labels, the line-chart tooltip | the field takes a narrow role deriving from `--a8c-charts-color-label` |
| `backgroundColor` | `--a8c-charts-color-background` | the annotation label, `.x-zoom__reset`, tooltips | those readers take `--a8c-charts-color-surface` instead |

**The two are shaped differently, and the difference is load-bearing.** `--a8c-charts-color-label-axis` *derives* from `--a8c-charts-color-label`: the theme field publishes the narrow role, so the broad one stays free as a move-every-label knob. `--a8c-charts-color-surface` is a **sibling** of `--a8c-charts-color-background`, not a child — there the theme field publishes the broad role, so deriving would hand the override straight back to the surfaces it is meant to spare. Deriving is only safe when the narrow role is the one the `theme` prop writes.

The consequence: `--a8c-charts-color-label` moves every label, but no single role repaints the chart background and the floating surfaces together.

`gridStyles.stroke`, `xAxisLineStyles.stroke` and `xTickLineStyles.stroke` need no narrow role — nothing outside the element each names reads their role.

### The SVG bridge

visx and Google Charts apply colours as SVG presentation attributes, where `var()` does not resolve. Those colours are resolved in JS through `getComputedStyle` against the chart's own scope element — never `document.documentElement` — so both delivery paths obey the same cascade. The JS theme in `themes.ts` therefore holds a bare catalog pointer with a terminal literal (`var(--a8c-charts-color-grid, #dbdbdb)`); the literal is the last resort for SSR and jsdom, where `getComputedStyle` resolves nothing.

The scope element is the wrapper a chart is rendered into, which sits **above** the element the chart's own `className` lands on. A role declared on that inner element is therefore invisible to this bridge: `.line-chart { --a8c-charts-color-grid: red }` recolours what the chart paints in CSS and leaves the gridlines, axis lines and tick labels at the inherited value, because the SVG carries a value already resolved higher up. Scope such a rule to a wrapper around the chart, not to the chart itself. CHARTS-255 tracks closing this.

`GeoChart` (Google Charts) takes a resolved-hex snapshot at render, so it does not live-update on a theme change without a re-render.

## Tier 1 — semantic catalog (shared, themeable roles)

> These tables are checked against `src/styles/chart-scope.scss` by `src/styles/test/chart-scope.test.ts`. Update the stylesheet and the table together.

| Role | Maps to | Fallback |
|---|---|---|
| `--a8c-charts-color-series-1` | `--wp-admin-theme-color` | `var(--wpds-color-foreground-interactive-brand, var(--wp-admin-theme-color, #3858e9))` |
| `--a8c-charts-color-series-2` | _(none — unset until a consumer sets it)_ | — |
| `--a8c-charts-color-series-3` | _(none — unset until a consumer sets it)_ | — |
| `--a8c-charts-color-series-4` | _(none — unset until a consumer sets it)_ | — |
| `--a8c-charts-color-series-5` | _(none — unset until a consumer sets it)_ | — |
| `--a8c-charts-color-grid` | `--wpds-color-stroke-surface-neutral` | `#dbdbdb` |
| `--a8c-charts-color-axis` | `--wpds-color-stroke-surface-neutral` | `#dbdbdb` |
| `--a8c-charts-color-tick` | `--wpds-color-stroke-surface-neutral` | `#dbdbdb` |
| `--a8c-charts-color-label` | `--wpds-color-foreground-content-neutral` | `#1e1e1e` |
| `--a8c-charts-color-label-secondary` | `--wpds-color-foreground-content-neutral-weak` | `#707070` |
| `--a8c-charts-color-label-inverse` | `--wpds-color-foreground-interactive-neutral-strong` | `#f0f0f0` |
| `--a8c-charts-color-label-on-fill` | _(none — white-on-series-fill, no WPDS fit)_ | `#fff` |
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

Axis and tick share grid's WPDS token but stay distinct roles, so the three can be themed independently.

### The series palette

The five `--a8c-charts-color-series-*` slots are the palette. `GlobalChartsProvider` resolves them once, at its wrapper, and seeds its colour cache with whatever resolves; charts generate accessible colours beyond the seeds, so five slots is a cap on *seeds*, not on series. A slot that resolves to nothing is skipped and the palette compacts — set only slots 1 and 3 and the palette is two colours, in that order.

Only slot 1 has a default, and it names `--wp-admin-theme-color` first, so series colours follow the WordPress admin colour scheme with no host configuration.

The design system's own brand token cannot lead that chain. WordPress 7.1's `wp-components` stylesheet depends on the `wp-theme` handle, so `design-tokens.css` loads on every React admin screen, and it pins `--wpds-color-foreground-interactive-brand` to a static `#3858e9` with no reference to the admin colour anywhere. Named first, that token would peg every chart to blueberry.

Leading with the admin colour costs nothing, because `@wordpress/theme`'s `ThemeProvider` writes `--wp-admin-theme-color` from its own accent — its legacy wp-admin override — alongside the `--wpds-*` ramp. A provider accent therefore still wins.

Precedence for a series colour, highest first:

1. `options.stroke` on that series, resolved at the chart element. This is the per-series override.
2. A CSS declaration of `--a8c-charts-color-series-N`, on the usual catalog rules above.
3. `theme.colors[ N - 1 ]`, which publishes slot N's theme layer. Deprecated — see below.
4. The catalog default, which exists only for slot 1.

The palette is resolved per provider, so one `ColorCache` and one group-to-colour map serve every chart under it and siblings agree on what a group is coloured. The consequence is that a slot set on a *chart's own* element does not apply — the palette was resolved at the provider wrapper before that element existed. Use `options.stroke` for a per-chart colour.

`theme.colors` is deprecated sugar over the slots: entry N publishes slot N's theme layer through the same mechanism as every other mapped field, so a CSS declaration still outranks it and a short array leaves the later slots unset rather than blank. Entries past the fifth are ignored, with a one-time console warning. It is removed in CHARTS-227.

## Non-colour roles

| Role | Maps to | Fallback |
|---|---|---|
| `--a8c-charts-motion-duration-entrance` | `--wpds-motion-duration-xl` | `400ms` |
| `--a8c-charts-motion-easing-entrance` | `--wpds-motion-easing-expressive` | `cubic-bezier(0.25, 0, 0, 1)` |
| `--a8c-charts-border-radius-bar` | `--wpds-border-radius-md` | `4px` |
| `--a8c-charts-border-radius-cell` | `--wpds-border-radius-sm` | `2px` |
| `--a8c-charts-border-radius-leaderboard-bar` | _(none — pill shape, no WPDS radius fits)_ | `9999px` |
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

The zoom selection roles' translucency is not part of the role — it lives in `fill-opacity` / `stroke-opacity`, so an override sets an opaque colour and keeps the intended transparency.

`--a8c-charts-heatmap-cell-intensity` is the one variable without a `{category}` segment: it holds a unitless 0–1 scalar consumed inside `color-mix()`, not a colour.

The heatmap Tier-2 variables and `--a8c-charts-dimension-leaderboard-bar-hover-inset` are **component-emitted** — set from JS per render, or in the component's own stylesheet — rather than on the provider wrapper. They are deliberately absent from `chart-scope.scss` and are not consumer override points in the same sense as the catalog above.

## Removed override variables

Every role in the catalog is a supported override point, on the precedence rules above. These names are not, and no longer resolve — set the replacement instead:

| Removed | Set instead |
|---|---|
| `--charts-trend-up-color` | `--a8c-charts-color-trend-up` |
| `--charts-trend-down-color` | `--a8c-charts-color-trend-down` |
| `--charts-trend-neutral-color` | `--a8c-charts-color-trend-neutral` |
| `--a8c--charts--leaderboard--bar--border-radius` | `--a8c-charts-border-radius-leaderboard-bar` |
| `--a8c-charts-color-focus` | `--wpds-color-stroke-focus` |

Removing the first four also removes a second name for a role, read at its component's own call site rather than through the catalog: each sat inside the role as its fallback — `var(--a8c-charts-*, var(--deprecated-name, …))` — so it applied only where the role itself was unset. No `--a8c-charts-*` role is now read anywhere but bare.
