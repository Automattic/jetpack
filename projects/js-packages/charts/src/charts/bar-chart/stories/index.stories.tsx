import {
	chartDecorator,
	sharedChartArgTypes,
	sharedThemeArgs,
	ChartStoryArgs,
	legendArgTypes,
	medalCountsData,
	largeValuesData,
	trafficData,
	themeArgTypes,
} from '../../../stories';
import BarChart from '../bar-chart';
import type { Meta, StoryObj } from '@storybook/react';

/**
 * Story-specific args that provide convenient Storybook controls.
 * These don't map directly to component props but control how data/state is manipulated in stories.
 */
type StoryArgs = ChartStoryArgs< React.ComponentProps< typeof BarChart > > & {
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
		...legendArgTypes,
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

		// Determine data based on seriesCount control
		let data = chartProps.data;
		if ( seriesCount === 'single' ) {
			data = [ medalCountsData[ 0 ] ];
		} else if ( seriesCount === 'multiple' ) {
			data = [ medalCountsData[ 0 ], medalCountsData[ 1 ], medalCountsData[ 2 ] ];
		} else if ( seriesCount === 'many' ) {
			data = medalCountsData;
		}

		return <BarChart { ...chartProps } data={ data } />;
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
		aspectRatio: 0.5,
		resizeDebounceTime: 300,
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

// Story without tooltip
export const ManyDataSeries: Story = {
	args: {
		...Default.args,
		data: medalCountsData,
	},
	parameters: {
		docs: {
			description: {
				story: 'Bar chart with many data series.',
			},
		},
	},
};

export const FixedDimensions: Story = {
	args: {
		...Default.args,
		width: 800,
		height: 400,
		data: [ medalCountsData[ 0 ], medalCountsData[ 1 ], medalCountsData[ 2 ] ],
	},
	parameters: {
		docs: {
			description: {
				story: 'Bar chart with fixed dimensions that override the responsive behavior.',
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

export const ErrorStates: StoryObj< typeof BarChart > = {
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

export const WithInteractiveLegend: Story = {
	args: {
		...Default.args,
		showLegend: true,
		legendInteractive: true,
		chartId: 'bar-chart-with-interactive-legend',
	},
	parameters: {
		docs: {
			description: {
				story:
					'Bar chart with interactive legend. Click on legend items to toggle series visibility. When all series are hidden, a message will be displayed prompting you to click legend items to show data again.',
			},
		},
	},
};

// Story demonstrating composition API
export const WithCompositionLegend: StoryObj< typeof BarChart > = {
	render: args => (
		<div style={ { width: '800px' } }>
			<BarChart
				data={ args.data || [ medalCountsData[ 0 ], medalCountsData[ 1 ], medalCountsData[ 2 ] ] }
				withTooltips={ true }
				gridVisibility="x"
				maxWidth={ 1200 }
				aspectRatio={ 0.5 }
			>
				<BarChart.Legend
					orientation={ args.legendOrientation || 'horizontal' }
					alignment={ args.legendAlignment || 'center' }
					position={ args.legendPosition || 'bottom' }
					maxWidth={ args.legendMaxWidth }
					textOverflow={ args.legendTextOverflow || 'wrap' }
				/>
			</BarChart>
		</div>
	),
	argTypes: {
		legendInteractive: {
			table: { disable: true },
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					'Demonstrates using the composition API with `<BarChart.Legend />` as a child component. This provides the same functionality as the `showLegend` prop but allows for more flexible composition patterns.',
			},
		},
	},
};

// Story showcasing legend customization controls
export const CustomLegendPositioning: Story = {
	args: {
		withTooltips: true,
		data: medalCountsData.slice( 0, 3 ), // Use first 3 series for cleaner legend
		gridVisibility: 'x',
		maxWidth: 1200,
		aspectRatio: 0.5,
		resizeDebounceTime: 300,
		// showLegend defaults to false, explicitly enabling for demonstration
		showLegend: true,
		legendOrientation: 'vertical',
		legendAlignment: 'start',
		legendPosition: 'top',
	},
	parameters: {
		docs: {
			description: {
				story:
					'Bar chart with top-left positioned vertical legend. This demonstrates non-default legend positioning to showcase different legend placement possibilities.',
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
export const ZeroValueComparison: StoryObj< typeof BarChart > = {
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
		</div>
	),
	parameters: {
		docs: {
			description: {
				story:
					'Comparison showing the difference between disabled and enabled zero value display modes. The feature preserves data integrity by keeping the original value for tooltips while providing visual feedback through minimum bar heights.',
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

export const LabelOverflowEllipsis: StoryObj< typeof BarChart > = {
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
				<h3>With labelOverflow: 'ellipsis' (Labels Truncated)</h3>
				<p style={ { marginBottom: '20px', color: '#666' } }>
					With <code>labelOverflow: 'ellipsis'</code>, labels are truncated to fit the
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
