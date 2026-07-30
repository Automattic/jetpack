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
	formatDateRangeLong,
	getDateRangeSpan,
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

| Name         | Purpose                                             |
| ------------ | --------------------------------------------------- |
| `medium`     | Default. The site's `date_format` verbatim.         |
| `short`      | The site format minus its year.                     |
| `full`       | The site format led by the weekday.                 |
| `fullNoYear` | `short` led by the weekday.                         |
| `year`       | Year alone.                                         |
| `iso`        | Machine-readable `YYYY-MM-DD`. Never localized.     |

The two weekday forms are derived, since core publishes no weekday-bearing
format. The weekday name itself still comes from WordPress's translation
tables; only the comma joining it to the date is ours.

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
formatDateRange( { from, to } );
// same day: 'June 21, 2025'
// range:    'June 21, 2025 – June 25, 2025'
```

Both ends are spelled out in full. Eliding the shared month or year
("Jun 21-25, 2025") is an English typographic convention that does not carry
over — on an es_ES site it yields "21 de junio-25 de junio de 2025" — and
WordPress publishes no per-locale elision rules to draw on.

| Parameter | Type                         | Description       |
| --------- | ---------------------------- | ----------------- |
| `range`   | `{ from?: Date; to?: Date }` | Date range object |

## `formatDateRangeLong( range?, options? )`

Format a date range in explicit, readable form, for prominent surfaces such as
the section header subtitle. Returns `''` when range or dates are missing.

The shape follows the range's own length: day-scale ranges lead with the
weekday and omit the year while they sit in the reference year; longer ranges
drop the weekday and always carry the year. A window of a day or less is named
by a single date rather than two endpoints.

```typescript
formatDateRangeLong( { from, to } );
// 24 hours:    'Tuesday, July 28'
// today:       'Wednesday, July 29'
// 7 days:      'Tuesday, July 21 – Monday, July 27'
// past year:   'Tuesday, July 16, 2024 – Monday, July 22, 2024'
// 12 months:   'July 1, 2025 – June 30, 2026'
```

| Parameter               | Type                         | Default      | Description                              |
| ----------------------- | ---------------------------- | ------------ | ---------------------------------------- |
| `range`                 | `{ from?: Date; to?: Date }` |              | Date range object                        |
| `options.referenceYear` | `number`                     | current year | Year against which the year is redundant |

## `getDateRangeSpan( range? )`

Measure how long a range is, in the coarsest unit that divides it evenly.
Returns `null` when range or dates are missing.

Derived from the range itself rather than the preset that produced it, so a
window stepped back off a preset still reports its own length.

```typescript
getDateRangeSpan( { from, to } );
// 24 hours:  { unit: 'hour', value: 24 }
// 7 days:    { unit: 'day', value: 7 }
// 12 months: { unit: 'month', value: 12 }
// all time:  { unit: 'year', value: 6 }
```

A whole-month range stays in days below two months, so "Last 30 days" does not
become "1 month", and only collapses into years from two years up, so a
twelve-month window keeps reading as "12 months".

| Parameter | Type                         | Description       |
| --------- | ---------------------------- | ----------------- |
| `range`   | `{ from?: Date; to?: Date }` | Date range object |

## Implementation

Number and currency formatting delegates to `@automattic/number-formatters`
(a tier-2 published Jetpack package), while date formatting uses
`@wordpress/date`, which WordPress seeds with the site's format and
translations. `formatMetricValue` routes analytics metric types to the
appropriate formatter.
