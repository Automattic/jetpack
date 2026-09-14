import { expect, userEvent, within } from 'storybook/test';
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

/** Column groups on a plain matrix: a gap and a label under each quarter. */
export const WithColumnGroups: Story = {
	args: {
		...Default.args,
		data: heatmapActivityMatrix.map( column => ( { ...column, label: '' } ) ),
		columnGroups: [
			{ label: 'Q1', span: 3 },
			{ label: 'Q2', span: 3 },
			{ label: 'Q3', span: 3 },
			{ label: 'Q4', span: 3 },
		],
	},
};

type MonthCalendarStoryArgs = StoryArgs & { weekStartsOn?: 0 | 1; locale?: string };

const MonthCalendarGrid = ( { weekStartsOn, locale, ...args }: MonthCalendarStoryArgs ) => {
	const { data, columnGroups } = useMonthCalendarHeatmapData(
		heatmapPostsByDay,
		HEATMAP_POSTS_RANGE,
		{ weekStartsOn, locale: locale || undefined }
	);
	return (
		<HeatmapChart { ...args } data={ data } columnGroups={ columnGroups }>
			<HeatmapChart.Legend lessLabel="Fewer posts" moreLabel="More posts" />
		</HeatmapChart>
	);
};

/** Twelve months as one grid sharing one scale: the "Monthly posting activity" layout. */
export const MonthCalendar: StoryObj< MonthCalendarStoryArgs > = {
	render: args => <MonthCalendarGrid { ...args } />,
	args: {
		...sharedThemeArgs,
		compact: true,
		withTooltips: true,
		'aria-label': 'Monthly posting activity',
		weekStartsOn: 1,
		locale: '',
	},
	argTypes: {
		weekStartsOn: calendarArgTypes.weekStartsOn,
		locale: calendarArgTypes.locale,
	},
	play: async ( { canvasElement } ) => {
		const canvas = within( canvasElement );
		const grid = canvas.getByRole( 'grid', { name: 'Monthly posting activity' } );
		await expect( canvas.getAllByRole( 'grid' ) ).toHaveLength( 1 );
		await expect( grid ).toHaveAttribute( 'aria-colcount', '84' );
		await expect( canvas.getAllByTestId( 'heatmap-group-label' ) ).toHaveLength( 12 );
	},
};

/** The same grid in a container too narrow for it; arrow keys keep the selection in view. */
export const MonthCalendarScrolling: StoryObj< MonthCalendarStoryArgs > = {
	...MonthCalendar,
	render: args => (
		<div data-testid="scroller" style={ { width: 480, overflowX: 'auto' } }>
			<MonthCalendarGrid { ...args } />
		</div>
	),
	play: async ( { canvasElement } ) => {
		const canvas = within( canvasElement );
		const scroller = canvas.getByTestId( 'scroller' );
		const grid = canvas.getByRole( 'grid', { name: 'Monthly posting activity' } );
		await expect( scroller.scrollLeft ).toBe( 0 );
		grid.focus();
		// 480px holds fewer than five 7-column months, so this crosses the visible edge.
		await userEvent.keyboard( '{ArrowRight}'.repeat( 40 ) );
		await expect( scroller.scrollLeft ).toBeGreaterThan( 0 );
	},
};
