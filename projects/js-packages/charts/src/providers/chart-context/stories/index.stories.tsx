import { Meta, StoryObj } from '@storybook/react';
import {
	LineChart,
	BarChart,
	PieSemiCircleChart,
	PieChart,
	BarListChart,
	DataPointPercentage,
	SeriesData,
} from '../../../.';
import { medalCountsData as barSampleData } from '../../../stories/sample-data';
import { CHART_THEME_MAP } from '../../../stories/theme-config';
import { GlobalChartsProvider } from '../global-charts-provider';

type StoryArgs = {
	themeName?: string;
};

const meta: Meta< StoryArgs > = {
	title: 'JS Packages/Charts/Chart Context',
	parameters: {
		layout: 'centered',
	},
	decorators: [
		( Story, { args }: { args: StoryArgs } ) => {
			const theme = CHART_THEME_MAP[ args.themeName || 'default' ];

			return (
				<GlobalChartsProvider theme={ theme }>
					<Story />
				</GlobalChartsProvider>
			);
		},
	],
	argTypes: {
		themeName: {
			control: { type: 'select' },
			options: [ 'default', 'jetpack', 'woo', 'custom' ],
			defaultValue: 'default',
		},
	},
};

export default meta;
type Story = StoryObj< StoryArgs >;

const barData: SeriesData[] = [ barSampleData[ 0 ], barSampleData[ 1 ], barSampleData[ 2 ] ];

const lineData: SeriesData[] = [
	{
		group: 'united-states',
		label: 'United States',
		data: [
			{ date: new Date( '2024-01-01' ), value: 10, label: 'Jan 1' },
			{ date: new Date( '2024-01-02' ), value: 20, label: 'Jan 2' },
			{ date: new Date( '2024-01-03' ), value: 15, label: 'Jan 3' },
			{ date: new Date( '2024-01-04' ), value: 25, label: 'Jan 4' },
			{ date: new Date( '2024-01-05' ), value: 30, label: 'Jan 5' },
		],
	},
	{
		group: 'united-states',
		label: 'United States comparison',
		data: [
			{ date: new Date( '2024-01-01' ), value: 1, label: 'Jan 1' },
			{ date: new Date( '2024-01-02' ), value: 2, label: 'Jan 2' },
			{ date: new Date( '2024-01-03' ), value: 1.5, label: 'Jan 3' },
			{ date: new Date( '2024-01-04' ), value: 2.5, label: 'Jan 4' },
			{ date: new Date( '2024-01-05' ), value: 3, label: 'Jan 5' },
		],
		options: {
			type: 'comparison' as const,
		},
	},
	{
		group: 'great-britain',
		label: 'Great Britain',
		data: [
			{ date: new Date( '2024-01-01' ), value: 8, label: 'Jan 1' },
			{ date: new Date( '2024-01-02' ), value: 12, label: 'Jan 2' },
			{ date: new Date( '2024-01-03' ), value: 18, label: 'Jan 3' },
			{ date: new Date( '2024-01-04' ), value: 22, label: 'Jan 4' },
			{ date: new Date( '2024-01-05' ), value: 28, label: 'Jan 5' },
		],
	},
	{
		group: 'great-britain',
		label: 'Great Britain comparison',
		data: [
			{ date: new Date( '2024-01-01' ), value: 0.8, label: 'Jan 1' },
			{ date: new Date( '2024-01-02' ), value: 1.2, label: 'Jan 2' },
			{ date: new Date( '2024-01-03' ), value: 1.8, label: 'Jan 3' },
			{ date: new Date( '2024-01-04' ), value: 2.2, label: 'Jan 4' },
			{ date: new Date( '2024-01-05' ), value: 2.8, label: 'Jan 5' },
		],
		options: {
			type: 'comparison' as const,
		},
	},
	{
		group: 'japan',
		label: 'Japan',
		data: [
			{ date: new Date( '2024-01-01' ), value: 5, label: 'Jan 1' },
			{ date: new Date( '2024-01-02' ), value: 8, label: 'Jan 2' },
			{ date: new Date( '2024-01-03' ), value: 6, label: 'Jan 3' },
			{ date: new Date( '2024-01-04' ), value: 12, label: 'Jan 4' },
			{ date: new Date( '2024-01-05' ), value: 16, label: 'Jan 5' },
		],
	},
	{
		group: 'japan',
		label: 'Japan comparison',
		data: [
			{ date: new Date( '2024-01-01' ), value: 0.5, label: 'Jan 1' },
			{ date: new Date( '2024-01-02' ), value: 0.8, label: 'Jan 2' },
			{ date: new Date( '2024-01-03' ), value: 0.6, label: 'Jan 3' },
			{ date: new Date( '2024-01-04' ), value: 1.2, label: 'Jan 4' },
			{ date: new Date( '2024-01-05' ), value: 1.6, label: 'Jan 5' },
		],
		options: {
			type: 'comparison' as const,
		},
	},
];

