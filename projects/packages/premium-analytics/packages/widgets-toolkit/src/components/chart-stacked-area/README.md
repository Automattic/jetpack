# StackedAreaChart

Series stacked into one total over time, built on `@automattic/charts` `AreaChart`. Use it when the
parts of a total matter as much as the total: requests by source, for example.

It takes the same series shape and tooltip as [`ComparativeLineChart`](../chart-comparative-line/README.md),
but it has no `styles` prop: colors come from the chart theme. It has no comparison series: every
series is a part of the stack.

## Usage

```tsx
import { StackedAreaChart } from '@jetpack-premium-analytics/widgets-toolkit';

<StackedAreaChart
	series={ series }
	dataFormat={ { type: 'number' } }
	tickResolution="day"
/>;
```

`series` is ordered bottom of the stack first. Give a series `options.stroke` to fix its color;
the rest come from the chart theme. Every point carries a number: a bucket with nothing in it is 0,
since `AreaChart` draws nothing at all when a value is `null`. It must be rendered inside a
`GlobalChartsProvider`.

## Outlined parts

Each part is drawn as an outline over a light fill of the same color, rather than the library's
near-opaque default, so a stack reads like the dashboard's line charts.

## No legend

The chart draws no legend. A stack has few, fixed parts, so the widget names them beside their
totals, where each name can carry its number.

## The y-axis fits the stack's total

The y domain is fixed to the stack's largest total (`rescaleYOnVisibilityChange={ false }`), so the
axis gutter fits that label and whole-number stacks keep whole-number ticks. All-zero data takes
the toolkit's empty domain, so the flat stack sits on the baseline.
