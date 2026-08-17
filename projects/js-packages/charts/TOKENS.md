# Charts CSS custom-property catalog

`@automattic/charts` exposes its themeable values as CSS custom properties under a
single convention: `--a8c-charts-{category}-{name}`. `{category}` mirrors the WPDS
token type (`color`, `dimension`, `border-radius`).

## How it resolves

`src/styles/chart-scope.scss` declares the whole catalog once, on the
`GlobalChartsProvider` wrapper, via `:where(.a8c-charts-scope)`. `:where()` keeps the
rule at zero specificity, so a consumer rule targeting that same wrapper element wins
over the catalog default without needing `!important` or a more specific selector.
`global-charts-provider.tsx` imports the stylesheet for its side effect, so it always
reaches the bundle: every chart either sits under a `GlobalChartsProvider` or
auto-mounts its own.

Chart roots deliberately do *not* carry the `a8c-charts-scope` class themselves — only
the provider wrapper (and, as below, a few components with no provider above them)
does. That is what lets an override set *anywhere inside the
provider tree* reach a chart: a CSS custom property inherits down through descendants,
and an element only shadows an inherited value by re-declaring it itself. If every
chart root re-declared the catalog, that re-declaration would win over an override set
on an ancestor between the chart and the provider, closing off the one place consumers
are meant to set overrides.

Portal-rendered tooltips carry the class unconditionally: a React portal renders
outside the provider's DOM tree, so without its own class it would inherit nothing —
not even the catalog default. `TrendIndicator`, `BaseTooltip`, and `BaseLegend` carry
the class only when no `GlobalChartsProvider` is above them (via
`useStandaloneScopeClass()`), so a component used inside a provider still resolves
through the provider's own declaration rather than shadowing it with a second one.

Carrying the class unconditionally has a cost: because a portal tooltip re-declares
the catalog on itself rather than inheriting the provider's, it only ever sees the
catalog *default* for a role, not an instance override. Neither the inline var
`GlobalChartsProvider` writes on its wrapper from a `theme`-prop override (Precedence
step 2 below), nor a consumer rule scoped more tightly than the bare
`.a8c-charts-scope` class (e.g. targeting the provider wrapper by its own selector),
reaches the tooltip's own `.a8c-charts-scope` declaration — both live on an ancestor
the portal's DOM position is not a descendant of. A plain `.a8c-charts-scope { … }`
rule with no other selector *does* reach it, because that selector matches the
tooltip's own class directly rather than relying on inheritance.

Each catalog entry maps to a WordPress design-system token with the WPDS spec value as
its fallback:

```scss
:where(.a8c-charts-scope) {
	--a8c-charts-color-grid: var(--wpds-color-stroke-surface-neutral, #dbdbdb);
}
```

Charts reference the catalog bare — `stroke: var(--a8c-charts-color-grid)`. For anything
that *is* a catalog role, `chart-scope.scss` is the only place its `--wpds-*` mapping is
named, so design-system churn lands in one file.

Two kinds of `--wpds-*` reference live outside it, both deliberately:

- **Values that are not chart roles.** Incidental typography, padding, gap and interaction
  motion — and the keyboard focus ring — read their design-system token directly at the
  call site. They are interface chrome that should track the host's theme rather than
  charts-level theming. See "The focus ring is deliberately not a catalog role" below.
- **The four deprecated public aliases** (three trend colours, one leaderboard radius).
  Each is read at its own component's call site, layered *outside* the catalog reference
  rather than inside the catalog entry — see "Public override variables" below for why.

### Precedence

Highest first:

1. `--a8c-charts-color-grid` set on the chart element itself, or on any element
   between it and the provider. CSS custom properties inherit down the tree, and a
   descendant only re-declares an inherited one when it sets its own value, so the
   closest such declaration wins.
2. The inline instance var `GlobalChartsProvider` writes from a `theme` prop override,
   set directly on the provider wrapper element.
3. A `--a8c-charts-color-grid` value set by a consumer rule targeting the provider
   wrapper itself. This beats the catalog default (next) because `:where()` makes the
   catalog's own declaration zero-specificity, but it loses to step 2 because an
   inline style always wins over a stylesheet rule regardless of specificity.
4. The catalog default declared on the provider wrapper, which resolves the mapped
   `--wpds-*` token.
5. The WPDS spec-value fallback, for when no `--wpds-*` token is set either (SSR,
   jsdom, or WPDS not loaded).

For the four roles with a deprecated public alias, a value set anywhere via the
deprecated name wins ahead of all five steps above — see "Public override variables"
below.

An override set **above** `GlobalChartsProvider` does not apply: the provider's own
declaration on its wrapper (step 4, or step 2/3 when set) beats a value merely
inherited from further up the tree, the same way any CSS custom property re-declared
on a closer element beats one from an ancestor. The supported place to set an override
is inside the provider tree — on the chart element, an element between it and the
provider, or the provider wrapper itself — never on an ancestor of the provider.

#### A `theme`-prop override reaches every reader of its role

`theme={ { svgLabelSmall: { fill: 'purple' } } }` is not a narrow "recolour this one
SVG label" override. It is published as the `--a8c-charts-color-label` catalog role
(step 2 above), so it reaches every reader of that role, not only the field it was
set from. Two roles have readers beyond their originating theme field:

