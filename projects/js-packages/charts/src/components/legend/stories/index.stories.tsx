import { Meta, StoryObj } from '@storybook/react';
import { BarChart } from '../../../charts/bar-chart';
import { LineChart } from '../../../charts/line-chart';
import { PieChart } from '../../../charts/pie-chart';
import {
	simpleChartDecorator,
	ChartStoryArgs,
	themeArgTypes,
	sharedThemeArgs,
} from '../../../stories';
import { Legend } from '../legend';
import type { SeriesData, DataPointPercentage } from '../../../types';

type StoryArgs = ChartStoryArgs< React.ComponentProps< typeof Legend > >;

const meta: Meta< StoryArgs > = {
	title: 'JS Packages/Charts Library/Components/Legend',
	component: Legend,
	parameters: {
		layout: 'centered',
	},
	decorators: [ simpleChartDecorator ],
	argTypes: {
		...themeArgTypes,
	},
};

export default meta;
type Story = StoryObj< StoryArgs >;

// Mock data for different chart types
const lineChartData: SeriesData[] = [
	{
		label: 'Desktop',
		data: [
			{ date: new Date( '2023-01-01' ), value: 100 },
			{ date: new Date( '2023-01-02' ), value: 150 },
			{ date: new Date( '2023-01-03' ), value: 120 },
		],
	},
	{
		label: 'Mobile',
		data: [
			{ date: new Date( '2023-01-01' ), value: 80 },
			{ date: new Date( '2023-01-02' ), value: 90 },
			{ date: new Date( '2023-01-03' ), value: 110 },
		],
	},
];

const barChartData: SeriesData[] = [
	{
		label: 'Q1 Sales',
		data: [
			{ label: 'Jan', value: 1000 },
			{ label: 'Feb', value: 1200 },
			{ label: 'Mar', value: 1100 },
		],
	},
	{
		label: 'Q2 Sales',
		data: [
			{ label: 'Jan', value: 800 },
			{ label: 'Feb', value: 900 },
			{ label: 'Mar', value: 1000 },
		],
	},
];

const pieChartData: DataPointPercentage[] = [
	{ label: 'Desktop', value: 65 },
	{ label: 'Mobile', value: 35 },
];

// Basic standalone legends
export const Default: Story = {
	render: args => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { themeName, accentColor, ...legendProps } = args;
		return <Legend { ...legendProps } />;
	},
	args: {
		...sharedThemeArgs,
		items: [
			{ label: 'Desktop', value: '65%', color: '#3858E9' },
			{ label: 'Mobile', value: '35%', color: '#80C8FF' },
		],
	},
};

export const Vertical: Story = {
	render: args => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { themeName, accentColor, ...legendProps } = args;
		return <Legend { ...legendProps } />;
	},
	args: {
		...sharedThemeArgs,
		items: [
			{ label: 'Desktop', value: '65%', color: '#3858E9' },
			{ label: 'Mobile', value: '35%', color: '#80C8FF' },
			{ label: 'Tablet', value: '12%', color: '#44B556' },
		],
		orientation: 'vertical',
	},
};

// Story showing composition API with LineChart
export const WithLineChart: Story = {
	render: () => (
		<LineChart
			data={ lineChartData }
			width={ 600 }
			height={ 300 }
			withGradientFill={ false }
			withLegendGlyph={ false }
			chartId="legend-line-chart"
		>
			<LineChart.Legend />
		</LineChart>
	),
};

// Story showing composition API with BarChart
export const WithBarChart: Story = {
	render: () => (
		<BarChart data={ barChartData } width={ 400 } height={ 300 } chartId="legend-bar-chart">
			<BarChart.Legend />
		</BarChart>
	),
};

// Story showing standalone legend using chartId to automatically get data from context
const StandaloneLegendWithChartIdComponent = () => {
	return (
		<div style={ { display: 'flex', flexDirection: 'column', gap: '20px' } }>
			{ /* Chart with legend hidden but still registering data */ }
			<LineChart
				chartId="standalone-legend-chart"
				data={ lineChartData }
				showLegend={ false }
				width={ 400 }
				height={ 200 }
				withGradientFill={ false }
				withLegendGlyph={ false }
			/>
			{ /* Standalone legend that automatically gets data from chart context */ }
			<Legend chartId="standalone-legend-chart" shape="line" />
		</div>
	);
};

export const StandaloneLegendWithChartId: Story = {
	render: () => <StandaloneLegendWithChartIdComponent />,
};

const InteractiveLegendComponent = () => (
	<LineChart
		chartId="interactive-legend-demo"
		data={ lineChartData }
		showLegend={ true }
		width={ 600 }
		height={ 300 }
		withGradientFill={ false }
		withLegendGlyph={ false }
		legend={ { interactive: true } }
	/>
);
export const InteractiveLegend: Story = {
	render: () => <InteractiveLegendComponent />,
};

