/**
 * External dependencies
 */
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { REFRESH_NOTICE_META } from '../refresh-failure-scope';
import { useRefreshFailure } from '../use-refresh-failure';
import type { ReactNode } from 'react';

function createWrapper( queryClient: QueryClient ) {
	return function Wrapper( { children }: { children: ReactNode } ) {
		return <QueryClientProvider client={ queryClient }>{ children }</QueryClientProvider>;
	};
}

function createClient() {
	return new QueryClient( { defaultOptions: { queries: { retry: false } } } );
}

/**
 * A fetcher that succeeds once and then fails, which is the shape of every
 * failed refresh: data lands, then the refetch behind it does not.
 */
function succeedsThenFails( error: unknown ) {
	return jest
		.fn< Promise< unknown >, [] >()
		.mockResolvedValueOnce( { views: 1 } )
		.mockRejectedValue( error );
}

/**
 * Mounts a widget-like query alongside the hook, so the assertions run against
 * real query transitions rather than a pinned state.
 */
function useProbe( queryFn: () => Promise< unknown >, enabled = true ) {
	const query = useQuery( {
		queryKey: [ 'probe' ],
		queryFn,
		retry: false,
		enabled,
		meta: REFRESH_NOTICE_META,
	} );

	return { query, failure: useRefreshFailure() };
}

function renderProbe( queryFn: () => Promise< unknown > ) {
	return renderHook( () => useProbe( queryFn ), { wrapper: createWrapper( createClient() ) } );
}

