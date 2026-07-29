# @automattic/jetpack-premium-analytics-formatters

Locale-aware formatting utilities for Jetpack Premium Analytics.

Thin wrapper over `@automattic/number-formatters` (numbers, currency) and
`date-fns` (dates), plus a domain-specific orchestrator (`formatMetricValue`)
that routes between formatters by analytics metric type.

## Exports

```typescript
import {
	formatMetricValue,
	formatDate,
	formatDateRange,
	formatDateRangeLong,
	getDateRangeSpan,
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

## `formatDate( date, format? )`

Format a date using a named preset or custom `date-fns` pattern.
Defaults to `'medium'`.

```typescript
formatDate( new Date( '2025-06-21' ) ); // 'Jun 21, 2025'
formatDate( new Date( '2025-06-21' ), 'short' ); // 'Jun 21'
formatDate( new Date( '2025-06-21' ), 'long' ); // 'June 21, 2025'
formatDate( new Date( '2025-06-21' ), 'dd/MM/yyyy' ); // '21/06/2025'
```

**Named presets:** `short`, `medium` (default), `long`, `full`, `fullNoYear`, `day`, `month`, `year`, `monthYear`, `numeric`, `iso`, `dateTime`.

## `formatDateRange( range? )`

Format a date range into a human-readable string.
Returns `''` when range or dates are missing.

```typescript
formatDateRange( { from, to } );
// same day:    'Jun 21, 2025'
// same month:  'Jun 21-25, 2025'
// same year:   'Jun 21-Jul 25, 2025'
// cross-year:  'Jun 21, 2024-Jul 25, 2025'
```

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

## Architecture

Number and currency formatting delegates to `@automattic/number-formatters`
(a tier-2 published Jetpack package). Date formatting uses `date-fns`. The
`formatMetricValue` orchestrator is domain-specific — it routes to the right
formatter based on the metric type.

## Dependencies

- `@automattic/number-formatters` — number/currency primitives
- `date-fns` — date formatting
