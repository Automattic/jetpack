import { formatDate } from '@jetpack-premium-analytics/formatters';
import { withChartTheme } from '../../../stories/with-chart-theme';
import { ComparativeLineChart } from '../comparative-line-chart';
import type { ComparativeLineChartSeries, SeriesStyle } from '../types';
import type { Meta, StoryObj } from '@storybook/react';

/**
 * Helper component to display series data as a table (for story documentation only)
 */
const SeriesDataTable = ( { series }: { series: ComparativeLineChartSeries[] } ) => {
	const tableStyle: React.CSSProperties = {
		width: '100%',
		borderCollapse: 'collapse',
		fontSize: '12px',
		marginTop: '16px',
	};

	const cellStyle: React.CSSProperties = {
		border: '1px solid #ddd',
		padding: '6px 10px',
		textAlign: 'left',
	};

	const headerStyle: React.CSSProperties = {
		...cellStyle,
		backgroundColor: '#f5f5f5',
		fontWeight: 600,
	};

	// Get max data points across all series
	const maxLength = Math.max( ...series.map( s => s.data.length ) );

	return (
		<table style={ tableStyle }>
			<thead>
				<tr>
					<th style={ headerStyle }>#</th>
					{ series.map( ( s, i ) => (
						<th key={ i } style={ headerStyle } colSpan={ 2 }>
							{ s.label }
						</th>
					) ) }
				</tr>
				<tr>
					<th style={ headerStyle }></th>
					{ series.map( ( _, i ) => (
						<>
							<th key={ `date-${ i }` } style={ headerStyle }>
								Date
							</th>
							<th key={ `value-${ i }` } style={ headerStyle }>
								Value
							</th>
						</>
					) ) }
				</tr>
			</thead>
			<tbody>
				{ Array.from( { length: maxLength }, ( _, rowIndex ) => (
					<tr key={ rowIndex }>
						<td style={ cellStyle }>{ rowIndex + 1 }</td>
						{ series.map( ( s, seriesIndex ) => {
							const point = s.data[ rowIndex ] as { date: Date; value: number } | undefined;
							return (
								<>
									<td key={ `date-${ seriesIndex }-${ rowIndex }` } style={ cellStyle }>
										{ point?.date ? formatDate( point.date, 'short' ) : '-' }
									</td>
									<td key={ `value-${ seriesIndex }-${ rowIndex }` } style={ cellStyle }>
										{ point?.value ?? '-' }
									</td>
								</>
							);
						} ) }
					</tr>
				) ) }
			</tbody>
		</table>
	);
};

const meta: Meta< typeof ComparativeLineChart > = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/ComparativeLineChart',
	component: ComparativeLineChart,
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
type Story = StoryObj< typeof ComparativeLineChart >;

/**
 * Series styles using the styles prop (recommended approach).
 * Clean API where all styling is defined in one place.
 */
const SERIES_STYLES: SeriesStyle[] = [
	{ stroke: '#3858E9', strokeWidth: 2 },
	{
		stroke: '#3858E9',
		strokeDasharray: '4 4',
		strokeWidth: 1.5,
		strokeDashoffset: 2,
	},
	{ stroke: '#3858E9', strokeDasharray: '2 2', strokeWidth: 1.5 },
];

/**
 * Sample data - deterministic values for consistent snapshots
 */
const primaryDates = [
	new Date( '2024-01-01' ),
	new Date( '2024-01-02' ),
	new Date( '2024-01-03' ),
	new Date( '2024-01-04' ),
	new Date( '2024-01-05' ),
	new Date( '2024-01-06' ),
	new Date( '2024-01-07' ),
];

const comparisonDates = [
	new Date( '2023-12-25' ),
	new Date( '2023-12-26' ),
	new Date( '2023-12-27' ),
	new Date( '2023-12-28' ),
	new Date( '2023-12-29' ),
	new Date( '2023-12-30' ),
	new Date( '2023-12-31' ),
];

