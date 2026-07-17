import {
	extractLegendConfig,
	temperatureData as sampleData,
	largeValuesData,
	trafficData as webTrafficData,
} from '../../../stories';
import LineChart from '../line-chart';
import { lineChartMetaArgs, lineChartStoryArgs, type StoryArgs as BaseStoryArgs } from './config';
import type { ChartLegendConfig, SeriesData } from '../../../types';
import type { Meta, StoryFn, StoryObj } from '@storybook/react';

/**
 * Story-specific args that provide convenient Storybook controls.
 * These don't map directly to component props but control how data/state is manipulated in stories.
 */
type StoryArgs = BaseStoryArgs & {
	/** Controls how many data series to display: 'single' (1 series), 'multiple' (4 series), or 'many' (all series) */
	seriesCount?: 'single' | 'multiple' | 'many';
	/** Chart sizing mode: 'responsive' (uses maxWidth/aspectRatio) or 'fixed' (uses width/height) */
	dimensionMode?: 'responsive' | 'fixed';
};

const meta: Meta< StoryArgs > = {
	...lineChartMetaArgs,
	title: 'JS Packages/Charts Library/Charts/Line Chart',
	component: lineChartMetaArgs.component, // Make eslint happy.
	argTypes: {
		...lineChartMetaArgs.argTypes,
		seriesCount: {
			control: { type: 'radio' },
			options: [ 'single', 'multiple', 'many' ],
			description: 'Number of data series',
			table: { category: 'Data' },
		},
		dimensionMode: {
			control: { type: 'radio' },
			options: [ 'responsive', 'fixed' ],
			description: 'Chart sizing mode',
			table: { category: 'Dimensions' },
		},
		smoothing: {
			control: 'boolean',
			description: 'Enable line smoothing',
			table: { category: 'Visual Style' },
		},
		curveType: {
			control: { type: 'radio' },
			options: [ 'linear', 'smooth', 'monotone' ],
			description: 'Line curve type',
			table: { category: 'Visual Style' },
		},
		withGradientFill: {
			control: 'boolean',
			description: 'Fill area under line with gradient',
			table: { category: 'Visual Style' },
		},
	},
};

export default meta;

const Template: StoryFn< StoryArgs > = args => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { seriesCount, dimensionMode, crosshairMode, withTooltipCrosshairs, ...chartProps } = args;
	const legend = extractLegendConfig< ChartLegendConfig< SeriesData[] > >( args );

	// Determine data based on seriesCount control
	let data = chartProps.data || lineChartStoryArgs.data;
	if ( seriesCount === 'single' ) {
		data = [ sampleData[ 0 ] ];
	} else if ( seriesCount === 'multiple' ) {
		data = sampleData.slice( 0, 4 );
	} else if ( seriesCount === 'many' ) {
		data = sampleData;
	}

	// Determine dimensions based on dimensionMode control
	let dimensions = {};
	if ( dimensionMode === 'fixed' ) {
		dimensions = { width: 800, height: 400 };
	}

	// Map crosshairMode to withTooltipCrosshairs
	let crosshairConfig;
	if ( crosshairMode === 'vertical' ) {
		crosshairConfig = { showVertical: true };
	} else if ( crosshairMode === 'horizontal' ) {
		crosshairConfig = { showHorizontal: true };
	} else if ( crosshairMode === 'both' ) {
		crosshairConfig = { showVertical: true, showHorizontal: true };
	}

	return (
		<LineChart
			{ ...chartProps }
			{ ...dimensions }
			data={ data }
			legend={ legend }
			withTooltipCrosshairs={ crosshairConfig }
		/>
	);
};

// Default story with multiple series
export const Default: StoryObj< StoryArgs > = Template.bind( {} );
Default.args = {
	...lineChartStoryArgs,
	zoomable: true,
};

export const FixedDimensions: StoryObj< StoryArgs > = Template.bind( {} );
FixedDimensions.args = {
	...lineChartStoryArgs,
	width: 600,
	height: 300,
};

