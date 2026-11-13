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
import type { CalendarHeatmapOptions, HeatmapCell, HeatmapColumn } from '../index';
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

const MONTH_LABELS = [
	'Jan',
	'Feb',
	'Mar',
	'Apr',
	'May',
	'Jun',
	'Jul',
	'Aug',
	'Sep',
	'Oct',
	'Nov',
	'Dec',
];

/**
 * Lay months out as twelve columns with one row per year.
 *
 * @param years   - The years, one per row.
 * @param cellFor - The cell for a month, or `null` for a month outside the covered span.
 * @return One column per month; uncovered months are placeholder cells.
 */
const monthColumns = (
	years: number[],
	cellFor: ( year: number, month: number ) => HeatmapCell | null
): HeatmapColumn[] =>
	MONTH_LABELS.map( ( label, month ) => ( {
		label,
		data: years.map( year => ( {
			label: `${ label } ${ year }`,
			...( cellFor( year, month ) ?? { value: null, placeholder: true } ),
		} ) ),
	} ) );

const LONG_HISTORY_YEARS = [ 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025 ];
const LONG_HISTORY_YEARLY_BASE = [ 18000, 28000, 34000, 30000, 25000, 21000, 18000, 16000 ];
const LONG_HISTORY_SEASONALITY = [ 1, 0.95, 1.05, 1, 0.9, 0.8, 0.75, 0.8, 1.1, 1.15, 1.05, 0.85 ];

const hashFraction = ( seed: number ) => Math.abs( Math.sin( seed * 12.9898 ) * 43758.5453 ) % 1;

const jitter = ( seed: number ) => 0.85 + 0.3 * hashFraction( seed );

// Launched late March 2018, one viral September 2021, and November 2025 still running.
const longHistoryCell = ( year: number, month: number ): HeatmapCell | null => {
	if ( year === 2018 && month < 2 ) {
		return null;
	}
	if ( year === 2018 && month === 2 ) {
		return { value: 200, partial: true };
	}
	if ( year === 2025 && month === 10 ) {
		return { value: 14200, partial: true };
	}
	if ( year === 2025 && month === 11 ) {
		return null;
	}
	if ( year === 2021 && month === 8 ) {
		return { value: 800000 };
	}
	const yearIndex = LONG_HISTORY_YEARS.indexOf( year );
	return {
		value: Math.round(
			LONG_HISTORY_YEARLY_BASE[ yearIndex ] *
				LONG_HISTORY_SEASONALITY[ month ] *
				jitter( yearIndex * 12 + month )
		),
	};
};

const longHistoryMonths = monthColumns( LONG_HISTORY_YEARS, longHistoryCell );

const longHistoryData: HeatmapColumn[] = [
	...longHistoryMonths,
	{
		label: 'Totals',
		summary: true,
		data: LONG_HISTORY_YEARS.map( ( year, row ) => ( {
			label: `Total ${ year }`,
			value: longHistoryMonths.reduce(
				( sum, column ) => sum + ( column.data[ row ].value ?? 0 ),
				0
			),
		} ) ),
	},
];

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
		data: longHistoryData,
		rowLabels: LONG_HISTORY_YEARS.map( String ),
		scale: 'buckets',
		withTooltips: true,
		ariaLabel: 'Views over years',
		containerWidth: '960px',
		containerHeight: '460px',
	},
};

const monthValues = ( year: number, values: number[] ): Record< string, number > =>
	Object.fromEntries( values.map( ( value, month ) => [ `${ year }-${ month }`, value ] ) );

const SINGLE_POST_HISTORY_YEARS = [ 2024, 2025 ];

// Published in October 2024, one spike in January 2025, November 2025 still running.
const SINGLE_POST_VIEWS: Record< string, number > = {
	'2024-9': 85,
	'2024-10': 140,
	'2024-11': 96,
	'2025-0': 9400,
	'2025-1': 310,
	'2025-2': 180,
	'2025-3': 150,
	'2025-4': 120,
	'2025-5': 95,
	'2025-6': 88,
	'2025-7': 110,
	'2025-8': 70,
	'2025-9': 82,
	'2025-10': 41,
};

