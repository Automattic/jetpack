import {
	extractLegendConfig,
	temperatureData as sampleData,
	trafficData as webTrafficData,
} from '../../../stories';
import AreaChart from '../area-chart';
import { areaChartMetaArgs, areaChartStoryArgs, type StoryArgs as BaseStoryArgs } from './config';
import type { ChartLegendConfig, SeriesData } from '../../../types';
import type { Meta, StoryFn, StoryObj } from '@storybook/react';

type StoryArgs = BaseStoryArgs & {
	seriesCount?: 'single' | 'multiple' | 'many';
	dimensionMode?: 'responsive' | 'fixed';
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

const Template: StoryFn< StoryArgs > = args => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { seriesCount, dimensionMode, crosshairMode, withTooltipCrosshairs, ...chartProps } = args;
	const legend = extractLegendConfig< ChartLegendConfig< SeriesData[] > >( args );

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
export const Default: StoryObj< StoryArgs > = Template.bind( {} );
Default.args = {
	...areaChartStoryArgs,
	showLegend: true,
	zoomable: true,
};

// Same series rendered as overlapping (non-stacked) filled areas.
export const Unstacked: StoryObj< StoryArgs > = Template.bind( {} );
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
export const PercentageStack: StoryObj< StoryArgs > = Template.bind( {} );
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
export const Streamgraph: StoryObj< StoryArgs > = Template.bind( {} );
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

export const LinearLines: StoryObj< StoryArgs > = Template.bind( {} );
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

export const SingleSeries: StoryObj< StoryArgs > = Template.bind( {} );
SingleSeries.args = {
	...areaChartStoryArgs,
	data: [ webTrafficData[ 0 ] ],
};

export const FixedDimensions: StoryObj< StoryArgs > = Template.bind( {} );
FixedDimensions.args = {
	...areaChartStoryArgs,
	width: 600,
	height: 300,
	showLegend: true,
};

export const AspectRatio: StoryObj< StoryArgs > = Template.bind( {} );
AspectRatio.args = {
	...areaChartStoryArgs,
	aspectRatio: 0.3,
	showLegend: true,
};

export const Animation: StoryObj< StoryArgs > = Template.bind( {} );
Animation.args = {
	...areaChartStoryArgs,
	animation: true,
	showLegend: true,
	legendInteractive: true,
};

export const RescaleYOnLegendToggle: StoryObj< StoryArgs > = {
	name: 'Y-axis rescales when legends toggle (default)',
	render: args => (
		<div style={ { display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(2, 1fr)' } }>
			<div>
				<h4>rescaleYOnLegendToggle: true (default)</h4>
				<AreaChart { ...args } rescaleYOnLegendToggle />
			</div>
			<div>
				<h4>rescaleYOnLegendToggle: false (pinned)</h4>
				<AreaChart { ...args } rescaleYOnLegendToggle={ false } />
			</div>
		</div>
	),
	args: {
		...areaChartStoryArgs,
		showLegend: true,
		legend: { interactive: true },
		width: 480,
		height: 280,
	},
	parameters: {
		docs: {
			description: {
				story:
					'Click legend items to toggle series. The left chart rescales the Y axis to the visible series; the right chart pins the Y axis to the full data extent so the baseline stays put.',
			},
		},
	},
};

export const WithCompositionLegend: StoryObj< StoryArgs > = {
	render: args => {
		const legend = extractLegendConfig< ChartLegendConfig< SeriesData[] > >( args );
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

export const CurveTypes: StoryObj< StoryArgs > = {
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

export const ErrorStates: StoryObj< StoryArgs > = {
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

// Showcase fillOpacity in both stacked and unstacked modes.
export const FillOpacity: StoryObj< StoryArgs > = Template.bind( {} );
FillOpacity.args = {
	...areaChartStoryArgs,
	fillOpacity: 0.5,
	showLegend: true,
};
FillOpacity.parameters = {
	docs: {
		description: {
			story:
				'Use `fillOpacity` to control how transparent the bands are. Defaults: `0.85` for stacked, `0.4` for unstacked.',
		},
	},
};

// Demonstrate the stroke-on-area toggle.
export const WithStroke: StoryObj< StoryArgs > = Template.bind( {} );
WithStroke.args = {
	...areaChartStoryArgs,
	withStroke: true,
	showLegend: true,
};
WithStroke.parameters = {
	docs: {
		description: {
			story:
				'`withStroke={ true }` renders a stroke on top of each band. By default, stroke is off in stacked mode and on in unstacked mode.',
		},
	},
};

// Show grid visibility variants side-by-side.
export const GridVisibility: StoryObj< StoryArgs > = {
	render: () => {
		const data = sampleData.slice( 0, 3 );
		return (
			<div style={ { display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(2, 1fr)' } }>
				<div>
					<h3>Default grid</h3>
					<AreaChart width={ 400 } height={ 240 } data={ data } />
				</div>
				<div>
					<h3>gridVisibility=&quot;none&quot;</h3>
					<AreaChart width={ 400 } height={ 240 } data={ data } gridVisibility="none" />
				</div>
			</div>
		);
	},
	parameters: {
		docs: {
			description: {
				story:
					'`gridVisibility` controls grid rendering. Use `"none"` for compact / inline visualisations like sparkline-style cards.',
			},
		},
	},
};

// Custom renderTooltip: showcase total + per-series rows.
export const CustomTooltip: StoryObj< StoryArgs > = Template.bind( {} );
CustomTooltip.args = {
	...areaChartStoryArgs,
	showLegend: true,
	renderTooltip: ( { tooltipData } ) => {
		const nearest = tooltipData?.nearestDatum?.datum;
		if ( ! nearest ) return null;
		const entries = Object.entries( tooltipData?.datumByKey || {} ) as Array<
			[ string, { datum: { value: number } } ]
		>;
		const points = entries.map( ( [ key, entry ] ) => ( {
			key,
			value: entry.datum.value,
		} ) );
		const total = points.reduce( ( sum, p ) => sum + ( p.value ?? 0 ), 0 );
		return (
			<div style={ { padding: 8, minWidth: 160 } }>
				<div style={ { fontWeight: 600, marginBottom: 6 } }>
					{ ( nearest as { date?: Date } ).date?.toLocaleDateString() }
				</div>
				{ points.map( p => (
					<div key={ p.key } style={ { display: 'flex', justifyContent: 'space-between' } }>
						<span>{ p.key }</span>
						<strong>{ p.value }</strong>
					</div>
				) ) }
				<hr style={ { margin: '6px 0', opacity: 0.3 } } />
				<div style={ { display: 'flex', justifyContent: 'space-between' } }>
					<span>Total</span>
					<strong>{ total }</strong>
				</div>
			</div>
		);
	},
};
CustomTooltip.parameters = {
	docs: {
		description: {
			story:
				'`renderTooltip` lets you render any React content inside the tooltip portal. The portal background is theme-driven; do not override it in custom content.',
		},
	},
};

// Stacked mode with mixed positive/negative values. The hover-glyph overlay
// follows d3-stack `offset="none"` semantics — running total — so glyphs land
// on the rendered band edge even when a series goes below zero.
export const NegativeValues: StoryObj< StoryArgs > = Template.bind( {} );
NegativeValues.args = {
	...areaChartStoryArgs,
	showLegend: true,
	stacked: true,
	stackOffset: 'none',
	data: [
		{
			label: 'Inflows',
			data: [
				{ date: new Date( '2024-01-01' ), value: 30 },
				{ date: new Date( '2024-02-01' ), value: 35 },
				{ date: new Date( '2024-03-01' ), value: 50 },
				{ date: new Date( '2024-04-01' ), value: 42 },
				{ date: new Date( '2024-05-01' ), value: 60 },
			],
		},
		{
			label: 'Outflows',
			data: [
				{ date: new Date( '2024-01-01' ), value: -15 },
				{ date: new Date( '2024-02-01' ), value: -20 },
				{ date: new Date( '2024-03-01' ), value: -10 },
				{ date: new Date( '2024-04-01' ), value: -25 },
				{ date: new Date( '2024-05-01' ), value: -18 },
			],
		},
	],
};
NegativeValues.parameters = {
	docs: {
		description: {
			story:
				'Mixed positive/negative values with `stackOffset="none"`. Hover glyphs follow the running total, matching where d3-stack draws the band edges.',
		},
	},
};

// Series with different x-domains. Where a series lacks a datum, the cumulative
// stack treats it as zero (matching d3-stack), and no glyph is rendered for
// that series — but glyphs for series above it stay positioned correctly.
export const MismatchedXDomains: StoryObj< StoryArgs > = Template.bind( {} );
MismatchedXDomains.args = {
	...areaChartStoryArgs,
	showLegend: true,
	data: [
		{
			label: 'Daily',
			data: [
				{ date: new Date( '2024-01-01' ), value: 10 },
				{ date: new Date( '2024-01-02' ), value: 12 },
				{ date: new Date( '2024-01-03' ), value: 14 },
				{ date: new Date( '2024-01-04' ), value: 16 },
				{ date: new Date( '2024-01-05' ), value: 18 },
			],
		},
		{
			// Missing the 1st and 5th — cumulative still advances correctly.
			label: 'Sparse',
			data: [
				{ date: new Date( '2024-01-02' ), value: 5 },
				{ date: new Date( '2024-01-03' ), value: 8 },
				{ date: new Date( '2024-01-04' ), value: 6 },
			],
		},
	],
};
MismatchedXDomains.parameters = {
	docs: {
		description: {
			story:
				'Series with non-matching x-domains. d3-stack treats missing values as zero; the hover-glyph overlay matches that convention so subsequent series glyphs stay on the correct stacked edge.',
		},
	},
};
