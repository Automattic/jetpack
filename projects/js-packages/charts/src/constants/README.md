# Chart Constants

This directory contains centralized configuration and constants for the Automattic Charts library.

## Chart Defaults System

The `chart-defaults.ts` file provides a centralized, tree-shakeable system for managing default properties across all chart types.

### Architecture

```typescript
// Individual chart defaults (tree-shakeable)
export const BAR_CHART_DEFAULTS = { ... };
export const LINE_CHART_DEFAULTS = { ... };

// Collection for dynamic usage
export const CHART_DEFAULTS = {
  bar: BAR_CHART_DEFAULTS,
  line: LINE_CHART_DEFAULTS,
  // ...
};
```

### Usage

#### Static Import (Recommended - Tree-Shakeable)
```typescript
import { BAR_CHART_DEFAULTS } from '../../constants/chart-defaults';

const BarChart = ({
  showLegend = BAR_CHART_DEFAULTS.showLegend,
  orientation = BAR_CHART_DEFAULTS.orientation,
  // ...
}) => { /* ... */ };
```

#### Dynamic Import (When Chart Type is Runtime-Determined)
```typescript
import { getChartDefaults } from '../../constants/chart-defaults';

const chartDefaults = getChartDefaults(chartType);
```

### Extending the System

To add defaults for a new chart type:

1. **Define the chart's defaults:**
```typescript
export const SCATTER_CHART_DEFAULTS = {
  ...LEGEND_DEFAULTS,
  legendShape: 'circle' as LegendShape< any, number >,
  // Chart-specific defaults
  pointSize: 8,
  pointOpacity: 0.8,
  showRegressionLine: false,
} as const;
```

2. **Add to the CHART_DEFAULTS collection:**
```typescript
export const CHART_DEFAULTS = {
  // ... existing charts
  scatter: SCATTER_CHART_DEFAULTS,
} as const;
```

3. **Update ChartType:**
```typescript
export type ChartType = keyof typeof CHART_DEFAULTS;
```

### Adding Properties to Existing Charts

To add new default properties:

```typescript
export const BAR_CHART_DEFAULTS = {
  // ... existing defaults
  
  // New properties
  animationDuration: 300,
  animationEasing: 'ease-in-out',
  showValues: false,
  valuePosition: 'top' as const,
} as const;
```

### Benefits

- **Tree-Shaking**: Individual exports only bundle what you import
- **Type Safety**: Full TypeScript support with const assertions
- **Maintainability**: Single source of truth for all defaults
- **Extensibility**: Easy to add new charts or properties
- **Backward Compatible**: Supports both static and dynamic usage

### Legend Defaults

All charts share common legend defaults:
- Position: Bottom center
- Orientation: Horizontal
- Visible by default (`showLegend: true`)

Chart-specific legend shapes:
- Bar charts: Rectangle (`rect`)
- Line charts: Line (`line`)
- Pie charts: Circle (`circle`)

## Other Constants

Additional constant files may be added here following similar patterns for:
- Color palettes
- Animation presets
- Breakpoint definitions
- Accessibility constants