/**
 * External dependencies
 */
import { queryClient } from '@jetpack-premium-analytics/data';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
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
		// This only proves `value` is each metric's correct total (not a
		// hardcoded or swapped field) — sanitizeStatsTimeSeriesResponse derives
		// the summary by summing these same rows, so it can't tell a
		// summary-read apart from a re-sum of the points.
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

	// The misleading-zero guard: an empty comparison response must read as "no
	// previous period", not as a previous total of 0 (which would render a
	// -100% delta against a real current value).
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
} );
