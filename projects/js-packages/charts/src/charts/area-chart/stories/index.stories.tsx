import {
	ChartStoryArgs,
	extractLegendConfig,
	temperatureData as sampleData,
	trafficData as webTrafficData,
} from '../../../stories';
import AreaChart from '../area-chart';
import { areaChartMetaArgs, areaChartStoryArgs } from './config';
import type { Meta, StoryFn, StoryObj } from '@storybook/react';

type StoryArgs = ChartStoryArgs< React.ComponentProps< typeof AreaChart > > & {
	seriesCount?: 'single' | 'multiple' | 'many';
	dimensionMode?: 'responsive' | 'fixed';
	crosshairMode?: 'none' | 'vertical' | 'horizontal' | 'both';
};

const meta: Meta< StoryArgs > = {
	...areaChartMetaArgs,
	title: 'JS Packages/Charts Library/Charts/Area Chart',
	component: areaChartMetaArgs.component,
	argTypes: {
		...areaChartMetaArgs.argTypes,
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
		stacked: {
			control: 'boolean',
			description: 'Stack series on top of each other',
			table: { category: 'Visual Style' },
		},
		stackOffset: {
			control: { type: 'radio' },
			options: [ 'none', 'expand', 'wiggle', 'silhouette' ],
			description: 'Stack offset strategy (only applies when stacked is true)',
			table: { category: 'Visual Style' },
		},
		smoothing: {
			control: 'boolean',
			description: 'Enable curve smoothing',
			table: { category: 'Visual Style' },
		},
		curveType: {
			control: { type: 'radio' },
			options: [ 'linear', 'smooth', 'monotone' ],
			description: 'Curve interpolation type',
			table: { category: 'Visual Style' },
		},
		fillOpacity: {
			control: { type: 'range', min: 0, max: 1, step: 0.05 },
			description: 'Fill opacity for the areas (0–1)',
			table: { category: 'Visual Style' },
		},
		withStroke: {
			control: 'boolean',
			description: 'Render a stroke (line) on top of each area',
			table: { category: 'Visual Style' },
		},
	},
};

export default meta;

const Template: StoryFn< typeof AreaChart > = args => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { seriesCount, dimensionMode, crosshairMode, withTooltipCrosshairs, ...chartProps } = args;
	const legend = extractLegendConfig( args );

	let data = chartProps.data || areaChartStoryArgs.data;
	if ( seriesCount === 'single' ) {
		data = [ sampleData[ 0 ] ];
	} else if ( seriesCount === 'multiple' ) {
		data = sampleData.slice( 0, 4 );
	} else if ( seriesCount === 'many' ) {
		data = sampleData;
	}

	let dimensions = {};
	if ( dimensionMode === 'fixed' ) {
		dimensions = { width: 800, height: 400 };
	}

	let crosshairConfig;
	if ( crosshairMode === 'vertical' ) {
		crosshairConfig = { showVertical: true };
	} else if ( crosshairMode === 'horizontal' ) {
		crosshairConfig = { showHorizontal: true };
	} else if ( crosshairMode === 'both' ) {
		crosshairConfig = { showVertical: true, showHorizontal: true };
	}

	return (
		<AreaChart
			{ ...chartProps }
			{ ...dimensions }
			data={ data }
			legend={ legend }
			withTooltipCrosshairs={ crosshairConfig }
		/>
	);
};

// Stacked is the default. Multiple series stacked on top of each other.
export const Default: StoryObj< typeof AreaChart > = Template.bind( {} );
Default.args = {
	...areaChartStoryArgs,
	showLegend: true,
};

// Same series rendered as overlapping (non-stacked) filled areas.
export const Unstacked: StoryObj< typeof AreaChart > = Template.bind( {} );
Unstacked.args = {
	...areaChartStoryArgs,
	stacked: false,
	showLegend: true,
};
Unstacked.parameters = {
	docs: {
		description: {
			story:
				'When `stacked={ false }`, series are rendered as overlapping filled areas. Use `fillOpacity` to control transparency so overlapping series remain visible.',
		},
	},
};

// 100% stacked area chart — values are normalised so each x-position sums to 1.
export const PercentageStack: StoryObj< typeof AreaChart > = Template.bind( {} );
PercentageStack.args = {
	...areaChartStoryArgs,
	stacked: true,
	stackOffset: 'expand',
	showLegend: true,
};
PercentageStack.parameters = {
	docs: {
		description: {
			story:
				'`stackOffset="expand"` produces a 100% stacked area chart — each x-position is normalised to 1.0, useful for showing relative composition over time.',
		},
	},
};

