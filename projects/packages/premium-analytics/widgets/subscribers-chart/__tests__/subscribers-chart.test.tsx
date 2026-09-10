/**
 * External dependencies
 */
import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import SubscribersChartWidget from '../render';

const mockUseStatsSubscribersReport = jest.fn();

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useStatsSubscribersReport: ( params: unknown ) => mockUseStatsSubscribersReport( params ),
} ) );

// The chart itself is visx SVG rendering, outside this widget's concern. Keep
// the tabs observable so the tests can assert what the widget charts.
jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/widgets-toolkit' ),
	MetricTabsChart: ( {
		metrics,
	}: {
		metrics: { key: string; value: number; current: { date: Date; value: number }[] }[];
	} ) => (
		<div
			data-testid="metric-tabs-chart"
			data-metric-keys={ metrics.map( metric => metric.key ).join( ',' ) }
			data-values={ metrics[ 0 ]?.current.map( point => point.value ).join( ',' ) }
			data-days={ metrics[ 0 ]?.current.map( point => point.date.getDate() ).join( ',' ) }
		/>
	),
} ) );

// WidgetRoot reads URL search params as a fallback for report params; outside
// a matched route the real hook warns and throws.
jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

function reportWith( data: Record< string, unknown >[] ) {
	return {
		primary: { data: { data } },
		comparison: { data: undefined },
		isLoading: false,
		isFetching: false,
		isError: false,
		refetch: jest.fn(),
	};
}

describe( 'SubscribersChartWidget', () => {
	beforeEach( () => {
		mockUseStatsSubscribersReport.mockReset();
	} );

	// Pinned west of UTC on purpose: under a UTC runner the site and runner
	// readings coincide, so this would pass either way.
	it( 'builds chart points on the bucket days the site names', async () => {
		const env = process.env as Record< string, string | undefined >;
		const runnerTimeZone = env.TZ;
		env.TZ = 'America/Los_Angeles';

		try {
			mockUseStatsSubscribersReport.mockReturnValue(
				reportWith( [
					{ date_start: '2026-07-04T00:00:00', subscribers: 5, subscribers_paid: 0 },
					{ date_start: '2026-07-05T00:00:00', subscribers: 6, subscribers_paid: 0 },
				] )
			);

			render(
				<SubscribersChartWidget attributes={ { reportParams: getDefaultQueryParams( false ) } } />
			);

			const chart = await screen.findByTestId( 'metric-tabs-chart' );
			// Reading these buckets in the runner's zone would report the previous
			// day (3,4).
			expect( chart ).toHaveAttribute( 'data-days', '4,5' );
			expect( chart ).toHaveAttribute( 'data-values', '5,6' );
		} finally {
			if ( runnerTimeZone === undefined ) {
				delete env.TZ;
			} else {
				env.TZ = runnerTimeZone;
			}
		}
	} );

	it( 'offers the Paid subscribers tab only when the site has paid subscribers', async () => {
		mockUseStatsSubscribersReport.mockReturnValue(
			reportWith( [ { date_start: '2026-07-04T00:00:00', subscribers: 5, subscribers_paid: 2 } ] )
		);

		render(
			<SubscribersChartWidget attributes={ { reportParams: getDefaultQueryParams( false ) } } />
		);

		const chart = await screen.findByTestId( 'metric-tabs-chart' );
		expect( chart ).toHaveAttribute( 'data-metric-keys', 'subscribers,paid' );
	} );
} );
