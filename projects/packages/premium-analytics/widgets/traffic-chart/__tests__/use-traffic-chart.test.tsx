/**
 * External dependencies
 */
import { queryClient } from '@jetpack-premium-analytics/data';
import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import useTrafficChart from '../use-traffic-chart';
import type { ReportParams } from '@jetpack-premium-analytics/data';
import type { ReactNode } from 'react';

jest.mock( '@wordpress/api-fetch' );

const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

// Raw WPCOM `stats/visits` matrix shape. Two monthly buckets, so each field's
// summary is the total across both.
const VIEWS_VISITORS_RESPONSE = {
	unit: 'month',
	fields: [ 'period', 'views', 'visitors' ],
	data: [
		[ '2026-05', 1200, 900 ],
		[ '2026-06', 800, 600 ],
	],
};

const LIKES_COMMENTS_RESPONSE = {
	unit: 'month',
	fields: [ 'period', 'likes', 'comments' ],
	data: [
		[ '2026-05', 30, 12 ],
		[ '2026-06', 20, 8 ],
	],
};

// Lower comparison periods, one bucket each, so previous values are distinct.
const VIEWS_VISITORS_COMPARISON = {
	unit: 'month',
	fields: [ 'period', 'views', 'visitors' ],
	data: [ [ '2026-03', 500, 400 ] ],
};

const LIKES_COMMENTS_COMPARISON = {
	unit: 'month',
	fields: [ 'period', 'likes', 'comments' ],
	data: [ [ '2026-03', 10, 4 ] ],
};

const RANGE: ReportParams = {
	from: '2026-05-01',
	to: '2026-06-30',
	interval: 'month',
};

const RANGE_WITH_COMPARISON: ReportParams = {
	...RANGE,
	comp: '1',
	compare_from: '2026-03-01',
	compare_to: '2026-03-31',
};

/** Per-pair comparison fixtures, keyed by which of the two concurrent requests they answer. */
type ComparisonFixtures = {
	viewsVisitors: unknown;
	likesComments: unknown;
};

/**
 * Route each of the two concurrent requests (and their comparison variants) to
 * its own fixture.
 */
function routeRequests( comparison?: ComparisonFixtures ) {
	mockApiFetch.mockImplementation( ( { path = '' }: { path?: string } ) => {
		const isViewsVisitors = path.includes( 'views' );

		if ( comparison && path.includes( 'date=2026-03-31' ) ) {
			return Promise.resolve(
				isViewsVisitors ? comparison.viewsVisitors : comparison.likesComments
			);
		}

		return Promise.resolve( isViewsVisitors ? VIEWS_VISITORS_RESPONSE : LIKES_COMMENTS_RESPONSE );
	} );
}

/**
 * The `stats/visits` requests the hook issued. `apiFetch` is mocked wholesale
 * and also records core-data's `/wp/v2/settings` traffic, so raw call counts
 * would depend on when that warms.
 *
 * @return One path per visits request, in call order.
 */
function visitsPaths(): string[] {
	return mockApiFetch.mock.calls
		.map( ( [ options ] ) => ( options as { path?: string } )?.path ?? '' )
		.filter( path => path.includes( 'stats/visits' ) );
}

function wrapper( { children }: { children: ReactNode } ) {
	return <QueryClientProvider client={ queryClient }>{ children }</QueryClientProvider>;
}

