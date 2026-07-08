# ChartTooltip

A **shared** tooltip component for chart visualizations. Supports both line charts and bar charts with configurable indicator types and value formatting.

## Features

- **Dual indicator types**: `line` for line charts, `rect` for bar charts
- **Configurable extractors**: Custom `getLabel` and `getValue` functions
- **Sensible defaults**: Works with `datum.label` and `datum.value` out of the box
- **WPDS styling**: Uses design tokens for consistent appearance
- **MetricValue integration**: Formatted values with currency, number, or percentage

## Basic Usage

### With Line Charts

```tsx
import { ChartTooltip } from '../chart-tooltip';

const renderTooltip = params => (
	<ChartTooltip
		tooltipData={ params.tooltipData }
		dataFormat={ { type: 'currency' } }
		seriesStyles={ [
			{ stroke: '#3858E9', strokeWidth: 2 },
			{ stroke: '#3858E9', strokeDasharray: '4 4', strokeWidth: 1.5 },
		] }
		indicatorType="line"
		getLabel={ ( datum, index, _key ) => formatDate( datum.date ) }
	/>
);
```

### With Bar Charts

```tsx
import { ChartTooltip } from '../chart-tooltip';

const renderTooltip = params => (
	<ChartTooltip
		tooltipData={ params.tooltipData }
		dataFormat={ { type: 'currency' } }
		seriesStyles={ [ { stroke: '#3858E9' } ] }
		indicatorType="rect"
		// Uses default getLabel which extracts datum.label
	/>
);
```

## Props

| Prop            | Type                                       | Required | Description                                                                    |
| --------------- | ------------------------------------------ | -------- | ------------------------------------------------------------------------------ |
| `tooltipData`   | `{ datumByKey?: Record<string, unknown> }` | No       | Tooltip data from visx chart                                                   |
| `dataFormat`    | `DataFormat`                               | Yes      | Format for values: currency, number, percentage                                |
| `seriesStyles`  | `TooltipStyle[]`                           | Yes      | Styles for each series (color, stroke properties)                              |
| `indicatorType` | `'line' \| 'rect'`                         | Yes      | Shape indicator: line for line charts, rect for bars                           |
| `getLabel`      | `(datum, index, key) => string`            | No       | Custom label extractor. `key` is the series key/label (default: `datum.label`) |
| `getValue`      | `(datum) => number`                        | No       | Custom value extractor (default: `datum.value`)                                |

## TooltipStyle Type

```typescript
type TooltipStyle = {
	/** Color for the indicator */
	stroke: string;
	/** Stroke width (for line indicator) */
	strokeWidth?: string | number;
	/** Stroke dash array (for line indicator) */
	strokeDasharray?: string | number;
};
```

## Default Extractors

The component provides sensible defaults that work with common chart data patterns:

```typescript
// Default label extractor - uses datum.label
// The key parameter contains the series key (e.g., date range for bar charts)
function defaultGetLabel( datum: unknown, _index: number, _key: string ): string {
	return ( datum as { label: string } ).label ?? '';
}

// Default value extractor - uses datum.value
function defaultGetValue( datum: unknown ): number {
	return ( datum as { value: number } ).value;
}
```

### When to Use Custom Extractors

**Line charts with dates**: Pass a custom `getLabel` to format dates:

```tsx
const getLabel = ( datum, index, _key ) => {
	const isComparison = index > 0;
	const displayDate = isComparison ? datum.realDate ?? datum.date : datum.date;
	return formatDate( displayDate );
};
```

**Bar charts with label-value data**: Use defaults (no custom extractors needed):

```tsx
// Data format: { label: 'Category A', value: 1000 }
// Default extractors work automatically
```

## Indicator Types

### Line Indicator (`indicatorType="line"`)

Uses `LineShape` from the chart library. Supports:

- `stroke` - Line color
- `strokeWidth` - Line thickness
- `strokeDasharray` - Dashed line pattern (e.g., `'4 4'`)

### Rectangle Indicator (`indicatorType="rect"`)

Uses `RectShape` from the chart library. Supports:

- `stroke` - Fill color (8x8 pixel rectangle)

## Styling

The tooltip uses WPDS design tokens:

- `--wpds-color-foreground-content-neutral` - Text color
- `--wpds-elevation-sm` - Box shadow
- `--wpds-dimension-padding-sm` - Padding

Global visx-tooltip overrides are applied to ensure consistent layout.

## Used By

- `ComparativeLineChart` - With `indicatorType="line"` and custom date label
- `BarChart` - With `indicatorType="rect"` and default label/value extractors

---

# PieChartTooltip

A tooltip component for **pie** and **semi-circle** charts. Renders a single row with a color indicator, label, and formatted value.

Reuses the same SCSS module as `ChartTooltip` so styling (box-shadow, padding, visx-tooltip override) is shared.

## Basic Usage

```tsx
import { PieChartTooltip } from '../chart-tooltip';

const renderTooltip = ( { tooltipData } ) => (
	<PieChartTooltip tooltipData={ tooltipData } dataFormat={ { type: 'number' } } />
);
```

## Props

| Prop          | Type                  | Required | Description                                             |
| ------------- | --------------------- | -------- | ------------------------------------------------------- |
| `tooltipData` | `DataPointPercentage` | Yes      | Tooltip data from pie chart hover (label, value, color) |
| `dataFormat`  | `DataFormat`          | Yes      | Format for values: currency, number, percentage         |

## Used By

- `DonutChart` - Pie chart tooltip with color indicators
- `SemiCircleChart` - Half-pie chart tooltip with color indicators

---

# TooltipRow

A shared building-block component that renders a single tooltip row: **indicator + label + formatted value**. Used internally by both `ChartTooltip` and `PieChartTooltip`.

## Basic Usage

```tsx
import { TooltipRow } from '../chart-tooltip';
import { RectShape } from '@automattic/charts/visx/legend';

<TooltipRow
	indicator={ <RectShape fill="#3858E9" height={ 8 } width={ 8 } /> }
	label="Revenue"
	value={ 1234.56 }
	dataFormat={ { type: 'currency' } }
/>;
```

## Props

| Prop         | Type              | Required | Description                                                 |
| ------------ | ----------------- | -------- | ----------------------------------------------------------- |
| `indicator`  | `React.ReactNode` | Yes      | Pre-rendered indicator element (LineShape, RectShape, etc.) |
| `label`      | `string`          | Yes      | Row label text                                              |
| `value`      | `number`          | Yes      | Numeric value to format                                     |
| `dataFormat` | `DataFormat`      | Yes      | Format configuration (currency, number, percentage)         |

## Used By

- `ChartTooltip` - For line and bar chart tooltip rows
- `PieChartTooltip` - For pie and semi-circle chart tooltip rows
