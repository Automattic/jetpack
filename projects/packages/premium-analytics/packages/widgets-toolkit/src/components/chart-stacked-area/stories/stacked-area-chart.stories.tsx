import { withChartTheme } from '../../../stories/with-chart-theme';
import { StackedAreaChart } from '../stacked-area-chart';
import type { StackedAreaSeries } from '../stacked-area-chart';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta< typeof StackedAreaChart > = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/StackedAreaChart',
	component: StackedAreaChart,
	tags: [ 'autodocs' ],
	parameters: {
		layout: 'padded',
	},
	decorators: [
		withChartTheme,
		Story => (
			<div style={ { width: '100%', height: '300px' } }>
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj< typeof StackedAreaChart >;

const days = Array.from( { length: 7 }, ( _, index ) => new Date( 2026, 6, index + 1 ) );
const hours = Array.from( { length: 24 }, ( _, index ) => new Date( 2026, 6, 1, index ) );

const part = (
	label: string,
	dates: Date[],
	valueAt: ( index: number ) => number,
	stroke?: string
): StackedAreaSeries => ( {
	label,
	...( stroke && { options: { stroke } } ),
	data: dates.map( ( date, index ) => ( { date, value: valueAt( index ) } ) ),
} );

const dailySeries = [
	part( 'Human', days, index => 5200 + index * 310 ),
	part( 'AI bots', days, index => 1400 + ( index % 3 ) * 220 ),
	part( 'Other bots', days, index => 900 + ( index % 2 ) * 180 ),
	part( 'Blocked', days, index => 240 + index * 15, '#d63638' ),
];

/**
 * Default: four parts of one total, by the day. The y-axis tops out at the stack's total.
 */
export const Default: Story = {
	args: {
		series: dailySeries,
		dataFormat: { type: 'number' },
		tickResolution: 'day',
	},
};

/**
 * Hourly: one day by the hour, with times on the axis and in the tooltip.
 */
export const Hourly: Story = {
	args: {
		series: [
			part( 'Human', hours, index => 180 + Math.round( 120 * Math.sin( index / 4 ) ** 2 ) ),
			part( 'AI bots', hours, index => 40 + ( index % 5 ) * 9 ),
			part( 'Other bots', hours, index => 30 + ( index % 4 ) * 6 ),
		],
		dataFormat: { type: 'number' },
		tickResolution: 'hour',
	},
};

/**
 * Sparkline: how the chart degrades on a tile too short for its axes.
 */
export const Sparkline: Story = {
	decorators: [
		Story => (
			<div style={ { width: '100%', height: '120px' } }>
				<Story />
			</div>
		),
	],
	args: {
		series: dailySeries,
		dataFormat: { type: 'number' },
		tickResolution: 'day',
		compactWhenShort: true,
	},
};
