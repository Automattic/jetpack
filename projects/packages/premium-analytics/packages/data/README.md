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
	prefetchReport,
	// ... other exports
} from '@jetpack-premium-analytics/data';
```

## Features

- **React Query Integration**: Built on `@tanstack/react-query` for
  caching and state management
- **Prefetching Support**: Route-based data prefetching for improved
  performance
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

```tsx
import {
	useReportOrders,
	useReportOrdersByProductType,
	useReportOrderAttribution,
	useReportCoupons,
} from '@jetpack-premium-analytics/data';

function OrdersReport() {
	// Orders endpoint separates primary and comparison periods
	const { primary, comparison, hasComparison } = useReportOrders( {
		from: '2025-07-01T00:00:00',
		to: '2025-07-29T23:59:59',
		interval: 'day',
	} );
}

function OrdersByProductTypeReport() {
	// Orders by product type with filtering support
	const { primary, comparison, hasComparison } = useReportOrdersByProductType( {
		from: '2025-07-01T00:00:00',
		to: '2025-07-29T23:59:59',
		interval: 'day',
		filters: [
			{
				key: 'product_type',
				value: [ 'simple' ],
				compare: 'IN',
			},
		],
	} );
}

function OrderAttributionReport() {
	// Order attribution requires a view parameter
	const { primary, comparison, hasComparison } = useReportOrderAttribution( {
		from: '2025-07-01T00:00:00',
		to: '2025-07-29T23:59:59',
		interval: 'day',
		view: 'channel', // 'channel' | 'source' | 'campaign' | 'device' | 'channel-source'
	} );
}

function CouponsReport() {
	// Coupons works like orders with separate comparison requests
	const { primary, comparison, hasComparison } = useReportCoupons( {
		from: '2025-07-01T00:00:00',
		to: '2025-07-29T23:59:59',
		interval: 'day',
	} );
}
```

### Prefetching

```tsx
import { prefetchReport, ensureCoreSettingsReady } from '@jetpack-premium-analytics/data';

export const route = {
	beforeLoad: async () => {
		// Ensure site settings are loaded first
		await ensureCoreSettingsReady();

		// Now safely prefetch reports
		await prefetchReport( 'orders' );
	},
};
```

## API Reference

### Individual Hooks (Recommended)

#### `useReportOrders( params )`

Fetches orders report data with automatic processing and comparison support.

**Parameters:**

- `params`: `ReportParams` with `from`, `to`, `interval`, and optional comparison params

**Returns:** `{ primary, comparison, hasComparison }`

#### `useReportOrdersByProductType( params )`

Fetches orders report data filtered by product type or other product characteristics with automatic processing and comparison support.

**Parameters:**

- `params`: `ReportParams` with `from`, `to`, `interval`, optional `filters` array, and optional comparison params

**Filters Structure:**

```typescript
filters: Array< {
	key: string; // e.g., 'product_type', 'virtual'
	value: string | string[]; // e.g., ['simple'], '1'
	compare: '=' | 'IN' | 'NOT IN' | '!=' | '>' | '<' | '>=' | '<=';
} >;
```

**Common Filter Examples:**

- Product types: `{ key: 'product_type', value: ['simple', 'variable'], compare: 'IN' }`
- Virtual products: `{ key: 'virtual', value: '1', compare: '=' }`
- Non-virtual products: `{ key: 'virtual', value: '0', compare: '=' }`

**Returns:** `{ primary, comparison, hasComparison }`

#### `useReportOrderAttribution( params )`

Fetches order attribution data with built-in comparison handling.

**Parameters:**

- `params`: `ReportParams` with `from`, `to`, `interval`, `view`, and optional comparison params

**Returns:** `{ primary, comparison, hasComparison }`

#### `useReportCoupons( params )`

Fetches coupons report data with automatic processing and comparison support.

**Parameters:**

- `params`: `ReportParams` with `from`, `to`, `interval`, and optional comparison params

**Returns:** `{ primary, comparison, hasComparison }`

### Legacy Hook (Deprecated)

#### `useReport( reportType, params )`

**⚠️ Deprecated:** Use individual hooks instead for better type safety and performance.

**Parameters:**

- `reportType`: `'orders'` | `'orders-by-product-type'` | `'order-attribution'` | `'coupons'`
- `params`: `ReportParams`

**Returns:** Same as individual hooks above

### `prefetchReport( reportType, params )`

Prefetches data for improved performance. Same parameters as `useReport`.

**Usage:** Call in route `beforeLoad` functions for instant data loading

**Returns:** Promise that resolves when data is prefetched

**Caching:** Uses React Query cache, so subsequent `useReport` calls are
instant

**Example:**

```tsx
// Prefetch orders data
await prefetchReport( 'orders', { from, to, interval } );

