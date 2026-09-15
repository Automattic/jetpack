import { expect, within } from 'storybook/test';
import {
	chartDecorator,
	sharedChartArgTypes,
	ChartStoryArgs,
} from '../../../stories/chart-decorator';
import {
	HEATMAP_POSTS_RANGE,
	heatmapActivityMatrix,
	heatmapActivityMatrixWithTotals,
	heatmapCalendarSeries,
	heatmapLargeValueMatrix,
	heatmapPartialMonthCalendarSeries,
	heatmapPostsByDay,
} from '../../../stories/sample-data';
import { sharedThemeArgs, themeArgTypes } from '../../../stories/theme-config';
import { HeatmapChart, useCalendarHeatmapData, useMonthCalendarHeatmapData } from '../index';
import type { DataPointDate } from '../../../types';
import type { CalendarHeatmapOptions } from '../index';
import type { Meta, StoryObj } from '@storybook/react';

type StoryArgs = ChartStoryArgs< React.ComponentProps< typeof HeatmapChart > >;

const meta: Meta< StoryArgs > = {
	title: 'JS Packages/Charts Library/Charts/Heatmap Chart',
	component: HeatmapChart,
	subcomponents: { 'HeatmapChart.Legend': HeatmapChart.Legend },
	parameters: { layout: 'centered' },
	decorators: [ chartDecorator ],
	argTypes: {
		...sharedChartArgTypes,
		...themeArgTypes,
		compact: { control: 'boolean', table: { category: 'Visual Style' } },
		showValues: { control: 'boolean', table: { category: 'Visual Style' } },
		maxCellWidth: {
			control: { type: 'number', min: 1 },
			description: 'Maximum cell width in pixels in non-compact mode',
			table: { category: 'Cell Size' },
		},
		maxCellHeight: {
			control: { type: 'number', min: 1 },
			description: 'Maximum cell height in pixels in non-compact mode',
			table: { category: 'Cell Size' },
		},
		minCellWidth: {
			control: { type: 'number', min: 0 },
			description: 'Minimum cell width in pixels in non-compact mode',
			table: { category: 'Cell Size' },
		},
		minCellHeight: {
			control: { type: 'number', min: 0 },
			description: 'Minimum cell height in pixels in non-compact mode',
			table: { category: 'Cell Size' },
		},
	},
} satisfies Meta< StoryArgs >;

export default meta;
type Story = StoryObj< StoryArgs >;

export const Default: Story = {
	args: {
		...sharedThemeArgs,
		data: heatmapActivityMatrix,
		rowLabels: [ 'Mon', '', 'Wed', '', 'Fri', '', '' ],
		withTooltips: true,
	},
};

export const Compact: Story = {
	args: { ...Default.args, compact: true, containerHeight: '160px' },
};

export const LargeValues: Story = {
	args: {
		...Default.args,
		data: heatmapLargeValueMatrix,
	},
};

export const WithSummaryColumn: Story = {
	args: {
		...Default.args,
		data: heatmapActivityMatrixWithTotals,
	},
};

export const MaximumCellSize: Story = {
	args: {
		...Default.args,
		containerWidth: '1000px',
		containerHeight: '420px',
		maxCellWidth: 64,
		maxCellHeight: 42,
	},
};

export const MinimumCellSize: Story = {
	args: {
		...Default.args,
		containerWidth: '480px',
		containerHeight: '280px',
		minCellWidth: 44,
		minCellHeight: 32,
	},
};

type CalendarStoryArgs = StoryArgs & CalendarHeatmapOptions;

const CalendarGrid = ( {
	series,
	weekStartsOn,
	hideOutOfRangeDays,
	locale,
	timeZone,
	...args
}: CalendarStoryArgs & { series: DataPointDate[] } ) => {
	const { data, rowLabels } = useCalendarHeatmapData( series, {
		weekStartsOn,
		hideOutOfRangeDays,
		locale: locale || undefined,
		timeZone: timeZone || undefined,
	} );
	return <HeatmapChart { ...args } data={ data } rowLabels={ rowLabels } />;
};

const calendarArgTypes = {
	weekStartsOn: {
		control: { type: 'inline-radio' as const, labels: { 0: 'Sunday', 1: 'Monday' } },
		options: [ 1, 0 ],
		table: { category: 'Calendar' },
	},
	hideOutOfRangeDays: { control: 'boolean' as const, table: { category: 'Calendar' } },
	locale: {
		control: 'text' as const,
		description: "BCP-47 tag for the labels. Empty falls back to the provider, then the runtime's.",
		table: { category: 'Calendar' },
	},
	timeZone: {
		control: 'text' as const,
		description: 'IANA zone the series is bucketed into days in.',
		table: { category: 'Calendar' },
	},
};

// A mid-week span (Wed to Wed) so both calendar edges are ragged. Sliced once, not per
// render, since `useCalendarHeatmapData` holds the series by reference.
const raggedCalendarSeries = heatmapCalendarSeries.slice( 2, 115 );

