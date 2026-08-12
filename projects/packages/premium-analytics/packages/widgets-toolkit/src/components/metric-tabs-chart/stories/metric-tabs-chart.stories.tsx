import { withChartTheme } from '../../../stories/with-chart-theme';
import { MetricTabsChart, type MetricTab } from '../metric-tabs-chart';
import { MetricTabsChartSkeleton } from '../metric-tabs-chart-skeleton';
import type { Decorator, Meta, StoryObj } from '@storybook/react';

const DATA_FORMAT = { type: 'number' as const, options: { useMultipliers: true, decimals: 0 } };

const CURRENT_DATES = [
	new Date( '2026-06-01' ),
	new Date( '2026-06-06' ),
	new Date( '2026-06-11' ),
	new Date( '2026-06-16' ),
	new Date( '2026-06-21' ),
	new Date( '2026-06-26' ),
	new Date( '2026-06-29' ),
];

// The immediately preceding window, so current/previous read as distinct ranges.
const PREVIOUS_DATES = [
	new Date( '2026-05-02' ),
	new Date( '2026-05-07' ),
	new Date( '2026-05-12' ),
	new Date( '2026-05-17' ),
	new Date( '2026-05-22' ),
	new Date( '2026-05-27' ),
	new Date( '2026-05-31' ),
];

/**
 * Pair a value series with a set of dates.
 *
 * @param dates  - One date per value.
 * @param values - The series values.
 * @return The metric points.
 */
const points = ( dates: Date[], values: number[] ) =>
	dates.map( ( date, index ) => ( { date, value: values[ index ] } ) );

const METRICS: MetricTab[] = [
	{
		key: 'subscribers',
		label: 'Subscribers',
		value: 2700,
		previousValue: 2030,
		current: points( CURRENT_DATES, [ 2100, 2200, 2300, 2450, 2520, 2640, 2700 ] ),
		previous: points( PREVIOUS_DATES, [ 1500, 1620, 1740, 1810, 1900, 1980, 2030 ] ),
	},
	{
		key: 'paid',
		label: 'Paid subscribers',
		value: 820,
		previousValue: 540,
		current: points( CURRENT_DATES, [ 520, 560, 610, 660, 710, 780, 820 ] ),
		previous: points( PREVIOUS_DATES, [ 300, 340, 380, 430, 470, 510, 540 ] ),
	},
];

// Close-up canvas so the chart fills the frame.
const withCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '300px' } }>
		<Story />
	</div>
);

/**
 * Widget card wrapper for the skeleton stories, simulating a dashboard widget
 * container so the shape is shown within typical widget dimensions.
 */
const WidgetCard = ( {
	width,
	height,
	children,
}: {
	width: string;
	height: string;
	children: React.ReactNode;
} ) => (
	<div
		style={ {
			width,
			height,
			border: '1px solid var(--wpds-color-stroke-surface-neutral-weak)',
			borderRadius: 'var(--wpds-border-radius-md)',
			background: 'var(--wpds-color-background-surface-neutral)',
			display: 'flex',
			flexDirection: 'column',
			overflow: 'hidden',
		} }
	>
		<div style={ { position: 'relative', flex: 1, minHeight: 0 } }>{ children }</div>
	</div>
);

const meta = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/MetricTabsChart',
	component: MetricTabsChart,
	tags: [ 'autodocs' ],
	parameters: {
		layout: 'padded',
		docs: {
			description: {
				component:
					'A metric switcher over a comparative chart: selectable cards (value + period-over-period delta), and the selected metric drawn with its previous-period overlay. `chartType` picks the mark — a current line with a dashed previous-period overlay, or bars with a translucent previous-period shadow. Shared by the subscribers and traffic charts.',
			},
		},
	},
	decorators: [ withChartTheme, withCanvas ],
} satisfies Meta< typeof MetricTabsChart >;

export default meta;

type Story = StoryObj< typeof meta >;

/**
 * Two metrics; selecting a card focuses the chart on that metric.
 */
export const Default: Story = {
	args: { metrics: METRICS, dataFormat: DATA_FORMAT },
};

/**
 * A single metric with no previous period — just the current line, no delta.
 * With nothing to switch to, the card drops its fill and pointer and reads as
 * the widget's headline figure.
 */
export const SingleMetric: Story = {
	args: {
		metrics: [ { ...METRICS[ 0 ], previousValue: undefined, previous: undefined } ],
		dataFormat: DATA_FORMAT,
	},
};

/**
 * The same metrics drawn as bars, with the previous period as the translucent
 * shadow bar behind each current-period bar.
 */
export const Bars: Story = {
	args: { metrics: METRICS, dataFormat: DATA_FORMAT, chartType: 'bar' },
};

type SkeletonStory = StoryObj< typeof MetricTabsChartSkeleton >;

/**
 * The loading shape widgets pass through `WidgetState`'s `renderLoading`. The
 * metric cards get no placeholder: their count is only known once data lands,
 * and the real header collapses into a dropdown at a width the skeleton cannot
 * predict, so a card-shaped stand-in would land as a jump.
 */
export const Skeleton: SkeletonStory = {
	render: () => (
		<WidgetCard width="720px" height="320px">
			<MetricTabsChartSkeleton />
		</WidgetCard>
	),
};

/**
 * A height-1 dashboard tile. The block gives up its room rather than pushing the
 * shape past the widget body.
 */
export const SkeletonShortTile: SkeletonStory = {
	render: () => (
		<WidgetCard width="360px" height="140px">
			<MetricTabsChartSkeleton />
		</WidgetCard>
	),
};

/**
 * On a short tile the chart degrades to a sparkline — dropping its axis, grid,
 * and legend — instead of squashing its labels, while the metric cards stay.
 */
export const Compact: Story = {
	args: { metrics: METRICS, dataFormat: DATA_FORMAT },
	decorators: [
		Story => (
			<div style={ { width: '320px', height: '170px' } }>
				<Story />
			</div>
		),
	],
};
