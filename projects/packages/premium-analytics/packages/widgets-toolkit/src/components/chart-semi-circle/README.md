# SemiCircleChart

A responsive semi-circle (half-donut) chart component that fills its parent container.

## Features

- **Responsive**: Uses `@automattic/charts` responsive `PieSemiCircleChart` to fill the parent container
- **Pure component**: No context dependencies - all data flows through props
- **Theme support**: Colors can be provided via `styles` prop or inline in `chartData`
- **Comparison mode**: Shows delta percentage when `comparisonValue` is provided
- **Legend integration**: Optional legend with comparison deltas
- **Tooltips**: Optional hover tooltips with configurable formatting

## Usage

```tsx
import { SemiCircleChart } from '@jetpack-premium-analytics/widgets-toolkit';

const chartData = [
	{ label: 'Mobile', value: 4500 },
	{ label: 'Desktop', value: 2500 },
	{ label: 'Tablet', value: 1000 },
];

const styles = [ { color: '#3858E9' }, { color: '#66BDFF' }, { color: '#A77EFF' } ];

<SemiCircleChart
	chartData={ chartData }
	styles={ styles }
	value={ 8000 }
	comparisonValue={ 7450 }
	showLegend={ true }
	legendData={ legendItems }
	dataFormat={ { type: 'number', options: { useMultipliers: true } } }
	withTooltips
/>;
```

## Props

| Prop                | Type                  | Default              | Description                                                                |
| ------------------- | --------------------- | -------------------- | -------------------------------------------------------------------------- |
| `chartData`         | `SemiCircleChartData` | required             | Array of segments with `label` and `value` (percentage is auto-calculated) |
| `styles`            | `SegmentStyle[]`      | -                    | Explicit colors per segment (takes priority over chartData colors)         |
| `value`             | `number`              | required             | Primary metric value displayed in center                                   |
| `comparisonValue`   | `number \| null`      | -                    | Previous period value for delta calculation                                |
| `dataFormat`        | `DataFormat`          | `{ type: 'number' }` | Format configuration for the metric display                                |
| `legendData`        | `LegendItem[]`        | -                    | Legend items with labels and comparison values                             |
| `showLegend`        | `boolean`             | `true`               | Whether to show the legend below the chart                                 |
| `thickness`         | `number`              | `0.3`                | Arc thickness as ratio (0-1)                                               |
| `maxWidth`          | `number`              | `Infinity`           | Maximum width constraint for the chart                                     |
| `withTooltips`      | `boolean`             | `false`              | Enable tooltips on hover                                                   |
| `tooltipOffsetX`    | `number`              | -                    | Horizontal offset for tooltip positioning                                  |
| `tooltipOffsetY`    | `number`              | -                    | Vertical offset for tooltip positioning                                    |
| `tooltipDataFormat` | `DataFormat`          | -                    | Format for tooltip values (falls back to `dataFormat`)                     |
| `emptyStateIcon`    | `IconProps['icon']`   | -                    | Icon for empty state                                                       |
| `emptyStateText`    | `string`              | -                    | Text for empty state                                                       |

## Responsive Layout

The chart fills its parent container automatically using the responsive `PieSemiCircleChart` from `@automattic/charts`. Use `maxWidth` to constrain the size when needed:

```tsx
// Fills parent container
<SemiCircleChart chartData={ data } value={ 8000 } />

// Constrained to 220px max
<SemiCircleChart chartData={ data } value={ 8000 } maxWidth={ 220 } />
```

## Storybook

Run `pnpm storybook` and navigate to **Widgets Toolkit / Components / SemiCircleChart** to see:

- **Default** - Basic chart without legend
- **WithLegend** - Chart with legend items
- **WithComparison** - Shows positive delta
- **NegativeComparison** - Shows negative delta
- **Resizable** - Drag container edges to test auto-resize
- **SmallContainer** - 200px narrow container
- **LargeContainer** - 400px wide container with 5 segments

## Providing Colors

Colors can be provided in two ways:

### 1. Via `styles` prop (recommended)

```tsx
const styles = [
  { color: '#3858E9' },
  { color: '#66BDFF' },
  { color: '#A77EFF' },
];

<SemiCircleChart styles={ styles } ... />
```

### 2. Inline in chartData

```tsx
const chartData = [
	{ label: 'Mobile', value: 4500, color: '#3858E9' },
	{ label: 'Desktop', value: 2500, color: '#66BDFF' },
];
```

The `styles` prop takes priority when both are provided.

## Integration with Theme

For widgets using `GlobalChartsProvider`, obtain colors via `getElementStyles`:

```tsx
const { getElementStyles } = useGlobalChartsContext();

const segmentStyles = chartData.map( ( segment, index ) => {
  const { color } = getElementStyles( { data: segment, index } );
  return { color };
} );

<SemiCircleChart styles={ segmentStyles } ... />
```
