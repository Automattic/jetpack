import {
	chartDecorator,
	sharedChartArgTypes,
	sharedThemeArgs,
	ChartStoryArgs,
	seriesLegendArgTypes,
	extractLegendConfig,
	medalCountsData,
	largeValuesData,
	trafficData,
	themeArgTypes,
	type SeriesLegendStoryControls,
} from '../../../stories';
import BarChart from '../bar-chart';
import type { ChartLegendConfig, SeriesData } from '../../../types';
import type { Meta, StoryObj } from '@storybook/react';

/**
 * Story-specific args that provide convenient Storybook controls.
 * These don't map directly to component props but control how data/state is manipulated in stories.
 */
type StoryArgs = ChartStoryArgs< React.ComponentProps< typeof BarChart > > &
	SeriesLegendStoryControls & {
		/** Controls how many data series to display: 'single' (1 series), 'multiple' (3 series), or 'many' (all series) */
		seriesCount?: 'single' | 'multiple' | 'many';
	};

const meta: Meta< StoryArgs > = {
	title: 'JS Packages/Charts Library/Charts/Bar Chart',
	component: BarChart,
	parameters: {
		layout: 'centered',
	},
	decorators: [ chartDecorator ],
	argTypes: {
		...sharedChartArgTypes,
		...themeArgTypes,
		...seriesLegendArgTypes,
		orientation: {
			control: { type: 'radio' },
			options: [ 'vertical', 'horizontal' ],
			description: 'Bar orientation',
			table: { category: 'Visual Style' },
		},
		gridVisibility: {
			control: { type: 'radio' },
			options: [ 'none', 'x', 'y', 'both' ],
			description: 'Grid line visibility',
			table: { category: 'Visual Style' },
		},
		seriesCount: {
			control: { type: 'radio' },
			options: [ 'single', 'multiple', 'many' ],
			description: 'Number of data series',
			table: { category: 'Data' },
		},
		withPatterns: {
			control: 'boolean',
			description: 'Use patterns for bars',
			table: { category: 'Visual Style' },
		},
	},
	render: args => {
		const { seriesCount, ...chartProps } = args;
		const legend = extractLegendConfig< ChartLegendConfig< SeriesData[] > >( args );

		// Determine data based on seriesCount control
		let data = chartProps.data;
		if ( seriesCount === 'single' ) {
			data = [ medalCountsData[ 0 ] ];
		} else if ( seriesCount === 'multiple' ) {
			data = [ medalCountsData[ 0 ], medalCountsData[ 1 ], medalCountsData[ 2 ] ];
		} else if ( seriesCount === 'many' ) {
			data = medalCountsData;
		}

		return <BarChart { ...chartProps } legend={ legend } data={ data } />;
	},
} satisfies Meta< StoryArgs >;

export default meta;

type Story = StoryObj< StoryArgs >;

// Default story with multiple series
export const Default: Story = {
	args: {
		...sharedThemeArgs,
		withTooltips: true,
		data: [ medalCountsData[ 0 ], medalCountsData[ 1 ], medalCountsData[ 2 ] ], // limit to 3 series for better readability
		gridVisibility: 'x',
		maxWidth: 1200,
		resizeDebounceTime: 300,
	},
};

export const FixedDimensions: Story = {
	args: {
		...Default.args,
		width: 600,
		height: 300,
	},
};

export const AspectRatio: Story = {
	args: {
		...Default.args,
		aspectRatio: 0.3,
	},
};

// Story with single data series
export const SingleSeries: Story = {
	args: {
		...Default.args,
		data: [ medalCountsData[ 0 ] ],
	},
	parameters: {
		docs: {
			description: {
				story: 'Bar chart with a single data series.',
			},
		},
	},
};

// Story with single data series
export const TimeSeries: Story = {
	args: {
		...Default.args,
		data: [
			{
				...trafficData[ 0 ],
				label: 'Data with dateString and date',
				data: [
					...trafficData[ 0 ].data,
					{ dateString: '2024-01-31', value: 2230 },
					{ dateString: '2024-02-01', value: 2580 },
					{ date: new Date( '2024-02-02 00:00:00' ), value: 3500 },
					{ dateString: '2024-02-03 00:00:00', value: 1500 },
					{ dateString: '2024-02-04', value: 2500 },
					{ dateString: '2024-02-05 00:00', value: 3000 },
				],
			},
		],
		options: {
			axis: {
				x: {
					tickFormat: ( timestamp: number ) => {
						const date = new Date( timestamp );
						return date.toLocaleDateString( 'en-US', { dateStyle: 'short' } );
					},
				},
			},
		},
	},
	parameters: {
		docs: {
			description: {
				story: 'Bar chart with a time series.',
			},
		},
	},
};

