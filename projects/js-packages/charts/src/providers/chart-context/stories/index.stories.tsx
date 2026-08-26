import { Meta, StoryObj } from '@storybook/react';
import {
	LineChart,
	BarChart,
	PieSemiCircleChart,
	PieChart,
	BarListChart,
	DataPointPercentage,
	SeriesData,
	LeaderboardChart,
} from '../../../.';
import { simpleChartDecorator, ChartStoryArgs } from '../../../stories/chart-decorator';
import {
	medalCountsData,
	marketingChannelsByCountry,
	globalMarketComparisonByCountry,
	osUsageData,
	trafficSourcesData,
} from '../../../stories/sample-data';
import { themeArgTypes } from '../../../stories/theme-config';

type StoryArgs = ChartStoryArgs< {
	showUnitedStates?: boolean;
	showGreatBritain?: boolean;
	showJapan?: boolean;
} >;

const meta: Meta< StoryArgs > = {
	title: 'JS Packages/Charts Library/Global Context',
	parameters: {
		layout: 'centered',
	},
	decorators: [ simpleChartDecorator ],
	argTypes: {
		...themeArgTypes,
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

// eslint-disable-next-line storybook/csf-component -- This is not a component-based story.
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

// Data with color overrides - only United States gets red override
const colorOverrideBarData: SeriesData[] = [
	{
		...medalCountsData[ 0 ],
		options: { stroke: '#e74c3c' }, // Red override for United States only
	},
	medalCountsData[ 1 ],
	medalCountsData[ 2 ],
];

const colorOverrideLineData: SeriesData[] = globalMarketComparisonByCountry.map(
	( series, index ) => {
		// Only United States series (index 0 and 1) get red override
		if ( index <= 1 ) {
			return {
				...series,
				options: {
					...series.options,
					stroke: '#e74c3c',
				},
			};
		}
		return series;
	}
);

const colorOverrideBarListData: SeriesData[] = [
	{
		...marketingChannelsByCountry[ 0 ],
		options: { stroke: '#e74c3c' }, // Red override for United States only
	},
	marketingChannelsByCountry[ 1 ],
	marketingChannelsByCountry[ 2 ],
];

const colorOverridePieData: DataPointPercentage[] = [
	{
		...basePieDataWithCountries[ 0 ],
		color: '#e74c3c', // Red override for United States only
	},
	{
		...basePieDataWithCountries[ 1 ],
	},
	{
		...basePieDataWithCountries[ 2 ],
	},
];

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

			<LeaderboardChart data={ trafficSourcesData } withComparison showLegend />
		</div>
	);
};

// Chart grid with color overrides
const ChartGridWithColorOverrides = ( { args }: { args: StoryArgs } ) => {
	// Apply filtering to color override data
	const lineChartData = filterSeriesData( colorOverrideLineData, args );
	const barChartData = filterSeriesData( colorOverrideBarData, args );
	const pieChartData = filterPieData( colorOverridePieData, args );
	const barListChartData = filterSeriesData( colorOverrideBarListData, args );
	const donutChartData = filterPieData( colorOverridePieData, args );

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

			<LeaderboardChart
				data={ trafficSourcesData }
				withComparison
				showLegend
				secondaryColor="#e74c3c"
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

export const WithColorOverrides: Story = {
	render: ( _, { args } ) => <ChartGridWithColorOverrides args={ args } />,
	args: {
		showUnitedStates: true,
		showGreatBritain: true,
		showJapan: true,
	},
};
