import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { createElement, type ReactNode } from 'react';
import { useBackupRuns } from '../use-backup-runs';
import type { RawBackupSize } from '../../data/api/backup-sizes';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
const mockedApiFetch = apiFetch as unknown as jest.Mock;

const CONNECTED = { isRegistered: true, hasConnectedOwner: true, isUserConnected: true };

let pages: RawBackupSize[][];

/**
 * Which pages of `/backups/sizes` have been requested, in order.
 *
 * @return Page numbers.
 */
function requestedPages(): number[] {
	return mockedApiFetch.mock.calls
		.map( ( [ options ] ) => ( options as { path?: string } )?.path ?? '' )
		.filter( path => path.includes( '/backups/sizes' ) )
		.map( path => Number( new URL( path, 'http://x' ).searchParams.get( 'page' ) ) );
}

/**
 * A backup row as the hook reads it, finishing 100 seconds after it started.
 *
 * @param backupPeriod - When the backup started.
 * @param isRewindable - False when WordPress.com has no record of the backup.
 * @return The row.
 */
function row( backupPeriod: number, isRewindable = true ) {
	return { rewindId: String( backupPeriod + 100 ), backupPeriod, isRewindable };
}

/**
 * A client this test can watch for in-flight requests.
 *
 * @return The client and a wrapper providing it.
 */
function setup() {
	const client = new QueryClient( { defaultOptions: { queries: { retry: false } } } );
	const wrapper = ( { children }: { children: ReactNode } ) =>
		createElement( QueryClientProvider, { client }, children );
	return { client, wrapper };
}

beforeEach( () => {
	// Newest first, as v3 pages them.
	pages = [
		[
			{ period: 300, size: 3 },
			{ period: 200, size: 2 },
		],
		[ { period: 100, size: 1 } ],
		[ { period: 50, size: 5 } ],
	];
	mockedApiFetch.mockReset();
	mockedApiFetch.mockImplementation( ( { path }: { path: string } ) => {
		const page = Number( new URL( path, 'http://x' ).searchParams.get( 'page' ) );
		return Promise.resolve( { totalPages: pages.length, backups: pages[ page - 1 ] } );
	} );
	window.JP_CONNECTION_INITIAL_STATE = {
		connectionStatus: CONNECTED,
	} as unknown as typeof window.JP_CONNECTION_INITIAL_STATE;
} );

describe( 'useBackupRuns', () => {
	it.each( [
		[ 'stops at the page that reaches the oldest row', row( 100 ), [ 1, 2 ] ],
		[ 'stops at the last page when none reaches it', row( 10 ), [ 1, 2, 3 ] ],
		[ 'does not page for a row whose backup has no record', row( 10, false ), [ 1 ] ],
	] )( '%s', async ( _, oldest, expected ) => {
		const { client, wrapper } = setup();
		renderHook( () => useBackupRuns( [ row( 200 ), oldest ] ), { wrapper } );

		await waitFor( () => expect( requestedPages() ).toEqual( expected ) );
		await waitFor( () => expect( client.isFetching() ).toBe( 0 ) );
		expect( requestedPages() ).toEqual( expected );
	} );

	it( 'refetches when a row newer than the sizes appears', async () => {
		const { client, wrapper } = setup();
		const { result, rerender } = renderHook( ( { rows } ) => useBackupRuns( rows ), {
			initialProps: { rows: [ row( 200 ) ] },
			wrapper,
		} );
		await waitFor( () => expect( requestedPages() ).toEqual( [ 1 ] ) );

		pages[ 0 ] = [ { period: 1400, size: 14 }, ...pages[ 0 ] ];
		rerender( { rows: [ row( 1400 ), row( 200 ) ] } );

		await waitFor( () =>
			expect( result.current( row( 1400 ) ) ).toEqual( {
				siteSize: 14,
				duration: 100,
			} )
		);
		await waitFor( () => expect( client.isFetching() ).toBe( 0 ) );
		expect( requestedPages() ).toEqual( [ 1, 1 ] );
	} );

	it( 'does not refetch for a newest row another caller already loaded', async () => {
		const { client, wrapper } = setup();
		renderHook( () => useBackupRuns( [ row( 100 ) ] ), { wrapper } );
		await waitFor( () => expect( requestedPages() ).toEqual( [ 1, 2 ] ) );
		await waitFor( () => expect( client.isFetching() ).toBe( 0 ) );

		const { result } = renderHook( () => useBackupRuns( [ row( 300 ), row( 200 ) ] ), {
			wrapper,
		} );

		expect( result.current( row( 300 ) ) ).toEqual( { siteSize: 3, duration: 100 } );
		await waitFor( () => expect( client.isFetching() ).toBe( 0 ) );
		expect( requestedPages() ).toEqual( [ 1, 2 ] );
	} );

	it( 'does not retry a refetch that failed', async () => {
		const { client, wrapper } = setup();
		const { rerender } = renderHook( ( { rows } ) => useBackupRuns( rows ), {
			initialProps: { rows: [ row( 200 ) ] },
			wrapper,
		} );
		await waitFor( () => expect( requestedPages() ).toEqual( [ 1 ] ) );

		mockedApiFetch.mockRejectedValue( new Error( 'WordPress.com is down' ) );
		rerender( { rows: [ row( 1400 ), row( 200 ) ] } );

		await waitFor( () => expect( requestedPages() ).toEqual( [ 1, 1 ] ) );
		await waitFor( () => expect( client.isFetching() ).toBe( 0 ) );
		expect( requestedPages() ).toEqual( [ 1, 1 ] );
	} );

	it( 'tries again once the rows change after a failure', async () => {
		const { client, wrapper } = setup();
		const { rerender } = renderHook( ( { rows } ) => useBackupRuns( rows ), {
			initialProps: { rows: [ row( 200 ) ] },
			wrapper,
		} );
		await waitFor( () => expect( requestedPages() ).toEqual( [ 1 ] ) );

		const answer = mockedApiFetch.getMockImplementation();
		mockedApiFetch.mockRejectedValue( new Error( 'WordPress.com is down' ) );
		rerender( { rows: [ row( 1400 ), row( 200 ) ] } );
		await waitFor( () => expect( requestedPages() ).toEqual( [ 1, 1 ] ) );
		await waitFor( () => expect( client.isFetching() ).toBe( 0 ) );

		mockedApiFetch.mockImplementation( answer );
		rerender( { rows: [ row( 1400 ), row( 200 ), row( 100 ) ] } );

		await waitFor( () => expect( requestedPages() ).toEqual( [ 1, 1, 1, 2 ] ) );
	} );
} );
