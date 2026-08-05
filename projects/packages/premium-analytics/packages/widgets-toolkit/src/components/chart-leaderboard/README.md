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
import { buildLeaderboardRow, LeaderboardChart } from '@jetpack-premium-analytics/widgets-toolkit';

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

### Row labels

Use `buildLeaderboardRow` for chart rows that need media, links, or drill-down actions. It
returns one `ReactElement` label plus the chart-level button props for drill-down rows, so links
and row buttons cannot be combined.

```tsx
const row = {
	id: 'example',
	...buildLeaderboardRow( {
		label: 'Example',
		media: { kind: 'favicon', url: 'https://example.com/favicon.ico' },
		action: { kind: 'link', href: 'https://example.com' },
	} ),
	currentValue: 100,
	currentShare: 100,
};
```

For a drill-down row, pass the chart-level action to the builder. Its result includes the
`onClick` and `ariaLabel` fields expected by `LeaderboardChart`:

```tsx
const row = {
	id: 'group',
	...buildLeaderboardRow( {
		label: 'Example group',
		media: { kind: 'favicon', url: 'https://example.com/favicon.ico' },
		action: {
			kind: 'drillDown',
			onClick: () => selectGroup( 'group' ),
			ariaLabel: 'View items in Example group',
		},
	} ),
	currentValue: 100,
	currentShare: 100,
};
```

An explicit drill-down `ariaLabel` replaces the accessible name otherwise computed from both
the media alt text and visible label, which can cause a screen reader to announce the label
twice.

For a post, page, or email with a detail page inside the dashboard, use the `postLink` action.
`PostTitleLink` chooses the destination: the internal detail route when the row carries a post
ID, the public URL when it does not, and plain text when neither is usable.

```tsx
const row = {
	id: 'post-41',
	...buildLeaderboardRow( {
		label: 'Hello world',
		media: { kind: 'none' },
		action: {
			kind: 'postLink',
			id: 41,
			href: 'https://example.com/hello-world/',
			search: { from: '2026-03-01', to: '2026-03-10' },
		},
	} ),
	currentValue: 100,
	currentShare: 100,
};
```

A `postLink` row carries no media, and never becomes a chart button: a chart row that is a
button cannot nest an anchor.

Inside a widget, use `LeaderboardPostLabel` instead of building the action by hand. It reads the
report window from `WidgetRootContext` and passes it as `search`, so the detail page opens on
the range the row was read against:

```tsx
<LeaderboardPostLabel id={ row.postId } label={ row.label } link={ row.link } />
```

Pass `section` to open a named tab on the detail page, such as `email-opens`.

`LeaderboardRowMedia` provides five semantic media variants. The variant owns its size,
fallback, and default alt-text policy:

| Kind        | Size      | Missing or failed image behavior |
| ----------- | --------- | -------------------------------- |
| `avatar`    | 20 × 20px | Placeholder                      |
| `favicon`   | 16 × 16px | Hidden; always decorative        |
| `flag`      | 28px wide | Placeholder; proportional height |
| `thumbnail` | 28 × 28px | Placeholder                      |
| `none`      | No media  | Renders text only                |

Use `resolveLeaderboardRowAction` when raw data can contain both an external URL and children.
It applies the shared precedence: drill-down for rows with children, external links for
childless rows, and static content otherwise.

Use `LeaderboardLabel` directly for media plus truncating text outside chart rows, such as a
DataViews table cell. It deliberately does not add the chart row's 36px minimum block size.

### Row layout

`LeaderboardRow` takes two optional layout props. `LeaderboardPostLabel` accepts both and
forwards them.

| Prop        | Default     | Description                                                                                                 |
| ----------- | ----------- | ----------------------------------------------------------------------------------------------------------- |
| `variant`   | `'compact'` | `'compact'` is the standard 36px row. `'overlay'` drops that floor and takes its height from block padding. |
| `className` | -           | Extra class on the row, for per-widget spacing.                                                             |

