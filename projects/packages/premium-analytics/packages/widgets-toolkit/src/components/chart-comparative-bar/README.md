# ComparativeBarChart

A date-keyed bar chart with previous-period comparison, built on `@automattic/charts` `BarChart`.
The bar counterpart to [`ComparativeLineChart`](../chart-comparative-line/README.md): it takes the
same series shape and shares its date alignment, so `MetricTabsChart` swaps the two on one flag.

## Theme-driven, not pure

Unlike `ComparativeLineChart`, this component reads the chart theme through
`useGlobalChartsContext()` and **must be rendered inside a `GlobalChartsProvider`** — outside one
that hook throws, before `BarChart` gets a chance to supply its own.

That is also why there is deliberately no `styles` prop. The comparison shadow's geometry comes
from the theme's `barChart.barStyles.comparison.widthFactor`, and its distinctness from the current
period comes from that entry's `opacity` — passing fills in here would decouple the shadow from the
bar it shadows. Theme styles are read back only to tint the tooltip swatches, so they match what the
chart drew.

## Usage

```tsx
import { ComparativeBarChart } from '@jetpack-premium-analytics/widgets-toolkit';

<ComparativeBarChart series={ series } dataFormat={ { type: 'number' } } compactWhenShort />;
```

A series marked `options.type: 'comparison'` renders as the previous-period shadow behind its
same-`group` primary series, and is the only kind `alignSeriesDates` moves: it re-dates such a
series onto the dates of the first series in the array. A chart may draw more than one metric — a
second current-period series keeps its own dates.

## Props

| Prop               | Type                          | Required | Description                                                   |
| ------------------ | ----------------------------- | -------- | ------------------------------------------------------------- |
| `series`           | `ComparativeBarChartSeries[]` | Yes      | Series to draw                                                |
| `dataFormat`       | `DataFormat`                  | Yes      | Format for values (Y-axis ticks and tooltips)                 |
| `tickFormat`       | `DateFormatName`              | No       | Named X-axis date format; uses the chart default when omitted |
| `compactWhenShort` | `boolean`                     | No       | Degrade to a sparkline under 140px of chart area              |
| `maxWidth`         | `number`                      | No       | Maximum chart width                                           |
| `className`        | `string`                      | No       | CSS class for the chart container                             |
| `chartId`          | `string`                      | No       | Identity the charts provider keys visibility on; generated when omitted. Change it whenever `defaultHiddenSeries` should be applied again |
| `defaultHiddenSeries` | `readonly string[]`        | No       | Labels of series hidden until revealed from the legend. Applied once per `chartId`, so only useful with `legendInteractive` |
| `legendInteractive` | `boolean`                    | No       | Let the reader click legend items to show and hide series. Defaults to `false` |

## Date alignment and tooltips

Comparison dates are aligned onto the primary series' dates so both land in the same band slot; the
original date survives in `realDate` and is what the tooltip shows.

The chart draws comparison series as a separate shadow layer rather than a registered series, so
their values never reach a custom `renderTooltip`. This component re-pairs them by date before
handing the data to `ChartTooltip` — without that, the shadow bar would be visible but its value
unreadable.

## Y-axis domain

Percentage metrics are pinned to 0%–100% and an all-zero period gets a readable axis instead of a
flat baseline, both via the shared `getFixedYAxis` helper, which also supplies the left margin such
a pinned domain needs. Zero-value bars are drawn as hairline stubs (`showZeroValues`) so a quiet day
reads as zero rather than missing data.
