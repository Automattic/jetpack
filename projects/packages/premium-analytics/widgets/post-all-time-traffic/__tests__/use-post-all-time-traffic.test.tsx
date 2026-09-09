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
		const { result } = renderHook( () => usePostAllTimeTraffic( 779 ), { wrapper } );

		await waitFor( () => expect( result.current.rows ).toHaveLength( 1 ) );

		expect( mockApiFetch ).toHaveBeenCalledTimes( 1 );
		expect( String( mockApiFetch.mock.calls[ 0 ][ 0 ].path ) ).toMatch(
			/stats\/post\/779.*fields=years(%2C|,)post/
		);

		expect( result.current.rows[ 0 ].year ).toBe( 2026 );
		expect( result.current.rows[ 0 ].months.slice( 0, 3 ) ).toEqual( [ 5, 0, 40 ] );
		expect( result.current.publishedAt?.toISOString() ).toBe( '2026-01-10T16:27:32.000Z' );
	} );

	it( 'never requests without a post scope', () => {
		const { result } = renderHook( () => usePostAllTimeTraffic( 0 ), { wrapper } );

		expect( mockApiFetch ).not.toHaveBeenCalled();
		expect( result.current.rows ).toEqual( [] );
		expect( result.current.publishedAt ).toBeUndefined();
	} );
} );
