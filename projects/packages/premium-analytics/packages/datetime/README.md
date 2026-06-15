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

#### `toLocalTZ( value?, timezone? )`

Creates a timezone-aware date in the specified timezone.

```typescript
const date = toLocalTZ( '2024-01-15', 'America/New_York' );
const now = toLocalTZ( undefined, '+05:30' ); // Current time in +05:30
```

**Parameters:**

- `value` (optional): `number | string | Date` - Date value to convert
- `timezone` (optional): `string` - Target timezone

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
const comparison = getComparisonRangeFromPreset( reference, 'previous-week' );
// Returns dates for Jan 8-14, 2024
```

**Parameters:**

- `reference`: `DateRange` - Reference date range with `from` and `to`
- `presetId`: `ComparisonPresetId` - One of the supported preset identifiers

**Returns:** `DateRange | undefined` - Comparison date range or undefined
if inputs are invalid

**Supported presets:**

- `previous-period` - Same duration, immediately before reference
- `previous-week` - One week before reference dates
- `previous-month` - One month before reference dates
- `previous-year` - One year before reference dates

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
type ComparisonPresetId = 'previous-period' | 'previous-week' | 'previous-month' | 'previous-year';
```

## Dependencies

- `date-fns` - Date manipulation functions
- `@date-fns/tz` - Timezone support for date-fns