describe( 'useRefreshFailure', () => {
	it( 'reports no failure while queries succeed', async () => {
		const { result } = renderProbe( () => Promise.resolve( { views: 1 } ) );

		await waitFor( () => expect( result.current.query.isSuccess ).toBe( true ) );

		expect( result.current.failure.hasStaleData ).toBe( false );
	} );

	it( 'reports the retained data when a refresh fails', async () => {
		const { result } = renderProbe( succeedsThenFails( { status: 500 } ) );

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
			isRetrying: false,
		} );
	} );

	it( 'stays quiet when the first load fails, which the widget reports itself', async () => {
		const { result } = renderProbe( () => Promise.reject( { status: 500 } ) );

		await waitFor( () => expect( result.current.query.isError ).toBe( true ) );

		expect( result.current.failure.hasStaleData ).toBe( false );
	} );

	it( 'ignores a failure from a query nothing on screen reads numbers from', async () => {
		const queryClient = createClient();
		const queryFn = succeedsThenFails( { status: 500 } );
		const { result } = renderHook(
			() => {
				// No `meta`: a product thumbnail or a settings read, whose failure
				// says nothing about the figures the reader is looking at.
				const query = useQuery( { queryKey: [ 'unscoped' ], queryFn, retry: false } );
				return { query, failure: useRefreshFailure() };
			},
			{ wrapper: createWrapper( queryClient ) }
		);

		await waitFor( () => expect( result.current.query.isSuccess ).toBe( true ) );
		await act( async () => {
			await result.current.query.refetch();
		} );

		await waitFor( () => expect( result.current.query.isError ).toBe( true ) );
		expect( result.current.failure.hasStaleData ).toBe( false );
	} );

	it( 'ignores a failure Retry could not reach, because the query is disabled', async () => {
		const queryClient = createClient();
		const queryFn = succeedsThenFails( { status: 500 } );
		const { result, rerender } = renderHook(
			( { enabled }: { enabled: boolean } ) => useProbe( queryFn, enabled ),
			{ wrapper: createWrapper( queryClient ), initialProps: { enabled: true } }
		);

		await waitFor( () => expect( result.current.query.isSuccess ).toBe( true ) );
		await act( async () => {
			await result.current.query.refetch();
		} );
		expect( result.current.failure.hasStaleData ).toBe( true );

		// The reader switches a control off — the observer stays, `enabled` does not.
		// `refetchQueries` skips disabled queries, so counting this one would leave
		// a notice no Retry can clear.
		rerender( { enabled: false } );

		expect( result.current.failure.hasStaleData ).toBe( false );
	} );

	it( 'names the oldest data still on screen when two queries fail', async () => {
		const queryClient = createClient();
		// Seeded rather than fetched: two real fetches race, and both would stamp
		// whatever `Date.now()` returned last. These are the ages the reader sees.
		queryClient.setQueryData( [ 'older' ], { views: 1 }, { updatedAt: 1_000 } );
		queryClient.setQueryData( [ 'newer' ], { views: 2 }, { updatedAt: 9_000 } );

		const failing = () => Promise.reject( { status: 500 } );
		const { result } = renderHook(
			() => {
				useQuery( {
					queryKey: [ 'older' ],
					queryFn: failing,
					retry: false,
					meta: REFRESH_NOTICE_META,
				} );
				useQuery( {
					queryKey: [ 'newer' ],
					queryFn: failing,
					retry: false,
					meta: REFRESH_NOTICE_META,
				} );
				return useRefreshFailure();
			},
			{ wrapper: createWrapper( queryClient ) }
		);

		// Mounting revalidates the seeded data; both refreshes fail and keep it.
		await waitFor( () => expect( result.current.hasStaleData ).toBe( true ) );

		expect( result.current ).toMatchObject( { dataUpdatedAt: 1_000 } );
	} );

	it.each( [
		[ 'retryable first', { status: 500 }, { status: 403 } ],
		[ 'retryable last', { status: 403 }, { status: 500 } ],
	] )( 'keeps the retry when any failure is retryable (%s)', async ( _label, first, second ) => {
		const queryClient = createClient();
		const a = succeedsThenFails( first );
		const b = succeedsThenFails( second );
		const { result } = renderHook(
			() => {
				useQuery( { queryKey: [ 'a' ], queryFn: a, retry: false, meta: REFRESH_NOTICE_META } );
				useQuery( { queryKey: [ 'b' ], queryFn: b, retry: false, meta: REFRESH_NOTICE_META } );
				return useRefreshFailure();
			},
			{ wrapper: createWrapper( queryClient ) }
		);

		await waitFor( () => expect( queryClient.getQueryData( [ 'b' ] ) ).toBeDefined() );
		await act( async () => {
			await queryClient.refetchQueries();
		} );

		expect( result.current ).toMatchObject( { hasStaleData: true, canRetry: true } );
	} );

	it( 'offers no retry when the failure is a permission error', async () => {
		const { result } = renderProbe( succeedsThenFails( { status: 403 } ) );

		await waitFor( () => expect( result.current.query.isSuccess ).toBe( true ) );
		await act( async () => {
			await result.current.query.refetch();
		} );

		expect( result.current.failure ).toMatchObject( { hasStaleData: true, canRetry: false } );
	} );

	it( 'keeps the retry for a broken connection, which reconnecting can heal', async () => {
		const { result } = renderProbe( succeedsThenFails( { status: 403, error: 'no_connection' } ) );

		await waitFor( () => expect( result.current.query.isSuccess ).toBe( true ) );
		await act( async () => {
			await result.current.query.refetch();
		} );

		expect( result.current.failure ).toMatchObject( { hasStaleData: true, canRetry: true } );
	} );

	it( 'drops the retry when the same stale data starts failing on permissions', async () => {
		const queryFn = jest
			.fn< Promise< unknown >, [] >()
			.mockResolvedValueOnce( { views: 1 } )
			.mockRejectedValueOnce( { status: 500 } )
			.mockRejectedValue( { status: 403 } );
		const { result } = renderProbe( queryFn );

		await waitFor( () => expect( result.current.query.isSuccess ).toBe( true ) );
		await act( async () => {
			await result.current.query.refetch();
		} );
		const staleAt = result.current.failure.hasStaleData
			? result.current.failure.dataUpdatedAt
			: undefined;
		expect( result.current.failure ).toMatchObject( { canRetry: true } );

		await act( async () => {
			result.current.failure.retry();
		} );

		// Same data, same age — only the reason it is stuck changed.
		await waitFor( () => expect( result.current.failure ).toMatchObject( { canRetry: false } ) );
		expect( result.current.failure ).toMatchObject( { dataUpdatedAt: staleAt } );
	} );

	it( 'stays on screen when the retry fails again', async () => {
		const { result } = renderProbe( succeedsThenFails( { status: 500 } ) );

		await waitFor( () => expect( result.current.query.isSuccess ).toBe( true ) );
		await act( async () => {
			await result.current.query.refetch();
		} );
		const staleAt = result.current.failure.hasStaleData
			? result.current.failure.dataUpdatedAt
			: undefined;

		await act( async () => {
			result.current.failure.retry();
		} );

		expect( result.current.failure ).toMatchObject( {
			hasStaleData: true,
			dataUpdatedAt: staleAt,
			isRetrying: false,
		} );
		expect( result.current.query.data ).toEqual( { views: 1 } );
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
