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
		// Same group as the metric it shadows, and `type: 'comparison'` is what
		// makes `alignSeriesDates` re-date it onto the primary's axis.
		group: 'primary',
		data: [ ... ],
		options: {
			type: 'comparison',
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

| Prop         | Type                           | Required | Description                                                   |
| ------------ | ------------------------------ | -------- | ------------------------------------------------------------- |
| `series`     | `ComparativeLineChartSeries[]` | Yes      | Array of series with data                                     |
| `styles`     | `SeriesStyle[]`                | No       | Styles for each series (by index)                             |
| `dataFormat` | `DataFormat`                   | Yes      | Format for values (Y-axis ticks and tooltips)                 |
| `tickFormat` | `DateFormatName`               | No       | Named X-axis date format; uses the chart default when omitted |
| `className`  | `string`                       | No       | CSS class for the chart container                             |
| `chartId`    | `string`                       | No       | Identity the charts provider keys visibility on; generated when omitted. Change it whenever `defaultHiddenSeries` should be applied again |
| `defaultHiddenSeries` | `readonly string[]`   | No       | Labels of series hidden until revealed from the legend. Applied once per `chartId`, so only useful with `legendInteractive` |
| `legendInteractive` | `boolean`             | No       | Let the reader click legend items to show and hide series. Defaults to `false` |

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

The component aligns previous-period series onto the axis dates for X-axis display:

1. The first series (`series[0]`) sets the axis dates
2. Only series marked `options.type: 'comparison'` are shifted onto those dates — a second
   current-period metric keeps its own
3. The original date is preserved in `realDate` for tooltip display

**Example**: A comparison series with Dec 25-31 dates will visually align to Jan 1-7 on the X-axis, but tooltips show the real Dec 25-31 dates.

## Empty State

When all values are zero, the chart shows a fixed Y-axis domain:

- `currency`: 0 - 4K
- `number`: 0 - 80
- `percentage`: 0% - 100%
