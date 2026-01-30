import {
	chartDecorator,
	sharedChartArgTypes,
	ChartStoryArgs,
} from '../../../stories/chart-decorator';
import { legendArgTypes } from '../../../stories/legend-config';
import { sharedThemeArgs, themeArgTypes } from '../../../stories/theme-config';
import TimeSeriesForecastChart from '../time-series-forecast-chart';
import type { TimeSeriesForecastChartProps } from '../types';
import type { Meta } from '@storybook/react';

/**
 * Sample forecast data point type
 */
export type SampleForecastDatum = {
	date: Date;
	value: number;
	lower?: number;
	upper?: number;
};

/**
 * Generate sample forecast data for storybook demonstrations.
 *
 * @param historicalDays - Number of historical days to generate
 * @param forecastDays   - Number of forecast days to generate
 * @param baseValue      - Starting value for the data
 * @param trend          - Daily trend increment
 * @param volatility     - Random noise amplitude
 * @return Array of sample forecast data points
 */
export const generateForecastData = (
	historicalDays: number = 30,
	forecastDays: number = 14,
	baseValue: number = 100,
	trend: number = 0.5,
	volatility: number = 10
): SampleForecastDatum[] => {
	const data: SampleForecastDatum[] = [];
	const startDate = new Date();
	startDate.setDate( startDate.getDate() - historicalDays );

	// Generate historical data (no bounds)
	for ( let i = 0; i < historicalDays; i++ ) {
		const date = new Date( startDate );
		date.setDate( date.getDate() + i );
		const noise = ( Math.random() - 0.5 ) * volatility * 2;
		const value = baseValue + trend * i + noise;
		data.push( { date, value: Math.max( 0, value ) } );
	}

	// Generate forecast data (with bounds)
	const lastHistoricalValue = data[ data.length - 1 ].value;
	for ( let i = 0; i < forecastDays; i++ ) {
		const date = new Date( startDate );
		date.setDate( date.getDate() + historicalDays + i );
		const projectedValue = lastHistoricalValue + trend * ( i + 1 );

		// Uncertainty grows with time
		const uncertaintySpread = volatility * ( 1 + i * 0.2 );
		const lower = projectedValue - uncertaintySpread;
		const upper = projectedValue + uncertaintySpread;

		data.push( {
			date,
			value: projectedValue,
			lower: Math.max( 0, lower ),
			upper,
		} );
	}

	return data;
};

/**
 * Fixed sample data for consistent story rendering
 * Note: The last historical point (2024-02-19) is also the first forecast point
 * to ensure the lines connect seamlessly at the transition.
 */
export const sampleForecastData: SampleForecastDatum[] = [
	// Historical data (no bounds)
	{ date: new Date( '2024-01-01' ), value: 100 },
	{ date: new Date( '2024-01-08' ), value: 108 },
	{ date: new Date( '2024-01-15' ), value: 115 },
	{ date: new Date( '2024-01-22' ), value: 112 },
	{ date: new Date( '2024-01-29' ), value: 125 },
	{ date: new Date( '2024-02-05' ), value: 130 },
	{ date: new Date( '2024-02-12' ), value: 128 },
	// Forecast data (with bounds) - starts at last historical point for seamless connection
	{ date: new Date( '2024-02-19' ), value: 135, lower: 135, upper: 135 }, // Transition point (no spread yet)
	{ date: new Date( '2024-02-26' ), value: 142, lower: 132, upper: 152 },
	{ date: new Date( '2024-03-04' ), value: 148, lower: 135, upper: 161 },
	{ date: new Date( '2024-03-11' ), value: 155, lower: 138, upper: 172 },
	{ date: new Date( '2024-03-18' ), value: 162, lower: 140, upper: 184 },
];

/**
 * Sample accessors for the default data type
 */
export const sampleAccessors = {
	x: ( d: SampleForecastDatum ) => d.date,
	y: ( d: SampleForecastDatum ) => d.value,
	yLower: ( d: SampleForecastDatum ) => d.lower,
	yUpper: ( d: SampleForecastDatum ) => d.upper,
};

/**
 * Forecast start date - the transition point where forecast begins
 */
export const sampleForecastStart = new Date( '2024-02-19' );

type StoryArgs = ChartStoryArgs< TimeSeriesForecastChartProps< SampleForecastDatum > >;

export const timeSeriesForecastChartMetaArgs: Meta< StoryArgs > = {
	title: 'JS Packages/Charts Library/Charts/Time Series Forecast Chart',
	component: TimeSeriesForecastChart,
	parameters: {
		layout: 'centered',
	},
	decorators: [ chartDecorator ],
	argTypes: {
		...legendArgTypes,
		...themeArgTypes,
		...sharedChartArgTypes,
		withTooltips: {
			control: 'boolean',
			description: 'Show tooltips on hover',
			table: { category: 'Tooltip' },
		},
		animation: {
			control: 'boolean',
			description: 'Enable chart animation',
			table: { category: 'Visual Style' },
		},
		gridVisibility: {
			control: { type: 'select' },
			options: [ 'x', 'y', 'xy', 'none' ],
			description: 'Grid visibility',
			table: { category: 'Visual Style' },
		},
	},
};

export const timeSeriesForecastChartStoryArgs = {
	...sharedThemeArgs,
	data: sampleForecastData,
	accessors: sampleAccessors,
	forecastStart: sampleForecastStart,
	withTooltips: true,
	showLegend: false,
	animation: false,
	gridVisibility: 'y' as const,
	maxWidth: 800,
	aspectRatio: 0.5,
	resizeDebounceTime: 300,
};
