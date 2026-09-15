/**
 * External dependencies
 */
import { queryClient } from '@jetpack-premium-analytics/data';
import { act, renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { getSettings, setSettings } from '@wordpress/date';
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

// The first month with views at `unit=day`: quiet until Nov 24.
const FIRST_MONTH_RESPONSE = {
	date: '2025-11-30',
	unit: 'day',
	fields: [ 'period', 'views' ],
	data: Array.from( { length: 30 }, ( _, index ) => [
		`2025-11-${ String( index + 1 ).padStart( 2, '0' ) }`,
		index + 1 >= 24 ? 42 : 0,
	] ),
};

// The current month closes the table, so the clock is pinned to the fixture's.
const NOW = new Date( '2026-03-15T12:00:00.000Z' );

const isDayRequest = ( options: { path?: string } ) => /unit=day/.test( String( options.path ) );

describe( 'useViewsOverYears', () => {
	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockImplementation( async options =>
			isDayRequest( options ) ? FIRST_MONTH_RESPONSE : VISITS_RESPONSE
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

	it( 'then requests the days of the first month with views, and opens it on the first', async () => {
		const { result } = renderHook( () => useViewsOverYears( 'average' ), { wrapper } );

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );

		expect( mockApiFetch ).toHaveBeenCalledTimes( 2 );
		const path = String( mockApiFetch.mock.calls[ 1 ][ 0 ].path );
		expect( path ).toMatch( /unit=day/ );
		expect( path ).toMatch( /start_date=2025-11-01/ );
		expect( path ).toMatch( /date=2025-11-30/ );

		// Nov 24 through Nov 30: 300 / 7.
		expect( result.current.rows[ 1 ].months.slice( 10 ) ).toEqual( [ 43, 20 ] );
		expect( result.current.lifeStartsAt?.toISOString() ).toBe( '2025-11-24T00:00:00.000Z' );
	} );

	it( 'reads the first day on the site calendar', async () => {
		const settings = getSettings();
		setSettings( {
			...settings,
			timezone: { string: 'Asia/Tokyo', offset: 9, offsetFormatted: '9', abbr: 'JST' },
		} );

		try {
			const { result } = renderHook( () => useViewsOverYears( 'average' ), { wrapper } );

			await waitFor( () => expect( result.current.isLoading ).toBe( false ) );

			expect( result.current.rows[ 1 ].months.slice( 10 ) ).toEqual( [ 43, 20 ] );
			expect( result.current.lifeStartsAt?.toISOString() ).toBe( '2025-11-23T15:00:00.000Z' );
		} finally {
			setSettings( settings );
		}
	} );

	it( 'cuts the day request at today when the first month is the current one', async () => {
		mockApiFetch.mockImplementation( async options =>
			isDayRequest( options )
				? { date: '2026-03-15', unit: 'day', fields: [ 'period', 'views' ], data: [] }
				: { ...VISITS_RESPONSE, data: [ [ '2026-03', 450 ] ] }
		);
		const { result } = renderHook( () => useViewsOverYears( 'average' ), { wrapper } );

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );

		const path = String( mockApiFetch.mock.calls[ 1 ][ 0 ].path );
		expect( path ).toMatch( /start_date=2026-03-01/ );
		expect( path ).toMatch( /date=2026-03-15/ );
		expect( result.current.rows[ 0 ].months[ 2 ] ).toBe( 30 );
	} );

	it( 'switches to the per-day averages without refetching', async () => {
		const { result, rerender } = renderHook(
			( { metric }: { metric: 'total' | 'average' } ) => useViewsOverYears( metric ),
			{ wrapper, initialProps: { metric: 'total' } }
		);

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );

		rerender( { metric: 'average' } );

		expect( result.current.rows[ 0 ].months.slice( 0, 3 ) ).toEqual( [ 5, 0, 30 ] );
		expect( mockApiFetch ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'divides the first month whole and starts the life on its first day when the day request fails', async () => {
		// A 403 is not retried, so the fallback is reached at once.
		mockApiFetch.mockImplementation( async options => {
			if ( isDayRequest( options ) ) {
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

	it( 'keeps the rows on screen while a failed day request is retried on focus', async () => {
		let dayRequests = 0;
		let resolveRetry: ( value: unknown ) => void = () => {};
		mockApiFetch.mockImplementation( options => {
			if ( ! isDayRequest( options ) ) {
				return Promise.resolve( VISITS_RESPONSE );
			}

			// The first attempt fails for good; the focus retry stays in flight.
			return ++dayRequests === 1
				? Promise.reject( { code: 'unauthorized', message: 'Nope.', status: 403 } )
				: new Promise( resolve => {
						resolveRetry = resolve;
				  } );
		} );
		const { result } = renderHook( () => useViewsOverYears( 'average' ), { wrapper } );

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
		expect( dayRequests ).toBe( 1 );

		act( () => {
			window.dispatchEvent( new Event( 'visibilitychange' ) );
			window.dispatchEvent( new Event( 'focus' ) );
		} );

		await waitFor( () => expect( dayRequests ).toBe( 2 ) );
		expect( result.current.isLoading ).toBe( false );
		expect( result.current.rows[ 1 ].months.slice( 10 ) ).toEqual( [ 10, 20 ] );

		resolveRetry( FIRST_MONTH_RESPONSE );

		await waitFor( () =>
			expect( result.current.rows[ 1 ].months.slice( 10 ) ).toEqual( [ 43, 20 ] )
		);
	} );

	it( 'draws the totals before the first day is known, and marks them busy', async () => {
		mockApiFetch.mockImplementation( options =>
			isDayRequest( options ) ? new Promise( () => {} ) : Promise.resolve( VISITS_RESPONSE )
		);
		const { result } = renderHook( () => useViewsOverYears( 'total' ), { wrapper } );

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );

		expect( result.current.rows[ 1 ].months.slice( 10 ) ).toEqual( [ 300, 620 ] );
		expect( result.current.isFetching ).toBe( true );
	} );

	it( 'keeps loading until the first day is known', async () => {
		let resolveDays: ( value: unknown ) => void = () => {};
		mockApiFetch.mockImplementation( options =>
			isDayRequest( options )
				? new Promise( resolve => {
						resolveDays = resolve;
				  } )
				: Promise.resolve( VISITS_RESPONSE )
		);
		const { result } = renderHook( () => useViewsOverYears( 'average' ), { wrapper } );

		await waitFor( () => expect( result.current.rows ).toHaveLength( 2 ) );
		expect( result.current.isLoading ).toBe( true );

		resolveDays( FIRST_MONTH_RESPONSE );

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
		expect( mockApiFetch ).toHaveBeenCalledTimes( 1 );
	} );
} );
