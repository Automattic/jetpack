# ChartTooltip

A tooltip for charts whose rows are label/value pairs, one per series. Date-bucketed charts (the comparative line and bar charts) use [`DatedTooltip`](#datedtooltip) below instead.

## Features

- **Dual indicator types**: `line` for line charts, `rect` for bar charts
- **Configurable extractors**: Custom `getLabel` and `getValue` functions
- **Sensible defaults**: Works with `datum.label` and `datum.value` out of the box
- **Shared box**: Content only; the chart's tooltip box draws the surface
- **MetricValue integration**: Formatted values with currency, number, or percentage

## Basic Usage

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

| Prop            | Type                                             | Required | Description                                                                                                                                                                                                                                                          |
| --------------- | ------------------------------------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tooltipData`   | `{ datumByKey?: Record<string, unknown> }`       | No       | Tooltip data from visx chart                                                                                                                                                                                                                                         |
| `dataFormat`    | `DataFormat`                                     | Yes      | Format for values: currency, number, percentage                                                                                                                                                                                                                      |
| `seriesStyles`  | `TooltipStyle[]`                                 | Yes      | Styles for each series (color, stroke properties)                                                                                                                                                                                                                    |
| `indicatorType` | `'line' \| 'rect'`                               | Yes      | Shape indicator: line for line charts, rect for bars                                                                                                                                                                                                                 |
| `getLabel`      | `(datum, index, key, value, rawValue) => string` | No       | Custom label extractor (default: `datum.label`). `key` is the series key/label; `value` is the row's value spelled out in full; `rawValue` is the number it spells. Both are `null` for a bucket with no reading                                                     |
| `getValue`      | `(datum) => number \| null`                      | No       | Custom value extractor (default: `datum.value`). A `null` value reads "No data"                                                                                                                                                                                      |

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
// The key parameter contains the series key (the series label, e.g. `Views · previous period`)
function defaultGetLabel( datum: unknown, _index: number, _key: string, _value: string ): string {
	return ( datum as { label: string } ).label ?? '';
}

// Default value extractor - uses datum.value, reading a missing one as null
function defaultGetValue( datum: unknown ): number | null {
	return ( datum as { value?: number | null } ).value ?? null;
}
```

### When to Use Custom Extractors

**Charts bucketed by date**: use `DatedTooltip`; see below.

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

The tooltip is content only. The chart draws the box around it: the shared `@automattic/charts` tooltip box, the same for every chart.

## Used By

- `BarChart` - With `indicatorType="rect"` and default label/value extractors

---

# DatedTooltip

The tooltip of the comparative line and bar charts. The hovered bucket's date heads the rows once; each row is the series swatch (or an icon, for a row the chart does not draw), the value in emphasis, then the unit (`130,859 Views`). With a comparison on, a second column lists the comparison bucket's values under its own date, each beside its row, with the comparison series' swatch. It renders as a table: each metric's two readings share a row, and the metric's cell is the row header, so the comparison value is read with its name.

## Basic Usage

The charts build the model from the rows the chart library reports, then render it:

```tsx
import { DatedTooltip, buildDatedTooltipModel } from '../chart-tooltip';

const renderTooltip = params => {
	const model = buildDatedTooltipModel( {
		tooltipData: params.tooltipData,
		series,
		seriesStyles,
		extras: tooltipExtras,
		dataFormat,
		formatDate: date => formatTooltipDate( date, tooltipDateFormat ),
	} );

	return model && <DatedTooltip model={ model } indicatorType="line" />;
};
```

## Model

`buildDatedTooltipModel()` groups the reported rows: a comparison series joins its group's current-period row as `previous` (one with no current series in its group, or no group, joins the first series). A comparison whose metric the chart did not report (a series the legend hid) is dropped with it. Extras are read at the hovered date from their own `data` and `previous` points; an extra with a reading in either period gets a row, and one that names a drawn series keeps that series' row. The header reads the hovered point's axis `date`, so a nearer comparison point cannot swap in its own; the first comparison point's `realDate` heads the comparison column.

| Field            | Type                                    | Description                                                                              |
| ---------------- | --------------------------------------- | ---------------------------------------------------------------------------------------- |
| `date`           | `string`                                | The hovered bucket's date, formatted                                                     |
| `previousDate`   | `string \| undefined`                   | The comparison bucket's date, when any row has a comparison                              |
| `rows[].name`    | `string`                                | The metric's name, read as the value's unit                                              |
| `rows[].countLabel` | `CountLabel \| undefined`           | The metric's plural-aware unit, from the series or extra                                 |
| `rows[].dataFormat` | `DataFormat`                         | The extra's own format, else the chart's                                                 |
| `rows[].indicator` | `series` / `icon` / `blank`           | The series swatch, the extra's `icon`, or a blank of the same width                      |
| `rows[].value`   | `number \| null`                        | The current reading; `null` reads as a dash, announced "No data for <name>"              |
| `rows[].previous` | `{ value, indicator } \| undefined`   | The comparison reading with its own indicator (the comparison series' swatch); absent or `null` reads as a dash |

## Reading

Each reading is one translated sentence, value then unit, through the metric's `countLabel` when it has one (`1 View`, `2 Views`) or `%1$s %2$s` otherwise; the value is rendered as its own element so it can take its own weight while translators keep the word order.

---

# PieChartTooltip

A tooltip component for **pie** and **semi-circle** charts. Renders a single row with a color indicator, label, and formatted value.

Like `ChartTooltip`, it is content only and sits in the chart's shared tooltip box.

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

| Prop         | Type              | Required | Description                                                             |
| ------------ | ----------------- | -------- | ----------------------------------------------------------------------- |
| `indicator`  | `React.ReactNode` | Yes      | Pre-rendered indicator element (LineShape, RectShape, etc.)             |
| `label`      | `string`          | Yes      | Row label text                                                          |
| `value`      | `number \| null`  | No       | Value to format; omit when the label carries it. `null` reads "No data" |
| `dataFormat` | `DataFormat`      | Yes      | Format configuration (currency, number, percentage)                     |

## Used By

- `ChartTooltip` - For line and bar chart tooltip rows
- `PieChartTooltip` - For pie and semi-circle chart tooltip rows
