# ComparativeBarChart

A date-keyed bar chart with previous-period comparison, built on `@automattic/charts` `BarChart`.
The bar counterpart to [`ComparativeLineChart`](../chart-comparative-line/README.md): it takes the
same series shape and shares its date alignment, so `MetricTabsChart` swaps the two on one flag.

## Series Styles from the Theme

Unlike `ComparativeLineChart`, which takes its series styles from props, this component reads them
from the chart theme through `useGlobalChartsContext()`. It **must be rendered inside a
`GlobalChartsProvider`** — outside one that hook throws, before `BarChart` gets a chance to supply
its own.

That is also why there is deliberately no `styles` prop. The comparison shadow's geometry comes
from the theme's `barChart.barStyles.comparison.widthFactor`, and charts tones the shadow and the
bar in front of it so they stay distinct — passing fills in here would decouple the shadow from the
bar it shadows. Bar colors are read back from `useBarColors` only to color the tooltip swatches, so
they match what the chart drew.

## Usage

```tsx
import { ComparativeBarChart } from '@jetpack-premium-analytics/widgets-toolkit';

<ComparativeBarChart series={ series } dataFormat={ { type: 'number' } } compactWhenShort />;
```

A series marked `options.type: 'comparison'` renders as the previous-period shadow behind its
same-`group` primary series, and is the only kind `alignSeriesDates` moves: it re-dates such a
series onto the dates of the first series in the array, unless it is marked `aligned` because its
points already sit on the dates they compare with. A chart may draw more than one metric — a
second current-period series keeps its own dates.

## Props

| Prop                          | Type                          | Required | Description                                                                                                                                                                                     |
| ----------------------------- | ----------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `series`                      | `ComparativeBarChartSeries[]` | Yes      | Series to draw                                                                                                                                                                                  |
| `dataFormat`                  | `DataFormat`                  | Yes      | Format for values (Y-axis ticks and tooltips)                                                                                                                                                   |
| `tickFormat`                  | `DateFormatName`              | No       | Named X-axis date format; uses the chart default when omitted                                                                                                                                   |
| `compactWhenShort`            | `boolean`                     | No       | Degrade to a sparkline under 140px of chart area                                                                                                                                                |
| `maxWidth`                    | `number`                      | No       | Maximum chart width                                                                                                                                                                             |
| `className`                   | `string`                      | No       | CSS class for the chart container                                                                                                                                                               |
| `chartTitle`                  | `string`                      | No       | What the chart shows, such as the widget title; the chart is named "Chart: <title>"                                                                                                             |
| `chartId`                     | `string`                      | No       | Identity the charts provider keys visibility on; generated when omitted. Change it whenever `defaultHiddenSeries` should be applied again                                                       |
| `defaultHiddenSeries`         | `readonly string[]`           | No       | Labels of series hidden until revealed from the legend. Applied once per `chartId`, so only useful with `legendInteractive`                                                                     |
| `legendInteractive`           | `boolean`                     | No       | Let the reader click legend items to show and hide series; the first item stays locked. Defaults to `false`                                                                                     |
| `comparisonLabel`             | `string`                      | No       | Names the comparison in each metric's previous-period legend item, e.g. "Prev. 30 days". Defaults to "Previous period"                                                                          |
| `layout`                      | `'grouped' \| 'overlap'`      | No       | The bar chart's layout; see below. Defaults to `grouped`                                                                                                                                        |
| `primarySeries`               | `string`                      | No       | Label of the series the reader picked, when it is not the first one drawn. Its legend item comes first and stays locked                                                                         |
| `defaultPreviousPeriodShown`  | `boolean`                     | No       | Overlap layout only. Start the previous period shown or hidden, and let the reader toggle it from its legend item. Applied once per `chartId`. Omit it to keep the previous period always drawn |
| `onPreviousPeriodShownChange` | `( shown: boolean ) => void`  | No       | Called when the reader shows or hides the previous period from the legend                                                                                                                       |

## Overlap layout

With `layout="overlap"`, the chart draws each `group` inside the one before it, and the previous period in a slot beside the current one. The bars are opaque and charts tones them, so the tooltip and legend swatches read their colors from the charts `useBarColors` hook instead of the series colors. The series keep their `group`s: `group` still names the metric. The legend names the previous period with one item, in the color of the picked metric's previous bar, or else of its widest shown bar.

With `defaultPreviousPeriodShown`, that item becomes a toggle and the legend is interactive. The previous period starts as the prop says, and the charts context owns it after that, like `defaultHiddenSeries`. A metric's previous bar is drawn only while both the previous period and that metric are shown, and a hidden previous period leaves the tooltip too.

## Date alignment and tooltips

Comparison dates are aligned onto the primary series' dates so both land in the same band slot; the
original date survives in `realDate` and is what the tooltip shows; a week, or a month or year the range
cuts, is named by its span, and a whole year by the year alone.

The chart draws comparison series as a separate shadow layer rather than a registered series, so
their values never reach a custom `renderTooltip`. This component re-pairs them by date before
handing the data to `DatedTooltip` — without that, the shadow bar would be visible but its value
unreadable.

## Y-axis domain

Percentage metrics are pinned to 0%–100% and an all-zero period gets a readable axis instead of a
flat baseline, both via the shared `getFixedYAxis` helper. Zero-value bars are drawn as hairline
stubs (`showZeroValues`) so a quiet day reads as zero rather than missing data.
