import { render, screen } from '@testing-library/react';
import { GlobalChartsProvider } from '../../providers';
import { salesByProduct } from '../../stories/sample-data';
import { AreaChartUnresponsive } from '../area-chart';
import { BarChartUnresponsive } from '../bar-chart';
import { BarListChartUnresponsive } from '../bar-list-chart';
import { ConversionFunnelChart } from '../conversion-funnel-chart';
import { GeoChartUnresponsive } from '../geo-chart';
import { HeatmapChart } from '../heatmap-chart';
import { LeaderboardChartUnresponsive } from '../leaderboard-chart';
import { LineChartUnresponsive } from '../line-chart';
import { PieChartUnresponsive } from '../pie-chart';
import { PieSemiCircleChartUnresponsive } from '../pie-semi-circle-chart';
import type { GeoData } from '../../types';
import type { ReactElement } from 'react';

jest.mock( 'react-google-charts', () => ( { Chart: () => <div /> } ) );

const series = [
	{
		label: 'Series A',
		data: [
			{ date: new Date( '2024-01-01' ), value: 10 },
			{ date: new Date( '2024-01-02' ), value: 20 },
		],
	},
];

const slices = [
	{ label: 'MacOS', value: 30, valueDisplay: '30', percentage: 60 },
	{ label: 'Linux', value: 20, valueDisplay: '20', percentage: 40 },
];

const geoData: GeoData = [
	[ 'Country', 'Value' ],
	[ 'US', 100 ],
	[ 'CA', 50 ],
	[ 'GB', 25 ],
];

const funnelSteps = [
	{ id: 'sessions', label: 'Sessions', rate: 100, count: 10000 },
	{ id: 'cart', label: 'Cart', rate: 71.1, count: 7110 },
	{ id: 'checkout', label: 'Checkout', rate: 52.5, count: 5250 },
	{ id: 'purchase', label: 'Purchase', rate: 10.3, count: 1030 },
];

const heatmapData = [
	{ label: 'W1', data: [ { value: 1 }, { value: 2 }, { value: null } ] },
	{ label: 'W2', data: [ { value: 3 }, { value: 0 }, { value: 4 } ] },
];

const leaderboardData = [
	{
		id: 'direct',
		label: 'Direct',
		currentValue: 12500,
		previousValue: 10000,
		currentShare: 100,
		previousShare: 80,
		delta: 25,
	},
	{
		id: 'social',
		label: 'Social Media',
		currentValue: 8750,
		previousValue: 9500,
		currentShare: 70,
		previousShare: 76,
		delta: -8,
	},
];

const CHARTS: [ string, string, string, ( ariaLabel?: string ) => ReactElement ][] = [
	[
		'line',
		'application',
		'Line chart',
		ariaLabel => (
			<LineChartUnresponsive
				data={ series }
				width={ 400 }
				height={ 300 }
				withGradientFill={ false }
				ariaLabel={ ariaLabel }
			/>
		),
	],
	[
		'area',
		'application',
		'Area chart',
		ariaLabel => (
			<AreaChartUnresponsive data={ series } width={ 400 } height={ 300 } ariaLabel={ ariaLabel } />
		),
	],
	[
		'bar',
		'application',
		'Bar chart',
		ariaLabel => (
			<BarChartUnresponsive data={ series } width={ 400 } height={ 300 } ariaLabel={ ariaLabel } />
		),
	],
	[
		'bar list',
		'application',
		'Bar list chart',
		ariaLabel => (
			<BarListChartUnresponsive
				data={ salesByProduct }
				width={ 400 }
				height={ 300 }
				ariaLabel={ ariaLabel }
			/>
		),
	],
	[
		'pie',
		'application',
		'Pie chart',
		ariaLabel => <PieChartUnresponsive data={ slices } size={ 300 } ariaLabel={ ariaLabel } />,
	],
	[
		'semi-circle',
		'application',
		'Semi-circle chart',
		ariaLabel => (
			<PieSemiCircleChartUnresponsive data={ slices } width={ 300 } ariaLabel={ ariaLabel } />
		),
	],
	[
		'geo',
		'group',
		'Geo chart',
		ariaLabel => (
			<GeoChartUnresponsive data={ geoData } width={ 800 } height={ 400 } ariaLabel={ ariaLabel } />
		),
	],
	[
		'conversion funnel',
		'group',
		'Conversion funnel chart',
		ariaLabel => (
			<ConversionFunnelChart mainRate={ 25 } steps={ funnelSteps } ariaLabel={ ariaLabel } />
		),
	],
	[
		'heatmap',
		'grid',
		'Heatmap chart',
		ariaLabel => (
			<HeatmapChart data={ heatmapData } width={ 500 } height={ 300 } ariaLabel={ ariaLabel } />
		),
	],
	[
		'leaderboard',
		'list',
		'Leaderboard chart',
		ariaLabel => (
			<LeaderboardChartUnresponsive
				data={ leaderboardData }
				width={ 400 }
				height={ 300 }
				ariaLabel={ ariaLabel }
			/>
		),
	],
];

it.each( CHARTS )(
	'names the %s chart from ariaLabel, or its default',
	( _chart, role, defaultName, renderChart ) => {
		const { unmount } = render( <GlobalChartsProvider>{ renderChart() }</GlobalChartsProvider> );
		expect( screen.getByRole( role, { name: defaultName } ) ).toBeInTheDocument();
		unmount();

		render( <GlobalChartsProvider>{ renderChart( 'Views by day' ) }</GlobalChartsProvider> );
		expect( screen.getByRole( role, { name: 'Views by day' } ) ).toBeInTheDocument();
	}
);
