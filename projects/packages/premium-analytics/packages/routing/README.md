# @automattic/jetpack-premium-analytics-routing

Utilities for handling **routing and URL search parameters** in
Jetpack Premium Analytics with TypeScript integration.

This package centralizes logic for encoding and decoding route params so
that date ranges, filters, comparison parameters, and other query
parameters are handled consistently across the application.

## Features

- **Date range encoding** – Convert `DateRange` objects into ISO strings
  with timezone support
- **Comparison parameters** – Handle `compare_from`, `compare_to`,
  `compare_preset`, and `comp` flags
- **@wordpress/route integration** – Type-safe navigation with search
  parameter management
- **Timezone handling** – Automatic timezone conversion for consistent
  date handling
- **URL state persistence** – Maintains filter and comparison state
  across page refreshes

## API Reference

### `decodeDateSearchParam( value?, timezone? )`

Parses a stored report date for the date picker, returning undefined when the
value is missing or malformed.

**Parameters:**

- **`value?`** – Date string to decode
- **`timezone?`** – Timezone in which to read an offset-less value

**Returns:** A timezone-aware Date or undefined

### `encodeDateToSearchParam( date? )`

Low-level function to convert a Date to an ISO string in the reporting timezone.

**Parameters:**

- **`date?`** – Date to encode (returns undefined if not provided)

**Returns:** ISO string with timezone offset or undefined

## Architecture

### URL Parameter Structure

```
/?
  from=2025-01-01T00:00:00-08:00&        # Primary date range
  to=2025-01-31T23:59:59-08:00&
  interval=day&                          # Data granularity
  compare_from=2024-12-01T00:00:00-08:00& # Comparison range
  compare_to=2024-12-31T23:59:59-08:00&
  compare_preset=previous_period&        # Comparison preset
  comp=1                                 # Comparison enabled flag
```

### Timezone Handling

1. **Local Timezone Detection**: Uses site timezone from WordPress settings
2. **ISO String Generation**: Converts dates to ISO strings with timezone offset
3. **Consistent API Calls**: Ensures all API requests use properly formatted dates
4. **Cross-browser Support**: Handles timezone differences across different environments
