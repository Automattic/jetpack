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
		// The data package's query client is a module-level singleton; drop its
		// cache so each test starts from a fresh fetch.
		queryClient.clear();
		mockApiFetch.mockReset();
		routeRequests();
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

	it( 'maps one chart point per period, oldest first', async () => {
		const { result } = renderHook( () => useTrafficChart( RANGE, 'month' ), { wrapper } );

		await waitFor( () => expect( result.current.isFetching ).toBe( false ) );

		const views = result.current.metrics[ 0 ];
		expect( views.current ).toHaveLength( 2 );
		expect( views.current[ 0 ].value ).toBe( 1200 );
		expect( views.current[ 1 ].value ).toBe( 800 );
		expect( views.current[ 0 ].date ).toBeInstanceOf( Date );
		expect( views.current[ 0 ].date.getTime() ).toBeLessThan( views.current[ 1 ].date.getTime() );
	} );

	it( 'omits the previous period when comparison is off', async () => {
		const { result } = renderHook( () => useTrafficChart( RANGE, 'month' ), { wrapper } );

		await waitFor( () => expect( result.current.isFetching ).toBe( false ) );

		for ( const metric of result.current.metrics ) {
			expect( metric.previous ).toBeUndefined();
			expect( metric.previousValue ).toBeUndefined();
		}
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

	// Misleading-zero guard: an empty comparison response must read as "no
	// previous period", not a previous total of 0 (would render a false -100% delta).
	it( 'omits the previous period when the comparison request returns no rows', async () => {
		// Shared between the views/visitors and likes/comments requests below, so
		// `fields` names neither pair specifically; `data: []` means it's never read.
		const empty = {
			unit: 'month',
			fields: [ 'period' ],
			data: [],
		};
		routeRequests( { viewsVisitors: empty, likesComments: empty } );

		const { result } = renderHook( () => useTrafficChart( RANGE_WITH_COMPARISON, 'month' ), {
			wrapper,
		} );

		await waitFor( () => expect( result.current.isFetching ).toBe( false ) );

		for ( const metric of result.current.metrics ) {
			expect( metric.previous ).toBeUndefined();
			expect( metric.previousValue ).toBeUndefined();
		}
	} );

	describe( 'hourly', () => {
		const HOURLY_RANGE: ReportParams = {
			from: '2026-06-15T00:00:00+00:00',
			to: '2026-06-15T23:59:59+00:00',
			interval: 'hour',
		};

		// `stats/visits` fills Views alone at this grain, so the hook must not ask
		// for the rest, and must say why they are missing rather than show a zero.
		const HOURLY_VIEWS_RESPONSE = {
			unit: 'hour',
			fields: [ 'period', 'views' ],
			data: [
				[ '2026-06-15 09:00:00', 40 ],
				[ '2026-06-15 10:00:00', 60 ],
			],
		};

		beforeEach( () => {
			mockApiFetch.mockImplementation( () => Promise.resolve( HOURLY_VIEWS_RESPONSE ) );
		} );

		it( 'requests only Views, as hourly buckets covering the range', async () => {
			const { result } = renderHook( () => useTrafficChart( HOURLY_RANGE, 'hour' ), { wrapper } );

			await waitFor( () => expect( result.current.isFetching ).toBe( false ) );

			const paths = visitsPaths();
			expect( paths ).toHaveLength( 1 );
			expect( paths[ 0 ] ).toContain( 'unit=hour' );
			// The endpoint counts the hourly buckets from these two, so they have
			// to reach it with their time of day intact.
			expect( paths[ 0 ] ).toContain(
				`start_date=${ encodeURIComponent( '2026-06-15T00:00:00+00:00' ) }`
			);
			expect( paths[ 0 ] ).toContain(
				`date=${ encodeURIComponent( '2026-06-15T23:59:59+00:00' ) }`
			);
			expect( paths[ 0 ] ).toContain( 'stat_fields=views' );
			expect( paths[ 0 ] ).not.toContain( 'visitors' );
		} );

		it( 'marks the metrics the endpoint cannot serve, leaving Views with its points', async () => {
			const { result } = renderHook( () => useTrafficChart( HOURLY_RANGE, 'hour' ), { wrapper } );

			await waitFor( () => expect( result.current.isFetching ).toBe( false ) );

			const [ views, visitors, likes, comments ] = result.current.metrics;
			expect( views.unavailable ).toBeUndefined();
			expect( views.value ).toBe( 100 );
			expect( views.current ).toHaveLength( 2 );

			for ( const metric of [ visitors, likes, comments ] ) {
				expect( metric.unavailable ).toBe( "Hourly data isn't available for this metric." );
			}
		} );

		// A manual refetch would ignore `enabled`; `useReport` gates its combined
		// refetch on it, so the skipped request stays skipped through a retry.
		it( 'still asks for Views alone when the retry action runs', async () => {
			const { result } = renderHook( () => useTrafficChart( HOURLY_RANGE, 'hour' ), { wrapper } );

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