/**
 * Default: Single series with currency format.
 * Styles are passed via the `styles` prop (recommended approach).
 */
const singleSeries: ComparativeLineChartSeries[] = [
	{
		label: 'Revenue',
		group: 'primary',
		data: [
			{ date: primaryDates[ 0 ], value: 1200 },
			{ date: primaryDates[ 1 ], value: 1800 },
			{ date: primaryDates[ 2 ], value: 1400 },
			{ date: primaryDates[ 3 ], value: 2200 },
			{ date: primaryDates[ 4 ], value: 1900 },
			{ date: primaryDates[ 5 ], value: 2400 },
			{ date: primaryDates[ 6 ], value: 2100 },
		],
	},
];

export const Default: Story = {
	args: {
		series: singleSeries,
		styles: SERIES_STYLES,
		dataFormat: { type: 'currency' },
	},
};

/**
 * WithComparison: Two series comparing current vs previous period.
 * Note how the comparison dates (Dec 25-31) are automatically aligned
 * to the primary dates (Jan 1-7) on the X-axis.
 */
const comparisonSeries: ComparativeLineChartSeries[] = [
	{
		label: 'Jan 1-7, 2024',
		group: 'primary',
		data: [
			{ date: primaryDates[ 0 ], value: 1200 },
			{ date: primaryDates[ 1 ], value: 1800 },
			{ date: primaryDates[ 2 ], value: 1400 },
			{ date: primaryDates[ 3 ], value: 2200 },
			{ date: primaryDates[ 4 ], value: 1900 },
			{ date: primaryDates[ 5 ], value: 2400 },
			{ date: primaryDates[ 6 ], value: 2100 },
		],
	},
	{
		label: 'Dec 25-31, 2023',
		group: 'comparison',
		data: [
			{ date: comparisonDates[ 0 ], value: 1000 },
			{ date: comparisonDates[ 1 ], value: 1500 },
			{ date: comparisonDates[ 2 ], value: 1300 },
			{ date: comparisonDates[ 3 ], value: 1800 },
			{ date: comparisonDates[ 4 ], value: 1600 },
			{ date: comparisonDates[ 5 ], value: 2000 },
			{ date: comparisonDates[ 6 ], value: 1700 },
		],
	},
];

export const WithComparison: Story = {
	args: {
		series: comparisonSeries,
		styles: SERIES_STYLES,
		dataFormat: { type: 'currency' },
	},
	render: args => (
		<>
			<ComparativeLineChart { ...args } />
			<SeriesDataTable series={ args.series } />
		</>
	),
	parameters: {
		docs: {
			source: {
				code: `<ComparativeLineChart
  series={ comparisonSeries }
  styles={ SERIES_STYLES }
  dataFormat={ { type: 'currency' } }
/>`,
			},
		},
	},
};

/**
 * MultipleSeries: Three series comparing different periods.
 * Each series is automatically aligned to the primary (first) series.
 */
const thirdPeriodDates = [
	new Date( '2023-12-18' ),
	new Date( '2023-12-19' ),
	new Date( '2023-12-20' ),
	new Date( '2023-12-21' ),
	new Date( '2023-12-22' ),
	new Date( '2023-12-23' ),
	new Date( '2023-12-24' ),
];

