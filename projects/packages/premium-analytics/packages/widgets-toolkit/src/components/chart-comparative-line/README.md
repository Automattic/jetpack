# ComparativeLineChart

A **pure** line chart component for comparing time series data across different periods. Built on top of `@automattic/charts` with automatic date alignment for comparison series.

## Pure Component Design

This component is **pure and self-contained**—it receives all styling via props and has no external dependencies on context providers or themes.

```tsx
import { ComparativeLineChart } from '@jetpack-premium-analytics/widgets-toolkit';

<ComparativeLineChart
	series={ series }
	styles={ seriesStyles }
	dataFormat={ { type: 'currency' } }
/>;
```

**Why this matters:**

- Predictable rendering — same props always produce the same output
- Easy to test in isolation
- No implicit dependencies to track

## Basic Usage

### With `styles` prop (recommended)

The cleanest approach is to pass styles as a separate prop. Styles are applied to series by index:

```tsx
import { ComparativeLineChart, type SeriesStyle } from '@jetpack-premium-analytics/widgets-toolkit';

const styles: SeriesStyle[] = [
	{ stroke: '#3858E9', strokeWidth: 2 },
	{ stroke: '#3858E9', strokeDasharray: '4 4', strokeWidth: 1.5 },
];

const series = [
	{
		label: 'Jan 1-7, 2024',
		group: 'primary',
		options: {},
		data: [
			{ date: new Date( '2024-01-01' ), value: 1000 },
			{ date: new Date( '2024-01-02' ), value: 1200 },
		],
	},
	{
		label: 'Dec 25-31, 2023',
		group: 'primary',
		options: { type: 'comparison' },
		data: [
			{ date: new Date( '2023-12-25' ), value: 900 },
			{ date: new Date( '2023-12-26' ), value: 1100 },
		],
	},
];

<ComparativeLineChart series={ series } styles={ styles } dataFormat={ { type: 'currency' } } />;
```

### With styles in series (fallback)

Alternatively, define styles directly in each series via `options`.
This is useful when each series needs different colors or when styles are dynamically generated per-series:

```tsx
const series = [
	{
		label: 'Jan 1-7, 2024',
		group: 'primary',
		data: [ ... ],
		options: {
			stroke: '#10B981',
			seriesLineStyle: { strokeWidth: 2 },
		},
	},
	{
		label: 'Dec 25-31, 2023',
		group: 'comparison',
		data: [ ... ],
		options: {
			stroke: '#F59E0B',
			seriesLineStyle: { strokeDasharray: '4 4', strokeWidth: 1.5 },
		},
	},
];

<ComparativeLineChart series={ series } dataFormat={ { type: 'currency' } } />;
```

**Style resolution priority:** `styles` prop > `series[].options` fallback

## Using with Theme Providers

Widgets wrapped in `GlobalChartsProvider` can use `getElementStyles` from the context to resolve theme colors:

```tsx
import { ComparativeLineChart } from '@jetpack-premium-analytics/widgets-toolkit';
import { useGlobalChartsContext } from '@automattic/charts';

function MyWidget( { series } ) {
	const { getElementStyles } = useGlobalChartsContext();

	const seriesStyles = series.map( ( seriesData, index ) => {
		const { color, lineStyles } = getElementStyles( {
			data: seriesData,
			index,
		} );
		return {
			stroke: color,
			...lineStyles,
		};
	} );

	return (
		<ComparativeLineChart series={ series } styles={ seriesStyles } dataFormat={ dataFormat } />
	);
}
```

## Props

| Prop         | Type                           | Required | Description                                        |
| ------------ | ------------------------------ | -------- | -------------------------------------------------- |
| `series`     | `ComparativeLineChartSeries[]` | Yes      | Array of series with data                          |
| `styles`     | `SeriesStyle[]`                | No       | Styles for each series (by index)                  |
| `dataFormat` | `DataFormat`                   | Yes      | Format for values (Y-axis ticks and tooltips)      |
| `tickFormat` | `string`                       | No       | Custom X-axis date format (date-fns format string) |
| `className`  | `string`                       | No       | CSS class for the chart container                  |

## SeriesStyle Type

```typescript
type SeriesStyle = {
	stroke: string;
	strokeWidth?: number | string;
	strokeDasharray?: string | number;
	strokeLinecap?: 'butt' | 'round' | 'square' | 'inherit';
	strokeLinejoin?: 'miter' | 'round' | 'bevel' | 'inherit';
	opacity?: number | string;
};
```

## Date Alignment

The component automatically aligns comparison series to the primary series for X-axis display:

1. First series (`series[0]`) is the reference
2. Comparison series dates are shifted to align with the primary
3. Original dates are preserved for tooltip display

**Example**: A comparison series with Dec 25-31 dates will visually align to Jan 1-7 on the X-axis, but tooltips show the real Dec 25-31 dates.

## Empty State

When all values are zero, the chart shows a fixed Y-axis domain:

- `currency`: 0 - 4K
- `number`: 0 - 80
- `percentage`: 0% - 100%
