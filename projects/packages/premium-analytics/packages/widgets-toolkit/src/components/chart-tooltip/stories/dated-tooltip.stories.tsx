import { TooltipBox } from '@jetpack-premium-analytics/externals';
import { _n } from '@wordpress/i18n';
import { postContent, seen } from '@wordpress/icons';
import { withChartTheme } from '../../../stories/with-chart-theme';
import { DatedTooltip } from '../dated-tooltip';
import type { DatedTooltipRow } from '../dated-tooltip-model';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta< typeof DatedTooltip > = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/DatedTooltip',
	component: DatedTooltip,
	tags: [ 'autodocs' ],
	decorators: [ withChartTheme ],
	parameters: {
		layout: 'centered',
	},
	render: args => (
		<TooltipBox>
			<DatedTooltip { ...args } />
		</TooltipBox>
	),
};

export default meta;
type Story = StoryObj< typeof DatedTooltip >;

const views = ( count: number ) =>
	/* translators: %s: number of views. */
	_n( '%s View', '%s Views', count, 'jetpack-premium-analytics-pkg' );
const visitors = ( count: number ) =>
	/* translators: %s: number of visitors. */
	_n( '%s Visitor', '%s Visitors', count, 'jetpack-premium-analytics-pkg' );
const posts = ( count: number ) =>
	/* translators: %s: number of posts published. */
	_n( '%s Post published', '%s Posts published', count, 'jetpack-premium-analytics-pkg' );

const LINE = { stroke: '#3858E9', strokeWidth: 2 };
const LINE_PREVIOUS = { stroke: '#3858E9', strokeDasharray: '4 4', strokeWidth: 1.5 };
const GREEN = { stroke: '#008A20', strokeWidth: 2 };
const GREEN_PREVIOUS = { stroke: '#008A20', strokeDasharray: '4 4', strokeWidth: 1.5 };

const ROWS: DatedTooltipRow[] = [
	{
		key: 'Views',
		name: 'Views',
		countLabel: views,
		dataFormat: { type: 'number' },
		indicator: { kind: 'series', style: LINE },
		value: 130859,
		previous: { value: 98765, indicator: { kind: 'series', style: LINE_PREVIOUS } },
	},
	{
		key: 'Visitors',
		name: 'Visitors',
		countLabel: visitors,
		dataFormat: { type: 'number' },
		indicator: { kind: 'series', style: GREEN },
		value: 67365,
		previous: { value: 51200, indicator: { kind: 'series', style: GREEN_PREVIOUS } },
	},
	{
		key: 'Views per visitor',
		name: 'Views per visitor',
		dataFormat: { type: 'average' },
		indicator: { kind: 'icon', icon: seen },
		value: 1.94,
		previous: { value: 1.93, indicator: { kind: 'icon', icon: seen } },
	},
	{
		key: 'Posts published',
		name: 'Posts published',
		countLabel: posts,
		dataFormat: { type: 'number' },
		indicator: { kind: 'icon', icon: postContent },
		value: 16,
		previous: { value: 12, indicator: { kind: 'icon', icon: postContent } },
	},
];

const withoutPrevious = ( rows: DatedTooltipRow[] ) =>
	rows.map( row => ( { ...row, previous: undefined } ) );

export const LineChart: Story = {
	args: {
		indicatorType: 'line',
		model: { date: 'September 18, 2026', rows: withoutPrevious( ROWS ) },
	},
};

export const LineChartWithComparison: Story = {
	args: {
		indicatorType: 'line',
		model: { date: 'September 18, 2026', previousDate: 'September 18, 2025', rows: ROWS },
	},
};

export const BarChartWithComparison: Story = {
	args: {
		indicatorType: 'rect',
		model: {
			date: 'September 18, 2026',
			previousDate: 'September 18, 2025',
			rows: ROWS.map( row =>
				row.indicator.kind === 'series'
					? {
							...row,
							indicator: { kind: 'series', style: { stroke: row.indicator.style.stroke } },
							previous: row.previous && {
								...row.previous,
								indicator: {
									kind: 'series',
									style: { stroke: row.indicator.style.stroke, opacity: 0.5 },
								},
							},
						}
					: row
			),
		},
	},
};

/**
 * A bucket with no reading shows a dash in place of the value, in either column.
 */
export const MissingReadings: Story = {
	args: {
		indicatorType: 'line',
		model: {
			date: 'March 1, 2026',
			previousDate: 'March 1, 2025',
			rows: [
				{
					...ROWS[ 0 ],
					value: null,
					previous: { value: 0, indicator: { kind: 'series', style: LINE_PREVIOUS } },
				},
				{ ...ROWS[ 1 ], previous: undefined },
				{ ...ROWS[ 3 ], previous: { value: null, indicator: ROWS[ 3 ].indicator } },
			],
		},
	},
};

/**
 * A row the chart does not draw and that names no icon keeps the swatch's width blank.
 */
export const ExtraRowWithoutIcon: Story = {
	args: {
		indicatorType: 'line',
		model: {
			date: 'September 18, 2026',
			rows: [
				{ ...ROWS[ 0 ], previous: undefined },
				{
					key: 'Orders',
					name: 'Orders',
					dataFormat: { type: 'number' },
					indicator: { kind: 'blank' },
					value: 42,
				},
			],
		},
	},
};