// Prefetch orders by product type data
await prefetchReport( 'orders-by-product-type', {
	from,
	to,
	interval,
	filters: [ { key: 'product_type', value: [ 'simple' ], compare: 'IN' } ],
} );

// Prefetch order attribution data
await prefetchReport( 'order-attribution', { from, to, interval, view: 'channel' } );

// Prefetch coupons data
await prefetchReport( 'coupons', { from, to, interval } );
```

### `normalizeReportParams( params? )`

Normalizes and validates report parameters, providing defaults when needed.

**Parameters:**

- `params`: Optional partial parameters object

**Returns:** `{ primary, comparison? }` with normalized parameters

**Defaults:** Last 30 days, daily interval when not specified

**Validation:** Ensures required fields are present for API calls

### `getDefaultIntervalForPeriod( period, from, to )`

Returns the optimal default interval for a given time period.

**Parameters:**

- `period`: `string` - Period identifier (e.g., 'today', 'last-7-days', 'last-30-days')
- `from`: `string` - Start date
- `to`: `string` - End date

**Returns:** `IntervalType` - Optimal interval ('hour', 'day', 'week', 'month', 'quarter', 'year')

**Example:**

```tsx
import { getDefaultIntervalForPeriod } from '@jetpack-premium-analytics/data';

const interval = getDefaultIntervalForPeriod( 'last-7-days', from, to ); // Returns 'day'
```

### `ORDER_ATTRIBUTION_VIEWS`

Constant array of available order attribution views.

**Values:** `['channel', 'source', 'campaign', 'device', 'channel-source']`

**Example:**

```tsx
import { ORDER_ATTRIBUTION_VIEWS } from '@jetpack-premium-analytics/data';

// Use in components for view selection
const views = ORDER_ATTRIBUTION_VIEWS; // ['channel', 'source', ...]
```

## Architecture

```
src/
├── api/                    # API functions and query keys
│   ├── index.ts           # API exports
│   ├── constants.ts       # Shared API endpoint constants
│   ├── report-orders-fetch/                # Orders API client
│   │   ├── index.ts       # Orders API exports
│   │   └── report-orders-fetch.ts          # Orders API implementation
│   ├── report-orders-by-product-type-fetch/  # Orders by product type API client
│   │   ├── index.ts       # Orders by product type API exports
│   │   └── report-orders-by-product-type-fetch.ts  # Orders by product type API implementation
│   ├── report-order-attribution-summary-fetch/  # Attribution API client
│   │   ├── index.ts       # Attribution API exports
│   │   └── report-order-attribution-summary-fetch.ts  # Attribution API implementation
│   └── report-coupons-fetch/               # Coupons API client
│       ├── index.ts       # Coupons API exports
│       └── report-coupons-fetch.ts         # Coupons API implementation
├── queries/                # React Query configurations
│   ├── index.ts           # Query exports
│   ├── report-orders-query.ts              # Orders query definition
│   ├── report-orders-by-product-type-query.ts  # Orders by product type query definition
│   ├── report-order-attribution-summary-query.ts  # Attribution query definition
│   └── report-coupons-query.ts             # Coupons query definition
├── hooks/                  # React hooks
│   ├── index.ts           # Hook exports
│   └── use-report.ts      # Main useReport hook with comparison
├── prefetch/               # Prefetching functions
│   ├── index.ts           # Prefetch exports
│   └── prefetch-report-orders.ts  # Multi-report prefetch logic (orders + attribution + coupons)
├── processing/             # Data sanitization and transformation
│   ├── orders/            # Orders-specific data processing
│   ├── orders-by-product-type/  # Orders by product type data processing
│   ├── coupons/           # Coupons data processing
│   └── order-attribution/ # Attribution data processing
├── providers/              # React Context providers
│   ├── index.ts           # Provider exports
│   └── query-client-provider.tsx  # React Query client setup
├── defaults/               # Default parameters and configurations
├── utils/                  # Utility functions
│   ├── date.ts            # Date manipulation utilities (timezone-aware)
│   ├── ensure-core-settings.ts  # Core settings initialization
│   ├── interval.ts        # Interval calculation and optimization
│   ├── search.ts          # Search parameter utilities
│   └── types.ts           # Shared utility types (Override, etc.)
└── types.ts                # TypeScript type definitions
```

### Data Flow

1. **Route Prefetching**: `beforeLoad` calls `prefetchReport()` to load
   data
2. **Component Consumption**: Components use `useReport()` to access cached
   data
3. **Automatic Processing**: Raw API responses are sanitized
   (strings → numbers)
4. **Comparison Handling**: Primary and comparison queries are managed
   automatically
5. **Cache Management**: React Query handles caching, background updates,
   and invalidation

## Date Utilities

This package provides timezone-aware date utilities that integrate with
WordPress site settings:

### `localTZDate( value?, timezone? )`

Creates a timezone-aware date using the site's configured timezone by
default.

```typescript
import { localTZDate } from '@jetpack-premium-analytics/data';

