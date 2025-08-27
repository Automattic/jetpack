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
import {
	medalCountsData,
	marketingChannelsByCountry,
	globalMarketComparisonByCountry,
	osUsageData,
} from '../../../stories/sample-data';
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

// Use centralized sample data
const barData: SeriesData[] = [ medalCountsData[ 0 ], medalCountsData[ 1 ], medalCountsData[ 2 ] ];
const lineData: SeriesData[] = globalMarketComparisonByCountry;
const barListData: SeriesData[] = marketingChannelsByCountry;
const pieDataWithCountries: DataPointPercentage[] = [
	{
		...osUsageData[ 0 ],
		label: 'United States',
		group: 'united-states',
	},
	{
		...osUsageData[ 1 ],
		label: 'Great Britain',
		group: 'great-britain',
	},
	{
		...osUsageData[ 2 ],
		label: 'Japan',
		group: 'japan',
	},
];
const pieData: DataPointPercentage[] = pieDataWithCountries;
const donutData: DataPointPercentage[] = pieDataWithCountries;

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