export const AspectRatio: StoryObj< StoryArgs > = Template.bind( {} );
AspectRatio.args = {
	...lineChartStoryArgs,
	aspectRatio: 0.3,
};

// Story with single data series
export const SingleSeries: StoryObj< StoryArgs > = Template.bind( {} );
SingleSeries.args = {
	...lineChartStoryArgs,
	data: [ sampleData[ 0 ] ], // Only London temperature data
};

export const ManySeries: StoryObj< StoryArgs > = Template.bind( {} );
ManySeries.args = {
	...lineChartStoryArgs,
	data: sampleData,
	showLegend: true,
};

export const Animation: StoryObj< StoryArgs > = Template.bind( {} );
Animation.args = {
	...lineChartStoryArgs,
	animation: true,
};

export const WithLegend: StoryObj< StoryArgs > = Template.bind( {} );
WithLegend.args = {
	...lineChartStoryArgs,
	showLegend: true,
};

WithLegend.parameters = {
	docs: {
		description: {
			story:
				'Props-based legend using `showLegend` and the `legend` config object. Use Storybook controls to adjust legend position, alignment, orientation, shape, and interactivity.',
		},
	},
};

// Story showing use with LineChart using composition API
export const WithCompositionLegend: StoryObj< StoryArgs > = {
	render: args => {
		const legend = extractLegendConfig< ChartLegendConfig< SeriesData[] > >( args );
		return (
			<LineChart
				{ ...Default.args }
				{ ...args }
				legend={ { interactive: legend?.interactive } }
				chartId="composition-line-chart"
			>
				<LineChart.Legend { ...legend } />
			</LineChart>
		);
	},
	args: {
		...Default.args,
	},
	parameters: {
		docs: {
			description: {
				story:
					'Composition API using `<LineChart.Legend />` as a child component for explicit legend placement and configuration. This is the recommended approach for flexible legend positioning.',
			},
		},
	},
};

// Story with gradient filled line chart
export const GradientFilled: StoryObj< StoryArgs > = Template.bind( {} );
GradientFilled.args = {
	...lineChartStoryArgs,
	margin: undefined,
	data: webTrafficData,
	withGradientFill: true,
	options: {
		axis: { y: { orientation: 'right' } },
	},
};

// Story with custom gradient colors per series
export const GradientCustomColors: StoryObj< StoryArgs > = Template.bind( {} );
GradientCustomColors.args = {
	width: 600,
	height: 300,
	data: [
		{
			label: 'Revenue',
			data: [
				{ date: new Date( '2024-01-01' ), value: 45000 },
				{ date: new Date( '2024-02-01' ), value: 52000 },
				{ date: new Date( '2024-03-01' ), value: 48000 },
				{ date: new Date( '2024-04-01' ), value: 61000 },
				{ date: new Date( '2024-05-01' ), value: 68000 },
				{ date: new Date( '2024-06-01' ), value: 72000 },
			],
			options: {
				gradient: {
					fromOpacity: 0.8,
					toOpacity: 0,
				},
			},
		},
		{
			label: 'Expenses',
			data: [
				{ date: new Date( '2024-01-01' ), value: 28000 },
				{ date: new Date( '2024-02-01' ), value: 31000 },
				{ date: new Date( '2024-03-01' ), value: 29000 },
				{ date: new Date( '2024-04-01' ), value: 33000 },
				{ date: new Date( '2024-05-01' ), value: 35000 },
				{ date: new Date( '2024-06-01' ), value: 38000 },
			],
			options: {
				gradient: {
					from: 'var(--jp-red)',
					to: 'var(--jp-red)',
					fromOpacity: 0.6,
					toOpacity: 0,
				},
			},
		},
	],
	withGradientFill: true,
};