const multipleSeries: ComparativeLineChartSeries[] = [
	{
		label: 'Jan 1-7, 2024',
		group: 'primary',
		data: [
			{ date: primaryDates[ 0 ], value: 1200 },
			{ date: primaryDates[ 1 ], value: 1800 },
			{ date: primaryDates[ 2 ], value: 1400 },
			{ date: primaryDates[ 3 ], value: 2200 },
			{ date: primaryDates[ 4 ], value: 1900 },
			{ date: primaryDates[ 5 ], value: 2400 },
			{ date: primaryDates[ 6 ], value: 2100 },
		],
	},
	{
		label: 'Dec 25-31, 2023',
		group: 'comparison',
		data: [
			{ date: comparisonDates[ 0 ], value: 1000 },
			{ date: comparisonDates[ 1 ], value: 1500 },
			{ date: comparisonDates[ 2 ], value: 1300 },
			{ date: comparisonDates[ 3 ], value: 1800 },
			{ date: comparisonDates[ 4 ], value: 1600 },
			{ date: comparisonDates[ 5 ], value: 2000 },
			{ date: comparisonDates[ 6 ], value: 1700 },
		],
	},
	{
		label: 'Dec 18-24, 2023',
		group: 'comparison',
		data: [
			{ date: thirdPeriodDates[ 0 ], value: 800 },
			{ date: thirdPeriodDates[ 1 ], value: 1200 },
			{ date: thirdPeriodDates[ 2 ], value: 1100 },
			{ date: thirdPeriodDates[ 3 ], value: 1400 },
			{ date: thirdPeriodDates[ 4 ], value: 1300 },
			{ date: thirdPeriodDates[ 5 ], value: 1600 },
			{ date: thirdPeriodDates[ 6 ], value: 1500 },
		],
	},
];

export const MultipleSeries: Story = {
	args: {
		series: multipleSeries,
		styles: SERIES_STYLES,
		dataFormat: { type: 'currency' },
	},
	render: args => (
		<>
			<ComparativeLineChart { ...args } />
			<SeriesDataTable series={ args.series } />
		</>
	),
};

/**
 * WithStylesInSeries: Alternative approach where styles are defined
 * directly in each series via the `options` property.
 * This is useful when each series needs different colors or when
 * styles are dynamically generated per-series.
 */
const seriesWithInlineStyles: ComparativeLineChartSeries[] = [
	{
		label: 'Jan 1-7, 2024',
		group: 'primary',
		data: [
			{ date: primaryDates[ 0 ], value: 1200 },
			{ date: primaryDates[ 1 ], value: 1800 },
			{ date: primaryDates[ 2 ], value: 1400 },
			{ date: primaryDates[ 3 ], value: 2200 },
			{ date: primaryDates[ 4 ], value: 1900 },
			{ date: primaryDates[ 5 ], value: 2400 },
			{ date: primaryDates[ 6 ], value: 2100 },
		],
		options: {
			stroke: '#10B981',
			seriesLineStyle: { strokeWidth: 2 },
		},
	},
	{
		label: 'Dec 25-31, 2023',
		group: 'comparison',
		data: [
			{ date: comparisonDates[ 0 ], value: 1000 },
			{ date: comparisonDates[ 1 ], value: 1500 },
			{ date: comparisonDates[ 2 ], value: 1300 },
			{ date: comparisonDates[ 3 ], value: 1800 },
			{ date: comparisonDates[ 4 ], value: 1600 },
			{ date: comparisonDates[ 5 ], value: 2000 },
			{ date: comparisonDates[ 6 ], value: 1700 },
		],
		options: {
			stroke: '#F59E0B',
			seriesLineStyle: {
				strokeWidth: 1.5,
				strokeDasharray: '4 4',
				strokeDashoffset: 2,
			},
		},
	},
];

export const WithStylesInSeries: Story = {
	args: {
		series: seriesWithInlineStyles,
		dataFormat: { type: 'currency' },
	},
	parameters: {
		docs: {
			description: {
				story: `Styles can also be defined directly in each series via the \`options\` property.
This approach is useful when:
- Each series needs different colors (e.g., green vs orange)
- Styles are dynamically generated per-series
- You want styles co-located with series data

The component will use these styles as a fallback when no \`styles\` prop is provided.`,
			},
			source: {
				code: `const seriesWithInlineStyles = [
  {
    label: 'Current Period',
    group: 'primary',
    data: [...],
    options: {
      stroke: '#10B981',
      seriesLineStyle: { strokeWidth: 2 },
    },
  },
  {
    label: 'Previous Period',
    group: 'comparison',
    data: [...],
    options: {
      stroke: '#F59E0B',
      seriesLineStyle: { strokeWidth: 1.5, strokeDasharray: '4 4', strokeDashoffset: 2 },
    },
  },
];

<ComparativeLineChart
  series={ seriesWithInlineStyles }
  dataFormat={ { type: 'currency' } }
/>`,
			},
		},
	},
};

