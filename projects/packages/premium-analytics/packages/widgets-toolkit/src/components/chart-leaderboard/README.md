# LeaderboardChart

A responsive leaderboard (horizontal bar) chart component for displaying ranking and "top X by Y" data visualizations.

## Widgets: use `Leaderboard`

A widget does not compose this chart by hand. `Leaderboard` (`components/leaderboard`) takes ranked rows in the widget's own terms and the request status, and renders the chart with its loading, error and empty states, the row limit, and the dashboard window on detail links. The chart derives the bar shares and deltas from the values. It must render inside `WidgetRoot`.

```tsx
// Inside `WidgetRoot`. Memoize the rows: the component rebuilds the chart data when they change.
const rows = useMemo(
	() =>
		videos.map( video => ( {
			id: video.key,
			label: video.label,
			value: video.plays,
			previousValue: video.previousPlays,
			action: { kind: 'videoLink', id: video.id, href: video.link },
		} ) ),
	[ videos ]
);

return (
	<Leaderboard
		rows={ rows }
		status={ { isLoading, isFetching, isError, hasComparison, refetch } }
		error={ describeError( error, {
			retryDescription: __(
				"We couldn't load video plays. Please try again in a moment.",
				'jetpack-premium-analytics-pkg'
			),
			onRetry: refetch,
		} ) }
	/>
);
```

A row's `media` defaults to none and its `action` to static. A `postLink` or `videoLink` action without `search` gets the dashboard window; pass `search: {}` to navigate without one on purpose.

Pass `error` as `describeError()` builds it, so an access-denied failure offers no Retry. Without an `error`, the component shows the generic message with a Retry bound to `status.refetch`.

Rows may carry `children`. With a `drillDown` (`backLabel`, `rowAriaLabel`) every such row becomes a button that shows its children under a back link, any number of levels deep; the selection heals itself when the settled data no longer backs it, and a widget whose rows change under a control of its own resets it by giving the leaderboard a `key`.

The rest of this document covers the chart on its own.

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
	},
	{
		id: '2',
		label: 'Google Ads',
		currentValue: 87500,
		previousValue: 92000,
	},
	{
		id: '3',
		label: 'Email campaign',
		currentValue: 53000,
		previousValue: 61000,
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
returns one `ReactElement` label plus the chart-level button props for drill-down rows.

```tsx
const row = {
	id: 'example',
	...buildLeaderboardRow( {
		label: 'Example',
		media: { kind: 'favicon', url: 'https://example.com/favicon.ico' },
		action: { kind: 'link', href: 'https://example.com' },
	} ),
	currentValue: 100,
};
```

A `viewLink` row keeps the label as plain text and offers the URL from a "View in new tab"
action beside it, revealed on hover or focus, for lists whose rows should not read as links
themselves. `resolveLeaderboardRowAction` returns it for a childless row when passed
`hrefAs: 'viewLink'`:

```tsx
action: { kind: 'viewLink', href: 'https://example.com' },
```

A `viewLink`, `static` or `drillDown` row can also take a `trailingAction`, an element rendered
after the label (and after the "View" action when there is one) and revealed on hover or focus,
for a widget's own row actions such as the Top referrers widget's `MarkAsSpamButton`. A drill-down
row with one becomes a layered row, so the action's own click wins over the drill-down. The type
rejects it on rows that link out as a whole or open a detail page:

```tsx
...buildLeaderboardRow( {
	label: 'example.com',
	media: { kind: 'favicon', url: 'https://example.com/favicon.ico' },
	action: { kind: 'viewLink', href: 'https://example.com' },
	trailingAction: <MarkAsSpamButton domain="example.com" onConfirm={ markAsSpam } />,
} ),
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
};
```

An explicit drill-down `ariaLabel` replaces the accessible name otherwise computed from both
the media alt text and visible label, which can cause a screen reader to announce the label
twice.

A drill-down row can also take a `link` to a dashboard page, which the label opens while the
rest of the row still drills down. The builder sets the chart's `hasInteractiveLabel`, so the
link sits beside the row button instead of inside it:

```tsx
action: {
	kind: 'drillDown',
	onClick: () => selectAuthor( 'id:42' ),
	link: authorDetailLinkProps( 42 ),
	ariaLabel: 'View posts by Ada Lovelace',
},
```

For a post, page, or email with a detail page inside the dashboard, use the `postLink` action.
`PostTitleLink` chooses the destination: the internal detail route when the row carries a post
ID and the reader can open post details, the public URL otherwise, and plain text when neither is
usable. A row whose title opens the detail route and that also has a public URL gets a trailing
"View" action, which opens the live content in a new tab and shows on hover or focus. Pass `extraAction` (an element) on `postLink` or `videoLink` for one more trailing action after it; the row wraps it, so it reveals the same way and stays clickable above the title.

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
};
```

A `postLink` row renders its media inside the link, and never becomes a chart button: a chart row
that is a button cannot nest an anchor.

Video rows use `videoLink`, which delegates to `VideoTitleLink` so the row reaches the video detail route instead of the post one. Like `postLink`, a `videoLink` row renders its media inside the detail link and gets the "View" action beside a title that opens it. It is never a chart button.

```tsx
action: { kind: 'videoLink', id: 9, search: { from: '2026-03-01', to: '2026-03-10' } },
```

Inside a widget, use `LeaderboardPostLabel` instead of building a post action by hand. It reads the report window from `WidgetRootContext` and names the report the detail breadcrumb returns to:

```tsx
<LeaderboardPostLabel
	id={ row.postId }
	label={ row.label }
	link={ row.link }
	origin={ { report: 'posts', section: 'posts-pages' } }
