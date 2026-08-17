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

Charts reference the catalog bare — `stroke: var(--a8c-charts-color-grid)`. For anything that *is* a catalog role, `chart-scope.scss` is the only place its `--wpds-*` mapping is named, so design-system churn lands in one file. Two kinds of `--wpds-*` reference live outside it, both deliberately:

- **Values that are not chart roles.** Incidental typography, padding, gap and interaction motion read their design-system token directly at the call site. They are interface chrome that should track the host's theme rather than charts-level theming.
- **The four deprecated public aliases** (three trend colours, one leaderboard radius), read at their own call sites — see "Public override variables" below for why.

### Precedence

Highest first:

1. The role set on the chart element, or on any element between it and the provider — the closest declaration wins.
2. The inline instance var `GlobalChartsProvider` writes from a `theme` prop override, on the provider wrapper.
3. The role set by a consumer rule targeting the provider wrapper. It beats the catalog default because `:where()` is zero-specificity, and loses to step 2 because inline style beats any stylesheet rule.
4. The catalog default on the provider wrapper, resolving the mapped `--wpds-*` token.
5. The WPDS spec-value fallback, when no `--wpds-*` token is set either (SSR, jsdom, or WPDS not loaded).

For the four roles with a deprecated alias, that alias wins ahead of all five — see "Public override variables".

An override set **above** `GlobalChartsProvider` does not apply: the provider's own declaration on its wrapper beats a value merely inherited from an ancestor. Set overrides inside the provider tree.

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

`GeoChart` (Google Charts) takes a resolved-hex snapshot at render, so it does not live-update on a theme change without a re-render.

## Tier 1 — semantic catalog (shared, themeable roles)

> These tables are checked against `src/styles/chart-scope.scss` by `src/styles/test/chart-scope.test.ts`. Update the stylesheet and the table together.

| Role | Maps to `--wpds-*` | Fallback |
|---|---|---|
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

## Non-colour roles

| Role | Maps to `--wpds-*` | Fallback |
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

| Role | Maps to `--wpds-*` | Fallback |
|---|---|---|
| `--a8c-charts-color-zoom-selection` | `--wpds-color-background-interactive-brand-strong` | `#3858e9` |
| `--a8c-charts-color-zoom-selection-stroke` | `--wpds-color-stroke-interactive-brand` | `#3858e9` |

The zoom selection roles' translucency is not part of the role — it lives in `fill-opacity` / `stroke-opacity`, so an override sets an opaque colour and keeps the intended transparency.

`--a8c-charts-heatmap-cell-intensity` is the one variable without a `{category}` segment: it holds a unitless 0–1 scalar consumed inside `color-mix()`, not a colour.

The heatmap Tier-2 variables and `--a8c-charts-dimension-leaderboard-bar-hover-inset` are **component-emitted** — set from JS per render, or in the component's own stylesheet — rather than on the provider wrapper. They are deliberately absent from `chart-scope.scss` and are not consumer override points in the same sense as the catalog above.

## Public override variables

These are documented, supported override points. Deprecated names still work:

| New | Deprecated alias |
|---|---|
| `--a8c-charts-color-trend-up` | `--charts-trend-up-color` |
| `--a8c-charts-color-trend-down` | `--charts-trend-down-color` |
| `--a8c-charts-color-trend-neutral` | `--charts-trend-neutral-color` |
| `--a8c-charts-border-radius-leaderboard-bar` | `--a8c--charts--leaderboard--bar--border-radius` |

Each deprecated alias is read at its component's own call site as the *outer* layer around the new name — `var(--deprecated-name, var(--a8c-charts-*))` — not inside the catalog entry. Precedence, highest first: the deprecated alias, then the `--a8c-charts-*` role per the section above, then the catalog default.

The reason is a rule worth knowing before touching any of this: **a `var()` fallback is substituted at the element that declares it**, so an inner fallback can only see values present at that same element. A catalog entry on the provider wrapper could only see a deprecated alias also set on the wrapper — never one set on a descendant, which is how `--a8c--charts--leaderboard--bar--border-radius` is documented to be set. Reading the alias at the call site instead lets it cascade like any other custom property.

The trade-off: the deprecated name beats the new name when both are set on the same element. That inversion is deliberate — it's the price of the alias working at all.