| Theme field | Role | Also paints |
|---|---|---|
| `svgLabelSmall.fill` | `--a8c-charts-color-label` | `legend.labelStyles.color`, `.heatmap-chart__cell-value` |
| `backgroundColor` | `--a8c-charts-color-background` | `annotationStyles.label.backgroundFill`, `.x-zoom__reset` background, the heatmap blend base |

This is the intended effect of a single-source catalog, not a bug — a consumer who
wants to change only one reader should target that reader's own selector directly
instead of the `theme` prop.

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

`--a8c-charts-color-axis` (axis line) and `--a8c-charts-color-tick` (tick marks)
resolve to the same value as `--a8c-charts-color-grid` by default. They are kept as
distinct roles so axis, tick marks, and gridlines can be themed independently; each
maps directly to its own `--wpds-*` token rather than chaining through `grid`.

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

`--a8c-charts-motion-duration-entrance` and `--a8c-charts-motion-easing-entrance` carry the
one-shot reveal a data mark plays on first paint — the `rise` / `stretch` keyframes in the
bar, area, line, leaderboard and conversion-funnel charts. Each is a single
`transform: scale…(1)`, differing only in axis, so one pair of tokens governs all six.

They deliberately do **not** cover interaction motion. Hover, opacity, width and transform
transitions read `--wpds-motion-duration-sm`/`-md`/`-lg` and `--wpds-motion-easing-subtle`
directly, because those are interface chrome rather than a chart role.

## The focus ring is deliberately not a catalog role

The keyboard focus ring on interactive leaderboard rows and heatmap cells reads the
design-system tokens directly at its call sites:

```scss
$focus-ring-width: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px));
outline: $focus-ring-width solid var(--wpds-color-stroke-focus, var(--wp-admin-theme-color, #3858e9));
```

There is no `--a8c-charts-color-focus` or `--a8c-charts-border-width-focus`, and there
should not be. A focus indicator is platform chrome and an accessibility affordance, not
a chart role — it should look the same on a chart as on every other focusable control on
the page. Giving it a charts-level token would invite exactly the divergence we don't
want, and a consumer restyling it is far more likely to reduce its contrast than improve
it (WCAG 2.4.11 sets a contrast floor charts cannot verify on a consumer's behalf).

To change it, theme it where it belongs: a `@wordpress/theme` `ThemeProvider` above the
charts provider, or the `--wpds-*` tokens at your application level. Either way the change
applies to your whole UI rather than to charts alone. The `--wp-admin-*` layer in each
fallback chain means that, absent any of that, the ring still follows the user's own
wp-admin colour scheme.

`--a8c-charts-border-radius-bar` sizes the conversion-funnel bar corners.
`--a8c-charts-border-radius-cell` sizes heatmap cells and the heatmap legend swatch —
the heatmap grid's own keyboard focus ring stays on the raw `--wpds-border-radius-sm`
token, since it's chrome rather than a cell.

`--a8c-charts-border-radius-leaderboard-bar` is a pill shape with no WPDS radius fit.
Its deprecated alias, `--a8c--charts--leaderboard--bar--border-radius`, is read at the
leaderboard chart's own call site, not inside the catalog entry — see "Public
override variables" below for why.

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
defines its hover-inset variable in its own stylesheet — rather than on the provider
wrapper. They are deliberately absent from `chart-scope.scss` and are not consumer
override points in the same sense as the catalog above.

## Public override variables

These are documented, supported override points. Deprecated names still work:

| New | Deprecated alias |
|---|---|
| `--a8c-charts-color-trend-up` | `--charts-trend-up-color` |
| `--a8c-charts-color-trend-down` | `--charts-trend-down-color` |
| `--a8c-charts-color-trend-neutral` | `--charts-trend-neutral-color` |
| `--a8c-charts-border-radius-leaderboard-bar` | `--a8c--charts--leaderboard--bar--border-radius` |

Both deprecated aliases are read at their component's own call site, as the *outer*
layer around the new name — `var(--deprecated-name, var(--a8c-charts-*))` — not inside
the catalog entry in `chart-scope.scss`. That makes precedence, highest first:

1. The deprecated alias, set on the chart element or any ancestor up to the provider.
2. The `--a8c-charts-*` role, resolved per the "Precedence" section above.
3. The catalog default.

This is the constraint that keeps biting throughout this document: a `var()`
fallback inside a declaration is substituted **at the element that declares it**, so
an inner fallback can only ever see a value also present at that same element. A
catalog entry declared on the provider wrapper can only see a deprecated-alias value
also set on the provider wrapper — never one set on a descendant, such as the chart
element's own `style` prop, which is how `--a8c--charts--leaderboard--bar--border-radius`
is documented to be set. That is why the catalog lives on the provider wrapper rather
than `:root` (a nested WPDS `ThemeProvider`'s `--wpds-*` overrides are a descendant
relative to `:root`, so a `:root` fallback can't see them either), and why both
deprecated aliases are read at their own call sites instead of nested inside the
catalog entry: reading the deprecated name at the call site makes it resolve like any
other cascading custom property, settable anywhere, rather than being pinned to
whatever the catalog entry's own declaring element happens to be.

The trade-off: the deprecated name beats the new name when both are set on the same
element. That inversion is deliberate — it's the price of the alias working at all —
not a bug to fix.
