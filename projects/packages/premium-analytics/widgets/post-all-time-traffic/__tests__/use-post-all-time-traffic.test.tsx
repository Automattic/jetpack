/**
 * External dependencies
 */
import { queryClient } from '@jetpack-premium-analytics/data';
import { renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { queryClientWrapper as wrapper } from '../../test-utils';
import usePostAllTimeTraffic from '../use-post-all-time-traffic';

jest.mock( '@wordpress/api-fetch' );

const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

const STATS_POST_RESPONSE = {
	years: { '2026': { total: 45, months: { '1': 5, '3': 40 } } },
	averages: { '2026': { overall: 3, months: { '1': 1, '3': 8 } } },
	post: { ID: 779, post_date: '2026-01-10 16:27:32' },
};

// The current year closes the table, so the clock is pinned to the fixture's year.
const NOW = new Date( '2026-03-15T12:00:00.000Z' );

describe( 'usePostAllTimeTraffic', () => {
	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( STATS_POST_RESPONSE );
		jest.useFakeTimers();
		jest.setSystemTime( NOW );
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'requests the yearly tables and the post row, and builds the rows from them', async () => {
		const { result } = renderHook( () => usePostAllTimeTraffic( 779, 'total' ), { wrapper } );

		await waitFor( () => expect( result.current.rows ).toHaveLength( 1 ) );

		expect( mockApiFetch ).toHaveBeenCalledTimes( 1 );
		expect( String( mockApiFetch.mock.calls[ 0 ][ 0 ].path ) ).toMatch(
			/stats\/post\/779.*fields=years(%2C|,)averages(%2C|,)post/
		);

		expect( result.current.rows[ 0 ].year ).toBe( 2026 );
		expect( result.current.rows[ 0 ].months.slice( 0, 3 ) ).toEqual( [ 5, 0, 40 ] );
		expect( result.current.lifeStartsAt?.toISOString() ).toBe( '2026-01-10T16:27:32.000Z' );
	} );

	it( 'starts the life at an earlier month the endpoint reports for a rescheduled post', async () => {
		mockApiFetch.mockResolvedValue( {
			...STATS_POST_RESPONSE,
			post: { ID: 779, post_date: '2026-03-05 10:00:00' },
		} );
		const { result } = renderHook( () => usePostAllTimeTraffic( 779, 'total' ), { wrapper } );

		await waitFor( () => expect( result.current.rows ).toHaveLength( 1 ) );

		expect( result.current.lifeStartsAt?.toISOString() ).toBe( '2026-01-01T00:00:00.000Z' );
	} );

	it( 'switches to the per-day averages without refetching', async () => {
		const { result, rerender } = renderHook(
			( { metric }: { metric: 'total' | 'average' } ) => usePostAllTimeTraffic( 779, metric ),
			{ wrapper, initialProps: { metric: 'total' } }
		);

		await waitFor( () => expect( result.current.rows ).toHaveLength( 1 ) );

		rerender( { metric: 'average' } );

		expect( result.current.rows[ 0 ].months.slice( 0, 3 ) ).toEqual( [ 1, 0, 8 ] );
		expect( mockApiFetch ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'never requests without a post scope', () => {
		const { result } = renderHook( () => usePostAllTimeTraffic( 0, 'total' ), { wrapper } );

		expect( mockApiFetch ).not.toHaveBeenCalled();
		expect( result.current.rows ).toEqual( [] );
		expect( result.current.lifeStartsAt ).toBeUndefined();
	} );
} );
