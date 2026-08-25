# @automattic/jetpack-premium-analytics-datetime

Date and timezone utilities for Jetpack Premium Analytics.

## Overview

Provides timezone-aware date handling and comparison range calculations
for analytics widgets and date-range pickers.

## Functions

### Timezone Utilities

#### `createTZDateFromParts( dateParts: number[], timezone? )`

Creates a timezone-aware date in the specified timezone using the provided date parts.
**Important:** Months are zero-based (0 = January, 11 = December).

```ts
// October 09, 2025 00:00 AM in America/New_York time
const date = createTZDateFromParts( [ 2025, 9, 9 ], 'America/New_York' );
```

**Parameters:**

- `dateParts` : `number[]` - Date value to convert
- `timezone` (optional): `string` - Target timezone, default is GMT

**Returns:** `TZDate` - Timezone-aware date object

#### `siteTimeZone()`

The site's timezone, as an identifier `Intl` accepts. Reads the WordPress
date settings that ship with the page, so it needs no await.

```typescript
siteTimeZone(); // 'America/New_York', or '+05:30' on an offset-configured site
```

**Returns:** `string` - An IANA zone name, or a `±HH:MM` offset

#### `toLocalTZ( value?, timezone? )`

Creates a timezone-aware date in the specified timezone.

A string that states no offset — `YYYY-MM-DD`, or a `T`- or space-separated
datetime — is read as **wall time** in that timezone. Values that already
identify an instant (offset-bearing strings, timestamps, `Date`s) keep their
instant. Surrounding whitespace is ignored, and a clock time or calendar date
that does not exist yields an invalid date rather than rolling over — whether
or not the value states an offset. `parseSiteDateTime` accepts exactly the same
values, so the two cannot disagree on what is parseable.

```typescript
const date = toLocalTZ( '2024-01-15', 'America/New_York' ); // Jan 15 00:00 in New York
const now = toLocalTZ( undefined, '+05:30' ); // Current time in +05:30
toLocalTZ( '2024-02-31', 'America/New_York' ); // Invalid Date
toLocalTZ( '2024-02-31T00:00:00Z', 'America/New_York' ); // Invalid Date
```

**Parameters:**

- `value` (optional): `number | string | Date` - Date value to convert
- `timezone` (optional): `string` - Target timezone, default is UTC

**Returns:** `TZDate` - Timezone-aware date object

#### `formatToTimezoneNaiveString( date, timezone )`

Formats a date to an ISO string without timezone offset.

```typescript
const naive = formatToTimezoneNaiveString( new Date(), 'Europe/London' );
// Returns: "2024-01-15T14:30:00.000"
```

**Parameters:**

- `date`: `Date` - Date to format
- `timezone`: `string` - Timezone for interpretation

**Returns:** `string` - ISO string without timezone offset

#### `dateToISOStringWithTZ( date, timezone )`

Converts a date to ISO string with timezone offset applied.

```typescript
const withTZ = dateToISOStringWithTZ( new Date(), 'America/New_York' );
// Returns: "2024-01-15T14:30:00.000-05:00"
```

**Parameters:**

- `date`: `Date` - Date to convert
- `timezone`: `string` - Target timezone

**Returns:** `string` - ISO string with timezone offset

### Comparison Range Calculations

#### `getComparisonRangeFromPreset( reference, presetId )`

Calculates comparison date ranges based on predefined presets.

```typescript
const reference = {
	from: new Date( '2024-01-15' ),
	to: new Date( '2024-01-21' ),
};
const comparison = getComparisonRangeFromPreset( reference, 'previous-period' );
// Returns dates for Jan 8-14, 2024
```

**Parameters:**

- `reference`: `DateRange` - Reference date range with `from` and `to`
- `presetId`: `ComparisonPresetId` - One of the supported preset identifiers

**Returns:** `DateRange | undefined` - Comparison date range or undefined
if inputs are invalid

**Supported presets:**

- `previous-period` - Same duration, immediately before reference
- `previous-month` - Same duration, anchored one month before the reference end
- `previous-year` - Same duration, anchored one year before the reference end

For whole-month references, `previous-month` and `previous-year` instead stay
aligned to calendar month boundaries, so their duration can differ. Whole months
are read from the range itself, so a rolling window that happens to land on one
(April 1-30 from "Last 30 days") compares against all 31 days of March.

### Range Measurement and Stepping

#### `getDateRangeSpan( range? )`

Measures how long a range is, in the coarsest unit that divides it evenly.
Returns `null` when the range is missing an end.

```typescript
getDateRangeSpan( { from, to } );
// 24 hours:  { unit: 'hour', value: 24 }
// 7 days:    { unit: 'day', value: 7 }
// 12 months: { unit: 'month', value: 12 }
```

A whole-month range stays in days below two months and only collapses into
years from two years up, so "Last 30 days" reads as 30 days and a
twelve-month window as 12 months.

#### `stepDateRange( range, direction )`

Shifts a range backward or forward (`'previous' | 'next'`) by its own length.
Steps move in calendar units, so a step across a DST boundary keeps the wall
clock; where a calendar step cannot be undone, it falls back to whole days.
Returns `undefined` when the range has no measurable span.

```typescript
stepDateRange( { from, to }, 'previous' ); // Last 7 days -> the 7 days before
```

#### `canStepForward( range, now )`

Whether the next window has already happened in full. Pass the site's `now`,
not the browser's.

## Types

### `DateRange`

```typescript
type DateRange = {
	from?: Date;
	to?: Date;
};
```

### `ComparisonPresetId`

```typescript
type ComparisonPresetId = 'previous-period' | 'previous-month' | 'previous-year';
```

### `DateRangeSpan`

```typescript
type DateRangeSpan = {
	unit: 'hour' | 'day' | 'month' | 'year';
	value: number;
};
```

## Dependencies

- `date-fns` - Date manipulation functions
- `@date-fns/tz` - Timezone support for date-fns