const singlePostCell = ( year: number, month: number ): HeatmapCell | null => {
	const key = `${ year }-${ month }`;
	if ( ! ( key in SINGLE_POST_VIEWS ) ) {
		return null;
	}
	return { value: SINGLE_POST_VIEWS[ key ], partial: key === '2024-9' || key === '2025-10' };
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
		data: monthColumns( SINGLE_POST_HISTORY_YEARS, singlePostCell ),
		rowLabels: SINGLE_POST_HISTORY_YEARS.map( String ),
		scale: 'buckets',
		withTooltips: true,
		ariaLabel: 'Post views by month',
		containerWidth: '960px',
		containerHeight: '280px',
	},
};

const SCALE_COMPARISON_YEARS = [ 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026 ];

// A post that sat in single digits for eight years, then caught on: the shape a rank scale
// flattens at the top and a distance scale flattens everywhere else.
const SCALE_COMPARISON_VIEWS: Record< string, number > = {
	...monthValues( 2017, [ 4, 21, 33, 19, 7, 12, 11, 15, 8, 3, 16, 22 ] ),
	...monthValues( 2018, [ 7, 5, 14, 9, 11, 6, 15, 8, 4, 6, 2, 5 ] ),
	...monthValues( 2019, [ 9, 7, 4, 15, 18, 13, 6, 5, 2, 28, 9, 11 ] ),
	...monthValues( 2020, [ 6, 9, 8, 3, 12, 640, 11, 2900, 8, 18, 14, 12 ] ),
	...monthValues( 2021, [ 21, 11, 16, 5, 7, 4, 11, 9, 2, 3, 5, 6 ] ),
	...monthValues( 2022, [ 12, 10, 9, 8, 6, 5, 7, 910, 205, 9, 4, 7 ] ),
	...monthValues( 2023, [ 8, 13, 5, 4, 7, 6, 3, 5, 9, 3, 2, 27 ] ),
	...monthValues( 2024, [ 16, 6, 5, 58, 230, 7, 14, 2, 1, 3, 9, 19 ] ),
	...monthValues( 2025, [ 0, 6, 3, 2, 19, 5, 275, 221, 1700, 2300, 11400, 10600 ] ),
	...monthValues( 2026, [ 9800, 7100, 1500, 4200, 2800, 2400, 3100, 1900, 1400, 2600, 820 ] ),
};

const scaleComparisonCell = ( year: number, month: number ): HeatmapCell | null => {
	const key = `${ year }-${ month }`;
	if ( ! ( key in SCALE_COMPARISON_VIEWS ) ) {
		return null;
	}
	return { value: SCALE_COMPARISON_VIEWS[ key ], partial: key === '2026-10' };
};

const SCALE_CAPTIONS: Record< 'linear' | 'buckets' | 'log', string > = {
	linear:
		'linear places a value by its distance from the largest. The recent months are unmistakable, and eight years of real differences share the lightest tone.',
	buckets:
		'buckets ranks a value against the series. The quiet years separate, and the darkest step now runs from the low hundreds all the way to the maximum.',
	log: 'log places a value by its distance in log space. Each step is a jump of the same factor, so the quiet years and the busy ones both keep their spread.',
};

/**
 * The same ten years of a post's traffic on each scale, so the three can be read against each
 * other. Values are above zero throughout, which the log scale requires.
 */
