import { withChartTheme } from '../../../stories/with-chart-theme';
import { MetricTabsChart, type MetricTab } from '../metric-tabs-chart';
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

const meta = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/MetricTabsChart',
	component: MetricTabsChart,
	tags: [ 'autodocs' ],
	parameters: {
		layout: 'padded',
		docs: {
			description: {
				component:
					'A metric switcher over a comparative line chart: selectable cards (value + period-over-period delta), and the selected metric drawn as a current line with a dashed previous-period overlay. Shared by the subscribers and traffic charts.',
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
 */
export const SingleMetric: Story = {
	args: {
		metrics: [ { ...METRICS[ 0 ], previousValue: undefined, previous: undefined } ],
		dataFormat: DATA_FORMAT,
	},
};

/**
 * The loading overlay shown over the chart while data resolves.
 */
export const Loading: Story = {
	args: { metrics: METRICS, dataFormat: DATA_FORMAT, loading: true },
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
