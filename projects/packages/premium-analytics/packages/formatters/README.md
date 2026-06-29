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

**Named presets:** `short`, `medium` (default), `long`, `full`, `day`, `month`, `year`, `monthYear`, `numeric`, `iso`, `dateTime`.

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

## Architecture

Number and currency formatting delegates to `@automattic/number-formatters`
(a tier-2 published Jetpack package). Date formatting uses `date-fns`. The
`formatMetricValue` orchestrator is domain-specific — it routes to the right
formatter based on the metric type.

## Dependencies

- `@automattic/number-formatters` — number/currency primitives
- `date-fns` — date formatting