describe( 'useTrafficChart', () => {
	beforeEach( () => {
		jest.useFakeTimers();
		// The data package's query client is a module-level singleton; drop its
		// cache so each test starts from a fresh fetch.
		queryClient.clear();
		mockApiFetch.mockReset();
		routeRequests();
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'builds one tab per metric in canonical order, with summary totals', async () => {
		const { result } = renderHook( () => useTrafficChart( RANGE, 'month' ), { wrapper } );

		await waitFor( () => expect( result.current.isFetching ).toBe( false ) );

		const metrics = result.current.metrics;
		expect( metrics.map( metric => metric.key ) ).toEqual( [
			'views',
			'visitors',
			'comments',
			'likes',
		] );
		// Proves `value` is each metric's correct total, not that it's read from the
		// summary field — sanitizeStatsTimeSeriesResponse sums these same rows either way.
		expect( metrics[ 0 ].value ).toBe( 2000 );
		expect( metrics[ 1 ].value ).toBe( 1500 );
		expect( metrics[ 2 ].value ).toBe( 20 );
		expect( metrics[ 3 ].value ).toBe( 50 );
	} );

	it( 'pairs Views with Visitors, starting Views hidden only on the Visitors tab', async () => {
		const { result } = renderHook( () => useTrafficChart( RANGE, 'month' ), { wrapper } );

		await waitFor( () => expect( result.current.isFetching ).toBe( false ) );

		const [ views, visitors ] = result.current.metrics;
		expect( views ).toMatchObject( { counterpartKey: 'visitors' } );
		expect( visitors ).toMatchObject( { counterpartKey: 'views' } );
		expect( views.counterpartHidden ).toBeUndefined();
		expect( visitors.counterpartHidden ).toBe( true );
	} );

	it( 'pluralizes the tooltip unit of each metric', async () => {
		const { result } = renderHook( () => useTrafficChart( RANGE, 'month' ), { wrapper } );

		await waitFor( () => expect( result.current.isFetching ).toBe( false ) );

		expect(
			result.current.metrics.map( metric => [ metric.countLabel?.( 1 ), metric.countLabel?.( 2 ) ] )
		).toEqual( [
			[ '%s View', '%s Views' ],
			[ '%s Visitor', '%s Visitors' ],
			[ '%s Comment', '%s Comments' ],
			[ '%s Like', '%s Likes' ],
		] );
	} );

	it( 'maps previous-period totals when comparison params are present', async () => {
		routeRequests( {
			viewsVisitors: VIEWS_VISITORS_COMPARISON,
			likesComments: LIKES_COMMENTS_COMPARISON,
		} );

		const { result } = renderHook( () => useTrafficChart( RANGE_WITH_COMPARISON, 'month' ), {
			wrapper,
		} );

		await waitFor( () => expect( result.current.isFetching ).toBe( false ) );

		// Keyed rather than indexed: tab order is the sibling test's subject, not
		// this one's, so a reorder shouldn't silently re-point these totals.
		const byKey = Object.fromEntries(
			result.current.metrics.map( metric => [ metric.key, metric ] )
		);
		expect( byKey.views.previousValue ).toBe( 500 );
		expect( byKey.visitors.previousValue ).toBe( 400 );
		expect( byKey.likes.previousValue ).toBe( 10 );
		expect( byKey.comments.previousValue ).toBe( 4 );
		expect( byKey.views.previous ).toHaveLength( 1 );
	} );

	it( "skips a year-ago comparison's one-day opening week when grouped by weeks", async () => {
		const weeks = ( ...rows: Array< [ string, number ] > ) => ( {
			unit: 'week',
			fields: [ 'period', 'views', 'visitors' ],
			data: rows.map( ( [ period, views ] ) => [ period, views, 1 ] ),
		} );
		mockApiFetch.mockImplementation( ( { path = '' }: { path?: string } ) =>
			Promise.resolve(
				path.includes( 'date=2025' )
					? weeks( [ '2025W08W25', 1 ], [ '2025W09W01', 132 ], [ '2025W09W08', 326 ] )
					: weeks( [ '2026W08W31', 2 ], [ '2026W09W07', 4 ] )
			)
		);

		const { result } = renderHook(
			() =>
				useTrafficChart(
					{
						from: '2026-08-31',
						to: '2026-09-13',
						interval: 'week',
						comp: '1',
						compare_from: '2025-08-31',
						compare_to: '2025-09-13',
					},
					'week'
				),
			{ wrapper }
		);

		await waitFor( () => expect( result.current.isFetching ).toBe( false ) );

		const views = result.current.metrics[ 0 ];
		expect( views.previous?.map( point => point.value ) ).toEqual( [ 132, 326 ] );
		expect( views.previousValue ).toBe( 459 );
	} );

	describe( 'hourly', () => {
		const DAY_RANGE: ReportParams = {
			from: '2026-06-15T00:00:00.000+00:00',
			to: '2026-06-15T23:59:59.999+00:00',
			interval: 'hour',
		};

		// "Last 24 hours": daily buckets would cover up to two whole days.
		const ROLLING_RANGE: ReportParams = {
			from: '2026-06-14T13:00:00.000+00:00',
			to: '2026-06-15T12:59:59.999+00:00',
			interval: 'hour',
		};

		const LONG_PARTIAL_RANGE: ReportParams = {
			from: '2026-06-12T13:00:00.000+00:00',
			to: '2026-06-15T12:59:59.999+00:00',
			interval: 'hour',
		};

		// `stats/visits` fills Views alone at this grain.
		const HOURLY_VIEWS_RESPONSE = {
			unit: 'hour',
			fields: [ 'period', 'views' ],
			data: [
				[ '2026-06-15 09:00:00', 40 ],
				[ '2026-06-15 10:00:00', 60 ],
			],
		};

		const DAILY_TOTALS_RESPONSE = {
			unit: 'day',
			fields: [ 'period', 'visitors', 'likes', 'comments' ],
			data: [ [ '2026-06-15', 9, 3, 2 ] ],
		};

		beforeEach( () => {
			mockApiFetch.mockImplementation( ( { path = '' }: { path?: string } ) =>
				Promise.resolve(
					path.includes( 'unit=day' ) ? DAILY_TOTALS_RESPONSE : HOURLY_VIEWS_RESPONSE
				)
			);
		} );

		it( 'asks for the other metrics as a daily total when the range covers whole days', async () => {
			const { result } = renderHook( () => useTrafficChart( DAY_RANGE, 'hour' ), { wrapper } );

			await waitFor( () => expect( result.current.isFetching ).toBe( false ) );

			const paths = visitsPaths();
			expect( paths ).toHaveLength( 2 );
			const hourly = paths.find( path => path.includes( 'unit=hour' ) );
			const daily = paths.find( path => path.includes( 'unit=day' ) );
			expect( hourly ).toContain( `stat_fields=${ encodeURIComponent( 'views' ) }` );
			expect( daily ).toContain(
				`stat_fields=${ encodeURIComponent( 'visitors,likes,comments' ) }`
			);
		} );

		it( 'shows the daily totals on the cards without drawing them on the hourly axis', async () => {
			const { result } = renderHook( () => useTrafficChart( DAY_RANGE, 'hour' ), { wrapper } );

			await waitFor( () => expect( result.current.isFetching ).toBe( false ) );

			const [ views, visitors, comments, likes ] = result.current.metrics;
			expect( views.value ).toBe( 100 );
			expect( views.current ).toHaveLength( 2 );
			expect( views.seriesUnavailable ).toBeUndefined();

			expect( [ visitors.value, comments.value, likes.value ] ).toEqual( [ 9, 2, 3 ] );
			for ( const metric of [ visitors, likes, comments ] ) {
				expect( metric.unavailable ).toBeUndefined();
				expect( metric.seriesUnavailable ).toBe( "Hourly data isn't available for this metric." );
				expect( metric.current ).toEqual( [] );
			}
		} );

		it( 'keeps the hourly Views chart when the daily totals request fails', async () => {
			mockApiFetch.mockImplementation( ( { path = '' }: { path?: string } ) =>
				path.includes( 'unit=day' )
					? Promise.reject( { error: 'unauthorized', status: 403 } )
					: Promise.resolve( HOURLY_VIEWS_RESPONSE )
			);

			const { result } = renderHook( () => useTrafficChart( DAY_RANGE, 'hour' ), { wrapper } );

			await waitFor( () => expect( result.current.isFetching ).toBe( false ) );

			expect( result.current.isError ).toBe( false );
			const [ views, visitors, comments, likes ] = result.current.metrics;
			expect( views.current ).toHaveLength( 2 );
			for ( const metric of [ visitors, comments, likes ] ) {
				expect( metric.unavailable ).toBe( "Hourly data isn't available for this metric." );
			}
		} );

		it.each( [
			[ 'a rolling day', ROLLING_RANGE ],
			[ 'a partial range longer than two days', LONG_PARTIAL_RANGE ],
		] )( 'requests only Views for %s', async ( _label, range ) => {
			const { result } = renderHook( () => useTrafficChart( range, 'hour' ), { wrapper } );

			await waitFor( () => expect( result.current.isFetching ).toBe( false ) );

			const paths = visitsPaths();
			expect( paths ).toHaveLength( 1 );
			expect( paths[ 0 ] ).toContain( 'unit=hour' );
			expect( paths[ 0 ] ).not.toContain( 'visitors' );

			const [ views, visitors, likes, comments ] = result.current.metrics;
			expect( views.unavailable ).toBeUndefined();
			for ( const metric of [ visitors, likes, comments ] ) {
				expect( metric.unavailable ).toBe( "Hourly data isn't available for this metric." );
			}
		} );

		// A manual refetch would ignore `enabled`; `useReport` gates its combined
		// refetch on it, so the skipped request stays skipped through a retry.
		it( 'still asks for Views alone when the retry action runs', async () => {
			const { result } = renderHook( () => useTrafficChart( ROLLING_RANGE, 'hour' ), { wrapper } );

			await waitFor( () => expect( result.current.isFetching ).toBe( false ) );

			act( () => result.current.refetch() );

			await waitFor( () => expect( result.current.isFetching ).toBe( false ) );

			const paths = visitsPaths();
			expect( paths ).toHaveLength( 2 );
			for ( const path of paths ) {
				expect( path ).toContain( 'stat_fields=views' );
				expect( path ).not.toContain( 'likes' );
			}
		} );
	} );
} );

describe( 'useTrafficChart tooltip extras', () => {
	const VIEWS_VISITORS = {
		unit: 'month',
		fields: [ 'period', 'views', 'visitors' ],
		data: [
			[ '2026-05', 1200, 900 ],
			[ '2026-06', 800, 0 ],
		],
	};
	const WITH_POSTS = {
		unit: 'month',
		fields: [ 'period', 'likes', 'comments', 'post_titles' ],
		data: [
			[ '2026-05', 30, 12, [ 'Hello world' ] ],
			[ '2026-06', 20, 8, [] ],
		],
	};

	beforeEach( () => {
		jest.useFakeTimers();
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockImplementation( ( { path = '' }: { path?: string } ) =>
			Promise.resolve( path.includes( 'views' ) ? VIEWS_VISITORS : WITH_POSTS )
		);
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'asks the likes and comments request for the post titles, not the views one', async () => {
		const { result } = renderHook( () => useTrafficChart( RANGE, 'month' ), { wrapper } );

		await waitFor( () => expect( result.current.isFetching ).toBe( false ) );

		const [ views, likesComments ] = visitsPaths();
		expect( views ).toContain( `stat_fields=${ encodeURIComponent( 'views,visitors' ) }` );
		expect( likesComments ).toContain(
			`stat_fields=${ encodeURIComponent( 'likes,comments,post_titles' ) }`
		);
	} );

	it( 'reads views per visitor and the posts published out under Views and Visitors only', async () => {
		const { result } = renderHook( () => useTrafficChart( RANGE, 'month' ), { wrapper } );

		await waitFor( () => expect( result.current.isFetching ).toBe( false ) );

		const [ views, visitors, comments, likes ] = result.current.metrics;
		expect( views.tooltipExtras?.map( extra => extra.label ) ).toEqual( [
			'Views per visitor',
			'Posts published',
		] );
		expect( visitors.tooltipExtras ).toBe( views.tooltipExtras );
		expect( comments.tooltipExtras ).toBeUndefined();
		expect( likes.tooltipExtras ).toBeUndefined();

		const [ ratio, posts ] = views.tooltipExtras ?? [];
		expect( ratio.data ).toHaveLength( 1 );
		expect( ratio.data[ 0 ].value ).toBeCloseTo( 1.33, 2 );
		expect( posts.data ).toEqual( [ expect.objectContaining( { value: 1 } ) ] );
	} );
} );
