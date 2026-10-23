/**
 * External dependencies
 */
import {
	DASHBOARD_PREFERENCES_SCOPE,
	getDefaultQueryParams,
} from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
import { dispatch } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
/**
 * Internal dependencies
 */
import { setMockRouteSearch } from '../../../tests/js/route-test-utils';
import SubscribersChartWidget from '../render';
import type { ReactNode } from 'react';

const mockUseStatsSubscribersReport = jest.fn();
const mockUseStatsSubscribersCounts = jest.fn();

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useStatsSubscribersReport: ( params: unknown ) => mockUseStatsSubscribersReport( params ),
	useStatsSubscribersCounts: ( params: unknown, options: unknown ) =>
		mockUseStatsSubscribersCounts( params, options ),
} ) );

// The chart itself is visx SVG rendering, outside this widget's concern. Keep
// the tabs observable so the tests can assert what the widget charts.
jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/widgets-toolkit' ),
	MetricTabsChart: ( {
		metrics,
		empty,
		tickResolution,
	}: {
		metrics: {
			key: string;
			value: number;
			current: { date: Date; value: number | null }[];
			countLabel?: ( count: number ) => string;
		}[];
		empty?: ReactNode;
		tickResolution?: string;
	} ) => (
		<div
			data-testid="metric-tabs-chart"
			data-tick-resolution={ tickResolution }
			data-metric-keys={ metrics.map( metric => metric.key ).join( ',' ) }
			data-count-labels={ metrics
				.map( metric => `${ metric.countLabel?.( 1 ) }|${ metric.countLabel?.( 2 ) }` )
				.join( ',' ) }
			data-values={ JSON.stringify( metrics[ 0 ]?.current.map( point => point.value ) ) }
			data-headline={ metrics[ 0 ]?.value }
			data-dates={ metrics[ 0 ]?.current.map( point => point.date.toISOString() ).join( ',' ) }
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
		mockUseStatsSubscribersCounts.mockReset();
		mockUseStatsSubscribersCounts.mockReturnValue( { data: undefined, isLoading: false } );
	} );

	it( 'builds chart points on the bucket days the site names', async () => {
		mockUseStatsSubscribersReport.mockReturnValue( {
			...reportWith( [
				{ date_start: '2026-07-04T00:00:00', subscribers: 5, subscribers_paid: 0 },
				{ date_start: '2026-07-05T00:00:00', subscribers: 6, subscribers_paid: 0 },
			] ),
			timezone: 'America/Los_Angeles',
		} );

		render(
			<SubscribersChartWidget attributes={ { reportParams: getDefaultQueryParams( false ) } } />
		);

		const chart = await screen.findByTestId( 'metric-tabs-chart' );
		// Los Angeles midnights: a bucket read in UTC, or in the runner's zone, lands elsewhere.
		expect( chart ).toHaveAttribute(
			'data-dates',
			'2026-07-04T07:00:00.000Z,2026-07-05T07:00:00.000Z'
		);
		expect( chart ).toHaveAttribute( 'data-values', '[5,6]' );
	} );

	it( 'declares its bucket size, which a month the range cuts would otherwise misread', async () => {
		mockUseStatsSubscribersReport.mockReturnValue(
			reportWith( [
				{ date_start: '2025-04-11T00:00:00', subscribers: 5, subscribers_paid: 0 },
				{ date_start: '2025-05-01T00:00:00', subscribers: 6, subscribers_paid: 0 },
			] )
		);

		render(
			<SubscribersChartWidget
				attributes={ {
					reportParams: {
						from: '2025-04-11T00:00:00',
						to: '2026-10-23T23:59:59',
						interval: 'month',
					},
				} }
			/>
		);

		await expect( screen.findByTestId( 'metric-tabs-chart' ) ).resolves.toHaveAttribute(
			'data-tick-resolution',
			'month'
		);
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

	it( 'drops the tabs for a period without rows, showing the no-results message', async () => {
		mockUseStatsSubscribersReport.mockReturnValue( reportWith( [] ) );

		render(
			<SubscribersChartWidget attributes={ { reportParams: getDefaultQueryParams( false ) } } />
		);

		await expect(
			screen.findByText( 'We couldn’t find results for this time period.' )
		).resolves.toBeInTheDocument();
		expect( screen.queryByTestId( 'metric-tabs-chart' ) ).not.toBeInTheDocument();
	} );

	describe( 'empty chart', () => {
		const NO_SUBSCRIBERS =
			'You don’t have subscribers yet. Newsletter can help you turn readers into an audience.';
		const NO_RESULTS = 'We couldn’t find results for this time period.';
		const emptyRange = [
			{ date_start: '2026-07-04T00:00:00', subscribers: 0, subscribers_paid: 0 },
		];

		it.each( [
			[ 'the site has no subscribers at all', { total_subscribers: 0 }, NO_SUBSCRIBERS, true ],
			[
				'the site has subscribers outside the range',
				{ total_subscribers: 12 },
				NO_RESULTS,
				false,
			],
			[ 'the subscriber total could not be read', undefined, NO_RESULTS, false ],
		] )( 'describes an empty chart when %s', async ( _case, data, message, hasNoSubscribers ) => {
			mockUseStatsSubscribersReport.mockReturnValue( reportWith( emptyRange ) );
			mockUseStatsSubscribersCounts.mockReturnValue( { data, isLoading: false } );

			render(
				<SubscribersChartWidget attributes={ { reportParams: getDefaultQueryParams( false ) } } />
			);

			await expect( screen.findByText( message ) ).resolves.toBeInTheDocument();
			expect( !! screen.queryByRole( 'link', { name: /Learn more/ } ) ).toBe( hasNoSubscribers );
			expect( screen.queryByTestId( 'metric-tabs-chart' ) ).not.toBeInTheDocument();
		} );

		it( 'links an empty chart to the Newsletter guide in a new tab', async () => {
			mockUseStatsSubscribersReport.mockReturnValue( reportWith( emptyRange ) );
			mockUseStatsSubscribersCounts.mockReturnValue( {
				data: { total_subscribers: 0 },
				isLoading: false,
			} );

			render(
				<SubscribersChartWidget attributes={ { reportParams: getDefaultQueryParams( false ) } } />
			);

			const link = await screen.findByRole( 'link', { name: /Learn more/ } );
			expect( link ).toHaveAttribute( 'href', 'https://jetpack.com/support/newsletter/' );
			expect( link ).toHaveAttribute( 'target', '_blank' );
		} );

		it( 'waits for the subscriber total before describing an empty chart', () => {
			mockUseStatsSubscribersReport.mockReturnValue( reportWith( emptyRange ) );
			mockUseStatsSubscribersCounts.mockReturnValue( { data: undefined, isLoading: true } );

			render(
				<SubscribersChartWidget attributes={ { reportParams: getDefaultQueryParams( false ) } } />
			);

			expect( mockUseStatsSubscribersCounts ).toHaveBeenLastCalledWith( undefined, {
				enabled: true,
			} );
			expect( screen.queryByText( NO_RESULTS ) ).not.toBeInTheDocument();
		} );

		it.each( [
			[
				'has subscribers',
				reportWith( [
					{ date_start: '2026-07-04T00:00:00', subscribers: 5, subscribers_paid: 0 },
				] ),
			],
			[ 'is still loading', { ...reportWith( [] ), isLoading: true } ],
			[ 'failed to load', { ...reportWith( [] ), isError: true } ],
		] )( 'leaves the subscriber total unread while the chart %s', ( _case, report ) => {
			mockUseStatsSubscribersReport.mockReturnValue( report );

			render(
				<SubscribersChartWidget attributes={ { reportParams: getDefaultQueryParams( false ) } } />
			);

			expect( mockUseStatsSubscribersCounts ).toHaveBeenLastCalledWith( undefined, {
				enabled: false,
			} );
		} );
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

		it( 'starts on a preset the reader remembers after the widget loaded', async () => {
			const preferences = dispatch( preferencesStore );
			preferences.set( DASHBOARD_PREFERENCES_SCOPE, 'datePreset', 'last-12-months' );

			try {
				render( <SubscribersChartWidget attributes={ {} } /> );

				await expect( screen.findByTestId( 'metric-tabs-chart' ) ).resolves.toBeInTheDocument();
				expect( mockUseStatsSubscribersReport ).toHaveBeenLastCalledWith(
					expect.objectContaining( { preset: 'last-12-months' } )
				);
			} finally {
				preferences.set( DASHBOARD_PREFERENCES_SCOPE, 'datePreset', undefined );
			}
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
