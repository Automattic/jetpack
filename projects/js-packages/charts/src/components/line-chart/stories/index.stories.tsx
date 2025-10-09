import {
	ChartStoryArgs,
	temperatureData as sampleData,
	trafficData as webTrafficData,
} from '../../../stories';
import LineChart from '../line-chart';
import { lineChartMetaArgs, lineChartStoryArgs } from './config';
import type { Meta, StoryFn, StoryObj } from '@storybook/react';

type StoryArgs = ChartStoryArgs< React.ComponentProps< typeof LineChart > >;

const meta: Meta< StoryArgs > = {
	...lineChartMetaArgs,
	title: 'JS Packages/Charts/Types/Line Chart',
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

const Template: StoryFn< typeof LineChart > = args => <LineChart { ...args } />;

// Interactive configuration story with all controls
export const Configuration: StoryObj< typeof LineChart > = {
	render: args => {
		const seriesCount = args.seriesCount || 'multiple';
		const dimensionMode = args.dimensionMode || 'responsive';

		const dataMap = {
			single: [ sampleData[ 0 ] ],
			multiple: sampleData.slice( 0, 4 ),
			many: sampleData,
		};

		const dimensionProps = dimensionMode === 'fixed' ? { width: 800, height: 400 } : {};

		return <LineChart { ...args } data={ dataMap[ seriesCount ] } { ...dimensionProps } />;
	},
	args: {
		...lineChartStoryArgs,
		seriesCount: 'multiple',
		dimensionMode: 'responsive',
		smoothing: true,
		curveType: 'smooth',
		withGradientFill: false,
	},
};

// Basic example
export const Default: StoryObj< typeof LineChart > = Template.bind( {} );
Default.args = {
	...lineChartStoryArgs,
};

// Interactive story for legend options
export const LegendConfiguration: StoryObj< typeof LineChart > = Template.bind( {} );
LegendConfiguration.args = {
	...lineChartStoryArgs,
	data: sampleData,
	showLegend: true,
	height: 400,
	legendAlignment: 'center',
	legendPosition: 'bottom',
	legendOrientation: 'horizontal',
	legendShape: 'rect',
	withLegendGlyph: false,
};

// Story showing use with LineChart using composition API
export const WithCompositionLegend: StoryObj< typeof LineChart > = {
	render: args => (
		<div style={ { width: '600px', height: '400px' } }>
			<LineChart
				data={ args.data || webTrafficData }
				width={ 600 }
				height={ 300 }
				withGradientFill={ false }
				withLegendGlyph={ false }
			>
				<LineChart.Legend
					orientation={ args.legendOrientation || 'horizontal' }
					alignment={ args.legendAlignment || 'center' }
					position={ args.legendPosition || 'bottom' }
					maxWidth={ args.legendMaxWidth }
					textOverflow={ args.legendTextOverflow || 'wrap' }
				/>
			</LineChart>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: 'Legend used with LineChart using the composition API, positioned below the chart.',
			},
		},
	},
};

export const ErrorStates: StoryObj< typeof LineChart > = {
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
