import { formatNumber } from '@automattic/number-formatters';
import { ChartStoryArgs } from '../../../stories';
import TimeSeriesForecastChart from '../time-series-forecast-chart';
import {
	timeSeriesForecastChartMetaArgs,
	timeSeriesForecastChartStoryArgs,
	sampleForecastData,
	sampleAccessors,
	sampleForecastStart,
	generateForecastData,
	type SampleForecastDatum,
} from './config';
import type { TimeSeriesForecastChartProps } from '../types';
import type { Meta, StoryFn, StoryObj } from '@storybook/react';

type StoryArgs = ChartStoryArgs< TimeSeriesForecastChartProps< SampleForecastDatum > >;

const meta: Meta< StoryArgs > = {
	...timeSeriesForecastChartMetaArgs,
	title: 'JS Packages/Charts Library/Charts/Time Series Forecast Chart',
};

export default meta;

const Template: StoryFn< typeof TimeSeriesForecastChart > = args => {
	return <TimeSeriesForecastChart { ...args } />;
};

/**
 * Default story showing historical data with forecast and uncertainty bands
 */
export const Default: StoryObj< StoryArgs > = Template.bind( {} );
Default.args = {
	...timeSeriesForecastChartStoryArgs,
};

Default.parameters = {
	docs: {
		description: {
			story:
				'The TimeSeriesForecastChart displays historical data as a solid line and forecast data as a dashed line. ' +
				'The shaded area represents the uncertainty band between lower and upper bounds. ' +
				'A vertical dashed line marks the forecast start date.',
		},
	},
};

/**
 * With Legend enabled
 */
export const WithLegend: StoryObj< StoryArgs > = Template.bind( {} );
WithLegend.args = {
	...timeSeriesForecastChartStoryArgs,
	showLegend: true,
	legendPosition: 'bottom',
};

WithLegend.parameters = {
	docs: {
		description: {
			story:
				'The chart with legend showing series labels. The forecast series shows a dashed line indicator.',
		},
	},
};

/**
 * With Animation
 */
export const WithAnimation: StoryObj< StoryArgs > = Template.bind( {} );
WithAnimation.args = {
	...timeSeriesForecastChartStoryArgs,
	animation: true,
};

WithAnimation.parameters = {
	docs: {
		description: {
			story:
				'The chart with animation enabled. Animation respects the prefers-reduced-motion setting.',
		},
	},
};

/**
 * Custom Series Labels
 */
export const CustomSeriesLabels: StoryObj< StoryArgs > = Template.bind( {} );
CustomSeriesLabels.args = {
	...timeSeriesForecastChartStoryArgs,
	showLegend: true,
	seriesKeys: {
		historical: 'Actual Revenue',
		forecast: 'Projected Revenue',
		band: 'Confidence Interval',
	},
};

CustomSeriesLabels.parameters = {
	docs: {
		description: {
			story:
				'Customize the series labels shown in the legend and tooltip using the seriesKeys prop.',
		},
	},
};

/**
 * Custom Tooltip
 */
export const CustomTooltip: StoryObj< StoryArgs > = Template.bind( {} );
CustomTooltip.args = {
	...timeSeriesForecastChartStoryArgs,
	renderTooltip: ( { x, y, yLower, yUpper, isForecast } ) => (
		<div style={ { padding: '8px', background: '#fff', borderRadius: '4px' } }>
			<div style={ { fontWeight: 'bold', marginBottom: '4px' } }>
				{ x.toLocaleDateString( 'en-US', { month: 'short', day: 'numeric', year: 'numeric' } ) }
			</div>
			<div>Value: ${ formatNumber( y ) }</div>
			{ isForecast && yLower !== undefined && yUpper !== undefined && (
				<div style={ { fontSize: '0.9em', color: '#666' } }>
					Range: ${ formatNumber( yLower ) } - ${ formatNumber( yUpper ) }
				</div>
			) }
			{ isForecast && (
				<div
					style={ {
						marginTop: '4px',
						fontSize: '0.8em',
						color: '#3858e9',
						fontStyle: 'italic',
					} }
				>
					Forecast
				</div>
			) }
		</div>
	),
};

CustomTooltip.parameters = {
	docs: {
		description: {
			story:
				'Use the renderTooltip prop to provide a custom tooltip renderer. ' +
				'The tooltip receives the original datum, x/y values, bounds (if available), and whether the point is in the forecast region.',
		},
	},
};

