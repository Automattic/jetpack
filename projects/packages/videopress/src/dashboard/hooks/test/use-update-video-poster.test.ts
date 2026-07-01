import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { createElement, type ReactNode } from 'react';
import { LIBRARY_QUERY_KEY } from '../use-library';
import {
	useUpdateVideoPoster,
	POSTER_POLL_INTERVAL_MS,
	POSTER_POLL_MAX_ATTEMPTS,
} from '../use-update-video-poster';

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

const mockedApiFetch = apiFetch as unknown as jest.Mock;

/**
 * Create an isolated QueryClient, spies on its invalidateQueries and setQueryData
 * methods, and a React wrapper component for renderHook.
 *
 * @return An object containing the client, wrapper component, invalidateSpy, and setQueryDataSpy.
 */
function makeWrapper() {
	const client = new QueryClient( {
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	} );
	const invalidateSpy = jest.spyOn( client, 'invalidateQueries' );
	const setQueryDataSpy = jest.spyOn( client, 'setQueryData' );
	const wrapper = ( { children }: { children: ReactNode } ) =>
		createElement( QueryClientProvider, { client }, children );
	return { client, wrapper, invalidateSpy, setQueryDataSpy };
}

afterEach( () => {
	jest.useRealTimers();
	mockedApiFetch.mockReset();
} );

describe( 'useUpdateVideoPoster — exported constants', () => {
	it( 'exports POSTER_POLL_INTERVAL_MS and POSTER_POLL_MAX_ATTEMPTS', () => {
		expect( POSTER_POLL_INTERVAL_MS ).toBe( 2000 );
		expect( POSTER_POLL_MAX_ATTEMPTS ).toBe( 30 );
	} );
} );

describe( 'useUpdateVideoPoster — POST body', () => {
	it( 'sends frame-mode POST body to the guid-scoped poster endpoint', async () => {
		mockedApiFetch.mockResolvedValueOnce( {
			data: { generating: false, poster: 'https://x/scrubthumb-1.jpg' },
		} );
		const { wrapper } = makeWrapper();
		const { result } = renderHook( () => useUpdateVideoPoster(), { wrapper } );

		await act( async () => {
			await result.current.mutateAsync( {
				id: '42',
				guid: 'abc123',
				source: 'frame',
				atTimeMs: 4200,
			} );
		} );

		expect( mockedApiFetch ).toHaveBeenCalledWith( {
			path: '/wpcom/v2/videopress/abc123/poster',
			method: 'POST',
			data: { at_time: 4200, is_millisec: true },
		} );
	} );

	it( 'sends attachment-mode POST body', async () => {
		mockedApiFetch.mockResolvedValueOnce( {
			data: { generating: false, poster: 'https://x/scrubthumb-1.jpg' },
		} );
		const { wrapper } = makeWrapper();
		const { result } = renderHook( () => useUpdateVideoPoster(), { wrapper } );

		await act( async () => {
			await result.current.mutateAsync( {
				id: '42',
				guid: 'abc123',
				source: 'attachment',
				attachmentId: 17,
			} );
		} );

		expect( mockedApiFetch ).toHaveBeenCalledWith( {
			path: '/wpcom/v2/videopress/abc123/poster',
			method: 'POST',
			data: { poster_attachment_id: 17 },
		} );
	} );
} );

describe( 'useUpdateVideoPoster — immediate (no generating)', () => {
	it( 'skips polling, persists meta, and updates the cache when generating is false', async () => {
		// POST resolves immediately with no generation needed.
		mockedApiFetch
			.mockResolvedValueOnce( { data: { generating: false, poster: 'P1' } } ) // POST /poster
			.mockResolvedValueOnce( {} ); // POST /meta

		const { wrapper, invalidateSpy, setQueryDataSpy } = makeWrapper();
		const { result } = renderHook( () => useUpdateVideoPoster(), { wrapper } );

		await act( async () => {
			await result.current.mutateAsync( {
				id: '42',
				guid: 'abc123',
				source: 'frame',
				atTimeMs: 1000,
			} );
		} );

		await waitFor( () => expect( result.current.isSuccess ).toBe( true ) );

		// No GET poll should have happened.
		const getCalls = mockedApiFetch.mock.calls.filter( ( [ opts ] ) => opts?.method === 'GET' );
		expect( getCalls ).toHaveLength( 0 );

		// Meta POST should have been called with the poster URL.
		expect( mockedApiFetch ).toHaveBeenCalledWith( {
			path: '/wpcom/v2/videopress/meta',
			method: 'POST',
			data: { id: 42, poster: 'P1' },
		} );

		// setQueryData should have updated the item's thumbnailUrl.
		expect( setQueryDataSpy ).toHaveBeenCalledWith(
			[ LIBRARY_QUERY_KEY, 'item', '42' ],
			expect.any( Function )
		);

		// Library list should be invalidated.
		expect( invalidateSpy ).toHaveBeenCalledWith( {
			queryKey: [ LIBRARY_QUERY_KEY ],
		} );

		// The item key should NOT have been separately invalidated.
		expect( invalidateSpy ).not.toHaveBeenCalledWith( {
			queryKey: [ LIBRARY_QUERY_KEY, 'item', '42' ],
		} );
	} );
} );

