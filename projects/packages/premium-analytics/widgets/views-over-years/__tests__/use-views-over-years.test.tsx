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

// The WPCOM matrix shape at `unit=month`.
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

const SITE_RESPONSE = { options: { created_at: '2025-11-24T09:30:00+00:00' } };

// The current month closes the table, so the clock is pinned to the fixture's.
const NOW = new Date( '2026-03-15T12:00:00.000Z' );

const isSiteRequest = ( options: { path?: string } ) => /\/site\?/.test( String( options.path ) );

describe( 'useViewsOverYears', () => {
	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockImplementation( async options =>
			isSiteRequest( options ) ? SITE_RESPONSE : VISITS_RESPONSE
		);
		jest.useFakeTimers();
		jest.setSystemTime( NOW );
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'requests month buckets of views over the whole history and builds the rows', async () => {
		const { result } = renderHook( () => useViewsOverYears( 'total' ), { wrapper } );

		await waitFor( () => expect( result.current.rows ).toHaveLength( 2 ) );

		expect( mockApiFetch ).toHaveBeenCalledTimes( 2 );
		const path = String(
			mockApiFetch.mock.calls.find( call => ! isSiteRequest( call[ 0 ] ) )?.[ 0 ].path
		);
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
		expect( mockApiFetch ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'opens the first month on the registration day and starts the life there', async () => {
		const { result } = renderHook( () => useViewsOverYears( 'average' ), { wrapper } );

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );

		expect(
			String( mockApiFetch.mock.calls.find( call => isSiteRequest( call[ 0 ] ) )?.[ 0 ].path )
		).toBe( '/jetpack-premium-analytics/v1/proxy/v1.1/site?fields=options&options=created_at' );
		// Nov 24 through Nov 30: 300 / 7.
		expect( result.current.rows[ 1 ].months.slice( 10 ) ).toEqual( [ 43, 20 ] );
		expect( result.current.lifeStartsAt?.toISOString() ).toBe( '2025-11-24T09:30:00.000Z' );
	} );

	it( 'divides the first month whole and starts the life on its first day without a registration date', async () => {
		// A 403 is what a user who cannot read site options gets; it is not retried.
		mockApiFetch.mockImplementation( async options => {
			if ( isSiteRequest( options ) ) {
				throw { code: 'unauthorized', message: 'Nope.', status: 403 };
			}

			return VISITS_RESPONSE;
		} );
		const { result } = renderHook( () => useViewsOverYears( 'average' ), { wrapper } );

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );

		expect( result.current.isError ).toBe( false );
		expect( result.current.rows[ 1 ].months.slice( 10 ) ).toEqual( [ 10, 20 ] );
		expect( result.current.lifeStartsAt?.toISOString() ).toBe( '2025-11-01T00:00:00.000Z' );
	} );

	it( 'keeps loading until the registration date arrives', async () => {
		let resolveSite: ( value: unknown ) => void = () => {};
		mockApiFetch.mockImplementation( options =>
			isSiteRequest( options )
				? new Promise( resolve => {
						resolveSite = resolve;
				  } )
				: Promise.resolve( VISITS_RESPONSE )
		);
		const { result } = renderHook( () => useViewsOverYears( 'average' ), { wrapper } );

		await waitFor( () => expect( result.current.rows ).toHaveLength( 2 ) );
		expect( result.current.isLoading ).toBe( true );

		resolveSite( SITE_RESPONSE );

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
		expect( result.current.rows[ 1 ].months.slice( 10 ) ).toEqual( [ 43, 20 ] );
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
