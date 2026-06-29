# @automattic/jetpack-premium-analytics-icons

Illustrated WPDS icons used by Premium Analytics widgets and navigation.

## Overview

13 branded multi-fill SVG illustrations (fills driven by
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

`calendar`, `channel`, `coupon`, `customer`, `device`, `goal`, `location`,
`megaphone`, `payment`, `paymentReturn`, `productBlouse`, `reports`,
`search`

## Dependencies

- `@wordpress/primitives` — `SVG`, `Path`, `Circle`