describe( 'useUpdateVideoPoster — polling until generated', () => {
	it( 'polls the GET endpoint and persists the final poster URL', async () => {
		jest.useFakeTimers();

		// POST returns generating:true, then two GETs: first still generating,
		// second returns the final poster URL.
		mockedApiFetch
			.mockResolvedValueOnce( { data: { generating: true } } ) // POST /poster
			.mockResolvedValueOnce( { data: { generating: true } } ) // GET poll 1
			.mockResolvedValueOnce( { data: { generating: false, poster: 'P2' } } ) // GET poll 2
			.mockResolvedValueOnce( {} ); // POST /meta

		const { wrapper, setQueryDataSpy } = makeWrapper();
		const { result } = renderHook( () => useUpdateVideoPoster(), { wrapper } );

		let mutationPromise: Promise< { poster?: string } >;
		act( () => {
			mutationPromise = result.current.mutateAsync( {
				id: '42',
				guid: 'abc123',
				source: 'frame',
				atTimeMs: 1000,
			} );
		} );

		// Advance past the first sleep (triggers poll 1 → still generating).
		await act( async () => {
			await jest.advanceTimersByTimeAsync( POSTER_POLL_INTERVAL_MS );
		} );

		// Advance past the second sleep (triggers poll 2 → done).
		await act( async () => {
			await jest.advanceTimersByTimeAsync( POSTER_POLL_INTERVAL_MS );
		} );

		// Let the meta POST and onSuccess run.
		await act( async () => {
			await mutationPromise;
		} );

		// GET calls should have been made.
		const getCalls = mockedApiFetch.mock.calls.filter( ( [ opts ] ) => opts?.method === 'GET' );
		expect( getCalls ).toHaveLength( 2 );
		expect( getCalls[ 0 ][ 0 ] ).toMatchObject( {
			path: '/wpcom/v2/videopress/abc123/poster',
			method: 'GET',
		} );

		// Meta POST should reference the final poster.
		expect( mockedApiFetch ).toHaveBeenCalledWith( {
			path: '/wpcom/v2/videopress/meta',
			method: 'POST',
			data: { id: 42, poster: 'P2' },
		} );

		// setQueryData should have updated thumbnailUrl to P2.
		expect( setQueryDataSpy ).toHaveBeenCalledWith(
			[ LIBRARY_QUERY_KEY, 'item', '42' ],
			expect.any( Function )
		);
	} );
} );

describe( 'useUpdateVideoPoster — setQueryData patches existing cached item only', () => {
	it( 'updates thumbnailUrl and preserves other fields in a pre-seeded cache entry', async () => {
		mockedApiFetch
			.mockResolvedValueOnce( { data: { generating: false, poster: 'NEW_POSTER' } } ) // POST /poster
			.mockResolvedValueOnce( {} ); // POST /meta

		const { client, wrapper } = makeWrapper();

		// Pre-seed a minimal cached item.
		const seedItem = { id: '42', thumbnailUrl: 'OLD', title: 'My video', isPrivate: false };
		client.setQueryData( [ LIBRARY_QUERY_KEY, 'item', '42' ], seedItem );

		const { result } = renderHook( () => useUpdateVideoPoster(), { wrapper } );

		await act( async () => {
			await result.current.mutateAsync( {
				id: '42',
				guid: 'abc123',
				source: 'frame',
				atTimeMs: 500,
			} );
		} );

		await waitFor( () => expect( result.current.isSuccess ).toBe( true ) );

		const cached = client.getQueryData< { thumbnailUrl: string; title: string } >( [
			LIBRARY_QUERY_KEY,
			'item',
			'42',
		] );
		expect( cached?.thumbnailUrl ).toBe( 'NEW_POSTER' );
		// Other fields are preserved.
		expect( cached?.title ).toBe( 'My video' );
	} );

	it( 'calls setQueryData but leaves the cache absent when no item is pre-seeded', async () => {
		mockedApiFetch
			.mockResolvedValueOnce( { data: { generating: false, poster: 'NEW_POSTER' } } )
			.mockResolvedValueOnce( {} );

		const { client, wrapper, setQueryDataSpy } = makeWrapper();
		// Clear spy counts from construction.
		setQueryDataSpy.mockClear();

		const { result } = renderHook( () => useUpdateVideoPoster(), { wrapper } );

		await act( async () => {
			await result.current.mutateAsync( {
				id: '99',
				guid: 'abc123',
				source: 'frame',
				atTimeMs: 500,
			} );
		} );

		await waitFor( () => expect( result.current.isSuccess ).toBe( true ) );

		// setQueryData was called but with no existing entry, the updater returns
		// `old` (undefined), so the key stays absent.
		const cached = client.getQueryData( [ LIBRARY_QUERY_KEY, 'item', '99' ] );
		expect( cached ).toBeUndefined();
	} );
} );

