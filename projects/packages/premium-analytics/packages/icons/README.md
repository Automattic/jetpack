# @jetpack-premium-analytics/icons

Illustrated WPDS icons used by Premium Analytics widgets and navigation.

## Overview

13 branded multi-fill SVG illustrations (48×48 viewBox, fills driven by
`var(--wpds-color-*)` tokens), plus a small set of re-exports from
`@wordpress/icons` for utility glyphs (`dashboard`, `settings`, `plus`,
`info`).

The illustrated icons are intentionally distinct from upstream
`@wordpress/icons`, which ships 24×24 monochrome glyphs intended for
`fill: currentColor` styling. Where a glyph is enough, prefer upstream.

## Usage

```ts
import { Icon } from '@wordpress/icons';
import { calendar, dashboard, search } from '@jetpack-premium-analytics/icons';

<Icon icon={ calendar } size={ 48 } />;
```

## Exports

| Name            | Source                                       |
| --------------- | -------------------------------------------- |
| `calendar`      | local (illustrated)                          |
| `channel`       | local (illustrated)                          |
| `coupon`        | local (illustrated)                          |
| `customer`      | local (illustrated)                          |
| `device`        | local (illustrated)                          |
| `goal`          | local (illustrated)                          |
| `location`      | local (illustrated)                          |
| `megaphone`     | local (illustrated)                          |
| `payment`       | local (illustrated)                          |
| `paymentReturn` | local (illustrated)                          |
| `productBlouse` | local (illustrated)                          |
| `reports`       | local (illustrated)                          |
| `search`        | local (illustrated)                          |
| `dashboard`     | re-export of `@wordpress/icons` `navigation` |
| `settings`      | re-export of `@wordpress/icons`              |
| `plus`          | re-export of `@wordpress/icons`              |
| `info`          | re-export of `@wordpress/icons`              |

## Dependencies

- `@wordpress/primitives` — `SVG`, `Path`, `Circle`
- `@wordpress/icons` — utility-glyph re-exports

See the parent README's "Internal packages" section for the dual-naming
convention behind the `@jetpack-premium-analytics/icons` import specifier
vs. the package's `name` field.
