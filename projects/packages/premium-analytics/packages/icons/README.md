# @automattic/jetpack-premium-analytics-icons

Illustrated WPDS icons used by Premium Analytics widgets and navigation.

## Overview

13 branded multi-fill SVG illustrations (48×48 viewBox for most — see the
exports table, fills driven by `var(--wpds-color-*)` tokens).

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

| Name            | viewBox     |
| --------------- | ----------- |
| `calendar`      | `0 0 36 40` |
| `channel`       | `0 0 48 48` |
| `coupon`        | `0 0 48 48` |
| `customer`      | `0 0 48 48` |
| `device`        | `0 0 48 48` |
| `goal`          | `0 0 48 48` |
| `location`      | `0 0 48 49` |
| `megaphone`     | `0 0 48 48` |
| `payment`       | `0 0 48 48` |
| `paymentReturn` | `0 0 48 48` |
| `productBlouse` | `0 0 48 48` |
| `reports`       | `0 0 24 24` |
| `search`        | `0 0 48 48` |

The viewBox variance is inherited from the upstream source as-is.

## Dependencies

- `@wordpress/primitives` — `SVG`, `Path`, `Circle`