// Story with transparent gradient sections
export const GradientTransparent: StoryObj< StoryArgs > = Template.bind( {} );
GradientTransparent.args = {
	width: 600,
	height: 300,
	data: [
		{
			label: 'Temperature (°C)',
			data: [
				{ date: new Date( '2024-01-01' ), value: 15 },
				{ date: new Date( '2024-02-01' ), value: 18 },
				{ date: new Date( '2024-03-01' ), value: 22 },
				{ date: new Date( '2024-04-01' ), value: 26 },
				{ date: new Date( '2024-05-01' ), value: 30 },
				{ date: new Date( '2024-06-01' ), value: 28 },
			],
			options: {
				gradient: {
					stops: [
						{ offset: '0%', opacity: 0.7 },
						{ offset: '20%', opacity: 0 },
						{ offset: '100%', opacity: 0 },
					],
				},
			},
		},
	],
	withGradientFill: true,
};

export const ErrorStates: StoryObj< StoryArgs > = {
	render: () => (
		<div style={ { display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(2, 1fr)' } }>
			<div>
				<h3>Empty Data</h3>
				<LineChart
					width={ 300 }
					height={ 200 }
					data={ [] }
					withGradientFill={ false }
					withLegendGlyph={ false }
				/>
			</div>
			<div>
				<h3>Invalid Date Values</h3>
				<LineChart
					width={ 300 }
					height={ 200 }
					data={ [
						{
							label: 'Invalid Dates',
							data: [
								{ date: new Date( 'invalid' ), value: 10 },
								{ date: new Date( '2024-01-02' ), value: 20 },
							],
							options: {},
						},
					] }
					withGradientFill={ false }
					withLegendGlyph={ false }
				/>
			</div>
			<div>
				<h3>Invalid Values</h3>
				<LineChart
					width={ 300 }
					height={ 200 }
					data={ [
						{
							label: 'Invalid Values',
							data: [
								{ date: new Date( '2024-01-01' ), value: NaN },
								{ date: new Date( '2024-01-02' ), value: null as number | null },
							],
							options: {},
						},
					] }
					withGradientFill={ false }
					withLegendGlyph={ false }
				/>
			</div>
			<div>
				<h3>Single Data Point</h3>
				<LineChart
					width={ 300 }
					height={ 200 }
					data={ [
						{
							label: 'Single Point',
							data: [ { date: new Date( '2024-01-01' ), value: 100 } ],
							options: {},
						},
					] }
					withGradientFill={ false }
					withLegendGlyph={ false }
				/>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: 'Examples of how the line chart handles various error states and edge cases.',
			},
		},
	},
};

export const WithoutSmoothing: StoryObj< StoryArgs > = Template.bind( {} );
WithoutSmoothing.args = {
	...lineChartStoryArgs,
	smoothing: false,
};

export const WithPointerEvents: StoryObj< StoryArgs > = Template.bind( {} );
WithPointerEvents.args = {
	...lineChartStoryArgs,
	// eslint-disable-next-line no-alert
	onPointerDown: ( { datum } ) => alert( 'Pointer down:' + JSON.stringify( datum ) ),
};

