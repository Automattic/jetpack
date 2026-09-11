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
import useViewsOverYears from '../use-views-over-years';

jest.mock( '@wordpress/api-fetch' );

const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

// The WPCOM matrix shape at `unit=month`, with the zero months the endpoint
// pads back to the requested start.
const VISITS_RESPONSE = {
	date: '2026-03-15',
	unit: 'month',
	fields: [ 'period', 'views' ],
	data: [
		[ '2025-10', 0 ],
		[ '2025-11', 300 ],
		[ '2025-12', 620 ],
		[ '2026-01', 155 ],
		[ '2026-02', 0 ],
		[ '2026-03', 450 ],
	],
};

// The current month closes the table, so the clock is pinned to the fixture's.
const NOW = new Date( '2026-03-15T12:00:00.000Z' );

describe( 'useViewsOverYears', () => {
	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( VISITS_RESPONSE );
		jest.useFakeTimers();
		jest.setSystemTime( NOW );
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'requests month buckets of views over the whole history and builds the rows', async () => {
		const { result } = renderHook( () => useViewsOverYears( 'total' ), { wrapper } );

		await waitFor( () => expect( result.current.rows ).toHaveLength( 2 ) );

		expect( mockApiFetch ).toHaveBeenCalledTimes( 1 );
		const path = String( mockApiFetch.mock.calls[ 0 ][ 0 ].path );
		expect( path ).toMatch( /stats\/visits/ );
		expect( path ).toMatch( /unit=month/ );
		expect( path ).toMatch( /start_date=2005-01-01/ );
		expect( path ).toMatch( /date=2026-03-15/ );
		expect( path ).toMatch( /stat_fields=views(&|$)/ );

		expect( result.current.rows.map( row => row.year ) ).toEqual( [ 2026, 2025 ] );
		expect( result.current.rows[ 0 ].months.slice( 0, 3 ) ).toEqual( [ 155, 0, 450 ] );
		expect( result.current.rows[ 1 ].months.slice( 9 ) ).toEqual( [ null, 300, 620 ] );
	} );

	it( 'switches to the per-day averages without refetching', async () => {
		const { result, rerender } = renderHook(
			( { metric }: { metric: 'total' | 'average' } ) => useViewsOverYears( metric ),
			{ wrapper, initialProps: { metric: 'total' } }
		);

		await waitFor( () => expect( result.current.rows ).toHaveLength( 2 ) );

		rerender( { metric: 'average' } );

		expect( result.current.rows[ 0 ].months.slice( 0, 3 ) ).toEqual( [ 5, 0, 30 ] );
		expect( mockApiFetch ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'has no rows before the response arrives or without views', async () => {
		mockApiFetch.mockResolvedValue( { ...VISITS_RESPONSE, data: [ [ '2026-03', 0 ] ] } );
		const { result } = renderHook( () => useViewsOverYears( 'total' ), { wrapper } );

		expect( result.current.rows ).toEqual( [] );
		expect( result.current.isLoading ).toBe( true );

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );

		expect( result.current.rows ).toEqual( [] );
	} );
} );