/**
 * WeeklyIntervalsAlignment: Demonstrates proper bullet alignment when comparing
 * periods with weekly intervals that start on different days of the week.
 *
 * This is a key test case for the index-based alignment fix:
 * - Primary period: Sep 12 (Thursday) - starts mid-week
 * - Comparison period: Jun 14 (Saturday) - starts on a different day
 *
 * Without the fix, bullets would be misaligned because the offset-based approach
 * didn't account for periods starting on different weekdays.
 * With index-based alignment, each comparison point aligns perfectly with its
 * corresponding primary point regardless of actual dates.
 */
const weeklyPrimaryDates = [
	new Date( '2024-09-12' ), // Week 1 - Thu (partial week)
	new Date( '2024-09-16' ), // Week 2 - Mon
	new Date( '2024-09-23' ), // Week 3 - Mon
	new Date( '2024-09-30' ), // Week 4 - Mon
	new Date( '2024-10-07' ), // Week 5 - Mon
	new Date( '2024-10-14' ), // Week 6 - Mon
];

const weeklyComparisonDates = [
	new Date( '2024-06-14' ), // Week 1 - Sat (partial week, different day!)
	new Date( '2024-06-17' ), // Week 2 - Mon
	new Date( '2024-06-24' ), // Week 3 - Mon
	new Date( '2024-06-30' ), // Week 4 - Sun (different day!)
	new Date( '2024-07-08' ), // Week 5 - Mon
	new Date( '2024-07-15' ), // Week 6 - Mon
];

const weeklyIntervalsSeries: ComparativeLineChartSeries[] = [
	{
		label: 'Sep 12 - Oct 14, 2024',
		group: 'primary',
		data: [
			{ date: weeklyPrimaryDates[ 0 ], value: 0 },
			{ date: weeklyPrimaryDates[ 1 ], value: 15800 },
			{ date: weeklyPrimaryDates[ 2 ], value: 47200 },
			{ date: weeklyPrimaryDates[ 3 ], value: 40900 },
			{ date: weeklyPrimaryDates[ 4 ], value: 36200 },
			{ date: weeklyPrimaryDates[ 5 ], value: 43000 },
		],
	},
	{
		label: 'Jun 14 - Aug 16, 2024',
		group: 'comparison',
		data: [
			{ date: weeklyComparisonDates[ 0 ], value: 0 },
			{ date: weeklyComparisonDates[ 1 ], value: 12000 },
			{ date: weeklyComparisonDates[ 2 ], value: 38500 },
			{ date: weeklyComparisonDates[ 3 ], value: 35200 },
			{ date: weeklyComparisonDates[ 4 ], value: 29800 },
			{ date: weeklyComparisonDates[ 5 ], value: 31500 },
		],
	},
];

export const WeeklyIntervalsAlignment: Story = {
	args: {
		series: weeklyIntervalsSeries,
		styles: SERIES_STYLES,
		dataFormat: { type: 'currency' },
	},
	render: args => (
		<>
			<ComparativeLineChart { ...args } />
			<SeriesDataTable series={ args.series } />
			<p style={ { marginTop: '16px', fontSize: '13px', color: '#666' } }>
				<strong>Note:</strong> The primary period starts on Thursday (Sep 12) while the comparison
				starts on Saturday (Jun 14). With index-based alignment, bullets align perfectly by position
				regardless of actual dates. Hover to see both dates in tooltip.
			</p>
		</>
	),
	parameters: {
		docs: {
			description: {
				story: `Demonstrates proper alignment when comparing weekly intervals
that start on different days of the week. This scenario previously caused
misaligned bullets because the offset-based approach didn't account for
periods starting on different weekdays. The fix uses index-based alignment
where each comparison point gets the date of its corresponding primary point.`,
			},
		},
	},
};

