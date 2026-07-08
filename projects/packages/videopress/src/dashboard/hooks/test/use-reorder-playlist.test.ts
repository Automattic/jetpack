import { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { mockApiFetch } from '../../test-utils/mock-api-fetch';
import { createTestQueryClient, createTestWrapper } from '../../test-utils/query-client-wrapper';
import { useReorderPlaylist } from '../use-reorder-playlist';
import type { Playlist } from '../../types/playlist';

// Unlike createTestQueryClient(), retains cache entries: these tests seed
// detached queries (no mounted observers) and read them back around the
// mutation lifecycle, and a gcTime of 0 would garbage-collect them mid-test.
const createCacheRetainingClient = () =>
	new QueryClient( {
		defaultOptions: {
			queries: { retry: false, gcTime: Infinity, staleTime: Infinity },
			mutations: { retry: false },
		},
	} );

const playlist = ( id: number, order: number[] ): Playlist => ( {
	id,
	name: `Playlist ${ id }`,
	description: '',
	count: order.length,
	artworkId: null,
	order,
} );

const LIST_KEY = [ 'jetpack-videopress-playlists' ];
const itemKey = ( id: number ) => [ 'jetpack-videopress-playlists', 'item', String( id ) ];

describe( 'useReorderPlaylist', () => {
	it( 'POSTs the order meta and patches the item and list caches optimistically', async () => {
		let resolveRequest: ( value: unknown ) => void = () => {};
		const calls: { path?: string; method?: string; data?: unknown }[] = [];
		mockApiFetch( ( { path, method, data } ) => {
			calls.push( { path, method, data } );
			return new Promise( resolve => {
				resolveRequest = resolve;
			} );
		} );

		const client = createCacheRetainingClient();
		client.setQueryData( itemKey( 7 ), playlist( 7, [ 1, 2, 3 ] ) );
		client.setQueryData( LIST_KEY, [ playlist( 7, [ 1, 2, 3 ] ), playlist( 8, [ 9 ] ) ] );

		const { result } = renderHook( () => useReorderPlaylist(), {
			wrapper: createTestWrapper( client ),
		} );

		act( () => {
			result.current.mutate( { id: 7, order: [ 3, 1, 2 ] } );
		} );

		// The caches reflect the new order before the request settles.
		await waitFor( () =>
			expect( ( client.getQueryData( itemKey( 7 ) ) as Playlist ).order ).toEqual( [ 3, 1, 2 ] )
		);
		const list = client.getQueryData( LIST_KEY ) as Playlist[];
		expect( list[ 0 ].order ).toEqual( [ 3, 1, 2 ] );
		// Other playlists are untouched.
		expect( list[ 1 ].order ).toEqual( [ 9 ] );

		expect( calls[ 0 ] ).toEqual( {
			path: '/wp/v2/videopress-playlists/7',
			method: 'POST',
			data: { meta: { vps_playlist_order: [ 3, 1, 2 ] } },
		} );

		const invalidateSpy = jest.spyOn( client, 'invalidateQueries' );
		await act( async () => {
			resolveRequest( { id: 7, meta: { vps_playlist_order: [ 3, 1, 2 ] } } );
		} );
		await waitFor( () => expect( result.current.isSuccess ).toBe( true ) );
		expect( invalidateSpy ).toHaveBeenCalledWith( { queryKey: LIST_KEY } );
	} );

	it( 'rolls the caches back when the request fails', async () => {
		mockApiFetch( async () => {
			throw new Error( 'boom' );
		} );

		const client = createCacheRetainingClient();
		client.setQueryData( itemKey( 7 ), playlist( 7, [ 1, 2, 3 ] ) );
		client.setQueryData( LIST_KEY, [ playlist( 7, [ 1, 2, 3 ] ) ] );

		const { result } = renderHook( () => useReorderPlaylist(), {
			wrapper: createTestWrapper( client ),
		} );

		await act( async () => {
			await result.current.mutateAsync( { id: 7, order: [ 3, 1, 2 ] } ).catch( () => {
				// Rejection is expected; the assertions below are about rollback.
			} );
		} );

		expect( ( client.getQueryData( itemKey( 7 ) ) as Playlist ).order ).toEqual( [ 1, 2, 3 ] );
		expect( ( client.getQueryData( LIST_KEY ) as Playlist[] )[ 0 ].order ).toEqual( [ 1, 2, 3 ] );
	} );

	it( 'skips the settle-time invalidation while another reorder is in flight', async () => {
		const resolvers: ( ( value: unknown ) => void )[] = [];
		mockApiFetch(
			() =>
				new Promise( resolve => {
					resolvers.push( resolve );
				} )
		);

		const client = createTestQueryClient();
		const invalidateSpy = jest.spyOn( client, 'invalidateQueries' );
		const { result } = renderHook( () => useReorderPlaylist(), {
			wrapper: createTestWrapper( client ),
		} );

		let first: Promise< Playlist > = Promise.resolve( undefined as unknown as Playlist );
		let second: Promise< Playlist > = first;
		act( () => {
			first = result.current.mutateAsync( { id: 7, order: [ 2, 1 ] } );
			second = result.current.mutateAsync( { id: 7, order: [ 1, 2 ] } );
		} );
		await waitFor( () => expect( resolvers ).toHaveLength( 2 ) );

		// First settles while the second is still pending: no invalidation —
		// a refetch now would clobber the second's optimistic order.
		await act( async () => {
			resolvers[ 0 ]( { id: 7, meta: { vps_playlist_order: [ 2, 1 ] } } );
			await first;
		} );
		expect( invalidateSpy ).not.toHaveBeenCalled();

		// Last one out refreshes the caches.
		await act( async () => {
			resolvers[ 1 ]( { id: 7, meta: { vps_playlist_order: [ 1, 2 ] } } );
			await second;
		} );
		await waitFor( () => expect( invalidateSpy ).toHaveBeenCalledWith( { queryKey: LIST_KEY } ) );
	} );

	it( 'invalidates when overlapping reorders settle in the same macrotask', async () => {
		const resolvers: ( ( value: unknown ) => void )[] = [];
		mockApiFetch(
			() =>
				new Promise( resolve => {
					resolvers.push( resolve );
				} )
		);

		const client = createTestQueryClient();
		const invalidateSpy = jest.spyOn( client, 'invalidateQueries' );
		const { result } = renderHook( () => useReorderPlaylist(), {
			wrapper: createTestWrapper( client ),
		} );

		let first: Promise< Playlist > = Promise.resolve( undefined as unknown as Playlist );
		let second: Promise< Playlist > = first;
		act( () => {
			first = result.current.mutateAsync( { id: 7, order: [ 2, 1 ] } );
			second = result.current.mutateAsync( { id: 7, order: [ 1, 2 ] } );
		} );
		await waitFor( () => expect( resolvers ).toHaveLength( 2 ) );

		// Both requests land in the same macrotask. TanStack v5 keeps each
		// mutation "pending" until after its own onSettled resolves, so a
		// naive "am I the last one?" isMutating() probe sees 2 from both
		// settlers and neither invalidates — the caches would keep the
		// optimistic order forever. Exactly one settler must invalidate.
		await act( async () => {
			resolvers[ 0 ]( { id: 7, meta: { vps_playlist_order: [ 2, 1 ] } } );
			resolvers[ 1 ]( { id: 7, meta: { vps_playlist_order: [ 1, 2 ] } } );
			await Promise.all( [ first, second ] );
		} );
		expect( invalidateSpy ).toHaveBeenCalledWith( { queryKey: LIST_KEY } );
		expect(
			invalidateSpy.mock.calls.filter( ( [ arg ] ) => arg?.queryKey === LIST_KEY ).length
		).toBeLessThanOrEqual( 1 );
	} );
} );
