# Legend

A pure component for rendering chart legends with optional comparison deltas.

## Usage

```tsx
import { Legend } from '@jetpack-premium-analytics/widgets-toolkit';

const items = [
	{ label: 'Mobile', value: 241950, displayValue: '$241.95K', color: '#3858E9' },
	{ label: 'Desktop', value: 148130, displayValue: '$148.13K', color: '#66BDFF' },
	{ label: 'Tablet', value: 44740, displayValue: '$44.74K', color: '#A77EFF' },
];

<Legend items={ items } />;
```

## Props

| Prop             | Type           | Default  | Description                      |
| ---------------- | -------------- | -------- | -------------------------------- |
| `items`          | `LegendItem[]` | required | Array of legend items to display |
| `withComparison` | `boolean`      | `false`  | Show comparison deltas           |

### LegendItem

| Property       | Type     | Required | Description                          |
| -------------- | -------- | -------- | ------------------------------------ |
| `label`        | `string` | yes      | Item label text                      |
| `value`        | `number` | yes      | Current numeric value                |
| `displayValue` | `string` | yes      | Display-ready formatted value        |
| `color`        | `string` | no       | Bullet color (hex, rgb, etc.)        |
| `comparison`   | `number` | no       | Previous value for delta calculation |

## With Comparison

```tsx
const items = [
	{
		label: 'Mobile',
		value: 241950,
		displayValue: '$241.95K',
		color: '#3858E9',
		comparison: 200000,
	},
	{
		label: 'Desktop',
		value: 148130,
		displayValue: '$148.13K',
		color: '#66BDFF',
		comparison: 160000,
	},
];

<Legend items={ items } withComparison />;
```

## Theme Integration

For widgets inside `GlobalChartsProvider`, use `LegendWithTheme` instead. It automatically resolves colors from the chart theme:

```tsx
import { LegendWithTheme as Legend } from '@jetpack-premium-analytics/widgets-toolkit';

// Colors are injected from theme - no need to specify them
<PieChart.Legend
	render={ chartItems => <Legend chartItems={ chartItems } items={ legendData } /> }
/>;
```

## Architecture

```
Legend (pure)
├── Receives items with colors already resolved
├── Renders Grid with LegendRow components
└── No context dependencies

LegendWithTheme (wrapper)
├── Resolves colors: item.color → chartItems → theme
├── Passes items with colors to Legend
└── Requires GlobalChartsProvider
```