describe( 'useUpdateVideoPoster — poll exhaustion (max attempts reached)', () => {
	it( 'does not POST meta or patch the cache when all polls return generating:true, but still invalidates the list', async () => {
		jest.useFakeTimers();

		// POST returns generating:true; every subsequent GET also returns generating:true.
		mockedApiFetch.mockResolvedValueOnce( { data: { generating: true } } ); // POST /poster
		for ( let i = 0; i < POSTER_POLL_MAX_ATTEMPTS; i++ ) {
			mockedApiFetch.mockResolvedValueOnce( { data: { generating: true } } ); // GET poll
		}

		const { wrapper, invalidateSpy, setQueryDataSpy } = makeWrapper();
		setQueryDataSpy.mockClear();

		const { result } = renderHook( () => useUpdateVideoPoster(), { wrapper } );

		let mutationPromise: Promise< { poster?: string } >;
		act( () => {
			mutationPromise = result.current.mutateAsync( {
				id: '42',
				guid: 'abc123',
				source: 'frame',
				atTimeMs: 1000,
			} );
		} );

		// Drive all POSTER_POLL_MAX_ATTEMPTS polls.
		for ( let i = 0; i < POSTER_POLL_MAX_ATTEMPTS; i++ ) {
			await act( async () => {
				await jest.advanceTimersByTimeAsync( POSTER_POLL_INTERVAL_MS );
			} );
		}

		// Let the mutation finish.
		await act( async () => {
			await mutationPromise;
		} );

		await waitFor( () => expect( result.current.isSuccess ).toBe( true ) );

		// The meta endpoint should never have been called.
		const metaCalls = mockedApiFetch.mock.calls.filter(
			( [ opts ] ) => opts?.path === '/wpcom/v2/videopress/meta'
		);
		expect( metaCalls ).toHaveLength( 0 );

		// setQueryData should not have patched any thumbnail (no poster URL).
		expect( setQueryDataSpy ).not.toHaveBeenCalled();

		// The library list key should still be invalidated.
		expect( invalidateSpy ).toHaveBeenCalledWith( {
			queryKey: [ LIBRARY_QUERY_KEY ],
		} );
	} );
} );

describe( 'useUpdateVideoPoster — POST returns {} (no data field)', () => {
	it( 'skips polling, skips meta POST, resolves successfully, and still invalidates the list', async () => {
		// POST returns a bare {} — no data property at all.
		mockedApiFetch.mockResolvedValueOnce( {} );

		const { wrapper, invalidateSpy, setQueryDataSpy } = makeWrapper();
		setQueryDataSpy.mockClear();
		invalidateSpy.mockClear();

		const { result } = renderHook( () => useUpdateVideoPoster(), { wrapper } );

		await act( async () => {
			await result.current.mutateAsync( {
				id: '42',
				guid: 'abc123',
				source: 'frame',
				atTimeMs: 1000,
			} );
		} );

		await waitFor( () => expect( result.current.isSuccess ).toBe( true ) );

		// No GET poll should have occurred.
		const getCalls = mockedApiFetch.mock.calls.filter( ( [ opts ] ) => opts?.method === 'GET' );
		expect( getCalls ).toHaveLength( 0 );

		// No meta POST should have occurred.
		const metaCalls = mockedApiFetch.mock.calls.filter(
			( [ opts ] ) => opts?.path === '/wpcom/v2/videopress/meta'
		);
		expect( metaCalls ).toHaveLength( 0 );

		// setQueryData should not have been called (no poster to persist).
		expect( setQueryDataSpy ).not.toHaveBeenCalled();

		// The library list key should be invalidated regardless.
		expect( invalidateSpy ).toHaveBeenCalledWith( {
			queryKey: [ LIBRARY_QUERY_KEY ],
		} );
	} );
} );

describe( 'useUpdateVideoPoster — error path', () => {
	it( 'rejects and does not call setQueryData or invalidate on API error', async () => {
		mockedApiFetch.mockRejectedValueOnce( new Error( 'boom' ) );
		const { wrapper, invalidateSpy, setQueryDataSpy } = makeWrapper();
		// Clear spy counts from construction.
		invalidateSpy.mockClear();
		setQueryDataSpy.mockClear();

		const { result } = renderHook( () => useUpdateVideoPoster(), { wrapper } );

		await act( async () => {
			await expect(
				result.current.mutateAsync( {
					id: '42',
					guid: 'abc123',
					source: 'frame',
					atTimeMs: 1000,
				} )
			).rejects.toThrow( 'boom' );
		} );

		expect( setQueryDataSpy ).not.toHaveBeenCalled();
		expect( invalidateSpy ).not.toHaveBeenCalled();
	} );
} );
