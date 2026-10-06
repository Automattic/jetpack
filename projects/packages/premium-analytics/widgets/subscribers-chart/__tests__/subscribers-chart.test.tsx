/**
 * External dependencies
 */
import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { setMockRouteSearch } from '../../../tests/js/route-test-utils';
import SubscribersChartWidget from '../render';
import type { ReactNode } from 'react';

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
		empty,
	}: {
		metrics: {
			key: string;
			value: number;
			current: { date: Date; value: number | null }[];
			countLabel?: ( count: number ) => string;
		}[];
		empty?: ReactNode;
	} ) => (
		<div
			data-testid="metric-tabs-chart"
			data-metric-keys={ metrics.map( metric => metric.key ).join( ',' ) }
			data-count-labels={ metrics
				.map( metric => `${ metric.countLabel?.( 1 ) }|${ metric.countLabel?.( 2 ) }` )
				.join( ',' ) }
			data-values={ JSON.stringify( metrics[ 0 ]?.current.map( point => point.value ) ) }
			data-headline={ metrics[ 0 ]?.value }
			data-days={ metrics[ 0 ]?.current.map( point => point.date.getDate() ).join( ',' ) }
		>
			{ empty }
		</div>
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

	// Passes under UTC either way; the `test-tz` pass west of UTC is what can fail it.
	it( 'builds chart points on the bucket days the site names', async () => {
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
		expect( chart ).toHaveAttribute( 'data-values', '[5,6]' );
	} );

	it( 'charts a missing count as a gap and a real zero as zero', async () => {
		mockUseStatsSubscribersReport.mockReturnValue(
			reportWith( [
				{ date_start: '2026-03-01T00:00:00', value: 0, subscribers: null, subscribers_paid: null },
				{ date_start: '2026-04-01T00:00:00', value: 0, subscribers: 0, subscribers_paid: 0 },
				{ date_start: '2026-05-01T00:00:00', value: 5, subscribers: 5, subscribers_paid: 0 },
			] )
		);

		render(
			<SubscribersChartWidget attributes={ { reportParams: getDefaultQueryParams( false ) } } />
		);

		const chart = await screen.findByTestId( 'metric-tabs-chart' );
		expect( chart ).toHaveAttribute( 'data-values', '[null,0,5]' );
		expect( chart ).toHaveAttribute( 'data-headline', '5' );
	} );

	it( 'keeps the chart for a period without rows, handing it the no-results message', async () => {
		mockUseStatsSubscribersReport.mockReturnValue( reportWith( [] ) );

		render(
			<SubscribersChartWidget attributes={ { reportParams: getDefaultQueryParams( false ) } } />
		);

		await expect(
			screen.findByText( 'We couldn’t find results for this time period.' )
		).resolves.toBeInTheDocument();
		expect( screen.getByTestId( 'metric-tabs-chart' ) ).toBeInTheDocument();
	} );

	it.each( [
		[
			'offers',
			2,
			'subscribers,paid',
			'%s Subscriber|%s Subscribers,%s Paid subscriber|%s Paid subscribers',
		],
		[ 'withholds', 0, 'subscribers', '%s Subscriber|%s Subscribers' ],
	] )(
		'%s the Paid subscribers tab when the site has %i paid subscribers',
		async ( _verb, paid, metricKeys, countLabels ) => {
			mockUseStatsSubscribersReport.mockReturnValue(
				reportWith( [
					{ date_start: '2026-07-04T00:00:00', subscribers: 5, subscribers_paid: paid },
				] )
			);

			render(
				<SubscribersChartWidget attributes={ { reportParams: getDefaultQueryParams( false ) } } />
			);

			const chart = await screen.findByTestId( 'metric-tabs-chart' );
			expect( chart ).toHaveAttribute( 'data-metric-keys', metricKeys );
			expect( chart ).toHaveAttribute( 'data-count-labels', countLabels );
		}
	);

	describe( 'widget-owned date range', () => {
		beforeEach( () => {
			mockUseStatsSubscribersReport.mockReturnValue(
				reportWith( [ { date_start: '2026-07-04T00:00:00', subscribers: 5, subscribers_paid: 0 } ] )
			);
		} );

		// A failed assertion would skip a reset written into the test body, leaking
		// the URL state to whatever runs next.
		afterEach( () => setMockRouteSearch( {} ) );

		// The Subscribers default layout saves this widget with no attributes;
		// `render.tsx`'s own fallback must win over WidgetRoot's URL fallback.
		it( 'ignores the URL range for an instance saved without report params', async () => {
			setMockRouteSearch( { from: '2020-01-01', to: '2020-01-31', interval: 'month' } );

			render( <SubscribersChartWidget attributes={ {} } /> );

			await expect( screen.findByTestId( 'metric-tabs-chart' ) ).resolves.toBeInTheDocument();
			expect( mockUseStatsSubscribersReport ).not.toHaveBeenCalledWith(
				expect.objectContaining( { to: '2020-01-31' } )
			);
		} );

		it( 'drops a comparison its attributes carry', async () => {
			render(
				<SubscribersChartWidget
					attributes={ {
						reportParams: {
							from: '2026-05-01',
							to: '2026-06-30',
							comp: '1',
							compare_from: '2026-03-01',
							compare_to: '2026-03-31',
						},
					} }
				/>
			);

			await expect( screen.findByTestId( 'metric-tabs-chart' ) ).resolves.toBeInTheDocument();
			expect( mockUseStatsSubscribersReport ).not.toHaveBeenCalledWith(
				expect.objectContaining( { comp: '1' } )
			);
		} );
	} );
} );