const pieData: DataPointPercentage[] = [
	{
		label: 'United States',
		group: 'united-states',
		value: 80000,
		valueDisplay: '80K',
		percentage: 65,
	},
	{
		label: 'Great Britain',
		group: 'great-britain',
		value: 30000,
		valueDisplay: '30K',
		percentage: 25,
	},
	{
		label: 'Japan',
		group: 'japan',
		value: 22000,
		valueDisplay: '22K',
		percentage: 10,
	},
];

// Data for Bar List Chart
const barListData: SeriesData[] = [
	{
		group: 'united-states',
		label: 'Jan 21-Aug 8, 2024',
		data: [
			{ label: 'Organic search', value: 30000 },
			{ label: 'Affiliates', value: 19000 },
			{ label: 'Display', value: 18000 },
		],
	},
	{
		group: 'great-britain',
		label: 'Jan 21-Aug 8, 2023',
		data: [
			{ label: 'Organic search', value: 20000 },
			{ label: 'Affiliates', value: 15000 },
			{ label: 'Display', value: 19900 },
		],
	},
	{
		group: 'japan',
		label: 'Jan 21-Aug 8, 2022',
		data: [
			{ label: 'Organic search', value: 15000 },
			{ label: 'Affiliates', value: 12000 },
			{ label: 'Display', value: 14000 },
		],
	},
];

// Data for Donut Chart (uses PieChart with thickness)
const donutData: DataPointPercentage[] = [
	{
		label: 'United States',
		group: 'united-states',
		value: 80000,
		valueDisplay: '80K',
		percentage: 65,
	},
	{
		label: 'Great Britain',
		group: 'great-britain',
		value: 30000,
		valueDisplay: '30K',
		percentage: 25,
	},
	{
		label: 'Japan',
		group: 'japan',
		value: 22000,
		valueDisplay: '22K',
		percentage: 10,
	},
];

// Reusable grid component
const ChartGrid = ( {
	lineChartData,
	barChartData,
	pieChartData,
	barListChartData,
	donutChartData,
}: {
	lineChartData: SeriesData[];
	barChartData: SeriesData[];
	pieChartData: DataPointPercentage[];
	barListChartData: SeriesData[];
	donutChartData: DataPointPercentage[];
} ) => {
	return (
		<div
			style={ {
				display: 'grid',
				gridTemplateColumns: 'repeat(2, 1fr)',
				gap: '4rem',
				width: '100%',
			} }
		>
			<LineChart
				data={ lineChartData }
				width={ 350 }
				height={ 250 }
				withGradientFill={ false }
				showLegend={ true }
				withTooltips={ true }
				margin={ { bottom: 40 } }
			/>

			<BarChart
				data={ barChartData }
				width={ 350 }
				height={ 250 }
				withTooltips={ true }
				showLegend={ true }
			/>

			<PieSemiCircleChart
				data={ pieChartData }
				width={ 350 }
				label="Semi-Circle Chart"
				withTooltips={ true }
				showLegend={ true }
			/>

			<BarListChart data={ barListChartData } width={ 350 } height={ 250 } withTooltips={ true } />

			<PieChart size={ 300 } data={ pieChartData } withTooltips={ true } showLegend={ true } />

			<PieChart
				size={ 300 }
				thickness={ 0.5 }
				data={ donutChartData }
				withTooltips={ true }
				showLegend={ true }
			/>
		</div>
	);
};

export const Default: Story = {
	render: () => (
		<ChartGrid
			lineChartData={ lineData }
			barChartData={ barData }
			pieChartData={ pieData }
			barListChartData={ barListData }
			donutChartData={ donutData }
		/>
	),
};