/**
 * Fixed Dimensions
 */
export const FixedDimensions: StoryObj< StoryArgs > = Template.bind( {} );
FixedDimensions.args = {
	...timeSeriesForecastChartStoryArgs,
	width: 600,
	height: 300,
};

FixedDimensions.parameters = {
	docs: {
		description: {
			story:
				'The chart with fixed dimensions instead of responsive behavior. Use width and height props directly.',
		},
	},
};

/**
 * Custom Y Domain
 */
export const CustomYDomain: StoryObj< StoryArgs > = Template.bind( {} );
CustomYDomain.args = {
	...timeSeriesForecastChartStoryArgs,
	yDomain: [ 0, 200 ],
};

CustomYDomain.parameters = {
	docs: {
		description: {
			story: 'Override the auto-calculated Y domain with a fixed range using the yDomain prop.',
		},
	},
};

/**
 * Custom Tick Formatters
 */
export const CustomTickFormatters: StoryObj< StoryArgs > = Template.bind( {} );
CustomTickFormatters.args = {
	...timeSeriesForecastChartStoryArgs,
	xTickFormat: ( d: Date ) => d.toLocaleDateString( 'en-US', { month: 'short', day: 'numeric' } ),
	yTickFormat: ( n: number ) => `$${ n }`,
};

CustomTickFormatters.parameters = {
	docs: {
		description: {
			story: 'Customize axis tick labels using xTickFormat and yTickFormat props.',
		},
	},
};

/**
 * Historical Only (no forecast data)
 */
export const HistoricalOnly: StoryObj< StoryArgs > = Template.bind( {} );
HistoricalOnly.args = {
	...timeSeriesForecastChartStoryArgs,
	data: sampleForecastData.slice( 0, 7 ), // Only historical points (before transition)
	forecastStart: new Date( '2024-12-31' ), // Far in the future
};

HistoricalOnly.parameters = {
	docs: {
		description: {
			story:
				'When forecastStart is after all data points, only the historical line is shown (no divider or band).',
		},
	},
};

/**
 * Forecast Only (no historical data)
 */
export const ForecastOnly: StoryObj< StoryArgs > = Template.bind( {} );
ForecastOnly.args = {
	...timeSeriesForecastChartStoryArgs,
	data: sampleForecastData.slice( 7 ), // Only forecast points (from transition onward)
	forecastStart: new Date( '2024-01-01' ), // Before all data
};

ForecastOnly.parameters = {
	docs: {
		description: {
			story:
				'When forecastStart is before all data points, only the forecast line and band are shown (no divider).',
		},
	},
};

/**
 * Different Grid Visibility Options
 */
export const GridVisibilityOptions: StoryObj< StoryArgs > = {
	render: () => (
		<div style={ { display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(2, 1fr)' } }>
			<div>
				<h3>Y Grid (default)</h3>
				<TimeSeriesForecastChart
					data={ sampleForecastData }
					accessors={ sampleAccessors }
					forecastStart={ sampleForecastStart }
					width={ 350 }
					height={ 200 }
					gridVisibility="y"
				/>
			</div>
			<div>
				<h3>X Grid</h3>
				<TimeSeriesForecastChart
					data={ sampleForecastData }
					accessors={ sampleAccessors }
					forecastStart={ sampleForecastStart }
					width={ 350 }
					height={ 200 }
					gridVisibility="x"
				/>
			</div>
			<div>
				<h3>Both (XY)</h3>
				<TimeSeriesForecastChart
					data={ sampleForecastData }
					accessors={ sampleAccessors }
					forecastStart={ sampleForecastStart }
					width={ 350 }
					height={ 200 }
					gridVisibility="xy"
				/>
			</div>
			<div>
				<h3>No Grid</h3>
				<TimeSeriesForecastChart
					data={ sampleForecastData }
					accessors={ sampleAccessors }
					forecastStart={ sampleForecastStart }
					width={ 350 }
					height={ 200 }
					gridVisibility="none"
				/>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: 'Different grid visibility options: y (default), x, xy, or none.',
			},
		},
	},
};

/**
 * Dynamic/Generated Data
 */
