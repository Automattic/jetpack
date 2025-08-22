# Chart Composition API

This directory contains shared utilities for implementing the composition API pattern across all chart components.

## Overview

The composition API allows charts to accept child components through a structured pattern:

```jsx
<Chart data={data}>
  <Chart.SVG>
    {/* SVG elements rendered inside the chart */}
  </Chart.SVG>
  
  <Chart.HTML>
    {/* HTML elements rendered outside the SVG */}
  </Chart.HTML>
  
  <Chart.Legend />
</Chart>
```

## Components

### ChartSVG & ChartHTML
Base components that serve as markers for content placement. Charts should create their own versions with proper display names:

```tsx
const PieChartSVG = (props) => <ChartSVG {...props} />;
PieChartSVG.displayName = 'PieChart.SVG';
```

### useChartChildren Hook
Processes and categorizes children into SVG, HTML, and other content:

```tsx
const { svgChildren, htmlChildren, otherChildren } = useChartChildren(children, 'PieChart');
```

### Types
- `BaseChartSubComponents`: Standard interface for chart subcomponents
- `ChartComponentWithComposition`: Type helper for charts with composition API

## Usage

To add composition API to a chart:

1. Import the shared utilities
2. Create chart-specific compound components with proper display names
3. Use `useChartChildren` to process children
4. Use `attachSubComponents` to attach compound components
5. Render categorized children in appropriate locations

## Benefits

- **DRY**: Eliminates duplicate code across chart components
- **Consistency**: Ensures all charts follow the same pattern
- **Maintainability**: Changes to composition logic only need to be made once
- **Type Safety**: Shared types ensure consistency