# ComparativeBarChart

A date-keyed bar chart with previous-period comparison, built on `@automattic/charts` `BarChart`.
The bar counterpart to [`ComparativeLineChart`](../chart-comparative-line/README.md): it takes the
same series shape and shares its date alignment, so `MetricTabsChart` swaps the two on one flag.

## Series Styles from the Theme

Unlike `ComparativeLineChart`, which takes its series styles from props, this component reads them
from the chart theme through `useGlobalChartsContext()`. It **must be rendered inside a
`GlobalChartsProvider`** — outside one that hook throws, before `BarChart` gets a chance to supply
its own.

That is also why there is deliberately no `styles` prop. The comparison bar's width comes from the theme's `barChart.barStyles.comparison.widthFactor`. Charts draws a comparison opaque. Unless the comparison sets its own `stroke`, charts tints it from its primary's color and darkens the primary where needed, so the pair keeps 3:1 against the card and against each other. `overlayGroup` leaves the current period's comparisons unstroked for that, and `previousStrokes` gives the previous period exact colors. The chart's bar colors are read back only to color the tooltip and legend swatches, so they match what the chart drew.

## Usage

```tsx
import { ComparativeBarChart } from '@jetpack-premium-analytics/widgets-toolkit';

<ComparativeBarChart series={ series } dataFormat={ { type: 'number' } } compactWhenShort />;
```

A series marked `options.type: 'comparison'` renders as the previous-period shadow behind its
same-`group` primary series, and is the only kind `alignSeriesDates` moves: it re-dates such a
series onto the dates of the first series in the array. A chart may draw more than one metric — a
second current-period series keeps its own dates.

With `overlayGroup`, the series are regrouped by period instead: each period takes one slot, the previous period's beside the current one, and the `overlayGroup` series is the primary, with the other groups' series as wider comparisons behind it. A comparison stays in its slot while the primary is hidden. The legend then names the previous period with one static item.

## Props

| Prop                  | Type                          | Required | Description                                                                                                                               |
| --------------------- | ----------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `series`              | `ComparativeBarChartSeries[]` | Yes      | Series to draw                                                                                                                            |
| `dataFormat`          | `DataFormat`                  | Yes      | Format for values (Y-axis ticks and tooltips)                                                                                             |
| `tickFormat`          | `DateFormatName`              | No       | Named X-axis date format; uses the chart default when omitted                                                                             |
| `compactWhenShort`    | `boolean`                     | No       | Degrade to a sparkline under 140px of chart area                                                                                          |
| `maxWidth`            | `number`                      | No       | Maximum chart width                                                                                                                       |
| `className`           | `string`                      | No       | CSS class for the chart container                                                                                                         |
| `chartTitle`          | `string`                      | No       | What the chart shows, such as the widget title; the chart is named "Chart: <title>"                                                       |
| `chartId`             | `string`                      | No       | Identity the charts provider keys visibility on; generated when omitted. Change it whenever `defaultHiddenSeries` should be applied again |
| `defaultHiddenSeries` | `readonly string[]`           | No       | Labels of series hidden until revealed from the legend. Applied once per `chartId`, so only useful with `legendInteractive`               |
| `legendInteractive`   | `boolean`                     | No       | Let the reader click legend items to show and hide series; the first item stays locked. Defaults to `false`                               |
| `comparisonLabel`     | `string`                      | No       | Names the comparison in each metric's previous-period legend item, e.g. "Prev. 30 days". Defaults to "Previous period"                    |
| `overlayGroup`        | `string`                      | No       | Give each period one slot, with this group's bar in front of the others                                                                   |
| `previousStrokes`     | `Record< string, string >`    | No       | Each group's previous-period color, applied only with `overlayGroup`                                                                      |

## Date alignment and tooltips

Comparison dates are aligned onto the primary series' dates so both land in the same band slot; the
original date survives in `realDate` and is what the tooltip shows, as a span when the point's
`endDate` falls on a later day.

The chart draws comparison series as a separate shadow layer rather than a registered series, so
their values never reach a custom `renderTooltip`. This component re-pairs them by date before
handing the data to `DatedTooltip` — without that, the shadow bar would be visible but its value
unreadable.

## Y-axis domain

Percentage metrics are pinned to 0%–100% and an all-zero period gets a readable axis instead of a
flat baseline, both via the shared `getFixedYAxis` helper. Zero-value bars are drawn as hairline
stubs (`showZeroValues`) so a quiet day reads as zero rather than missing data.
