# DonutChart

A responsive donut (pie) chart component that automatically adapts to its container size.

## Features

- **Auto-resize**: Automatically scales to fit the parent container
- **Pure component**: No context dependencies - all data flows through props
- **Theme support**: Colors can be provided via `styles` prop or inline in `chartData`
- **Comparison mode**: Shows delta percentage when `comparisonValue` is provided
- **Legend integration**: Optional legend with comparison deltas
- **Validation**: Falls back to metric-only display when data is invalid

## Usage

```tsx
import { DonutChart } from '@jetpack-premium-analytics/widgets-toolkit';

const chartData = [
	{ label: 'Completed', value: 45, percentage: 56.25 },
	{ label: 'Pending', value: 25, percentage: 31.25 },
	{ label: 'Cancelled', value: 10, percentage: 12.5 },
];

const styles = [ { color: '#3858E9' }, { color: '#66BDFF' }, { color: '#A77EFF' } ];

<DonutChart
	chartData={ chartData }
	styles={ styles }
	value={ 80 }
	comparisonValue={ 72 }
	showLegend={ true }
	legendData={ legendItems }
	dataFormat={ { type: 'number' } }
/>;
```

## Props

| Prop              | Type             | Default              | Description                                                        |
| ----------------- | ---------------- | -------------------- | ------------------------------------------------------------------ |
| `chartData`       | `DonutChartData` | required             | Array of segments with `label`, `value`, and `percentage`          |
| `styles`          | `SegmentStyle[]` | -                    | Explicit colors per segment (takes priority over chartData colors) |
| `value`           | `number`         | required             | Primary metric value displayed in center                           |
| `comparisonValue` | `number \| null` | -                    | Previous period value for delta calculation                        |
| `dataFormat`      | `DataFormat`     | `{ type: 'number' }` | Format configuration for the metric display                        |
| `legendData`      | `LegendItem[]`   | -                    | Legend items with labels and comparison values                     |
| `showLegend`      | `boolean`        | `true`               | Whether to show the legend below the chart                         |
| `thickness`       | `number`         | `0.3`                | Arc thickness as ratio (0-1)                                       |

## Data Validation

The component validates chart data before rendering:

1. **No negative values**: Both `value` and `percentage` must be >= 0
2. **100% total**: Percentages must sum to approximately 100% (within 0.01 tolerance)

When validation fails, the component displays a fallback view showing only the metric and legend without the chart.

## Responsive Layout

The component uses a reference/wrapper pattern to achieve fluid sizing:

```
┌─────────────────────────────┐
│ .reference (relative)       │ ← Takes 100% width from parent
│ ┌─────────────────────────┐ │
│ │ .wrapper (absolute)     │ │ ← Fills reference, observed by ResizeObserver
│ │ ┌─────────────────────┐ │ │
│ │ │ Stack (content)     │ │ │ ← Chart + Legend
│ │ └─────────────────────┘ │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

### How it works

1. **`.reference`** - Outer container with `position: relative` and `width: 100%`. Sets initial height from content or defaults to 164px.

2. **`.wrapper`** - Absolutely positioned to fill the reference. The `ResizeObserver` attached to the inner `Stack` captures available dimensions.

3. **Dynamic sizing** - The chart size is calculated as the minimum of container width, height, and the default size (164px).

4. **SVG scaling** - The `PieChart` receives the calculated size and renders proportionally.

### Default dimensions

Before the first resize observation, the chart uses sensible defaults:

- Size: 164px (width and height)

## Storybook

Run `pnpm storybook` and navigate to **Widgets Toolkit / Components / DonutChart** to see:

- **Default** - Basic chart without legend
- **WithLegend** - Chart with legend items
- **WithComparison** - Shows positive delta
- **NegativeComparison** - Shows negative delta
- **CurrencyFormat** - Currency formatted values
- **Resizable** - Drag container edges to test auto-resize
- **SmallContainer** - 200px narrow container
- **LargeContainer** - 400px wide container with 5 segments
- **BookingsByStatus** - Real-world booking status example
- **NewVsReturning** - Customer segmentation example
- **InvalidData** - Shows fallback when data is invalid

## Providing Colors

Colors can be provided in two ways:

### 1. Via `styles` prop (recommended)

```tsx
const styles = [
  { color: '#3858E9' },
  { color: '#66BDFF' },
  { color: '#A77EFF' },
];

<DonutChart styles={ styles } ... />
```

### 2. Inline in chartData

```tsx
const chartData = [
	{ label: 'Completed', value: 45, percentage: 56, color: '#3858E9' },
	{ label: 'Pending', value: 25, percentage: 31, color: '#66BDFF' },
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

<DonutChart styles={ segmentStyles } ... />
```

## Comparison with SemiCircleChart

| Feature         | DonutChart          | SemiCircleChart        |
| --------------- | ------------------- | ---------------------- |
| Shape           | Full circle         | Half circle            |
| Use case        | Status distribution | Two-segment comparison |
| Default size    | 164px               | 220x100px              |
| Metric position | Center              | Bottom center          |
