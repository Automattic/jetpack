# LeaderboardChart

A responsive leaderboard (horizontal bar) chart component for displaying ranking and "top X by Y" data visualizations.

## Features

- **Context-aware styling**: Integrates with GlobalChartsProvider for consistent theming
- **Comparison mode**: Shows current vs. previous period data with delta indicators
- **Flexible formatting**: Supports currency, number, percentage, and custom formats
- **Empty state handling**: Built-in empty state with customizable content
- **Legend support**: Optional legend with customizable labels
- **Overlay labels**: Alternative styling with labels on top of bars
- **Loading states**: Skeleton loaders during data fetch
- **Long label handling**: Automatic truncation and tooltips for long labels

## Requirements

**Important**: This component must be rendered within a `GlobalChartsProvider` context to access chart styling (colors, themes, element styles).

```tsx
import { GlobalChartsProvider } from '@automattic/charts';

<GlobalChartsProvider>
	<LeaderboardChart data={ data } />
</GlobalChartsProvider>;
```

## Usage

```tsx
import { LeaderboardChart } from '@jetpack-premium-analytics/widgets-toolkit';

const data = [
	{
		id: '1',
		label: 'Direct traffic',
		currentValue: 125000,
		previousValue: 98000,
		currentShare: 42,
		previousShare: 35,
		delta: 27.55,
	},
	{
		id: '2',
		label: 'Google Ads',
		currentValue: 87500,
		previousValue: 92000,
		currentShare: 29,
		previousShare: 33,
		delta: -4.89,
	},
	{
		id: '3',
		label: 'Email campaign',
		currentValue: 53000,
		previousValue: 61000,
		currentShare: 18,
		previousShare: 22,
		delta: -13.11,
	},
];

<LeaderboardChart
	data={ data }
	withComparison={ true }
	dataFormat={ {
		type: 'currency',
		options: { useMultipliers: true, decimals: 2 },
	} }
	legendLabels={ {
		primary: 'Current period',
		comparison: 'Previous period',
	} }
/>;
```

## Props

| Prop               | Type                   | Default                                                                | Description                                                       |
| ------------------ | ---------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `data`             | `LeaderboardChartData` | required                                                               | Array of leaderboard items with label, values, shares, and deltas |
| `className`        | `string`               | -                                                                      | Additional CSS classes for container                              |
| `loading`          | `boolean`              | `false`                                                                | Shows loading skeleton when true                                  |
| `withComparison`   | `boolean`              | `false`                                                                | Enables comparison mode with previous period data                 |
| `withOverlayLabel` | `boolean`              | `false`                                                                | Places labels on top of bars instead of beside them               |
| `legendLabels`     | `LegendLabels`         | `{ primary: 'Current period', comparison: 'Previous period' }`         | Custom legend labels                                              |
| `showLegend`       | `boolean`              | `true`                                                                 | Whether to show the legend                                        |
| `dataFormat`       | `DataFormat`           | `{ type: 'currency', options: { useMultipliers: true, decimals: 2 } }` | Value formatting configuration                                    |
| `emptyState`       | `ReactNode`            | -                                                                      | Custom empty state content (overrides default)                    |
| `emptyStateIcon`   | `ReactNode`            | -                                                                      | Icon to display in default empty state                            |
| `emptyStateText`   | `string`               | `'No data available'`                                                  | Text for default empty state                                      |

### LeaderboardChartData Type

```tsx
type LeaderboardChartData = Array< {
	id: string;
	label: string;
	currentValue: number;
	previousValue: number;
	currentShare: number; // Percentage (0-100)
	previousShare: number; // Percentage (0-100)
	delta: number; // Percentage change
} >;
```

### DataFormat Type

```tsx
type DataFormat = {
	type: 'currency' | 'number' | 'percentage' | 'average';
	options?: {
		useMultipliers?: boolean; // Show 1K, 1M, etc.
		decimals?: number; // Number of decimal places
		signDisplay?: 'auto' | 'never' | 'always' | 'exceptZero'; // Sign display for numbers
		// ... other format-specific options
	};
};
```

## Common Use Cases

### Basic Leaderboard (No Comparison)

```tsx
<LeaderboardChart data={ data } withComparison={ false } showLegend={ false } />
```

### With Comparison Period

```tsx
<LeaderboardChart
	data={ data }
	withComparison={ true }
	legendLabels={ {
		primary: 'Last 30 days',
		comparison: 'Previous 30 days',
	} }
/>
```

### Number Format (Not Currency)

