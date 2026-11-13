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
	heatmapCalendarDatasets,
	heatmapLargeValueMatrix,
	heatmapPartialMonthCalendarSeries,
	heatmapPostHistory,
	heatmapPostsByDay,
	heatmapScaleComparison,
	heatmapViewsOverYears,
} from '../../../stories/sample-data';
import { sharedThemeArgs, themeArgTypes } from '../../../stories/theme-config';
import { HeatmapChart, useCalendarHeatmapData, useMonthCalendarHeatmapData } from '../index';
import type { DataPointDate } from '../../../types';
import type { CalendarHeatmapOptions } from '../index';
import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';

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
		scale: {
			control: { type: 'inline-radio' },
			options: [ 'linear', 'log' ],
			description: 'Whether a value picks its color by distance, or by distance in log space.',
			table: { category: 'Visual Style' },
		},
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

/**
 * The "Views over years" shape: eight years of months, skewed the way a real site's are.
 * Look for two things. Every year shows its own busy and quiet months, even beside a viral
 * September 2021 near 800,000 views. And each filled cell matches one swatch of the legend.
 * The launch month (Mar 2018) and the current month (Nov 2025) cover part of a month, so
 * they are hatched instead of shaded: they are not read as quiet months, and they sit
 * outside the scale. Months before launch and after the current month are faded slots.
 */
export const LongSiteHistory: Story = {
	render: args => (
		<HeatmapChart { ...args } chartId="long-site-history-heatmap">
			<HeatmapChart.Legend variant="bar" lessLabel="Fewer views" moreLabel="More views" />
		</HeatmapChart>
	),
	args: {
		...sharedThemeArgs,
		...heatmapViewsOverYears,
		scale: 'log',
		withTooltips: true,
		ariaLabel: 'Views over years',
		containerWidth: '960px',
		containerHeight: '460px',
	},
};

/**
 * A post's all-time traffic: fourteen months from the month it was published. One spike sits
 * two orders of magnitude above the rest, yet the quieter months still tell apart. The
 * publish month (Oct 2024) and the current month (Nov 2025) are hatched; the months before
 * publication and after the current month are faded slots.
 */
export const SinglePostHistory: Story = {
	render: args => (
		<HeatmapChart { ...args } chartId="single-post-history-heatmap">
			<HeatmapChart.Legend variant="bar" lessLabel="Fewer views" moreLabel="More views" />
		</HeatmapChart>
	),
	args: {
		...sharedThemeArgs,
		...heatmapPostHistory,
		scale: 'log',
		withTooltips: true,
		ariaLabel: 'Post views by month',
		containerWidth: '960px',
		containerHeight: '280px',
	},
};

const SCALE_CAPTIONS: Record< 'linear' | 'log', string > = {
	linear:
		'linear places a value by its distance from the largest. The recent months are unmistakable, and eight years of real differences share the lightest tone.',
	log: 'log places a value by its distance in log space. Each step is a jump of the same factor, so the quiet years and the busy ones both keep their spread.',
};

/**
 * The same ten years of a post's traffic on both scales, so they can be read against each
 * other. Values are above zero throughout, which the log scale requires.
 */
export const ScaleComparison: Story = {
	render: args => (
		<div style={ { display: 'flex', flexDirection: 'column', gap: '28px' } }>
			{ ( [ 'linear', 'log' ] as const ).map( scale => (
				<div key={ scale }>
					<p style={ { margin: '0 0 8px', maxWidth: '62em', fontSize: '13px', lineHeight: 1.5 } }>
						{ SCALE_CAPTIONS[ scale ] }
					</p>
					<HeatmapChart
						{ ...args }
						scale={ scale }
						height={ 260 }
						chartId={ `scale-comparison-${ scale }` }
					>
						<HeatmapChart.Legend variant="bar" lessLabel="Fewer views" moreLabel="More views" />
					</HeatmapChart>
				</div>
			) ) }
		</div>
	),
	args: {
		...sharedThemeArgs,
		...heatmapScaleComparison,
		withTooltips: true,
		ariaLabel: 'Post views by month',
		containerWidth: '1000px',
		containerHeight: 'auto',
	},
	// This story sets the scale on each chart it draws, so the control would move nothing.
	argTypes: { scale: { control: false, table: { disable: true } } },
};

