# @automattic/jetpack-premium-analytics-widgets-toolkit

A collection of focused, single-responsibility components for building analytics widgets.
Each component has a clear API and specific purpose, making them easy to understand, test, and compose.

## Installation

This is an internal package of Jetpack Premium Analytics — it is never
published to npm and is resolved entirely in-tree. It's automatically
available to routes and other internal packages within
`@automattic/jetpack-premium-analytics`.

## Components

### MetricValue

Displays a formatted numeric value. Does NOT handle comparisons or deltas.

**Props:**

- `value` (number) - The numeric value to display
- `format` ('number' | 'currency' | 'percentage') - How to format the value (default: 'number')
- `formatter` ((value: number) => string) - Custom formatter function (overrides format)
- `size` ('small' | 'medium' | 'large') - Size variant (default: 'medium')
- `color` ('neutral' | 'positive' | 'negative') - Color variant (default: 'neutral')
- `className` (string) - CSS class for styling

**Examples:**

```tsx
import { MetricValue } from '@jetpack-premium-analytics/widgets-toolkit';

// Simple number
<MetricValue value={ 1234 } />

// Currency
<MetricValue value={ 1234.56 } format="currency" />

// Custom formatter
<MetricValue value={ 1234 } formatter={ ( v ) => `${ v } items` } />

// Large positive value
<MetricValue value={ 5000 } size="large" color="positive" />
```

---

### MetricDelta

Displays the change between two values (as percentage or absolute).

**Props:**

- `current` (number) - The current/new value
- `previous` (number) - The previous/comparison value
- `fallback` (string) - Display when calculation fails (default: '—')
- `hideZero` (boolean) - Hide when delta is zero (default: false)
- `invertColors` (boolean) - For metrics where decrease is improvement (default: false)
- `showAbsolute` (boolean) - Show absolute change instead of percentage (default: false)
- `absoluteFormat` ('number' | 'currency') - Format for absolute values (default: 'number')
- `className` (string) - CSS class for styling

**Examples:**

```tsx
import { MetricDelta } from '@jetpack-premium-analytics/widgets-toolkit';

// Percentage change: +50%
<MetricDelta current={ 150 } previous={ 100 } />

// Absolute change: +50
<MetricDelta current={ 150 } previous={ 100 } showAbsolute />

// Inverted colors (for metrics where lower is better)
// Shows -33% in green
<MetricDelta current={ 20 } previous={ 30 } invertColors />

// Hide when no change
<MetricDelta current={ 100 } previous={ 100 } hideZero />
```

**Delta Calculation:**

- Returns percentage change: `( ( current - previous ) / |previous| ) * 100`
- Returns `null` if inputs are invalid or previous is zero (displays fallback)
- Returns `0` if both current and previous are zero

---

### MetricWithComparison

Composite component that combines MetricValue and MetricDelta.

**Props:**

- `value` (number) - The current value
- `previousValue` (number | null) - Previous value for comparison (no delta if null)
- `format` ('number' | 'currency' | 'percentage') - How to format the value (default: 'number')
- `formatter` ((value: number) => string) - Custom formatter for the value
- `direction` ('row' | 'column') - Layout direction (default: 'row')
- `size` ('small' | 'medium' | 'large') - Size of the main value (default: 'medium')
- `invertDeltaColors` (boolean) - Invert delta colors (default: false)
- `hideDeltaOnZero` (boolean) - Hide delta when zero (default: false)
- `showAbsoluteDelta` (boolean) - Show absolute change (default: false)
- `deltaFallback` (string) - Delta fallback text
- `className` (string) - Container CSS class

**Examples:**

```tsx
import { MetricWithComparison } from '@jetpack-premium-analytics/widgets-toolkit';

// Simple metric with comparison
<MetricWithComparison
  value={ 1250 }
  previousValue={ 1000 }
  format="currency"
/>
// Renders: $1,250  +25%

// Metric where lower is better (e.g., bounce rate)
<MetricWithComparison
  value={ 15 }
  previousValue={ 20 }
  format="percentage"
  invertDeltaColors
/>
// Renders: 15%  -25% (in green)

// Vertical layout
<MetricWithComparison
  value={ 1250 }
  previousValue={ 1000 }
  direction="column"
/>

// No comparison
<MetricWithComparison
  value={ 1250 }
  previousValue={ null }
  format="currency"
/>
// Renders: $1,250 (no delta)
```

---

### ComparativeLineChart

Responsive line chart wrapper for displaying time-series data with comparison support.
Handles automatic resizing and provides sensible defaults for analytics visualizations.

**Props:**

- `series` (SeriesData[]) - Array of series data to display in the chart
- `dataFormat` (DataFormat) - Format configuration for tooltips (required)
- `className` (string) - CSS class for the chart container (optional)

**Note:** Y-axis ticks are automatically formatted using the `dataFormat.type` with multipliers and zero decimals for concise labels (e.g., "1K", "2.5M"). Tooltips display full precision values according to `dataFormat` configuration.

**DataFormat Type:**

```tsx
type DataFormat = {
	type: 'number' | 'currency' | 'percentage' | 'average';
	options?: {
		useMultipliers?: boolean;
		decimals?: number;
	};
};
```

**Examples:**