export const CurveTypes: StoryObj< StoryArgs > = {
	render: () => {
		// Create sample data that highlights the difference between curve types
		// Monotone X will prevent overshooting on steep changes followed by gradual changes
		const curveData = [
			{
				label: 'Sample Series',
				data: [
					{ date: new Date( '2024-01-01' ), value: 10 },
					{ date: new Date( '2024-01-02' ), value: 90 }, // Sharp rise
					{ date: new Date( '2024-01-03' ), value: 85 }, // Slight decline
					{ date: new Date( '2024-01-04' ), value: 82 }, // Gradual decline
					{ date: new Date( '2024-01-05' ), value: 5 }, // Sharp drop
					{ date: new Date( '2024-01-06' ), value: 8 }, // Slight rise
					{ date: new Date( '2024-01-07' ), value: 10 }, // Gradual rise
				],
				options: {},
			},
		];

		return (
			<div style={ { display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(3, 1fr)' } }>
				<div>
					<h3>Linear Curve</h3>
					<LineChart
						width={ 300 }
						height={ 200 }
						data={ curveData }
						curveType="linear"
						withGradientFill={ false }
						withLegendGlyph={ false }
					/>
				</div>
				<div>
					<h3>Smooth Curve (Catmull-Rom)</h3>
					<LineChart
						width={ 300 }
						height={ 200 }
						data={ curveData }
						curveType="smooth"
						withGradientFill={ false }
						withLegendGlyph={ false }
					/>
				</div>
				<div>
					<h3>Monotone X Curve</h3>
					<LineChart
						width={ 300 }
						height={ 200 }
						data={ curveData }
						curveType="monotone"
						withGradientFill={ false }
						withLegendGlyph={ false }
					/>
				</div>
			</div>
		);
	},
	parameters: {
		docs: {
			description: {
				story:
					'Examples of the three different curve types available. The data points are designed to highlight how Monotone X prevents overshooting (going above/below data points) compared to Catmull-Rom smoothing, while still maintaining a smooth curve. Linear shows the raw connections between points.',
			},
		},
	},
};

// Story demonstrating Smart Formatting (formatYTick) with large values
export const SmartFormatting: StoryObj< StoryArgs > = Template.bind( {} );
SmartFormatting.args = {
	...lineChartStoryArgs,
	data: largeValuesData,
	withGradientFill: false,
	smoothing: true,
	options: {
		axis: {
			x: {
				orientation: 'bottom',
			},
			y: {
				orientation: 'left',
			},
		},
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

// Offset for dashed line to prevent overlapping with solid line
const DASHED_LINE_OFFSET = 100;

export const BrokenLine: StoryObj< StoryArgs > = Template.bind( {} );
BrokenLine.args = {
	...lineChartStoryArgs,
	data: [
		{
			...webTrafficData[ 0 ],
			label: 'Visitors with dashed line',
			data: webTrafficData[ 0 ].data.map( point => ( {
				...point,
				value: point.value + DASHED_LINE_OFFSET,
			} ) ),
			options: {
				...webTrafficData[ 0 ].options,
				seriesLineStyle: { strokeDasharray: '5 5', strokeWidth: 3 },
			},
		},
		webTrafficData[ 0 ],
	],
	showLegend: true,
};

BrokenLine.parameters = {
	docs: {
		description: {
			story: 'Demonstrates the option of setting a seriesLineStyle to a dash array.',
		},
	},
};

export const DateStringFormats: StoryObj< StoryArgs > = Template.bind( {} );
DateStringFormats.args = {
	...lineChartStoryArgs,
	withGradientFill: false,
	withLegendGlyph: false,
	data: [
		{
			label: 'String Dates',
			data: [
				{ dateString: '2024-01-01', value: 10 },
				{ dateString: '2024-01-02', value: 20 },
				{ dateString: '2024-01-03 00:00:00', value: 15 },
				{ dateString: '2024-01-04', value: 25 },
				{ dateString: '2024-01-05 00:00', value: 30 },
			],
			options: {},
		},
	],
};
DateStringFormats.parameters = {
	docs: {
		description: {
			story:
				"Demonstrates the line chart's ability to handle various date string formats and mixed date types. All dates are converted to local timezone. The chart can process:\n" +
				'- Simple date strings (YYYY-MM-DD)\n' +
				'- Date with time (YYYY-MM-DD 00:00:00)\n' +
				'- Date with time (YYYY-MM-DD 00:00)\n' +
				'- ISO format (YYYY-MM-DDT00:00:00)\n' +
				'- UTC format (YYYY-MM-DDT00:00:00Z)\n' +
				'- Timezone offset (YYYY-MM-DDT00:00:00±HH:mm)\n',
		},
	},
};

export const Comparison: StoryObj< StoryArgs > = Template.bind( {} );
Comparison.args = {
	...lineChartStoryArgs,
	showLegend: true,
	smoothing: false,
	data: [
		{
			...sampleData[ 0 ],
			label: 'New York',
		},
		{
			...sampleData[ 1 ],
			label: 'New York last year',
			group: 'new-york',
			options: {
				type: 'comparison' as const,
			},
		},
		{
			...sampleData[ 2 ],
			label: 'Tokyo',
		},
		{
			...sampleData[ 3 ],
			label: 'Tokyo last year',
			group: 'tokyo',
			options: {
				type: 'comparison' as const,
			},
		},
	],
};