/**
 * EmptyData: Shows the chart behavior when all values are zero.
 * The chart displays a fixed Y-axis domain and adjusts margins accordingly.
 */
const emptyDataSeries: ComparativeLineChartSeries[] = [
	{
		label: 'Jan 1-7, 2024',
		group: 'primary',
		data: [
			{ date: primaryDates[ 0 ], value: 0 },
			{ date: primaryDates[ 1 ], value: 0 },
			{ date: primaryDates[ 2 ], value: 0 },
			{ date: primaryDates[ 3 ], value: 0 },
			{ date: primaryDates[ 4 ], value: 0 },
			{ date: primaryDates[ 5 ], value: 0 },
			{ date: primaryDates[ 6 ], value: 0 },
		],
	},
];

export const EmptyState: Story = {
	args: {
		series: emptyDataSeries,
		styles: SERIES_STYLES,
		dataFormat: { type: 'currency' },
	},
	parameters: {
		docs: {
			description: {
				story: `When all data points are zero, the chart shows a fixed Y-axis domain
(0-4000 for currency) to maintain visual consistency.`,
			},
		},
	},
};

/**
 * EmptyDataNumber: Shows empty state behavior for number format.
 * Uses a fixed Y-axis domain of 0-80 for number metrics.
 */
export const EmptyDataNumber: Story = {
	args: {
		series: emptyDataSeries,
		styles: SERIES_STYLES,
		dataFormat: { type: 'number' },
	},
	parameters: {
		docs: {
			description: {
				story: `When using number format with empty data, the chart shows a fixed
Y-axis domain of 0-80 to maintain visual consistency.`,
			},
		},
	},
};

/**
 * Long date labels for testing legend overflow.
 */
const longLabelSeries: ComparativeLineChartSeries[] = [
	{
		label: 'January 1, 2024 - January 31, 2024',
		group: 'primary',
		data: [
			{ date: primaryDates[ 0 ], value: 1200 },
			{ date: primaryDates[ 1 ], value: 1800 },
			{ date: primaryDates[ 2 ], value: 1400 },
			{ date: primaryDates[ 3 ], value: 2200 },
			{ date: primaryDates[ 4 ], value: 1900 },
			{ date: primaryDates[ 5 ], value: 2400 },
			{ date: primaryDates[ 6 ], value: 2100 },
		],
	},
	{
		label: 'December 1, 2023 - December 31, 2023',
		group: 'comparison',
		data: [
			{ date: comparisonDates[ 0 ], value: 1000 },
			{ date: comparisonDates[ 1 ], value: 1500 },
			{ date: comparisonDates[ 2 ], value: 1300 },
			{ date: comparisonDates[ 3 ], value: 1800 },
			{ date: comparisonDates[ 4 ], value: 1600 },
			{ date: comparisonDates[ 5 ], value: 2000 },
			{ date: comparisonDates[ 6 ], value: 1700 },
		],
	},
];

/**
 * Resizable: Demonstrates auto-resize behavior.
 * Drag the container edges to see the chart adapt to different widths.
 */
export const Resizable: Story = {
	decorators: [
		Story => (
			<div
				style={ {
					width: 400,
					height: 350,
					resize: 'both',
					overflow: 'auto',
					border: '1px dashed #ccc',
					padding: 16,
					minWidth: 200,
					maxWidth: 800,
				} }
			>
				<Story />
			</div>
		),
	],
	args: {
		series: longLabelSeries,
		styles: SERIES_STYLES,
		dataFormat: { type: 'currency' },
	},
	parameters: {
		layout: 'padded',
	},
};
