# @automattic/jetpack-premium-analytics-formatters

Locale-aware formatting utilities for Jetpack Premium Analytics.

Thin wrapper over `@automattic/number-formatters` (numbers, currency) and
`@wordpress/date` (dates), plus a domain-specific orchestrator
(`formatMetricValue`) that routes between formatters by analytics metric type.

## Exports

```typescript
import {
	formatMetricValue,
	formatDate,
	formatDateRange,
	type DateFormatName,
} from '@jetpack-premium-analytics/formatters';
```

## `formatMetricValue( value, type?, options? )`

Format a numeric value based on its metric type.
Returns `''` for null, undefined, or NaN.

```typescript
formatMetricValue( 9876.543 ); // '9,877'
formatMetricValue( 1500, 'number', {
	useMultipliers: true,
	decimals: 1,
} ); // '1.5K'
formatMetricValue( 192088.05, 'currency' ); // '$192,088.05'
formatMetricValue( 0.25, 'percentage' ); // '+25%'
formatMetricValue( 4.75, 'average' ); // '4.75'
formatMetricValue( 192088, 'currency', {
	useMultipliers: true,
	currencyCode: 'EUR',
} ); // '192.09K€'
```

| Parameter                | Type                                                  | Default                                  | Description                                    |
| ------------------------ | ----------------------------------------------------- | ---------------------------------------- | ---------------------------------------------- |
| `value`                  | `string \| number \| null`                            |                                          | Value to format                                |
| `type`                   | `'number' \| 'currency' \| 'percentage' \| 'average'` | `'number'`                               | Formatting strategy                            |
| `options.decimals`       | `number`                                              | varies by type                           | Decimal precision (0 for number, 2 for others) |
| `options.useMultipliers` | `boolean`                                             | `false`                                  | Compact notation (K/M suffixes)                |
| `options.signDisplay`    | `Intl` sign mode                                      | `'auto'` (`'exceptZero'` for percentage) | Sign display                                   |
| `options.currencyCode`   | `string`                                              | `'USD'`                                  | ISO 4217 currency code                         |

## `formatDate( date, name? )`

Format a date in the site's locale and timezone. Month and weekday names come
from WordPress's own translation tables and the ordering from the site's
`date_format` option, so dates match the rest of wp-admin rather than the
browser's locale. Defaults to `'medium'`.

```typescript
// On a site left on the US English default:
formatDate( date ); // 'June 21, 2025'
formatDate( date, 'short' ); // 'June 21'
formatDate( date, 'year' ); // '2025'
formatDate( date, 'iso' ); // '2025-06-21'

// The same calls on an es_ES site:
formatDate( date ); // '21 de junio de 2025'
formatDate( date, 'short' ); // '21 de junio'
```

| Name     | Purpose                                         |
| -------- | ----------------------------------------------- |
| `medium` | Default. The site's `date_format` verbatim.     |
| `short`  | The site format minus its year.                 |
| `year`   | Year alone.                                     |
| `iso`    | Machine-readable `YYYY-MM-DD`. Never localized. |

There is no custom-pattern escape hatch: a hand-written pattern fixes the
day/month order to whatever the author happened to type, which is the problem
this formatter exists to avoid.

**Pass an instant** — a `TZDate` from `@jetpack-premium-analytics/datetime`, or a
timestamp. Strings are outside the parameter type on purpose, even though
`dateI18n` accepts them: a bare `YYYY-MM-DD` is read as browser-local midnight
and then shifted into the site's timezone, landing on the previous day for any
visitor ahead of the site. Parse site-local strings with `parseSiteDateTime` from
`@jetpack-premium-analytics/datetime` first.

## `formatDateRange( range? )`

Format a date range into a human-readable string.
Returns `''` when range or dates are missing.

```typescript
// On a site left on its locale's default date format:
formatDateRange( { from, to } );
// same day:    'June 21, 2025'
// same month:  'June 21 – 25, 2025'
// same year:   'June 21 – July 25, 2025'
// cross-year:  'June 21, 2024 – July 25, 2025'

// The same-month range above on an es_ES site:
// '21–25 de junio de 2025'
```

A month or year shared by both ends is elided where the site's locale has a
rule for it. Those rules are not written by hand — "Jun 21-25, 2025" is an
English convention that, translated literally, gives the wrong result in
Spanish. They are borrowed from CLDR via `Intl.DateTimeFormat.formatRange()`,
which only holds where WordPress and CLDR agree on how dates look. Two checks
establish that per site, so no allowlist of trusted locales has to be
maintained:

1. `Intl` renders representative dates exactly as `formatDate` does. A site
   with a custom `date_format` or different month translations fails here and
   keeps the format it asked for.
2. `Intl` builds an un-elidable range out of that same rendering. `ja` and `zh`
   fail here because their range patterns switch to numeric dates and
   locale-specific separators.

Where either check fails, both ends are spelled out in full using the
translated WordPress range pattern instead:

```typescript
// Site with a custom `date_format` of 'd/m/Y':
// '21/06/2025 – 25/06/2025'
```

| Parameter | Type                         | Description       |
| --------- | ---------------------------- | ----------------- |
| `range`   | `{ from?: Date; to?: Date }` | Date range object |

## Implementation

Number and currency formatting delegates to `@automattic/number-formatters`
(a tier-2 published Jetpack package), while date formatting uses
`@wordpress/date`, which WordPress seeds with the site's format and
translations. `formatMetricValue` routes analytics metric types to the
appropriate formatter.