const now = localTZDate(); // Current time in site timezone
const custom = localTZDate( '2024-01-15', 'America/New_York' );
```

**Parameters:**

- `value` (optional): `number | string | Date` - Date value to convert
- `timezone` (optional): `string` - Target timezone (defaults to site
  timezone)

**Returns:** `TZDate` - Timezone-aware date object

### `dateToISOStringWithLocalTZ( date, timezone? )`

Converts a date to ISO string with the site's timezone offset applied.

```typescript
const withTZ = dateToISOStringWithLocalTZ( new Date() );
// Returns: "2024-01-15T14:30:00.000-05:00" (with site timezone offset)
```

**Parameters:**

- `date`: `Date` - Date to convert
- `timezone` (optional): `string` - Target timezone (defaults to site
  timezone)

**Returns:** `string` - ISO string with timezone offset

### `getSiteTimezone()`

Returns the WordPress site's configured timezone string.

```typescript
const timezone = getSiteTimezone();
// Returns: "America/New_York" or "+05:30" (offset format)
```

**Returns:** `string` - Site timezone from WordPress settings

**Note:** This function will throw an error if called before core settings
are loaded. Use `ensureCoreSettingsReady()` in route loaders to prevent
this.

### `ensureCoreSettingsReady()`

Ensures WordPress core settings (site and general settings) are loaded
before accessing timezone-dependent functions.

```typescript
// In route loaders or beforeLoad hooks
await ensureCoreSettingsReady();
// Now getSiteTimezone() can be safely called
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

- `useReportOrders` - Hook for fetching orders report data
- `useReportOrdersByProductType` - Hook for fetching orders by product type with filtering
- `useReportOrderAttribution` - Hook for fetching order attribution data
- `useReportCoupons` - Hook for fetching coupons report data
- `useReport` - Legacy main hook for fetching report data (deprecated)

### Functions

- `prefetchReport` - Prefetch data for routes
- `normalizeReportParams` - Normalize and validate parameters
- `getDefaultIntervalForPeriod` - Get optimal interval for time period

### Date Utilities

- `localTZDate` - Create timezone-aware dates
- `dateToISOStringWithLocalTZ` - Convert to ISO with timezone
- `getSiteTimezone` - Get WordPress site timezone
- `ensureCoreSettingsReady` - Ensure settings are loaded

### Constants

- `ORDER_ATTRIBUTION_VIEWS` - Available attribution view types

### Types

- `ReportDataMap` - TypeScript type mapping for report data structures
