# Sparkline Chart Component

A minimal, word-sized chart component designed for showing trends at a glance. Perfect for dashboard metrics and inline data visualization.

## Features

- ✅ Clean, minimal design with no axes or grids
- ✅ Smooth monotone curves
- ✅ Optional gradient fill beneath the line
- ✅ Customizable colors and dimensions
- ✅ Responsive variant included
- ✅ Handles edge cases (empty data, single point, etc.)
- ✅ Theme integration support

## Installation

```bash
npm install @automattic/charts
# or
pnpm add @automattic/charts
```

## Basic Usage

```tsx
import { Sparkline } from '@automattic/charts';
import '@automattic/charts/sparkline/style.css';

function MetricCard() {
  const data = [10, 15, 12, 18, 22, 25, 23, 28];

  return (
    <div className="metric">
      <span>Speeding up</span>
      <span>28</span>
      <Sparkline
        data={data}
        width={120}
        height={48}
        color="#4CAF50"
      />
    </div>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `number[]` | **required** | Array of numeric values to plot |
| `width` | `number` | `100` | Width of the sparkline in pixels |
| `height` | `number` | `40` | Height of the sparkline in pixels |
| `color` | `string` | theme color | Color for the line stroke (hex or CSS color) |
| `strokeWidth` | `number` | `2` | Line stroke width in pixels |
| `withGradientFill` | `boolean` | `true` | Whether to render gradient fill beneath the line |
| `gradient` | `GradientConfig` | auto | Gradient configuration (from, to, fromOpacity, toOpacity) |
| `className` | `string` | - | Additional CSS class name |
| `margin` | `object` | `{2,2,2,2}` | Margin around the chart |

## Examples

### Trending Up

```tsx
<Sparkline
  data={[10, 15, 12, 18, 22, 25, 23, 28]}
  color="#4CAF50"
  width={120}
  height={48}
/>
```

### No Gradient

```tsx
<Sparkline
  data={[10, 15, 12, 18, 22, 25]}
  color="#2196F3"
  withGradientFill={false}
  width={120}
  height={48}
/>
```

### Custom Gradient

```tsx
<Sparkline
  data={[10, 15, 12, 18, 22, 25]}
  color="#00BCD4"
  gradient={{
    from: "#00BCD4",
    to: "#ffffff",
    fromOpacity: 0.8,
    toOpacity: 0.1,
  }}
  width={120}
  height={48}
/>
```

### Responsive

```tsx
<div style={{ width: '100%', maxWidth: '200px' }}>
  <Sparkline
    data={[10, 15, 12, 18, 22, 25]}
    color="#9C27B0"
    aspectRatio={0.3}
  />
</div>
```

### Dashboard Metrics

```tsx
const metrics = [
  { label: 'Speeding up', value: 28, data: [10, 15, 12, 18, 22, 25, 23, 28], color: '#4CAF50' },
  { label: 'Efficient', value: 90, data: [80, 82, 85, 83, 87, 90, 88, 92], color: '#2196F3' },
  { label: 'Unstable', value: 65, data: [50, 75, 45, 80, 40, 85, 55, 65], color: '#FF9800' },
];

return (
  <div style={{ display: 'flex', gap: '24px' }}>
    {metrics.map(metric => (
      <div key={metric.label} className="metric-card">
        <div className="metric-header">
          <span>{metric.label}</span>
          <span>{metric.value}</span>
        </div>
        <Sparkline
          data={metric.data}
          width={180}
          height={48}
          color={metric.color}
        />
      </div>
    ))}
  </div>
);
```

## Theme Integration

Sparklines integrate with the global charts theme:

```tsx
import { GlobalChartsProvider, jetpackTheme } from '@automattic/charts/providers';

<GlobalChartsProvider theme={jetpackTheme}>
  <Sparkline data={[10, 15, 12, 18]} />
</GlobalChartsProvider>
```

## Accessibility

Sparklines are decorative visualizations. For accessibility, ensure the parent container provides context:

```tsx
<div role="img" aria-label="Momentum trending upward, current value 28">
  <span>Momentum</span>
  <span>28</span>
  <Sparkline data={data} aria-hidden="true" />
</div>
```

## Edge Cases

The component handles various edge cases gracefully:

- **Empty data** (`[]`): Renders empty container
- **Single point** (`[42]`): Renders a circle
- **Two points** (`[10, 20]`): Renders minimal line
- **Negative values**: Supported
- **Flat line** (all same values): Renders horizontal line

## TypeScript

Full TypeScript support with exported types:

```tsx
import type { SparklineProps, CurveType, GradientConfig } from '@automattic/charts/sparkline';
```
