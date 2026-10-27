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
- `options`: optional. `enabled` turns the queries off, `disabledComparisonKey` parks the comparison query, and `refreshNotice: false` keeps a failed refresh out of the stale-data notice (default `true`)

**Returns:** `{ primary, comparison, hasComparison, isLoading, isFetching, hasData, isError, error, refetch }`

### `normalizeReportParams( search?, defaultPreset?, { lockedIntervals }? )`

Normalizes and validates report parameters, providing defaults when needed.

**Parameters:**

- `search`: Optional partial parameters object, as read off the URL
- `defaultPreset`: `PresetType | undefined` - Preset to open on when `search` names no dates; defaults to `getDefaultPreset()`
- `lockedIntervals`: `readonly LockableInterval[] | undefined` - Buckets the site's plan locks; the interval falls back to an open one. Defaults to none

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
- `locked`: `readonly LockableInterval[]` - Buckets the site's plan locks; `day` when none is left

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
- `locked`: `readonly LockableInterval[]` - Buckets the site's plan locks

**Returns:** `IntervalType`

### `intervalMenuOptions( params, locked, periods?, extension? )`

Returns what an interval menu lists: the buckets it can pick, the ones the widget withholds for
now, and the ones the range could draw but `locked` withholds, to list after them with a lock. A
bucket lands in one list only.

**Parameters:**

- `params`: `IntervalRange` (`{ preset?: PrimaryPresetId; from?: string; to?: string }`) - The range being edited
- `locked`: `readonly LockableInterval[]` - Buckets the site's plan locks
- `periods`: `readonly [ StatsPeriod, ...StatsPeriod[] ] | undefined` - The periods the chart draws; every bucket when omitted
- `extension`: `IntervalExtension | undefined` - The widget's own changes: `extra` buckets added after the range's, and `unavailable` ones listed unpickable with a `hint`. Pass the same one to `chartInterval`

**Returns:** `{ options: IntervalType[]; lockedOptions: LockableInterval[]; unavailableOptions: IntervalType[]; unavailableHint?: string }` - Each in the range's order, a widget's `extra` buckets last

### `needsReportDateParamsSeed( search?, lockedIntervals? )`

Returns whether report date params are incomplete or the interval is invalid
for the range (`from` / `to` / `interval` missing, or `interval` not allowed).

**Parameters:**

- `search`: date-window fields from unnormalized report params (`from`, `to`, `interval`, `preset`)
- `lockedIntervals`: `readonly LockableInterval[] | undefined` - Buckets the site's plan locks, so a locked `interval` needs a seed. Defaults to none

**Returns:** `boolean`

### `getStatsDatePolicy()`

Returns the `StatsDatePolicy` the site's plan sets, read from the Stats gates the server publishes
(`recent-7-days`, `long-date-presets`, `intervals`) in the site's reporting timezone. A server that
publishes no gates gets `OPEN_DATE_POLICY`.

**Returns:** `StatsDatePolicy`

### `getSectionDatePolicy( section )`

Returns `getStatsDatePolicy()` for a dashboard section whose registration sets
`follows_plan_date_limits` (Traffic, and the reports and ranges opened on it), and
`OPEN_DATE_POLICY` for any other.
`isPlanDateLimitedSection( section )` answers the same question as a boolean.

**Returns:** `StatsDatePolicy`

### `applyStatsDatePolicy( params, policy, landingPresetId? )`

Moves a window the policy locks, or one that starts before its earliest day, to the policy's
fallback preset, drops a comparison the policy does not offer, and keeps the interval off locked
buckets.

**Parameters:**

- `params`: `ReportParams` - Normalized report params
- `policy`: `StatsDatePolicy`
- `landingPresetId`: `PresetType | undefined` - Where a replaced window lands instead of the fallback, when the policy allows it

**Returns:** `{ params, isWindowAdjusted, isComparisonDropped }`

### `getPolicyDefaultPreset( policy, defaultPreset? )`

Returns the preset a page opens on when its URL names no dates: `defaultPreset` (the reader's
own by default), or the policy's fallback when the policy locks it.

**Returns:** `PresetType`

### `isPresetLockedByPolicy( presetId, policy )`

Returns whether the policy locks a preset. Either date limit locks every single-year preset.

**Returns:** `boolean`

### `isDateLimitedPolicy( policy )`

Returns whether the policy sets any limit: a locked feature, or a locked bucket. `OPEN_DATE_POLICY`
sets none.

**Returns:** `boolean`

### `ReportScopeProvider`'s `dateLimits`

The date options the surface's plan locks, as `DateLimits`: the policy's `lockedPresetIds`,
`earliestDate` and `lockedIntervals`, plus the `upsell` for locked periods and the
`intervalUpsell` for locked chart intervals, each copy carrying its own `onUpgradeClick`.
The date controls read it through `useReportScope()`; absent where the host applies no limits.

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
- `useScopeLockedIntervals` - The buckets the nearest report scope's plan locks; none where it sets no date limits

### Functions

- `normalizeReportParams` - Normalize and validate parameters
- `getDefaultIntervalForPeriod` - Default interval for a preset / range
- `resolveIntervalForRange` - Keep a still-valid candidate interval, else the range default
- `resolveIntervalForPresetChange` - Reset to the preset default on a named-preset switch, else keep a still-valid interval
- `intervalMenuOptions` - The open, withheld and locked buckets an interval menu lists
- `getDaysBetweenInclusive` - The calendar days a range spans, both ends counted
- `needsReportDateParamsSeed` - Whether report date params are incomplete or the interval is invalid for the range
- `getStatsDatePolicy` - The date limits the site's plan sets
- `getSectionDatePolicy` - The date limits a dashboard section follows
- `isPlanDateLimitedSection` - Whether a dashboard section's dates follow the plan
- `applyStatsDatePolicy` - Keep report params within a date policy
- `getPolicyDefaultPreset` - The preset a page opens on within a date policy
- `isPresetLockedByPolicy` - Whether a date policy locks a preset
- `isDateLimitedPolicy` - Whether a date policy sets any limit
- `downloadReport` - Download one report as a CSV file

### Core Settings

- `ensureCoreSettingsReady` - Ensure core settings records are resolved

### Constants

- `OPEN_DATE_POLICY` - The date policy of a plan that sets no limits

### Types

- `ReportParams` - The report params every hook takes
- `LockableInterval` - A bucket a plan can lock (`week`, `month`, `year`)
- `IntervalRange` - A range as the interval helpers read it (`preset`, `from`, `to`)
- `IntervalExtension` - The buckets a widget adds to its range (`extra`) or lists unpickable with a hint (`unavailable`)
- `StatsDatePolicy` - The date limits a plan sets: open, the last 7 days, or no long presets
- `DateLimitFeature` - The Stats gate a date limit comes from
- `DateLimits` - The date limits a report scope declares to its controls
- `DateLimitUpsellCopy` - The copy, links and upgrade callback of an upsell beside locked date options