export const Calendar: StoryObj< CalendarStoryArgs > = {
	render: args => <CalendarGrid { ...args } series={ raggedCalendarSeries } />,
	args: {
		...sharedThemeArgs,
		withTooltips: true,
		weekStartsOn: 1,
		hideOutOfRangeDays: true,
		locale: '',
		timeZone: '',
	},
	argTypes: calendarArgTypes,
};

// Regression story for a one-column first month label in compact mode.
export const CompactCalendarPartialMonth: StoryObj< CalendarStoryArgs > = {
	render: args => <CalendarGrid { ...args } series={ heatmapPartialMonthCalendarSeries } />,
	args: { ...sharedThemeArgs, compact: true, withTooltips: true, weekStartsOn: 1 },
	argTypes: {
		weekStartsOn: {
			control: { type: 'inline-radio', labels: { 0: 'Sunday', 1: 'Monday' } },
			options: [ 1, 0 ],
			table: { category: 'Calendar' },
		},
	},
};

export const WithCompositionLegend: Story = {
	render: args => (
		<HeatmapChart { ...args } chartId="composition-heatmap">
			<HeatmapChart.Legend />
		</HeatmapChart>
	),
	args: { ...Default.args },
};

export const FixedDimensions: Story = {
	args: {
		...Default.args,
		width: 720,
		height: 220,
	},
};

export const AspectRatio: Story = {
	args: {
		...Default.args,
		aspectRatio: 0.4,
	},
};

export const ErrorStates: Story = {
	args: {
		...Default.args,
		data: [],
	},
};

/** Column groups: a gap and a label under each quarter; the Total column stays outside them. */
export const WithColumnGroups: Story = {
	args: {
		...Default.args,
		data: heatmapActivityMatrixWithTotals.map( column => ( {
			...column,
			label: column.summary ? column.label : '',
		} ) ),
		columnGroups: [
			{ label: 'Q1', span: 3 },
			{ label: 'Q2', span: 3 },
			{ label: 'Q3', span: 3 },
			{ label: 'Q4', span: 3 },
		],
	},
};

type MonthCalendarStoryArgs = StoryArgs & {
	months?: number;
	weekStartsOn?: 0 | 1;
	locale?: string;
};

/**
 * The last `months` of the sample range, from the first of the earliest month.
 *
 * @param months - How many months to draw.
 * @return A range ending at the sample range end.
 */
const lastMonthsRange = ( months: number ) => {
	const end = new Date( `${ HEATMAP_POSTS_RANGE.end }T00:00:00Z` );
	const start = new Date( Date.UTC( end.getUTCFullYear(), end.getUTCMonth() - ( months - 1 ), 1 ) );
	return { start: start.toISOString().slice( 0, 10 ), end: HEATMAP_POSTS_RANGE.end };
};

const MonthCalendarGrid = ( {
	months = 12,
	weekStartsOn,
	locale,
	...args
}: MonthCalendarStoryArgs ) => {
	const { data, columnGroups } = useMonthCalendarHeatmapData(
		heatmapPostsByDay,
		lastMonthsRange( months ),
		{ weekStartsOn, locale: locale || undefined }
	);
	return (
		<HeatmapChart { ...args } data={ data } columnGroups={ columnGroups }>
			<HeatmapChart.Legend lessLabel="Fewer posts" moreLabel="More posts" />
		</HeatmapChart>
	);
};

/**
 * Months as one grid sharing one scale: the "Monthly posting activity" layout.
 * Drag the container's corner: the month gaps share the width, shrink to the theme's
 * `groupGap`, and past that the container scrolls with the keyboard selection in view.
 */
export const MonthCalendar: StoryObj< MonthCalendarStoryArgs > = {
	render: args => <MonthCalendarGrid { ...args } />,
	args: {
		...sharedThemeArgs,
		compact: true,
		withTooltips: true,
		ariaLabel: 'Monthly posting activity',
		containerWidth: '1200px',
		containerHeight: '200px',
		months: 6,
		weekStartsOn: 1,
		locale: '',
	},
	argTypes: {
		months: {
			control: { type: 'range', min: 1, max: 12 },
			description:
				'Months drawn, ending at the sample range end. Twelve need about 1400px before the gaps grow.',
			table: { category: 'Calendar' },
		},
		weekStartsOn: calendarArgTypes.weekStartsOn,
		locale: calendarArgTypes.locale,
	},
	play: async ( { canvasElement } ) => {
		const canvas = within( canvasElement );
		const grid = canvas.getByRole( 'grid', { name: 'Monthly posting activity' } );
		await expect( canvas.getAllByRole( 'grid' ) ).toHaveLength( 1 );
		await expect( grid ).toHaveAttribute( 'aria-colcount', '42' );
		const labels = canvas.getAllByTestId( 'heatmap-group-label' );
		await expect( labels ).toHaveLength( 6 );
		// Six months leave width over at 1200px, so the gaps grow past groupGap.
		const [ first, second ] = labels.map( label => label.getBoundingClientRect() );
		await expect( second.left - first.right ).toBeGreaterThan( 24 );
		await expect( grid.scrollWidth ).toBe( grid.clientWidth );
	},
};