/>
```

Pass `section` to `LeaderboardPostLabel` to open a named tab on the detail page, such as
`email-opens`. That destination tab is distinct from `origin.section`, which becomes `ref_section`.

There is no `LeaderboardVideoLabel`, so a widget building a `videoLink` action takes that same
window from `useWidgetNavigationSearch()` and passes it as `search`.

`LeaderboardRowMedia` provides six semantic media variants. The variant owns its size,
fallback, and default alt-text policy:

| Kind        | Size      | Missing or failed image behavior |
| ----------- | --------- | -------------------------------- |
| `avatar`    | 20 × 20px | Placeholder                      |
| `favicon`   | 16 × 16px | Hidden; always decorative        |
| `flag`      | 28px wide | Placeholder; proportional height |
| `thumbnail` | 28 × 28px | Placeholder                      |
| `icon`      | 20 × 20px | No image; takes a glyph          |
| `none`      | No media  | Renders text only                |

Pass a `thumbnail` a `fallbackIcon` to draw that glyph in a bordered box, instead of the grey placeholder, when there is no image or it fails to load: `media: { kind: 'thumbnail', url, alt: '', fallbackIcon: video }`.

`icon` takes a `@wordpress/icons` glyph rather than a URL and draws it in the muted neutral color: `media: { kind: 'icon', icon: category }`.

Use `resolveLeaderboardRowAction` when raw data can contain both an external URL and children.
It applies the shared precedence: drill-down for rows with children, external links for
childless rows (or a `viewLink` row, with `hrefAs: 'viewLink'`), and static content otherwise.

Use `LeaderboardLabel` directly for media plus truncating text outside chart rows, such as a
DataViews table cell. It deliberately does not add the chart row's 36px minimum block size or its
inline padding.

## Props

| Prop               | Type                   | Default                                                        | Description                                                                                                                                                    |
| ------------------ | ---------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data`             | `LeaderboardChartData` | required                                                       | Array of leaderboard items with label and values; shares and deltas are optional                                                                               |
| `className`        | `string`               | -                                                              | Additional CSS classes for container                                                                                                                           |
| `loading`          | `boolean`              | `false`                                                        | Shows loading skeleton when true                                                                                                                               |
| `withComparison`   | `boolean`              | `false`                                                        | Enables comparison mode with previous period data                                                                                                              |
| `withOverlayLabel` | `boolean`              | `false`                                                        | Places labels on top of bars instead of beside them                                                                                                            |
| `legendLabels`     | `LegendLabels`         | `{ primary: 'Current period', comparison: 'Previous period' }` | Custom legend labels                                                                                                                                           |
| `showLegend`       | `boolean`              | `true`                                                         | Whether to show the legend                                                                                                                                     |
| `dataFormat`       | `DataFormat`           | `{ type: 'currency', options: { useMultipliers: true } }`      | Value formatting configuration                                                                                                                                 |
| `emptyState`       | `ReactNode`            | -                                                              | Custom empty state content (overrides default)                                                                                                                 |
| `emptyStateIcon`   | `ReactNode`            | The `search` magnifier                                         | Icon to display in default empty state                                                                                                                         |
| `emptyStateText`   | `string`               | `'We couldn’t find results for this time period.'`             | Text for default empty state                                                                                                                                   |
| `fitRows`          | `boolean`              | `true`                                                         | Show only the rows that fit the widget height instead of scrolling                                                                                             |
| `columns`          | `LeaderboardColumns`   | -                                                              | Names the rows (`label`) and the metric in a header, hidden on height-1 tiles; the metric also adds the unit to an abbreviated value's tooltip (`4,186 views`) |
| `chartTitle`       | `string`               | -                                                              | What the chart shows; the chart is named "Chart: <title>"                                                                                                      |

### LeaderboardChartData Type

```tsx
type LeaderboardChartData = Array< {
	id: string;
	label: string | ReactElement;
	onClick?: ( event: MouseEvent< HTMLButtonElement > ) => void;
	ariaLabel?: string;
	currentValue: number;
	previousValue?: number;
	currentShare?: number; // Percentage of the largest value; derived when omitted
	previousShare?: number; // Percentage of the largest value; derived when omitted
	delta?: number; // Percentage change; derived when omitted
} >;
```

### Derived shares and deltas

Pass `currentValue` and `previousValue` only. The chart derives the shares and deltas; the rules are in the [Leaderboard Chart docs](https://automattic.github.io/jetpack-storybook/?path=/docs/js-packages-charts-library-charts-leaderboard-chart--docs) under Share Calculation. This wrapper passes `negativeBars="clamp"` with `withOverlayLabel`, so a negative value draws an empty bar under its label instead of diverging.

Leave a missing `previousValue` `undefined`, not `0`, so the chart shows the placeholder.

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
