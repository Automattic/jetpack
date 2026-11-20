# @automattic/jetpack-premium-analytics-icons

Icons of the Premium Analytics dashboard: the ones its widgets and navigation draw, and the
lookup that turns the `jpa/<name>` reference a `widget.json` carries into one of them.

## The dashboard's own icons

Branded multi-fill illustrations, fills driven by `var(--wpds-color-*)` tokens, plus two glyphs
upstream lacks: `chartLine`, drawn as the pair of `chartBar`, and `jetpack`, the logo in its
brand colors. They are intentionally distinct from the 24×24 monochrome glyphs of
`@wordpress/icons`. Where one of those is enough, import it from `@wordpress/icons` rather than
re-exporting it here.

```ts
import { Icon } from '@wordpress/icons';
import { calendar, search } from '@jetpack-premium-analytics/icons';

<Icon icon={ calendar } size={ 48 } />;
```

## Widget icon references

A `widget.json` names its icon as `jpa/<name>`. `lookupWidgetIcon()` turns the reference into
the element, and `resolveWidgetIcon()` is the same lookup in the shape `registerIconResolver()`
from `@wordpress/widget-primitives` takes: `packages/init` registers it before any widget type
resolves, and Storybook calls the lookup directly.

The collection is the explicit `ICONS` map in `src/resolve.ts`: the `@wordpress/icons` glyphs
the widgets use, by kebab-case name (`jpa/chart-bar` is `chartBar`), plus the dashboard's own
icons where no widget names a WordPress one. It is explicit so a consumer bundles those glyphs
and nothing else of `@wordpress/icons`. Where a dashboard icon and a glyph share a name
(`calendar`, `megaphone`, `payment`, `search`), the reference resolves to the glyph; the
dashboard's own stays reachable by import.

Anything outside the map, another collection included, resolves to `null` and the dashboard
shows no icon. A glyph a widget wants to name goes into the map first.

```ts
import { lookupWidgetIcon } from '@jetpack-premium-analytics/icons';

lookupWidgetIcon( 'jpa/chart-bar' ); // chartBar, from @wordpress/icons
lookupWidgetIcon( 'jpa/chart-line' ); // chartLine, from this package
lookupWidgetIcon( 'core/calendar' ); // null
```

## Exports

Icons: `calendar`, `channel`, `chartLine`, `coupon`, `customer`, `device`, `goal`, `jetpack`,
`location`, `megaphone`, `payment`, `paymentReturn`, `productBlouse`, `reports`, `search`, `tag`.

Lookup: `lookupWidgetIcon`, `resolveWidgetIcon`.

## Dependencies

- `@wordpress/primitives`: `SVG`, `Path`, `Circle`
- `@wordpress/icons`: the glyphs the collection lists
