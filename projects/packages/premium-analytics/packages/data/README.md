# @automattic/jetpack-premium-analytics-data

Data management for Jetpack Premium Analytics with React Query integration.

## Installation

This is an internal package of Jetpack Premium Analytics — it is never
published to npm and is resolved entirely in-tree. It's automatically
available to routes and other internal packages within
`@automattic/jetpack-premium-analytics`, imported via the
`@jetpack-premium-analytics/data` path alias.

```tsx
import {
	AnalyticsQueryClientProvider,
	useReport,
	useStatsTopPosts,
	// ... other exports
} from '@jetpack-premium-analytics/data';
```

## Features

- **React Query Integration**: Built on `@tanstack/react-query` for
  caching and state management
- **Data Processing**: Automatic sanitization of API responses
  (strings → numbers)
- **Comparison Support**: Built-in primary + comparison data fetching
- **TypeScript Support**: Fully typed data structures and API responses
- **Smart Caching**: Automatic cache invalidation and background
  refetching

## Usage

### Setup

```tsx
import { AnalyticsQueryClientProvider } from '@jetpack-premium-analytics/data';

function App() {
	return <AnalyticsQueryClientProvider>{ /* Your app components */ }</AnalyticsQueryClientProvider>;
}
```

### Fetching Data

Every report goes through `useReport`: hand it a query factory and the report
params, and it runs the primary request plus the comparison one when the params
carry a comparison range. The Stats hooks (`useStatsTopPosts`,
`useStatsReferrers`, `useStatsVisits`, …) are built on it, one per endpoint of
the Stats API.

```tsx
import { useStatsTopPosts } from '@jetpack-premium-analytics/data';

function TopPosts( { reportParams } ) {
	const { primary, comparison, hasComparison } = useStatsTopPosts( reportParams );
	// `primary.data` is the sanitized report; `comparison.data` the previous
	// period's when `hasComparison`.
}
```

The WooCommerce report client lives in the WooCommerce Stats package, which
calls `useReport` with its own queries.

## API Reference

### `useReport( queryFactory, params, options? )`

Runs a report's primary query, and its comparison query when `params` carry
`compare_from` / `compare_to`.

**Parameters:**

- `queryFactory`: builds the query definition from the params of each request
- `params`: `ReportParams` with `from`, `to`, `interval`, and optional comparison params
- `options`: optional, e.g. `enabled`

**Returns:** `{ primary, comparison, hasComparison, isLoading, isFetching, hasData, isError, error, refetch }`

### `normalizeReportParams( search?, defaultPreset?, { lockedIntervals }? )`

Normalizes and validates report parameters, providing defaults when needed.

**Parameters:**

- `search`: Optional partial parameters object, as read off the URL
- `defaultPreset`: `PresetType | undefined` - Preset to open on when `search` names no dates; defaults to `getDefaultPreset()`
- `lockedIntervals`: `readonly IntervalType[]` - Buckets the site's plan locks; the interval falls back to an open one

**Returns:** `ReportParams` with normalized parameters

**Defaults:** The reader's last applied preset, else their Jetpack Stats v1 range, else Last 7 days; daily interval when not specified

**Validation:** Ensures required fields are present for API calls

### `getDefaultIntervalForPeriod( preset, from, to )`

Returns the default interval for a preset / date range: the first one it allows.

**Parameters:**

- `preset`: `PrimaryPresetId | undefined` - Primary date-range preset, when known
- `from`: `string` - Start date
- `to`: `string` - End date

**Returns:** `IntervalType` - `'hour' | 'day' | 'week' | 'month' | 'year'`

**Example:**

```tsx
import { getDefaultIntervalForPeriod } from '@jetpack-premium-analytics/data';

const interval = getDefaultIntervalForPeriod( 'last-7-days', from, to ); // 'day'
```

### `resolveIntervalForRange( preset, from, to, current?, locked? )`

Returns a valid interval for a date range. Keeps `current` when it is still
allowed; otherwise returns the range default.

