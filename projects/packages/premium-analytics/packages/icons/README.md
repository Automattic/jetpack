# @jetpack-premium-analytics/icons

Illustrated WPDS icons used by Premium Analytics widgets and navigation.

## Overview

13 branded multi-fill SVG illustrations (48×48 viewBox, fills driven by
`var(--wpds-color-*)` tokens).

The illustrated icons are intentionally distinct from upstream
`@wordpress/icons`, which ships 24×24 monochrome glyphs intended for
`fill: currentColor` styling. Where a glyph is enough, import it directly
from `@wordpress/icons` rather than adding a re-export here — keeping this
package focused on the genuinely-custom illustrations and free of upstream
names we'd otherwise have to track across `@wordpress/icons` bumps.

## Usage

```ts
import { Icon } from '@wordpress/icons';
import { calendar, search } from '@jetpack-premium-analytics/icons';

<Icon icon={ calendar } size={ 48 } />;
```

## Exports

| Name            | Source              |
| --------------- | ------------------- |
| `calendar`      | local (illustrated) |
| `channel`       | local (illustrated) |
| `coupon`        | local (illustrated) |
| `customer`      | local (illustrated) |
| `device`        | local (illustrated) |
| `goal`          | local (illustrated) |
| `location`      | local (illustrated) |
| `megaphone`     | local (illustrated) |
| `payment`       | local (illustrated) |
| `paymentReturn` | local (illustrated) |
| `productBlouse` | local (illustrated) |
| `reports`       | local (illustrated) |
| `search`        | local (illustrated) |

## Dependencies

- `@wordpress/primitives` — `SVG`, `Path`, `Circle`

See the parent README's "Internal packages" section for the dual-naming
convention behind the `@jetpack-premium-analytics/icons` import specifier
vs. the package's `name` field.