export const DynamicData: StoryObj< StoryArgs > = {
	render: () => {
		const data = generateForecastData( 30, 14, 100, 1.5, 15 );
		const forecastStart = new Date();

		return (
			<TimeSeriesForecastChart
				data={ data }
				accessors={ sampleAccessors }
				forecastStart={ forecastStart }
				showLegend={ true }
				maxWidth={ 800 }
				aspectRatio={ 0.5 }
			/>
		);
	},
	parameters: {
		docs: {
			description: {
				story:
					'Example with dynamically generated data. The generateForecastData helper creates realistic time series with configurable parameters for trend, volatility, and forecast length.',
			},
		},
	},
};

/**
 * Generic Data Type Example
 */
type CustomDatum = {
	timestamp: number;
	measurement: number;
	confidenceLow?: number;
	confidenceHigh?: number;
};

const customData: CustomDatum[] = [
	{ timestamp: Date.parse( '2024-01-01' ), measurement: 50 },
	{ timestamp: Date.parse( '2024-01-15' ), measurement: 55 },
	// Transition point - shared by both series
	{ timestamp: Date.parse( '2024-02-01' ), measurement: 60, confidenceLow: 60, confidenceHigh: 60 },
	{ timestamp: Date.parse( '2024-02-15' ), measurement: 65, confidenceLow: 58, confidenceHigh: 72 },
	{ timestamp: Date.parse( '2024-03-01' ), measurement: 70, confidenceLow: 60, confidenceHigh: 80 },
];

const customAccessors = {
	x: ( d: CustomDatum ) => new Date( d.timestamp ),
	y: ( d: CustomDatum ) => d.measurement,
	yLower: ( d: CustomDatum ) => d.confidenceLow,
	yUpper: ( d: CustomDatum ) => d.confidenceHigh,
};

export const GenericDataType: StoryObj< StoryArgs > = {
	render: () => (
		<TimeSeriesForecastChart
			data={ customData }
			accessors={ customAccessors }
			forecastStart={ new Date( '2024-02-01' ) }
			seriesKeys={ {
				historical: 'Measurements',
				forecast: 'Predictions',
				band: 'Confidence',
			} }
			showLegend={ true }
			width={ 600 }
			height={ 300 }
		/>
	),
	parameters: {
		docs: {
			description: {
				story:
					'The chart supports generic data types via accessor functions. ' +
					'This example uses a custom datum shape with timestamp (number) instead of Date, ' +
					'and differently named fields for values and bounds.',
			},
		},
	},
};

/**
 * Empty Data State
 */
export const EmptyData: StoryObj< StoryArgs > = Template.bind( {} );
EmptyData.args = {
	...timeSeriesForecastChartStoryArgs,
	data: [],
};

EmptyData.parameters = {
	docs: {
		description: {
			story: 'When no data is provided, the chart displays a "No data available" message.',
		},
	},
};

/**
 * Partial Bounds (some forecast points missing bounds)
 */
const partialBoundsData: SampleForecastDatum[] = [
	{ date: new Date( '2024-01-01' ), value: 100 },
	{ date: new Date( '2024-01-15' ), value: 110 },
	// Transition point - shared by both series (tight bounds at start)
	{ date: new Date( '2024-02-01' ), value: 120, lower: 120, upper: 120 },
	// Forecast with bounds
	{ date: new Date( '2024-02-15' ), value: 130, lower: 120, upper: 140 },
	// Forecast WITHOUT bounds (band won't include this point)
	{ date: new Date( '2024-03-01' ), value: 140 },
	// Forecast with bounds again
	{ date: new Date( '2024-03-15' ), value: 150, lower: 135, upper: 165 },
];

export const PartialBounds: StoryObj< StoryArgs > = Template.bind( {} );
PartialBounds.args = {
	...timeSeriesForecastChartStoryArgs,
	data: partialBoundsData,
	forecastStart: new Date( '2024-02-01' ),
};

PartialBounds.parameters = {
	docs: {
		description: {
			story:
				'The uncertainty band only renders for forecast points that have both lower AND upper bounds. ' +
				'Points with missing bounds are still shown on the forecast line but excluded from the band.',
		},
	},
};

/**
 * Legend at Top
 */
export const LegendAtTop: StoryObj< StoryArgs > = Template.bind( {} );
LegendAtTop.args = {
	...timeSeriesForecastChartStoryArgs,
	showLegend: true,
	legendPosition: 'top',
};

LegendAtTop.parameters = {
	docs: {
		description: {
			story: 'The legend positioned above the chart using legendPosition="top".',
		},
	},
};