```tsx
import { ComparativeLineChart, getFormatByMetricKey } from '@jetpack-premium-analytics/widgets-toolkit';

// Simple line chart with currency formatting
<ComparativeLineChart
  series={ [
    {
      key: 'primary',
      label: 'Current Period',
      data: [
        { date: new Date( '2024-01-01' ), value: 100 },
        { date: new Date( '2024-01-02' ), value: 150 },
        { date: new Date( '2024-01-03' ), value: 120 },
      ],
    },
  ] }
  dataFormat={ { type: 'currency' } }
/>

// Chart with comparison data and number format
<ComparativeLineChart
  series={ [
    {
      key: 'primary',
      label: 'This Period',
      data: currentData,
    },
    {
      key: 'comparison',
      label: 'Previous Period',
      data: previousData,
    },
  ] }
  dataFormat={ { type: 'number' } }
/>

// Chart with multipliers (for large numbers like visitors)
<ComparativeLineChart
  series={ series }
  dataFormat={ {
    type: 'number',
    options: { useMultipliers: true, decimals: 0 }
  } }
/>

// Using helper for predefined metric formats
<ComparativeLineChart
  series={ series }
  dataFormat={ getFormatByMetricKey( 'total_sales' ) }
/>
```

---

### ChartTooltip

Internal chart tooltip component used by `ComparativeLineChart`. Displays formatted values and dates for primary and comparison series.

**Props:**

- `tooltipData` - Tooltip data from chart (provided by LineChart)
- `colorScale` - Function to get color for series keys
- `dataFormat` (DataFormat) - Format configuration for values
- `shape` ('line' | 'circle' | 'rect') - Legend shape type (default: 'line')
- `shapeSize` (number) - Size of legend shape in pixels (default: 16)

**Note:** This component is typically used internally by `ComparativeLineChart` and doesn't need to be used directly.

---

## Helpers

### getFormatByMetricKey

Returns the appropriate `DataFormat` configuration for a given metric key.

**Signature:**

```tsx
function getFormatByMetricKey( metricKey: MetricKey ): DataFormat;
```

**Supported Metrics:**

- `orders_no` - Number format
- `total_sales` - Currency format
- `average_order_value` - Currency format
- `avg_items` - Average format
- `orders_value_net` - Currency format
- `orders_value_gross` - Currency format
- `coupons` - Currency format
- `profit_margin` - Currency format
- `visitors` - Number format with multipliers

**Example:**

```tsx
import { getFormatByMetricKey, ComparativeLineChart } from '@jetpack-premium-analytics/widgets-toolkit';

<ComparativeLineChart
  series={ ordersSeries }
  dataFormat={ getFormatByMetricKey( 'total_sales' ) }
/>
// Returns: { type: 'currency' }

<ComparativeLineChart
  series={ visitorsSeries }
  dataFormat={ getFormatByMetricKey( 'visitors' ) }
/>
// Returns: { type: 'number', options: { useMultipliers: true, decimals: 0 } }
```

---

### applyThemeStylesToSeries

Injects theme styles into chart series, so each series has everything it needs to render correctly (stroke color, strokeDasharray, strokeWidth, etc.) without depending on the theme context at render time.

**Signature:**

```tsx
function applyThemeStylesToSeries(
	series: SeriesData[],
	chartTheme: ReturnType< typeof useChartTheme >
): SeriesData[];
```

**Example:**

```tsx
import {
	applyThemeStylesToSeries,
	useChartTheme,
	ComparativeLineChart,
} from '@jetpack-premium-analytics/widgets-toolkit';

const chartTheme = useChartTheme();
const styledSeries = applyThemeStylesToSeries( series, chartTheme );

<ComparativeLineChart series={ styledSeries } dataFormat={ dataFormat } />;
```

**What it does:**

- Maps `chartTheme.seriesLineStyles` to each series
- Sets `options.stroke` from `chartTheme.colors[ 0 ]`
- Sets `options.seriesLineStyle` with strokeWidth, strokeDasharray, etc.
- Returns original series unchanged if no theme styles available

---

### formatOrderMetric

Creates a formatter function for a specific order metric.

**Signature:**

```tsx
function formatOrderMetric(
	metricKey: MetricKey,
	options?: FormatMetricValueOptions
): ( value: number ) => string;
```

**Example:**

```tsx
import { formatOrderMetric } from '@jetpack-premium-analytics/widgets-toolkit';

const formatter = formatOrderMetric( 'total_sales' );
formatter( 1234.56 ); // Returns: "$1,234.56"

const visitorFormatter = formatOrderMetric( 'visitors' );
visitorFormatter( 15000 ); // Returns: "15K"
```

---

## Types

### DataFormat

Configuration object for formatting chart values and tooltips.

```tsx
type DataFormat = {
	type: 'number' | 'currency' | 'percentage' | 'average';
	options?: {
		useMultipliers?: boolean; // Use K, M, B suffixes for large numbers
		decimals?: number; // Number of decimal places
	};
};
```

### MetricKey

Union type of all supported metric keys.

```tsx
type OrderMetricKey =
	| 'orders_no'
	| 'total_sales'
	| 'average_order_value'
	| 'avg_items'
	| 'orders_value_net'
	| 'orders_value_gross'
	| 'coupons'
	| 'profit_margin';

type VisitorsMetricKey = 'visitors';

type MetricKey = OrderMetricKey | VisitorsMetricKey;
```

---

## Styling

Components use CSS Modules for styling. You can customize appearance by:

1. **Using className props**: Pass custom classes to any component
2. **CSS variables**: Components respect design system tokens
3. **Overriding styles**: Use CSS Modules or styled-components

Example:

```tsx
<MetricWithComparison value={ 1250 } previousValue={ 1000 } className="custom-container" />
```