```tsx
<LeaderboardChart
	data={ data }
	dataFormat={ {
		type: 'number',
		options: { useMultipliers: true, decimals: 0 },
	} }
/>
```

### Percentage Values

```tsx
<LeaderboardChart
	data={ conversionRates }
	dataFormat={ {
		type: 'percentage',
		options: { decimals: 2 },
	} }
/>
```

### With Overlay Labels

```tsx
<LeaderboardChart data={ data } withOverlayLabel={ true } withComparison={ true } />
```

### Custom Empty State

```tsx
<LeaderboardChart
	data={ [] }
	emptyStateIcon={ <SearchIcon /> }
	emptyStateText="No results found for this period"
/>
```

Or with fully custom empty state:

```tsx
<LeaderboardChart
	data={ [] }
	emptyState={
		<div className="custom-empty">
			<MyCustomIcon />
			<h3>No Data Yet</h3>
			<p>Start tracking your metrics to see insights here</p>
		</div>
	}
/>
```

## Integration with GlobalChartsProvider

The component automatically retrieves colors from the GlobalChartsProvider context:

```tsx
import { GlobalChartsProvider } from '@automattic/charts';
import { LeaderboardChart } from '@jetpack-premium-analytics/widgets-toolkit';

function MyWidget() {
	return (
		<GlobalChartsProvider theme={ { colors: [ '#3858E9', '#66BDFF', '#A77EFF' ] } }>
			<LeaderboardChart data={ data } withComparison={ true } />
		</GlobalChartsProvider>
	);
}
```

The component uses `getElementStyles()` from the context to:

- Retrieve primary and secondary colors for bars
- Apply consistent theming across all charts
- Support both current period (index 0) and comparison period (index 1) colors

## Empty State Behavior

The component handles empty data gracefully:

1. **No data + custom `emptyState` prop**: Renders your custom empty state component
2. **No data + `emptyStateIcon` and/or `emptyStateText`**: Renders default empty state with your customizations
3. **No data + no customization**: Renders default empty state with "No data available" message

## Loading State

When `loading={true}`, the component displays skeleton loaders that match the structure of the actual chart, providing visual feedback during data fetch operations.

## Responsive Behavior

The LeaderboardChart automatically adapts to its container width. For optimal display:

- **Minimum width**: 280px recommended
- **Ideal width**: 400px+ for comfortable reading
- **Label truncation**: Long labels automatically truncate with ellipsis
- **Bar scaling**: Bars scale proportionally to container width

## Storybook

Run `pnpm storybook` and navigate to **Widgets Toolkit / Components / LeaderboardChart** to see:

- **Default** - Basic leaderboard without comparison
- **WithComparison** - Current vs. previous period
- **Loading** - Loading skeleton state
- **EmptyState** - No data handling
- **WithOverlayLabel** - Labels on top of bars
- **WithoutLegend** - Chart without legend
- **LongLabels** - Label truncation handling
- **NumberFormat** - Number formatting (not currency)
- **PercentageFormat** - Percentage values
- **Container size variants** - Small (280px), Medium (400px), Large (600px)

## Comparison with Other Chart Components

| Feature            | LeaderboardChart           | DonutChart         | SemiCircleChart        |
| ------------------ | -------------------------- | ------------------ | ---------------------- |
| Shape              | Horizontal bars            | Full circle        | Half circle            |
| Use case           | Rankings, top N            | Distribution       | Two-segment comparison |
| Context dependency | Yes (GlobalChartsProvider) | No (pure)          | No (pure)              |
| Comparison mode    | Yes                        | Yes                | Yes                    |
| Data items         | Unlimited                  | Unlimited segments | 2-5 segments typical   |

## Common Patterns

### Sales by Traffic Source

```tsx
<LeaderboardChart
	data={ trafficSourceData }
	withComparison={ true }
	dataFormat={ { type: 'currency', options: { useMultipliers: true } } }
	legendLabels={ { primary: 'This month', comparison: 'Last month' } }
/>
```

### Top Products by Revenue

```tsx
<LeaderboardChart
	data={ topProductsData }
	withComparison={ true }
	dataFormat={ { type: 'currency', options: { decimals: 0 } } }
/>
```

### Conversion Rates by Campaign

```tsx
<LeaderboardChart
	data={ campaignData }
	withComparison={ true }
	dataFormat={ { type: 'average', options: { decimals: 2 } } }
/>
```

### Sales by Device Type

```tsx
<LeaderboardChart
	data={ deviceData }
	withOverlayLabel={ true }
	withComparison={ true }
	dataFormat={ { type: 'currency', options: { useMultipliers: true } } }
/>
```