// Wall-clock dates in the browser frame — the library's parsing convention —
// so the ticks read the same in any viewer timezone.
const hourlyBarSeries = ( label: string, hours: number ): SeriesData => ( {
	label,
	data: Array.from( { length: hours }, ( _, i ) => ( {
		date: new Date( 2026, 7, 2, i ),
		value: Math.round( 60 + 40 * Math.sin( ( i % 24 ) / 3.5 ) ),
	} ) ),
	options: {},
} );

export const TimeAxisTickFormats: Story = {
	render: () => (
		<div style={ { display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(2, 1fr)' } }>
			<div>
				<h3>Hourly buckets, single day → hour ticks</h3>
				<BarChart width={ 460 } height={ 220 } data={ [ hourlyBarSeries( 'Views', 24 ) ] } />
			</div>
			<div>
				<h3>Daily buckets → date ticks</h3>
				<BarChart
					width={ 460 }
					height={ 220 }
					data={ [
						{
							label: 'Views',
							data: Array.from( { length: 30 }, ( _, i ) => ( {
								date: new Date( 2026, 6, 1 + i ),
								value: Math.round( 60 + 40 * Math.sin( i / 4 ) ),
							} ) ),
							options: {},
						},
					] }
				/>
			</div>
			<div>
				<h3>Yearly span → year ticks</h3>
				<BarChart
					width={ 460 }
					height={ 220 }
					data={ [
						{
							label: 'Views',
							data: Array.from( { length: 4 }, ( _, i ) => ( {
								date: new Date( 2023 + i, 0, 1 ),
								value: Math.round( 60 + 40 * Math.sin( i / 2 ) ),
							} ) ),
							options: {},
						},
					] }
				/>
			</div>
		</div>
	),
	args: {
		containerWidth: '1020px',
		containerHeight: '700px',
	},
	parameters: {
		docs: {
			description: {
				story:
					'Date-based series share the time-axis tick formatter with the line and area charts: hour ticks within a day, calendar dates within a year, otherwise years. An explicit `options.axis.x.tickFormat` still overrides.',
			},
		},
	},
};

export const WithPatterns: Story = {
	args: {
		...Default.args,
		withPatterns: true,
		data: Default.args.data.map( country => {
			return {
				...country,
				data: country.data.filter( d => parseInt( d.label ) >= 2016 ),
			};
		} ),
	},
};

export const Animation: Story = {
	args: {
		...Default.args,
		animation: true,
	},
};

export const ErrorStates: Story = {
	render: () => (
		<div style={ { display: 'grid', gap: '20px' } }>
			<div>
				<h3>Empty Data</h3>
				<div style={ { width: '400px', height: '300px' } }>
					<BarChart data={ [] } />
				</div>
			</div>

			<div>
				<h3>Invalid Data</h3>
				<div style={ { width: '400px', height: '300px' } }>
					<BarChart
						data={ [
							{
								label: 'Invalid Series',
								data: [
									{ date: new Date( 'invalid' ), value: 10, label: 'Invalid Date' },
									{ date: new Date( '2024-01-02' ), value: null, label: 'Null Value' },
								],
								options: {},
							},
						] }
					/>
				</div>
			</div>
		</div>
	),
};

ErrorStates.parameters = {
	docs: {
		description: {
			story:
				'Examples of how the bar chart handles various error states including empty data and invalid data.',
		},
	},
};

// Story demonstrating Smart Formatting (formatYTick) with large values
export const SmartFormatting: Story = {
	args: {
		withTooltips: true,
		data: largeValuesData,
		gridVisibility: 'x',
	},
};

SmartFormatting.parameters = {
	docs: {
		description: {
			story:
				'Demonstrates the Smart Formatting feature (formatYTick) that automatically formats Y-axis tick labels based on the data range. Values ≥1B are formatted as "1.23B", ≥1M as "1.2M", ≥1K as "1k", and smaller values as "1,234". This example shows revenue in billions and users in millions.',
		},
	},
};

export const WithLegend: Story = {
	args: {
		...Default.args,
		showLegend: true,
	},
	parameters: {
		docs: {
			description: {
				story:
					'Props-based legend using `showLegend` and the `legend` config object. Use Storybook controls to adjust legend position, alignment, orientation, shape, and interactivity.',
			},
		},
	},
};

// Story demonstrating composition API
export const WithCompositionLegend: Story = {
	render: args => {
		const legend = extractLegendConfig< ChartLegendConfig< SeriesData[] > >( args );
		return (
			<BarChart
				{ ...Default.args }
				{ ...args }
				legend={ { interactive: legend?.interactive } }
				chartId="composition-bar-chart"
			>
				<BarChart.Legend { ...legend } />
			</BarChart>
		);
	},
	args: {
		...Default.args,
	},
	parameters: {
		docs: {
			description: {
				story:
					'Composition API using `<BarChart.Legend />` as a child component for explicit legend placement and configuration. This is the recommended approach for flexible legend positioning.',
			},
		},
	},
};

export const HorizontalBarChart: Story = {
	args: {
		...Default.args,
		data: [ medalCountsData[ 0 ], medalCountsData[ 1 ], medalCountsData[ 2 ] ],
		orientation: 'horizontal',
		gridVisibility: 'none',
	},
};

const dataWithZeroValues = [
	{
		group: 'United States',
		label: 'United States',
		data: [
			{ label: '1896', value: 0 },
			{ label: '1900', value: 0 },
			{ label: '1904', value: 2 },
			{ label: '1908', value: 1 },
			{ label: '1912', value: 3 },
		],
	},
	{
		group: 'Great Britain',
		label: 'Great Britain',
		data: [
			{ label: '1896', value: 1 },
			{ label: '1900', value: 0 },
			{ label: '1904', value: 1 },
			{ label: '1908', value: 10 },
			{ label: '1912', value: 9 },
		],
	},
	{
		group: 'Japan',
		label: 'Japan',
		data: [
			{ label: '1896', value: 2 },
			{ label: '1900', value: 1 },
			{ label: '1904', value: 2 },
			{ label: '1908', value: 1 },
			{ label: '1912', value: 2 },
		],
	},
];
export const ZeroValueComparison: Story = {
	render: () => (
		<div style={ { display: 'grid', gap: '40px' } }>
			<div>
				<h3>Zero Value Display: Disabled (Default)</h3>
				<p style={ { marginBottom: '20px', color: '#666' } }>
					Zero values are not visually displayed. Bars with zero values have no height.
				</p>
				<div style={ { width: '600px', height: '300px' } }>
					<BarChart
						data={ dataWithZeroValues }
						showZeroValues={ false }
						withTooltips={ true }
						gridVisibility="x"
					/>
				</div>
			</div>

			<div>
				<h3>Zero Value Display: Enabled</h3>
				<p style={ { marginBottom: '20px', color: '#666' } }>
					Zero values are visually displayed with minimum height bars. The tooltip still shows the
					actual value of 0, while the bar has a small visual height for better UX.
				</p>
				<div style={ { width: '600px', height: '300px' } }>
					<BarChart
						data={ dataWithZeroValues }
						showZeroValues={ true }
						withTooltips={ true }
						gridVisibility="x"
					/>
				</div>
			</div>

			<div>
				<h3>Small Chart Height (100px)</h3>
				<p style={ { marginBottom: '20px', color: '#666' } }>
					Zero-value bars remain visible even in small charts. The minimum pixel height ensures bars
					are at least 2 pixels tall regardless of chart dimensions.
				</p>
				<div style={ { width: '600px', height: '100px', border: '1px solid #e0e0e0' } }>
					<BarChart
						data={ dataWithZeroValues }
						showZeroValues={ true }
						withTooltips={ true }
						gridVisibility="x"
					/>
				</div>
			</div>
		</div>
	),
	args: {
		containerHeight: '1600px', // Extra height to demonstrate zero-value bars in small chart height scenario
	},
	parameters: {
		docs: {
			description: {
				story:
					'Comparison showing the difference between disabled and enabled zero value display modes. The feature preserves data integrity by keeping the original value for tooltips while providing visual feedback through minimum bar heights. Zero-value bars remain visible even in small chart heights.',
			},
		},
	},
};

// Data with long categorical labels to demonstrate overlapping issue
const longLabelData = [
	{
		group: 'sales',
		label: 'Sales by Channel',
		data: [
			{ label: 'Organic Search Traffic', value: 12500 },
			{ label: 'Paid Advertising Campaign', value: 8750 },
			{ label: 'Social Media Marketing', value: 6250 },
			{ label: 'Email Newsletter Subscribers', value: 4375 },
			{ label: 'Direct Website Visitors', value: 3125 },
			{ label: 'Affiliate Partner Referrals', value: 2500 },
		],
	},
];

// Comparison mode: one primary series + one shadow series sharing the same group.
// The shadow renders as a translucent bar (150% width, 50% opacity) centered behind
// the primary bar, making it easy to compare the current period against a previous one.
export const ComparisonSingle: Story = {
	args: {
		...Default.args,
		showLegend: true,
		legendCollapseGroups: false,
		data: [
			{
				label: 'Views',
				group: 'views',
				data: [
					{ label: 'Mon', value: 420 },
					{ label: 'Tue', value: 580 },
					{ label: 'Wed', value: 310 },
					{ label: 'Thu', value: 750 },
					{ label: 'Fri', value: 640 },
				],
			},
			{
				label: 'Views — previous',
				group: 'views',
				options: { type: 'comparison' as const },
				data: [
					{ label: 'Mon', value: 510 },
					{ label: 'Tue', value: 490 },
					{ label: 'Wed', value: 430 },
					{ label: 'Thu', value: 620 },
					{ label: 'Fri', value: 700 },
				],
			},
		],
	},
	parameters: {
		docs: {
			description: {
				story:
					'One primary series paired with a `type: "comparison"` series sharing the same `group`. The comparison series renders as a translucent (50% opacity) shadow bar at the standard slot width, behind a primary bar narrowed to 60% — so it reads as a shadow peeking around the current period. `legend.collapseGroups` is off here, the default, so each series keeps its own legend item; turn the `legendCollapseGroups` control on to fold the pair into a single **Views** item.',
			},
		},
	},
};

// Comparison mode with multiple groups side by side.
// Each group has its own primary series and its own shadow series,
// demonstrating that comparison mode works correctly across grouped bar layouts.
export const ComparisonMulti: Story = {
	args: {
		...Default.args,
		showLegend: true,
		legendInteractive: true,
		legendCollapseGroups: true,
		data: [
			{
				label: 'Views',
				group: 'views',
				data: [
					{ label: 'Mon', value: 420 },
					{ label: 'Tue', value: 580 },
					{ label: 'Wed', value: 310 },
					{ label: 'Thu', value: 750 },
					{ label: 'Fri', value: 640 },
				],
			},
			{
				label: 'Views — previous',
				group: 'views',
				options: { type: 'comparison' as const },
				data: [
					{ label: 'Mon', value: 510 },
					{ label: 'Tue', value: 490 },
					{ label: 'Wed', value: 430 },
					{ label: 'Thu', value: 620 },
					{ label: 'Fri', value: 700 },
				],
			},
			{
				label: 'Visitors',
				group: 'visitors',
				data: [
					{ label: 'Mon', value: 280 },
					{ label: 'Tue', value: 390 },
					{ label: 'Wed', value: 220 },
					{ label: 'Thu', value: 500 },
					{ label: 'Fri', value: 430 },
				],
			},
			{
				label: 'Visitors — previous',
				group: 'visitors',
				options: { type: 'comparison' as const },
				data: [
					{ label: 'Mon', value: 340 },
					{ label: 'Tue', value: 320 },
					{ label: 'Wed', value: 290 },
					{ label: 'Thu', value: 410 },
					{ label: 'Fri', value: 460 },
				],
			},
		],
	},
	parameters: {
		docs: {
			description: {
				story:
					'Two groups (`views` and `visitors`) rendered side by side, each paired with its own `type: "comparison"` series. Each group\'s standard-width shadow bar sits behind its 60%-width primary bar, with clear gaps preserved between groups — confirming comparison mode composes correctly with grouped bar layouts. With `legend.collapseGroups` each group is a single legend item (Views, Visitors), and because `legend.interactive` is also on, clicking one toggles both its current and previous-period series at once. Turn the `legendCollapseGroups` control off to get one item per series, each toggling alone.',
			},
		},
	},
};

export const LabelOverflowEllipsis: Story = {
	render: () => (
		<div style={ { display: 'grid', gap: '40px' } }>
			<div>
				<h3>Without labelOverflow (Default - Labels Overlap)</h3>
				<p style={ { marginBottom: '20px', color: '#666' } }>
					Default behavior: long labels overlap and become unreadable at narrow widths.
				</p>
				<div style={ { width: '350px', height: '250px', border: '1px solid #e0e0e0' } }>
					<BarChart data={ longLabelData } withTooltips={ true } gridVisibility="x" />
				</div>
			</div>
			<div>
				<h3>With labelOverflow: &apos;ellipsis&apos; (Labels Truncated)</h3>
				<p style={ { marginBottom: '20px', color: '#666' } }>
					With <code>labelOverflow: &apos;ellipsis&apos;</code>, labels are truncated to fit the
					available bandwidth. <strong>Hover over a label to see the full text.</strong>
				</p>
				<div style={ { width: '350px', height: '250px', border: '1px solid #e0e0e0' } }>
					<BarChart
						data={ longLabelData }
						withTooltips={ true }
						gridVisibility="x"
						options={ {
							axis: {
								x: {
									labelOverflow: 'ellipsis',
								},
							},
						} }
					/>
				</div>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story:
					"Demonstrates the `labelOverflow: 'ellipsis'` option that truncates long axis labels to fit the available bandwidth. The full label text is shown on hover via a native tooltip. This is useful for narrow widget contexts where space is limited.",
			},
		},
	},
};
