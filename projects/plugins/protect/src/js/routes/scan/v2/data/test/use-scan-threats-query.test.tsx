import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as fetchers from '../fetchers';
import { useScanThreatsQuery } from '../use-scan-threats-query';
import type { ReactNode } from 'react';

jest.mock( '../fetchers' );

/**
 * Build a `renderHook` wrapper that mounts children inside the given QueryClient.
 *
 * @param client - The QueryClient to provide.
 * @return Wrapper component for `renderHook`.
 */
function wrapper( client: QueryClient ) {
	return ( { children }: { children: ReactNode } ) => (
		<QueryClientProvider client={ client }>{ children }</QueryClientProvider>
	);
}

/**
 * Build a fresh QueryClient with retries disabled so error tests resolve fast.
 *
 * @return A new QueryClient instance.
 */
function freshClient(): QueryClient {
	return new QueryClient( { defaultOptions: { queries: { retry: false } } } );
}

describe( 'useScanThreatsQuery', () => {
	afterEach( () => jest.resetAllMocks() );

	it( 'merges active and history threats keyed by id', async () => {
		( fetchers.fetchSiteScan as jest.Mock ).mockResolvedValue( {
			state: 'idle',
			threats: [ { id: 'a', status: 'current', title: 'A' } ],
		} );
		( fetchers.fetchSiteScanHistory as jest.Mock ).mockResolvedValue( {
			threats: [ { id: 'b', status: 'fixed', title: 'B' } ],
		} );

		const client = freshClient();
		const { result } = renderHook( () => useScanThreatsQuery(), {
			wrapper: wrapper( client ),
		} );

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
		expect( result.current.data.map( t => t.id ) ).toEqual( [ 'a', 'b' ] );
		expect( result.current.activeError ).toBeNull();
		expect( result.current.historyError ).toBeNull();
	} );

	it( 'surfaces history error without blocking active rows', async () => {
		( fetchers.fetchSiteScan as jest.Mock ).mockResolvedValue( {
			state: 'idle',
			threats: [ { id: 'a', status: 'current', title: 'A' } ],
		} );
		( fetchers.fetchSiteScanHistory as jest.Mock ).mockRejectedValue( new Error( 'boom' ) );

		const client = freshClient();
		const { result } = renderHook( () => useScanThreatsQuery(), {
			wrapper: wrapper( client ),
		} );

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
		expect( result.current.data.map( t => t.id ) ).toEqual( [ 'a' ] );
		expect( result.current.historyError?.message ).toBe( 'boom' );
		expect( result.current.activeError ).toBeNull();
	} );

	it( 'returns the active error when the active query fails', async () => {
		( fetchers.fetchSiteScan as jest.Mock ).mockRejectedValue( new Error( 'down' ) );
		( fetchers.fetchSiteScanHistory as jest.Mock ).mockResolvedValue( { threats: [] } );

		const client = freshClient();
		const { result } = renderHook( () => useScanThreatsQuery(), {
			wrapper: wrapper( client ),
		} );

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
		expect( result.current.activeError?.message ).toBe( 'down' );
		expect( result.current.data ).toEqual( [] );
	} );

	it( 'dedupes overlapping threats by id, preferring active', async () => {
		( fetchers.fetchSiteScan as jest.Mock ).mockResolvedValue( {
			state: 'idle',
			threats: [ { id: 'x', status: 'current', title: 'Active X' } ],
		} );
		( fetchers.fetchSiteScanHistory as jest.Mock ).mockResolvedValue( {
			threats: [ { id: 'x', status: 'fixed', title: 'History X' } ],
		} );

		const client = freshClient();
		const { result } = renderHook( () => useScanThreatsQuery(), {
			wrapper: wrapper( client ),
		} );

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
		expect( result.current.data ).toHaveLength( 1 );
		expect( result.current.data[ 0 ].title ).toBe( 'Active X' );
	} );

	it( 'resolves with an empty array when both queries return empty arrays', async () => {
		( fetchers.fetchSiteScan as jest.Mock ).mockResolvedValue( {
			state: 'idle',
			threats: [],
		} );
		( fetchers.fetchSiteScanHistory as jest.Mock ).mockResolvedValue( { threats: [] } );

		const client = freshClient();
		const { result } = renderHook( () => useScanThreatsQuery(), {
			wrapper: wrapper( client ),
		} );

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
		expect( result.current.data ).toEqual( [] );
		expect( result.current.activeError ).toBeNull();
		expect( result.current.historyError ).toBeNull();
	} );

	it( 'reflects active rows during the active-before-history race, then merges once history resolves', async () => {
		// Active resolves immediately; history is delayed so we can observe the
		// "active-resolved, history-pending" intermediate state.
		( fetchers.fetchSiteScan as jest.Mock ).mockResolvedValue( {
			state: 'idle',
			threats: [ { id: 'a', status: 'current', title: 'Active A' } ],
		} );
		let resolveHistory: ( ( value: { threats: unknown[] } ) => void ) | undefined;
		( fetchers.fetchSiteScanHistory as jest.Mock ).mockImplementation(
			() =>
				new Promise( resolve => {
					resolveHistory = resolve;
				} )
		);

		const client = freshClient();
		const { result } = renderHook( () => useScanThreatsQuery(), {
			wrapper: wrapper( client ),
		} );

		// Intermediate state: active settled, history still pending — `data`
		// should already include the active row even though `isLoading` is true.
		await waitFor( () => expect( result.current.data.map( t => t.id ) ).toEqual( [ 'a' ] ) );
		expect( result.current.activeError ).toBeNull();

		// Now let history resolve and verify the merged shape.
		resolveHistory?.( {
			threats: [ { id: 'b', status: 'fixed', title: 'History B' } ],
		} );
		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
		expect( result.current.data.map( t => t.id ) ).toEqual( [ 'a', 'b' ] );
		expect( result.current.historyError ).toBeNull();
	} );
} );