// Story showing a real-world dashboard layout with centralized legends
const DashboardWithCentralizedLegend = () => {
	return (
		<div
			style={ {
				display: 'grid',
				gridTemplateColumns: '1fr 300px',
				gap: '20px',
				padding: '20px',
				backgroundColor: '#f5f5f5',
				borderRadius: '8px',
			} }
		>
			{ /* Main content area with charts */ }
			<div style={ { display: 'flex', flexDirection: 'column', gap: '20px' } }>
				<div style={ { backgroundColor: 'white', padding: '20px', borderRadius: '4px' } }>
					<h3 style={ { margin: '0 0 20px 0' } }>Revenue Trends</h3>
					<LineChart
						chartId="dashboard-revenue"
						data={ lineChartData }
						showLegend={ false }
						height={ 300 }
						withGradientFill={ false }
						withLegendGlyph={ false }
					/>
				</div>

				<div
					style={ {
						display: 'grid',
						gridTemplateColumns: '1fr 1fr',
						gap: '20px',
					} }
				>
					<div
						style={ {
							backgroundColor: 'white',
							padding: '20px',
							borderRadius: '4px',
						} }
					>
						<h3 style={ { margin: '0 0 20px 0' } }>Sales by Quarter</h3>
						<BarChart
							chartId="dashboard-sales"
							data={ barChartData }
							showLegend={ false }
							height={ 300 }
						/>
					</div>

					<div
						style={ {
							backgroundColor: 'white',
							padding: '20px',
							borderRadius: '4px',
						} }
					>
						<h3 style={ { margin: '0 0 20px 0' } }>Device Distribution</h3>
						<PieChart
							chartId="dashboard-devices"
							data={ pieChartData }
							showLegend={ false }
							height={ 300 }
						/>
					</div>
				</div>
			</div>

			{ /* Centralized legend panel */ }
			<aside style={ { backgroundColor: 'white', padding: '20px', borderRadius: '4px' } }>
				<h3 style={ { margin: '0 0 20px 0' } }>Legend</h3>

				<div style={ { marginBottom: '20px' } }>
					<h4
						style={ {
							margin: '0 0 10px 0',
							fontSize: '14px',
							color: '#666',
						} }
					>
						Revenue Trends
					</h4>
					<Legend chartId="dashboard-revenue" orientation="vertical" shape="line" />
				</div>

				<div style={ { marginBottom: '20px' } }>
					<h4
						style={ {
							margin: '0 0 10px 0',
							fontSize: '14px',
							color: '#666',
						} }
					>
						Sales by Quarter
					</h4>
					<Legend chartId="dashboard-sales" orientation="vertical" />
				</div>

				<div>
					<h4
						style={ {
							margin: '0 0 10px 0',
							fontSize: '14px',
							color: '#666',
						} }
					>
						Device Distribution
					</h4>
					<Legend chartId="dashboard-devices" orientation="vertical" shape="circle" />
				</div>
			</aside>
		</div>
	);
};

export const DashboardExample: Story = {
	render: () => <DashboardWithCentralizedLegend />,
	parameters: {
		layout: 'fullscreen',
	},
};

// Story showing different alignment options
export const AlignmentOptions: Story = {
	args: {
		items: [
			{ label: 'Series 1', value: '25%', color: '#3858E9' },
			{ label: 'Series 2', value: '35%', color: '#80C8FF' },
			{ label: 'Series 3', value: '40%', color: '#44B556' },
		],
		alignment: 'start',
	},
};

// Comprehensive story showing all text overflow and wrapping features
export const TextOverflow: Story = {
	render: args => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { themeName, accentColor, ...legendProps } = args;
		const maxWidth = args.labelStyles?.maxWidth;
		const textOverflow = args.labelStyles?.textOverflow;
		const containerStyle =
			args.orientation === 'horizontal'
				? { width: '600px', border: '1px solid #ddd', padding: '20px' }
				: { width: '350px', border: '1px solid #ddd', padding: '20px' };

		const titleText = maxWidth
			? `Legend with ${
					textOverflow === 'ellipsis' ? 'Ellipsis' : 'Text Wrapping'
			  } (maxWidth: ${ maxWidth })`
			: 'Legend without maxWidth constraint';

		return (
			<div style={ containerStyle }>
				<h4 style={ { marginBottom: '10px' } }>{ titleText }</h4>
				<Legend { ...legendProps } />
			</div>
		);
	},
	args: {
		items: [
			{
				label: 'Very Long Legend Item Label That Demonstrates Text Overflow Behavior',
				value: '25%',
				color: '#3858E9',
			},
			{
				label: 'Another Extremely Long Label for Testing Different Display Options',
				value: '35%',
				color: '#80C8FF',
			},
			{ label: 'Short Label', value: '15%', color: '#44B556' },
			{ label: 'Medium Length Label Text', value: '25%', color: '#FFC107' },
		],
		orientation: 'horizontal',
		labelStyles: { maxWidth: '150px', textOverflow: 'wrap' },
		position: 'bottom',
		alignment: 'center',
	},
	argTypes: {
		orientation: {
			control: { type: 'radio' },
			options: [ 'horizontal', 'vertical' ],
		},
		labelStyles: {
			control: 'object',
		},
		position: {
			control: { type: 'radio' },
			options: [ 'top', 'bottom' ],
		},
		alignment: {
			control: { type: 'radio' },
			options: [ 'start', 'center', 'end' ],
		},
	},
};

// Story showing the legend with custom shapes
export const CustomShape: Story = {
	args: {
		items: [
			{ label: 'Desktop', value: '65%', color: '#3858E9' },
			{ label: 'Mobile', value: '35%', color: '#80C8FF' },
		],
		shape: 'circle',
	},
};
