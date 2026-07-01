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
- **Navigation utilities** – Write encoded parameters directly to the URL
  using router navigation

## Usage Examples

### Date Range Navigation

```typescript
import { writeDateRangeToSearch } from '@jetpack-premium-analytics/routing';
import { useNavigate } from '@wordpress/route';

function DateRangeSelector() {
	const navigate = useNavigate();

	const handleRangeChange = nextRange => {
		writeDateRangeToSearch( {
			navigate,
			to: '/',
			range: nextRange,
			search: { interval: 'day' }, // Preserve other params
		} );
	};
}
```

### Comparison Parameter Management

```typescript
import { writeComparisonToSearch } from '@jetpack-premium-analytics/routing';

function ComparisonSelector() {
	const navigate = useNavigate();

	const handleComparisonChange = ( range, presetId ) => {
		writeComparisonToSearch( {
			navigate,
			to: '/',
			range,
			presetId,
			enabled: !! range,
		} );
	};
}
```

## API Reference

### `writeDateRangeToSearch( options )`

Writes a `DateRange` to the URL using the provided `navigate` function.

**Parameters:**

- **`navigate`** – Navigation function from `useNavigate()` (`@wordpress/route`)
- **`to`** – Destination path (e.g., `'/'`)
- **`range`** – `{ from: Date | undefined; to?: Date | undefined }`
- **`timezone?`** _(optional)_ – Override timezone for date conversion
- **`search?`** _(optional)_ – Additional search params to preserve/set

**URL Parameters Generated:**

- `from` – ISO string with timezone offset
- `to` – ISO string with timezone offset

### `writeComparisonToSearch( options )`

Writes comparison parameters to the URL for period-over-period analysis.

**Parameters:**

- **`navigate`** – Navigation function from `@wordpress/route`
- **`to`** – Destination path
- **`range?`** – Comparison date range
- **`presetId?`** – Preset identifier (e.g., 'previous_period')
- **`enabled?`** – Whether comparison is active
- **`timezone?`** – Override timezone
- **`search?`** – Additional search params

**URL Parameters Generated:**

- `compare_from` – Comparison start date (ISO string)
- `compare_to` – Comparison end date (ISO string)
- `compare_preset` – Preset identifier
- `comp` – '1' when comparison enabled, undefined when disabled

### `encodeDateToSearchParam( date?, timezone? )`

Low-level function to convert a Date to an ISO string with timezone.

**Parameters:**

- **`date?`** – Date to encode (returns undefined if not provided)
- **`timezone?`** – Timezone override

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