export const ScaleComparison: Story = {
	render: args => (
		<div style={ { display: 'flex', flexDirection: 'column', gap: '28px' } }>
			{ ( [ 'linear', 'buckets', 'log' ] as const ).map( scale => (
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
		data: monthColumns( SCALE_COMPARISON_YEARS, scaleComparisonCell ),
		rowLabels: SCALE_COMPARISON_YEARS.map( String ),
		withTooltips: true,
		ariaLabel: 'Post views by month',
		containerWidth: '1000px',
		containerHeight: 'auto',
	},
};

const FEW_DISTINCT_VALUES = [
	120, 120, 480, 120, 2400, 120, 480, 480, 120, 120, 480, 120, 480, 120, 120, 2400, 480, 120, 480,
	120, 120, 480, 2400, 120,
];

/**
 * Twenty-four months holding three distinct values. Each value takes its own step, so the
 * scale uses three of its five colors and leaves two legend swatches unused. The largest
 * value is still the darkest cell, and the smallest the lightest.
 */
export const FewDistinctValues: Story = {
	render: args => (
		<HeatmapChart { ...args } chartId="few-distinct-values-heatmap">
			<HeatmapChart.Legend variant="bar" lessLabel="Fewer views" moreLabel="More views" />
		</HeatmapChart>
	),
	args: {
		...sharedThemeArgs,
		data: monthColumns( [ 2024, 2025 ], ( year, month ) => ( {
			value: FEW_DISTINCT_VALUES[ ( year - 2024 ) * 12 + month ],
		} ) ),
		rowLabels: [ '2024', '2025' ],
		scale: 'buckets',
		withTooltips: true,
		ariaLabel: 'Views by month',
		containerWidth: '960px',
		containerHeight: '280px',
	},
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
	scale: {
		control: { type: 'inline-radio' as const },
		options: [ 'buckets', 'linear', 'log' ],
		description:
			'Whether a value picks its color by rank among its peers, by distance, or by distance in log space.',
		table: { category: 'Calendar' },
	},
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

const calendarSeriesFrom = ( valueFor: ( dayIndex: number ) => number ): DataPointDate[] =>
	raggedCalendarSeries.map( ( { date }, dayIndex ) => ( { date, value: valueFor( dayIndex ) } ) );

const publicationSpikeSeries = calendarSeriesFrom( day =>
	Math.round( 500 * 0.45 ** day + 4 * jitter( day ) )
);

const GROWTH_WEEKLY_SEASONALITY = [ 1.15, 1.05, 1, 0.95, 0.9, 0.8, 1.05 ];

const gradualGrowthSeries = calendarSeriesFrom( day =>
	Math.round( ( 20 + day * 1.6 ) * GROWTH_WEEKLY_SEASONALITY[ day % 7 ] * jitter( day + 500 ) )
);

const CALENDAR_VALUE_STEPS = [ 4, 30, 120, 900 ];

const fewValuesCalendarSeries = calendarSeriesFrom(
	day => CALENDAR_VALUE_STEPS[ Math.floor( hashFraction( day ) * CALENDAR_VALUE_STEPS.length ) ]
);

// Days 54 to 60 fill one whole column while weeks start on Monday, so the busy week reads as one.
const oneBusyWeekSeries = calendarSeriesFrom( day =>
	Math.round( ( day >= 54 && day <= 60 ? 140 : 18 ) * jitter( day ) )
);

const CALENDAR_DATASETS = {
	'Steady traffic': raggedCalendarSeries,
	'Publication spike and decay': publicationSpikeSeries,
	'Gradual growth': gradualGrowthSeries,
	'A few distinct values': fewValuesCalendarSeries,
	'One busy week': oneBusyWeekSeries,
};

type CalendarDatasetStoryArgs = CalendarStoryArgs & { dataset: keyof typeof CALENDAR_DATASETS };

export const Calendar: StoryObj< CalendarDatasetStoryArgs > = {
	render: ( { dataset, ...args } ) => (
		// Seven swatches hold under `linear` and snap back to the five the cells paint under `buckets`.
		<CalendarGrid { ...args } series={ CALENDAR_DATASETS[ dataset ] }>
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
		scale: 'linear',
	},
	argTypes: {
		...calendarArgTypes,
		dataset: {
			control: 'select' as const,
			options: Object.keys( CALENDAR_DATASETS ),
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
