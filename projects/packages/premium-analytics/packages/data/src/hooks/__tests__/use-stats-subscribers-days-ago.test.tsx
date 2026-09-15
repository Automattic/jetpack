/**
 * External dependencies
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { getSettings, setSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import { useStatsSubscribersDaysAgo } from '../use-stats-subscribers';
import type { ReactNode } from 'react';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

const mockApiFetch = apiFetch as unknown as jest.Mock;

const queryClient = new QueryClient( {
	defaultOptions: { queries: { retry: false } },
} );

function wrapper( { children }: { children: ReactNode } ) {
	return <QueryClientProvider client={ queryClient }>{ children }</QueryClientProvider>;
}

function requestedDate( call: [ { path: string } ] ) {
	return new URL( call[ 0 ].path, 'https://example.test' ).searchParams.get( 'date' );
}

function subscribersOn( counts: Record< string, number > ) {
	return ( { path }: { path: string } ) => {
		const date = new URL( path, 'https://example.test' ).searchParams.get( 'date' ) ?? '';
		return Promise.resolve( {
			date,
			unit: 'day',
			fields: [ 'period', 'subscribers', 'subscribers_paid' ],
			data: date in counts ? [ [ date, counts[ date ], 0 ] ] : [],
		} );
	};
}

describe( 'useStatsSubscribersDaysAgo', () => {
	const originalSettings = getSettings();

	beforeAll( () => {
		setSettings( {
			...originalSettings,
			timezone: { ...originalSettings.timezone, offset: -7, string: 'America/Los_Angeles' },
		} );
	} );

	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
		// Already the 15th in UTC, still the 14th on the site.
		jest.useFakeTimers( { now: new Date( '2026-09-15T02:00:00Z' ), advanceTimers: true } );
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	afterAll( () => {
		setSettings( originalSettings );
	} );

	it( 'asks for one day of subscribers per offset, counted back from the site-local today', async () => {
		mockApiFetch.mockImplementation( subscribersOn( {} ) );

		renderHook( () => useStatsSubscribersDaysAgo( [ 30, 60, 90 ] ), { wrapper } );

		await waitFor( () => expect( mockApiFetch ).toHaveBeenCalledTimes( 3 ) );
		expect( mockApiFetch.mock.calls.map( requestedDate ) ).toEqual( [
			'2026-08-15',
			'2026-07-16',
			'2026-06-16',
		] );
		expect( mockApiFetch.mock.calls[ 0 ][ 0 ].path ).toContain( 'stats/subscribers' );
		expect( mockApiFetch.mock.calls[ 0 ][ 0 ].path ).toContain( 'quantity=1' );
	} );

	it( 'returns the counts in offset order, leaving a day with no point undefined', async () => {
		mockApiFetch.mockImplementation( subscribersOn( { '2026-08-15': 412, '2026-06-16': 0 } ) );

		const { result } = renderHook( () => useStatsSubscribersDaysAgo( [ 30, 60, 90 ] ), {
			wrapper,
		} );

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
		expect( result.current.counts ).toEqual( [ 412, undefined, 0 ] );
		expect( result.current.isError ).toBe( false );
	} );

	it( 'reports an error when any day fails', async () => {
		mockApiFetch.mockImplementation( ( request: { path: string } ) =>
			request.path.includes( '2026-07-16' )
				? Promise.reject( { status: 500, message: 'Server error' } )
				: subscribersOn( { '2026-08-15': 412 } )( request )
		);

		const { result } = renderHook( () => useStatsSubscribersDaysAgo( [ 30, 60, 90 ] ), {
			wrapper,
		} );

		await waitFor( () => expect( result.current.isError ).toBe( true ) );
		expect( result.current.counts[ 0 ] ).toBe( 412 );
	} );
} );
