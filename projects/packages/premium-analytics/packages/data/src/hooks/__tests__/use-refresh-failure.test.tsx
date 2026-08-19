/**
 * External dependencies
 */
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useRefreshFailure } from '../use-refresh-failure';
import type { ReactNode } from 'react';

function createWrapper( queryClient: QueryClient ) {
	return function Wrapper( { children }: { children: ReactNode } ) {
		return <QueryClientProvider client={ queryClient }>{ children }</QueryClientProvider>;
	};
}

/**
 * Mounts a widget-like query alongside the hook, so the assertions run against
 * real query transitions rather than a pinned state.
 */
function useProbe( queryFn: () => Promise< unknown > ) {
	const query = useQuery( { queryKey: [ 'probe' ], queryFn, retry: false } );

	return { query, failure: useRefreshFailure() };
}

function renderProbe( queryFn: () => Promise< unknown > ) {
	const queryClient = new QueryClient( { defaultOptions: { queries: { retry: false } } } );

	return renderHook( () => useProbe( queryFn ), { wrapper: createWrapper( queryClient ) } );
}

describe( 'useRefreshFailure', () => {
	it( 'reports no failure while queries succeed', async () => {
		const { result } = renderProbe( () => Promise.resolve( { views: 1 } ) );

		await waitFor( () => expect( result.current.query.isSuccess ).toBe( true ) );

		expect( result.current.failure.hasStaleData ).toBe( false );
		expect( result.current.failure.dataUpdatedAt ).toBeUndefined();
	} );

	it( 'reports the retained data when a refresh fails', async () => {
		const queryFn = jest
			.fn< Promise< unknown >, [] >()
			.mockResolvedValueOnce( { views: 1 } )
			.mockRejectedValue( { status: 500 } );
		const { result } = renderProbe( queryFn );

		await waitFor( () => expect( result.current.query.isSuccess ).toBe( true ) );
		const fetchedAt = result.current.query.dataUpdatedAt;

		await act( async () => {
			await result.current.query.refetch();
		} );

		expect( result.current.query.data ).toEqual( { views: 1 } );
		expect( result.current.failure ).toMatchObject( {
			hasStaleData: true,
			dataUpdatedAt: fetchedAt,
			canRetry: true,
		} );
	} );

	it( 'stays quiet when the first load fails, which the widget reports itself', async () => {
		const { result } = renderProbe( () => Promise.reject( { status: 500 } ) );

		await waitFor( () => expect( result.current.query.isError ).toBe( true ) );

		expect( result.current.failure.hasStaleData ).toBe( false );
	} );

	it( 'offers no retry when the failure is a permission error', async () => {
		const queryFn = jest
			.fn< Promise< unknown >, [] >()
			.mockResolvedValueOnce( { views: 1 } )
			.mockRejectedValue( { status: 403 } );
		const { result } = renderProbe( queryFn );

		await waitFor( () => expect( result.current.query.isSuccess ).toBe( true ) );
		await act( async () => {
			await result.current.query.refetch();
		} );

		expect( result.current.failure ).toMatchObject( { hasStaleData: true, canRetry: false } );
	} );

	it( 'clears itself once a retry succeeds', async () => {
		const queryFn = jest
			.fn< Promise< unknown >, [] >()
			.mockResolvedValueOnce( { views: 1 } )
			.mockRejectedValueOnce( { status: 500 } )
			.mockResolvedValue( { views: 2 } );
		const { result } = renderProbe( queryFn );

		await waitFor( () => expect( result.current.query.isSuccess ).toBe( true ) );
		await act( async () => {
			await result.current.query.refetch();
		} );
		expect( result.current.failure.hasStaleData ).toBe( true );

		await act( async () => {
			result.current.failure.retry();
		} );

		await waitFor( () => expect( result.current.failure.hasStaleData ).toBe( false ) );
		expect( result.current.query.data ).toEqual( { views: 2 } );
	} );
} );