type CalendarStoryArgs = StoryArgs & CalendarHeatmapOptions;

const CalendarGrid = ( {
	series,
	weekStartsOn,
	hideOutOfRangeDays,
	locale,
	timeZone,
	children,
	...args
}: CalendarStoryArgs & { series: DataPointDate[]; children?: ReactNode } ) => {
	const { data, rowLabels } = useCalendarHeatmapData( series, {
		weekStartsOn,
		hideOutOfRangeDays,
		locale: locale || undefined,
		timeZone: timeZone || undefined,
	} );
	return (
		<HeatmapChart { ...args } data={ data } rowLabels={ rowLabels }>
			{ children }
		</HeatmapChart>
	);
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

type CalendarDatasetStoryArgs = CalendarStoryArgs & { dataset: string };

export const Calendar: StoryObj< CalendarDatasetStoryArgs > = {
	render: ( { dataset, ...args } ) => (
		// Seven swatches hold under `linear` and snap back to the five the cells paint under `log`.
		<CalendarGrid { ...args } series={ heatmapCalendarDatasets[ dataset ] }>
			<HeatmapChart.Legend steps={ 7 } />
		</CalendarGrid>
	),
	args: {
		...sharedThemeArgs,
		withTooltips: true,
		weekStartsOn: 1,
		hideOutOfRangeDays: true,
		locale: '',
		timeZone: '',
		dataset: 'Steady traffic',
		scale: 'log',
	},
	argTypes: {
		...calendarArgTypes,
		dataset: {
			// Radio, not select: the select control carries an empty "Choose option" entry, and this
			// arg indexes the series the calendar draws, so there is no series for it to pick.
			control: 'radio' as const,
			options: Object.keys( heatmapCalendarDatasets ),
			description:
				'Traffic shape the calendar draws, for comparing how the color scale reads on each.',
			table: { category: 'Calendar' },
		},
	},
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

export const WithBarLegend: Story = {
	render: args => (
		<HeatmapChart { ...args } chartId="bar-legend-heatmap">
			<HeatmapChart.Legend variant="bar" />
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

/**
 * Column groups: a gap and a label under each quarter; the Total column stays outside them.
 * Cells carry no label of their own, so each is named by its group, column and row ("Q1 Col 3 Mon").
 */
export const WithColumnGroups: Story = {
	args: {
		...Default.args,
		data: heatmapActivityMatrixWithTotals.map( ( column, index ) => ( {
			...column,
			label: column.summary ? column.label : `Col ${ index + 1 }`,
			data: column.data.map( ( { label, ...cell } ) =>
				column.summary ? { label, ...cell } : cell
			),
		} ) ),
		rowLabels: [ 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun' ],
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
		<HeatmapChart
			{ ...args }
			data={ data }
			columnGroups={ columnGroups }
			keyboardNavigation="calendar"
		>
			<HeatmapChart.Legend lessLabel="Fewer posts" moreLabel="More posts" />
		</HeatmapChart>
	);
};

/**
 * `fitCells` grows the days with the container, wrapping the months onto more rows when
 * that makes them larger. Drag the container's corner to see the row count change.
 */
export const MonthCalendarFitCells: StoryObj< MonthCalendarStoryArgs > = {
	render: args => <MonthCalendarGrid { ...args } />,
	args: {
		...sharedThemeArgs,
		compact: true,
		fitCells: true,
		withTooltips: true,
		ariaLabel: 'Monthly posting activity',
		containerWidth: '1200px',
		containerHeight: '360px',
		months: 12,
		weekStartsOn: 1,
		locale: '',
	},
};

/**
 * Months as one grid sharing one scale: the "Monthly posting activity" layout.
 * Drag the container's corner: the month gaps share the width, shrink to the theme's
 * `groupGap`, and past that the container scrolls with the keyboard selection in view.
 * Arrow keys step by day and week, Page Up/Down by month.
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
				'Months drawn, ending at the sample range end. Narrow the container until the gaps stop growing.',
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
