import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import * as fetchers from '../fetchers';
import { SCAN_QUERY_PREFIX } from '../query-options';
import {
	useEnqueueScanMutation,
	useFixThreatsMutation,
	useIgnoreThreatMutation,
	useUnignoreThreatMutation,
} from '../use-threat-mutations';
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
 * Build a fresh QueryClient with retries disabled so success/error settle quickly.
 *
 * @return A new QueryClient instance.
 */
function freshClient(): QueryClient {
	return new QueryClient( {
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	} );
}

describe( 'threat mutations', () => {
	afterEach( () => jest.resetAllMocks() );

	it( 'useFixThreatsMutation invalidates SCAN_QUERY_PREFIX on success', async () => {
		( fetchers.fixThreats as jest.Mock ).mockResolvedValue( {
			ok: true,
			threats: { '1': { status: 'in_progress' } },
		} );
		const client = freshClient();
		const spy = jest.spyOn( client, 'invalidateQueries' );

		const { result } = renderHook( () => useFixThreatsMutation(), {
			wrapper: wrapper( client ),
		} );

		await act( async () => {
			await result.current.mutateAsync( [ 1 ] );
		} );

		await waitFor( () => expect( result.current.isSuccess ).toBe( true ) );
		expect( fetchers.fixThreats as jest.Mock ).toHaveBeenCalledWith( [ 1 ] );
		expect( spy ).toHaveBeenCalledWith( { queryKey: SCAN_QUERY_PREFIX } );
	} );

	it( 'useIgnoreThreatMutation invalidates SCAN_QUERY_PREFIX on success', async () => {
		( fetchers.ignoreThreat as jest.Mock ).mockResolvedValue( { ok: true } );
		const client = freshClient();
		const spy = jest.spyOn( client, 'invalidateQueries' );

		const { result } = renderHook( () => useIgnoreThreatMutation(), {
			wrapper: wrapper( client ),
		} );

		await act( async () => {
			await result.current.mutateAsync( 'threat-a' );
		} );

		await waitFor( () => expect( result.current.isSuccess ).toBe( true ) );
		expect( fetchers.ignoreThreat as jest.Mock ).toHaveBeenCalledWith( 'threat-a' );
		expect( spy ).toHaveBeenCalledWith( { queryKey: SCAN_QUERY_PREFIX } );
	} );

	it( 'useUnignoreThreatMutation invalidates SCAN_QUERY_PREFIX on success', async () => {
		( fetchers.unignoreThreat as jest.Mock ).mockResolvedValue( { ok: true } );
		const client = freshClient();
		const spy = jest.spyOn( client, 'invalidateQueries' );

		const { result } = renderHook( () => useUnignoreThreatMutation(), {
			wrapper: wrapper( client ),
		} );

		await act( async () => {
			await result.current.mutateAsync( 'threat-b' );
		} );

		await waitFor( () => expect( result.current.isSuccess ).toBe( true ) );
		expect( fetchers.unignoreThreat as jest.Mock ).toHaveBeenCalledWith( 'threat-b' );
		expect( spy ).toHaveBeenCalledWith( { queryKey: SCAN_QUERY_PREFIX } );
	} );

	it( 'useEnqueueScanMutation invalidates SCAN_QUERY_PREFIX on success', async () => {
		( fetchers.enqueueScan as jest.Mock ).mockResolvedValue( { success: true } );
		const client = freshClient();
		const spy = jest.spyOn( client, 'invalidateQueries' );

		const { result } = renderHook( () => useEnqueueScanMutation(), {
			wrapper: wrapper( client ),
		} );

		await act( async () => {
			await result.current.mutateAsync();
		} );

		await waitFor( () => expect( result.current.isSuccess ).toBe( true ) );
		expect( fetchers.enqueueScan as jest.Mock ).toHaveBeenCalledTimes( 1 );
		expect( spy ).toHaveBeenCalledWith( { queryKey: SCAN_QUERY_PREFIX } );
	} );

	it( 'does NOT invalidate SCAN_QUERY_PREFIX when the fixer fetch rejects', async () => {
		( fetchers.fixThreats as jest.Mock ).mockRejectedValue( new Error( 'boom' ) );
		const client = freshClient();
		const spy = jest.spyOn( client, 'invalidateQueries' );

		const { result } = renderHook( () => useFixThreatsMutation(), {
			wrapper: wrapper( client ),
		} );

		await act( async () => {
			await expect( result.current.mutateAsync( [ 1 ] ) ).rejects.toThrow( 'boom' );
		} );

		await waitFor( () => expect( result.current.isError ).toBe( true ) );
		expect( spy ).not.toHaveBeenCalledWith( { queryKey: SCAN_QUERY_PREFIX } );
	} );
} );
