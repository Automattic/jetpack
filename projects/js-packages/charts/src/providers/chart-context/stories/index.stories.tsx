import { Meta, StoryObj } from '@storybook/react';
import { expect, waitFor } from 'storybook/test';
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
// `ectoplasm` from `WP_ADMIN_COLOR_SCHEMES`, kept as a literal so the assertion below fails if the
// scheme's published colour ever changes rather than silently following it.
const ADMIN_SCHEME = 'ectoplasm';
const ADMIN_SCHEME_COLOR = '#646c3e';
// Any colour the admin scheme does not publish; it only has to be distinguishable from the above.
const ACCENT_COLOR_NOT_EXPECTED = '#4a19ab';

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

/**
 * The two colours this story sets are deliberately different, and which one wins is the assertion.
 *
 * `accentColor` seeds the WPDS `ThemeProvider`, so the design system's brand token derives from it.
 * `adminColorScheme` publishes `--wp-admin-theme-color` on a closer wrapper, the way
 * `admin-schemes.css` does. Slot 1 names the admin colour before the brand token, so the bar has to
 * paint the scheme's colour and not the accent's.
 *
 * Reordering that chain — putting the design system's token first — passes every unit test and
 * looks correct on WP 7.1, and this is what catches it. jsdom cannot cascade `var()`, so it can only
 * be checked in a browser.
 *
 * Both values must be set before the provider mounts. The palette resolves once per provider in a
 * layout effect, so a `play` function that sets the variable afterwards would assert against the
 * colours resolved at mount and prove nothing.
 */
export const AdminColorSchemeLeadsThePalette: Story = {
	render: () => <BarChart width={ 400 } height={ 200 } data={ [ baseBarData[ 0 ] ] } />,
	args: {
		themeName: 'custom',
		accentColor: ACCENT_COLOR_NOT_EXPECTED,
		adminColorScheme: ADMIN_SCHEME,
	},
	parameters: {
		docs: {
			description: {
				story: `Slot 1 reads \`--wp-admin-theme-color\` before the design system's brand token. With the admin scheme set to \`${ ADMIN_SCHEME }\` and a different accent seeding the design system, the bar paints \`${ ADMIN_SCHEME_COLOR }\`.`,
			},
		},
	},
	play: async ( { canvasElement } ) => {
		const bar = await waitFor( () => {
			const found = canvasElement.querySelector< SVGRectElement >( '.visx-bar-group rect' );
			if ( ! found ) {
				throw new Error( 'No bar rendered yet.' );
			}
			return found;
		} );

		await expect( bar.getAttribute( 'fill' ) ).toBe( ADMIN_SCHEME_COLOR );
		await expect( bar.getAttribute( 'fill' ) ).not.toBe( ACCENT_COLOR_NOT_EXPECTED );
	},
};