**Parameters:**

- `preset`: `PrimaryPresetId | undefined`
- `from`: `string`
- `to`: `string`
- `current`: `string | undefined` - Candidate interval to keep when still allowed
- `locked`: `readonly IntervalType[]` - Buckets the site's plan locks; `day` when none is left

**Returns:** `IntervalType`

### `resolveIntervalForPresetChange( currentPreset, nextPreset, from, to, currentInterval?, locked? )`

Returns a valid interval for a range picked while `currentPreset` was active.
Switching to a different named preset returns that preset's default; any other
change (same preset, `custom`, no preset) keeps `currentInterval` when still
allowed.

**Parameters:**

- `currentPreset`: `PrimaryPresetId | undefined`
- `nextPreset`: `PrimaryPresetId | undefined`
- `from`: `string`
- `to`: `string`
- `currentInterval`: `string | undefined` - Candidate interval to keep when still allowed
- `locked`: `readonly IntervalType[]` - Buckets the site's plan locks

**Returns:** `IntervalType`

### `needsReportDateParamsSeed( search?, lockedIntervals? )`

Returns whether report date params are incomplete or the interval is invalid
for the range (`from` / `to` / `interval` missing, or `interval` not allowed).

**Parameters:**

- `search`: date-window fields from unnormalized report params (`from`, `to`, `interval`, `preset`)
- `lockedIntervals`: `readonly IntervalType[] | undefined` - Buckets the site's plan locks, so a locked `interval` needs a seed

**Returns:** `boolean`

## Architecture

```
src/
├── api/                    # Transport: the proxy fetchers and the CSV export request
├── queries/                # React Query definitions, one per Stats endpoint
├── hooks/                  # useReport and the Stats hooks built on it
├── processing/             # Response sanitization (author, latest post, stats)
├── providers/              # React Query client provider
├── defaults/               # Default report params and presets
└── utils/                  # Report params, intervals, timezone, API errors
```

### Data Flow

1. **Component Consumption**: A component calls a hook, which builds the
   query from the report params
2. **Automatic Processing**: Raw API responses are sanitized
   (strings → numbers)
3. **Comparison Handling**: Primary and comparison queries are managed
   automatically
4. **Cache Management**: React Query handles caching, background updates,
   and invalidation

## Core Settings

Timezone-aware date helpers live in `@jetpack-premium-analytics/datetime`.

### `ensureCoreSettingsReady()`

Ensures the WordPress core `site` and `general settings` records are
resolved, so components reading them (e.g. `useSiteHomeUrl`) render with a
warm cache.

```typescript
// In route loaders or beforeLoad hooks
await ensureCoreSettingsReady();
```

**Returns:** `Promise<void>` - Resolves when settings are loaded

**Features:**

- Memoizes the promise to avoid duplicate requests
- Prevents race conditions during navigation
- Essential for route prefetching and hover preloading

These functions automatically use the WordPress site's timezone settings
and provide consistent date handling across the analytics interface.

## Complete API Exports

This package exports the following public API:

### Components

- `AnalyticsQueryClientProvider` - React Query provider wrapper

### Hooks

- `useReport` - Run a report query with comparison support
- `useStats*` - One hook per Stats endpoint (`useStatsTopPosts`, `useStatsReferrers`, `useStatsVisits`, …)

### Functions

- `normalizeReportParams` - Normalize and validate parameters
- `getDefaultIntervalForPeriod` - Default interval for a preset / range
- `resolveIntervalForRange` - Keep a still-valid candidate interval, else the range default
- `resolveIntervalForPresetChange` - Reset to the preset default on a named-preset switch, else keep a still-valid interval
- `needsReportDateParamsSeed` - Whether report date params are incomplete or the interval is invalid for the range
- `downloadReport` - Download one report as a CSV file

### Core Settings

- `ensureCoreSettingsReady` - Ensure core settings records are resolved

### Types

- `ReportParams` - The report params every hook takes
