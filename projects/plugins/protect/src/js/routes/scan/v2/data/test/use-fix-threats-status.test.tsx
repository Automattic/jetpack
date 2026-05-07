import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as fetchers from '../fetchers';
import { isFixComplete, useFixThreatsStatusQuery } from '../use-fix-threats-status';
import type { FixThreatsStatusResponse } from '../types';
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

describe( 'isFixComplete', () => {
	it( 'returns false when the response is undefined (no poll yet)', () => {
		expect( isFixComplete( undefined ) ).toBe( false );
	} );

	it( 'returns true when the threat map is empty (nothing to fix)', () => {
		const response: FixThreatsStatusResponse = { ok: true, threats: {} };
		expect( isFixComplete( response ) ).toBe( true );
	} );

	it( 'returns false while any threat is still in_progress', () => {
		const response: FixThreatsStatusResponse = {
			ok: true,
			threats: {
				a: { status: 'fixed' },
				b: { status: 'in_progress' },
			},
		};
		expect( isFixComplete( response ) ).toBe( false );
	} );

	it( 'returns true when every threat has reached a terminal status', () => {
		const response: FixThreatsStatusResponse = {
			ok: true,
			threats: {
				a: { status: 'fixed' },
				b: { status: 'not_fixed' },
				c: { status: 'not_found' },
			},
		};
		expect( isFixComplete( response ) ).toBe( true );
	} );

	it( 'tolerates an unexpected status string and treats it as non-terminal', () => {
		const response: FixThreatsStatusResponse = {
			ok: true,
			threats: {
				a: { status: 'fixed' },
				b: { status: 'queued_unknown' },
			},
		};
		expect( isFixComplete( response ) ).toBe( false );
	} );
} );

describe( 'useFixThreatsStatusQuery', () => {
	afterEach( () => jest.resetAllMocks() );

	it( 'is disabled when ids is null (no fetcher call)', () => {
		( fetchers.fetchFixThreatsStatus as jest.Mock ).mockResolvedValue( {
			ok: true,
			threats: {},
		} );

		const client = freshClient();
		const { result } = renderHook( () => useFixThreatsStatusQuery( null ), {
			wrapper: wrapper( client ),
		} );

		// Hook is disabled, so it stays idle without firing the fetcher.
		expect( result.current.fetchStatus ).toBe( 'idle' );
		expect( fetchers.fetchFixThreatsStatus as jest.Mock ).not.toHaveBeenCalled();
	} );

	it( 'is disabled when ids is empty (no fetcher call)', () => {
		( fetchers.fetchFixThreatsStatus as jest.Mock ).mockResolvedValue( {
			ok: true,
			threats: {},
		} );

		const client = freshClient();
		const { result } = renderHook( () => useFixThreatsStatusQuery( [] ), {
			wrapper: wrapper( client ),
		} );

		expect( result.current.fetchStatus ).toBe( 'idle' );
		expect( fetchers.fetchFixThreatsStatus as jest.Mock ).not.toHaveBeenCalled();
	} );

	it( 'fetches when ids is non-empty and resolves with the response', async () => {
		( fetchers.fetchFixThreatsStatus as jest.Mock ).mockResolvedValue( {
			ok: true,
			threats: { '1': { status: 'in_progress' } },
		} );

		const client = freshClient();
		const { result } = renderHook( () => useFixThreatsStatusQuery( [ '1' ] ), {
			wrapper: wrapper( client ),
		} );

		await waitFor( () => expect( result.current.isSuccess ).toBe( true ) );
		expect( fetchers.fetchFixThreatsStatus as jest.Mock ).toHaveBeenCalledWith( [ '1' ] );
		expect( result.current.data?.threats[ '1' ].status ).toBe( 'in_progress' );
	} );

	it( 'stops polling once isFixComplete returns true (refetchInterval=false on terminal data)', async () => {
		// Resolve straight to a terminal "fixed" state so `refetchInterval`
		// evaluates against terminal data and returns false (no further polling).
		( fetchers.fetchFixThreatsStatus as jest.Mock ).mockResolvedValue( {
			ok: true,
			threats: { '1': { status: 'fixed' } },
		} );

		const client = freshClient();
		const { result } = renderHook( () => useFixThreatsStatusQuery( [ '1' ] ), {
			wrapper: wrapper( client ),
		} );

		await waitFor( () => expect( result.current.isSuccess ).toBe( true ) );
		// The fetcher fires once for the initial query; with terminal data the
		// `refetchInterval` callback short-circuits to `false`, so no polling.
		expect( fetchers.fetchFixThreatsStatus as jest.Mock ).toHaveBeenCalledTimes( 1 );
		expect( isFixComplete( result.current.data ) ).toBe( true );
	} );
} );
