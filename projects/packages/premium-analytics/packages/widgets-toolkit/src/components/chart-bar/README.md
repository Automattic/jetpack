# BarChart

A **pure** vertical bar chart component for displaying categorical data. Built on top of `@automattic/charts` with support for negative values, making it ideal for monetary widgets showing refunds, returns, or discounts.

## Pure Component Design

This component is **pure and self-contained**—it receives all styling via props and has no external dependencies on context providers or themes.

```tsx
import { BarChart } from '@jetpack-premium-analytics/widgets-toolkit';

<BarChart chartData={ chartData } styles={ barStyles } dataFormat={ { type: 'currency' } } />;
```

**Why this matters:**

- Predictable rendering — same props always produce the same output
- Easy to test in isolation
- No implicit dependencies to track

## Basic Usage

### With `styles` prop (recommended)

The cleanest approach is to pass styles as a separate prop. Styles are applied to series by index:

```tsx
import { BarChart, type BarChartStyle } from '@jetpack-premium-analytics/widgets-toolkit';

const styles: BarChartStyle[] = [ { stroke: '#3858E9' } ];

const chartData = [
	{
		label: 'Sales',
		data: [
			{ label: 'SUMMER20', value: 4500 },
			{ label: 'WELCOME10', value: 3200 },
			{ label: 'FLASH25', value: 2800 },
		],
	},
];

<BarChart chartData={ chartData } styles={ styles } dataFormat={ { type: 'currency' } } />;
```

### With styles in chartData (fallback)

Alternatively, define styles directly in each series via `options`.
This is useful when styles are dynamically generated per-series:

```tsx
const chartData = [
	{
		label: 'Sales',
		data: [ ... ],
		options: { stroke: '#10B981' },
	},
];

<BarChart chartData={ chartData } dataFormat={ { type: 'currency' } } />;
```

**Style resolution priority:** `styles` prop > `chartData[].options.stroke` fallback

## Handling Negative Values

The component supports negative values, making it ideal for showing refunds, returns, or discounts:

```tsx
const revenueData = [
	{
		label: 'Revenue',
		data: [
			{ label: 'Product Sales', value: 15000 },
			{ label: 'Shipping', value: 2500 },
			{ label: 'Refunds', value: -3200 },
			{ label: 'Discounts', value: -1500 },
		],
	},
];

<BarChart
	chartData={ revenueData }
	dataFormat={ { type: 'currency' } }
	styles={ [ { stroke: '#3858E9' } ] }
/>;
```

## Comparison Mode

Display multiple series to compare periods:

```tsx
const comparisonData = [
	{
		label: 'Current Period',
		data: [
			{ label: 'SUMMER20', value: 4500 },
			{ label: 'WELCOME10', value: 3200 },
		],
	},
	{
		label: 'Previous Period',
		data: [
			{ label: 'SUMMER20', value: 3800 },
			{ label: 'WELCOME10', value: 2900 },
		],
	},
];

const styles: BarChartStyle[] = [
	{ stroke: '#3858E9' }, // Primary - Blueberry
	{ stroke: '#66BDFF' }, // Comparison - Blue 30
];

<BarChart chartData={ comparisonData } styles={ styles } dataFormat={ { type: 'currency' } } />;
```

## Using with Theme Providers

Widgets wrapped in `GlobalChartsProvider` can use `getElementStyles` from the context to resolve theme colors:

```tsx
import { BarChart } from '@jetpack-premium-analytics/widgets-toolkit';
import { useGlobalChartsContext } from '@automattic/charts';

function MyWidget( { chartData } ) {
	const { getElementStyles } = useGlobalChartsContext();

	const barStyles = chartData.map( ( seriesData, index ) => {
		const { color } = getElementStyles( {
			data: seriesData,
			index,
		} );
		return { stroke: color };
	} );

	return (
		<BarChart chartData={ chartData } styles={ barStyles } dataFormat={ { type: 'currency' } } />
	);
}
```

## Props

| Prop         | Type              | Required | Description                                                |
| ------------ | ----------------- | -------- | ---------------------------------------------------------- |
| `chartData`  | `BarChartData`    | Yes      | Array of series with categorical data points               |
| `dataFormat` | `DataFormat`      | Yes      | Format for values (tooltips): currency, number, percentage |
| `styles`     | `BarChartStyle[]` | No       | Styles for each series (by index)                          |
| `className`  | `string`          | No       | CSS class for the chart container                          |

## BarChartStyle Type

```typescript
type BarChartStyle = {
	/** Bar fill color */
	stroke: string;
};
```

## DataFormat Type

```typescript
type DataFormat = {
	type: 'currency' | 'number' | 'percentage';
};
```

## Empty State

When all values are zero, the chart:

1. **Disables tooltips** — no meaningless "0" tooltips on hover
2. **Shows a fixed Y-axis domain** — so 0 appears at the bottom with meaningful tick values

Default domains by data format:

- `currency`: 0 - 4K
- `number`: 0 - 80
- `percentage`: 0% - 100%

## Internal Components

### ChartTooltip

The tooltip displays data points when hovering over bars. It uses:

- Rectangle indicators (matching bar shape)
- WPDS design tokens for consistent styling
- `MetricValue` component for formatted values

## Features

- **Responsive sizing**: Automatically adapts to container dimensions
- **Pure component**: No context dependencies - all data flows through props
- **Negative value support**: Can display both positive and negative values
- **Multiple series**: Support for comparison periods
- **Tooltips**: Built-in tooltip support with formatted values
- **Empty state handling**: Fixed Y-axis domain when data is empty
- **Custom styling**: Apply custom colors via `styles` prop or `className`
