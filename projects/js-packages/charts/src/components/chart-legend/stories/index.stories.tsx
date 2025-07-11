import { Meta, StoryObj } from '@storybook/react';
import { useChartTheme } from '../../../providers/theme';
import { BarChart } from '../../bar-chart';
import { LineChart } from '../../line-chart';
import { PieChart } from '../../pie-chart';
import { ChartLegend } from '../chart-legend';
import { useChartLegendData } from '../use-chart-legend-data';
import type { SeriesData, DataPointPercentage } from '../../../types';

const meta: Meta< typeof ChartLegend > = {
	title: 'JS Packages/Charts/Composites/ChartLegend',
	component: ChartLegend,
	parameters: {
		layout: 'centered',
		docs: {
			description: {
				component:
					'A standalone legend component that can be used independently from charts or connected to chart data.',
			},
		},
	},
};

export default meta;
type Story = StoryObj< typeof ChartLegend >;

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
	{ label: 'Desktop', value: 65, percentage: 65 },
	{ label: 'Mobile', value: 35, percentage: 35 },
];

// Story that demonstrates the standalone component with manual legend items
export const Standalone: Story = {
	args: {
		items: [
			{ label: 'Desktop', value: '65%', color: '#3858E9' },
			{ label: 'Mobile', value: '35%', color: '#80C8FF' },
		],
		orientation: 'horizontal',
	},
};

// Story showing vertical orientation
export const Vertical: Story = {
	args: {
		items: [
			{ label: 'Desktop', value: '65%', color: '#3858E9' },
			{ label: 'Mobile', value: '35%', color: '#80C8FF' },
			{ label: 'Tablet', value: '12%', color: '#44B556' },
		],
		orientation: 'vertical',
	},
};

// Story showing use with LineChart data
const WithLineChartData = () => {
	const theme = useChartTheme();
	const legendItems = useChartLegendData( lineChartData, theme, {
		showValues: false,
	} );

	return (
		<div style={ { display: 'flex', flexDirection: 'column', gap: '20px' } }>
			<LineChart data={ lineChartData } showLegend={ false } width={ 600 } height={ 300 } />
			<ChartLegend items={ legendItems } orientation="horizontal" />
		</div>
	);
};

export const WithLineChart: Story = {
	render: () => <WithLineChartData />,
	parameters: {
		docs: {
			description: {
				story: 'ChartLegend used with LineChart data, positioned independently below the chart.',
			},
		},
	},
};

// Story showing use with BarChart data
const WithBarChartData = () => {
	const theme = useChartTheme();
	const legendItems = useChartLegendData( barChartData, theme );

	return (
		<div style={ { display: 'flex', gap: '20px', alignItems: 'flex-start' } }>
			<BarChart data={ barChartData } showLegend={ false } width={ 400 } height={ 300 } />
			<ChartLegend items={ legendItems } orientation="vertical" />
		</div>
	);
};

export const WithBarChart: Story = {
	render: () => <WithBarChartData />,
	parameters: {
		docs: {
			description: {
				story: 'ChartLegend used with BarChart data, positioned vertically beside the chart.',
			},
		},
	},
};

// Story showing use with PieChart data
const WithPieChartData = () => {
	const theme = useChartTheme();
	const legendItems = useChartLegendData( pieChartData, theme, {
		showValues: true,
	} );

	return (
		<div style={ { display: 'flex', gap: '20px', alignItems: 'center' } }>
			<PieChart data={ pieChartData } showLegend={ false } width={ 200 } height={ 200 } />
			<ChartLegend items={ legendItems } orientation="vertical" />
		</div>
	);
};

export const WithPieChart: Story = {
	render: () => <WithPieChartData />,
	parameters: {
		docs: {
			description: {
				story: 'ChartLegend used with PieChart data, showing values in the legend.',
			},
		},
	},
};

// Story showing multiple charts with shared legend
const MultipleChartsSharedLegendComponent = () => {
	const theme = useChartTheme();
	const legendItems = useChartLegendData( lineChartData, theme );

	return (
		<div style={ { display: 'flex', flexDirection: 'column', gap: '20px' } }>
			<div style={ { display: 'flex', gap: '20px' } }>
				<LineChart data={ lineChartData } showLegend={ false } width={ 300 } height={ 200 } />
				<BarChart data={ barChartData } showLegend={ false } width={ 300 } height={ 200 } />
			</div>
			<ChartLegend items={ legendItems } orientation="horizontal" />
		</div>
	);
};

export const MultipleChartsSharedLegend: Story = {
	render: () => <MultipleChartsSharedLegendComponent />,
	parameters: {
		docs: {
			description: {
				story: 'Single ChartLegend component used for multiple charts with shared data series.',
			},
		},
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
		orientation: 'horizontal',
		alignmentHorizontal: 'left',
		alignmentVertical: 'top',
	},
	parameters: {
		docs: {
			description: {
				story: 'ChartLegend with custom alignment options.',
			},
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
		orientation: 'horizontal',
		shape: 'circle',
	},
	parameters: {
		docs: {
			description: {
				story: 'ChartLegend with circle shape instead of default rectangle.',
			},
		},
	},
};