Pick `variant` to match the sibling rows in the same widget, not the chart's `withOverlayLabel`
prop. That prop only tints the bar fill; it sets no row height. Use `'overlay'` where the
neighbouring rows also take their height from block padding, and `'compact'` where they come
from `buildLeaderboardRow`.

## Props

| Prop               | Type                   | Default                                                                | Description                                                        |
| ------------------ | ---------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `data`             | `LeaderboardChartData` | required                                                               | Array of leaderboard items with label, values, shares, and deltas  |
| `className`        | `string`               | -                                                                      | Additional CSS classes for container                               |
| `loading`          | `boolean`              | `false`                                                                | Shows loading skeleton when true                                   |
| `withComparison`   | `boolean`              | `false`                                                                | Enables comparison mode with previous period data                  |
| `withOverlayLabel` | `boolean`              | `false`                                                                | Places labels on top of bars instead of beside them                |
| `legendLabels`     | `LegendLabels`         | `{ primary: 'Current period', comparison: 'Previous period' }`         | Custom legend labels                                               |
| `showLegend`       | `boolean`              | `true`                                                                 | Whether to show the legend                                         |
| `dataFormat`       | `DataFormat`           | `{ type: 'currency', options: { useMultipliers: true, decimals: 2 } }` | Value formatting configuration                                     |
| `emptyState`       | `ReactNode`            | -                                                                      | Custom empty state content (overrides default)                     |
| `emptyStateIcon`   | `ReactNode`            | -                                                                      | Icon to display in default empty state                             |
| `emptyStateText`   | `string`               | `'No data available'`                                                  | Text for default empty state                                       |
| `fitRows`          | `boolean`              | `true`                                                                 | Show only the rows that fit the widget height instead of scrolling |

### LeaderboardChartData Type

```tsx
type LeaderboardChartData = Array< {
	id: string;
	label: string | ReactElement;
	onClick?: ( event: MouseEvent< HTMLButtonElement > ) => void;
	ariaLabel?: string;
	currentValue: number;
	previousValue?: number;
	currentShare: number; // Percentage (0-100)
	previousShare?: number; // Percentage (0-100); omitted when no comparison row matches
	delta?: number; // Percentage change; omitted when no comparison row matches or unavailable
} >;
```

### Premium Analytics comparison bar scaling

Premium Analytics comparison widgets use one shared scale so current and previous bar widths are
directly comparable. Calculate the largest value represented across both periods and use it for
both shares:

```tsx
import { getCombinedPeriodMax, sharePercentage } from '@jetpack-premium-analytics/widgets-toolkit';

const maxValue = getCombinedPeriodMax(
	rows.map( row => row.currentValue ),
	rows.map( row => row.previousValue )
);

const data = rows.map( row => ( {
	...row,
	currentShare: sharePercentage( row.currentValue, maxValue ),
	previousShare:
		row.previousValue === undefined ? undefined : sharePercentage( row.previousValue, maxValue ),
} ) );
```

Do not normalize each period against a separate maximum. That can render equal-width bars for
different values and visually contradict the displayed delta. Build the maximum from visible
primary rows and their matching comparison values; omit missing comparison values rather than
treating them as zero.

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

Height is handled by `fitRows`, which is on by default because these charts sit
in fixed-height dashboard tiles where an inner scrollbar is unexpected:

- **Whole rows only**: the chart shows as many complete rows as the height
  allows and hides the rest — a row is never half-clipped.
- **Instant on resize**: hidden rows stay mounted, so a taller tile reveals them
  without the widget re-rendering or re-requesting data.
- **Hidden means hidden**: rows that do not fit leave the focus order and the
  accessibility tree, so there are no invisible-but-tabbable rows.
- **Opting out**: pass `fitRows={ false }` for a widget that genuinely wants a
  scrollable list.
- **When nothing fits**: if the height cannot hold even one row, the chart says
  so rather than rendering an empty panel.

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
| Data items         | Unlimited (see note)       | Unlimited segments | 2-5 segments typical   |

All supplied items stay available to the chart, but with `fitRows` on (the
default) a fixed-height widget displays only the leading complete rows.

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