// Streamgraph layout — stack centred around zero with wiggle offset.
export const Streamgraph: StoryObj< typeof AreaChart > = Template.bind( {} );
Streamgraph.args = {
	...areaChartStoryArgs,
	stacked: true,
	stackOffset: 'wiggle',
	showLegend: true,
	smoothing: true,
};
Streamgraph.parameters = {
	docs: {
		description: {
			story:
				'`stackOffset="wiggle"` produces a streamgraph layout. Each series flows around a central baseline, minimising weighted change in slope.',
		},
	},
};

export const LinearLines: StoryObj< typeof AreaChart > = Template.bind( {} );
LinearLines.args = {
	...areaChartStoryArgs,
	curveType: 'linear',
	smoothing: false,
	showLegend: true,
};
LinearLines.parameters = {
	docs: {
		description: {
			story:
				'Stacked area chart with straight (linear) edges between data points. Use `curveType="linear"` (or `smoothing={ false }`) when you want a precise, unsmoothed visualisation.',
		},
	},
};

export const SingleSeries: StoryObj< typeof AreaChart > = Template.bind( {} );
SingleSeries.args = {
	...areaChartStoryArgs,
	data: [ webTrafficData[ 0 ] ],
};

export const FixedDimensions: StoryObj< typeof AreaChart > = Template.bind( {} );
FixedDimensions.args = {
	...areaChartStoryArgs,
	width: 600,
	height: 300,
	showLegend: true,
};

export const AspectRatio: StoryObj< typeof AreaChart > = Template.bind( {} );
AspectRatio.args = {
	...areaChartStoryArgs,
	aspectRatio: 0.3,
	showLegend: true,
};

export const Animation: StoryObj< typeof AreaChart > = Template.bind( {} );
Animation.args = {
	...areaChartStoryArgs,
	animation: true,
	showLegend: true,
};

export const WithCompositionLegend: StoryObj< typeof AreaChart > = {
	render: args => {
		const legend = extractLegendConfig( args );
		return (
			<AreaChart
				{ ...Default.args }
				{ ...args }
				legend={ { interactive: legend?.interactive } }
				chartId="composition-area-chart"
			>
				<AreaChart.Legend { ...legend } />
			</AreaChart>
		);
	},
	args: { ...Default.args },
	parameters: {
		docs: {
			description: {
				story:
					'Composition API using `<AreaChart.Legend />` as a child component for explicit legend placement and configuration.',
			},
		},
	},
};

export const CurveTypes: StoryObj< typeof AreaChart > = {
	render: () => {
		const curveData = sampleData.slice( 0, 3 );
		return (
			<div style={ { display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(3, 1fr)' } }>
				<div>
					<h3>Linear</h3>
					<AreaChart width={ 300 } height={ 200 } data={ curveData } curveType="linear" />
				</div>
				<div>
					<h3>Smooth (Catmull-Rom)</h3>
					<AreaChart width={ 300 } height={ 200 } data={ curveData } curveType="smooth" />
				</div>
				<div>
					<h3>Monotone X</h3>
					<AreaChart width={ 300 } height={ 200 } data={ curveData } curveType="monotone" />
				</div>
			</div>
		);
	},
	parameters: {
		docs: {
			description: {
				story:
					'The three available curve types. `linear` connects points with straight lines; `smooth` uses Catmull-Rom interpolation; `monotone` prevents overshooting on steep changes.',
			},
		},
	},
};

export const ErrorStates: StoryObj< typeof AreaChart > = {
	render: () => (
		<div style={ { display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(2, 1fr)' } }>
			<div>
				<h3>Empty Data</h3>
				<AreaChart width={ 300 } height={ 200 } data={ [] } />
			</div>
			<div>
				<h3>Invalid Date Values</h3>
				<AreaChart
					width={ 300 }
					height={ 200 }
					data={ [
						{
							label: 'Invalid Dates',
							data: [
								{ date: new Date( 'invalid' ), value: 10 },
								{ date: new Date( '2024-01-02' ), value: 20 },
							],
						},
					] }
				/>
			</div>
			<div>
				<h3>Invalid Values</h3>
				<AreaChart
					width={ 300 }
					height={ 200 }
					data={ [
						{
							label: 'Invalid Values',
							data: [
								{ date: new Date( '2024-01-01' ), value: NaN },
								{ date: new Date( '2024-01-02' ), value: null as number | null },
							],
						},
					] }
				/>
			</div>
			<div>
				<h3>Single Data Point</h3>
				<AreaChart
					width={ 300 }
					height={ 200 }
					data={ [
						{
							label: 'Single Point',
							data: [ { date: new Date( '2024-01-01' ), value: 100 } ],
						},
					] }
				/>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: 'How the area chart handles common edge cases.',
			},
		},
	},
};
