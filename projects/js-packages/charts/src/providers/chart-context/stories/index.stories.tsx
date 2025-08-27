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
	showUnitedStates?: boolean;
	showGreatBritain?: boolean;
	showJapan?: boolean;
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
		showUnitedStates: {
			control: { type: 'boolean' },
			description: 'Show United States data in all charts',
			defaultValue: true,
		},
		showGreatBritain: {
			control: { type: 'boolean' },
			description: 'Show Great Britain data in all charts',
			defaultValue: true,
		},
		showJapan: {
			control: { type: 'boolean' },
			description: 'Show Japan data in all charts',
			defaultValue: true,
		},
	},
};

export default meta;
type Story = StoryObj< StoryArgs >;

// Use centralized sample data
const baseBarData: SeriesData[] = [
	medalCountsData[ 0 ],
	medalCountsData[ 1 ],
	medalCountsData[ 2 ],
];
const baseLineData: SeriesData[] = globalMarketComparisonByCountry;
const baseBarListData: SeriesData[] = marketingChannelsByCountry;
const basePieDataWithCountries: DataPointPercentage[] = [
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

// Filtering functions
const filterSeriesData = ( data: SeriesData[], args: StoryArgs ): SeriesData[] => {
	return data.filter( series => {
		if ( series.group === 'united-states' && ! args.showUnitedStates ) return false;
		if ( series.group === 'great-britain' && ! args.showGreatBritain ) return false;
		if ( series.group === 'japan' && ! args.showJapan ) return false;
		return true;
	} );
};

const filterPieData = ( data: DataPointPercentage[], args: StoryArgs ): DataPointPercentage[] => {
	return data.filter( item => {
		if ( item.group === 'united-states' && ! args.showUnitedStates ) return false;
		if ( item.group === 'great-britain' && ! args.showGreatBritain ) return false;
		if ( item.group === 'japan' && ! args.showJapan ) return false;
		return true;
	} );
};

// Reusable grid component
const ChartGrid = ( { args }: { args: StoryArgs } ) => {
	// Apply filtering based on args
	const lineChartData = filterSeriesData( baseLineData, args );
	const barChartData = filterSeriesData( baseBarData, args );
	const pieChartData = filterPieData( basePieDataWithCountries, args );
	const barListChartData = filterSeriesData( baseBarListData, args );
	const donutChartData = filterPieData( basePieDataWithCountries, args );
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
	render: ( _, { args } ) => <ChartGrid args={ args } />,
	args: {
		showUnitedStates: true,
		showGreatBritain: true,
		showJapan: true,
	},
};
