import { renderHook, act } from '@testing-library/react';
import { mockApiFetch } from '../../test-utils/mock-api-fetch';
import { createTestQueryClient, createTestWrapper } from '../../test-utils/query-client-wrapper';
import { useSetPlaylists } from '../use-set-playlists';

type MediaPost = { path: string; terms: number[] };
type MetaPost = { path: string; order: number[] };

const recordRequests = ( failMediaIds: string[] = [] ) => {
	const mediaPosts: MediaPost[] = [];
	const metaPosts: MetaPost[] = [];
	mockApiFetch( async ( { path, method, data } ) => {
		if ( method !== 'POST' || ! path ) {
			throw new Error( 'unexpected' );
		}
		const mediaMatch = path.match( /^\/wp\/v2\/media\/(\w+)$/ );
		if ( mediaMatch ) {
			if ( failMediaIds.includes( mediaMatch[ 1 ] ) ) {
				throw new Error( 'nope' );
			}
			mediaPosts.push( {
				path,
				terms: ( data as { 'videopress-playlists': number[] } )[ 'videopress-playlists' ],
			} );
			return { id: Number( mediaMatch[ 1 ] ) };
		}
		if ( path.startsWith( '/wp/v2/videopress-playlists/' ) ) {
			metaPosts.push( {
				path,
				order: ( data as { meta: { vps_playlist_order: number[] } } ).meta.vps_playlist_order,
			} );
			return { id: 1 };
		}
		throw new Error( `unexpected path: ${ path }` );
	} );
	return { mediaPosts, metaPosts };
};

describe( 'useSetPlaylists', () => {
	it( 'merges term assignments per attachment and appends one order meta POST per playlist', async () => {
		const { mediaPosts, metaPosts } = recordRequests();

		const wrapper = createTestWrapper( createTestQueryClient() );
		const { result } = renderHook( () => useSetPlaylists(), { wrapper } );

		let outcome;
		await act( async () => {
			outcome = await result.current.mutateAsync( {
				items: [
					{ id: '1', playlistIds: [ 5 ] },
					{ id: '2', playlistIds: [] },
				],
				playlists: [
					{ id: 5, order: [ 9 ] },
					{ id: 7, order: [] },
				],
			} );
		} );

		// The terms arg replaces the relationship set, so existing playlist
		// ids must survive the merge (and not repeat).
		expect( mediaPosts ).toEqual( [
			{ path: '/wp/v2/media/1', terms: [ 5, 7 ] },
			{ path: '/wp/v2/media/2', terms: [ 5, 7 ] },
		] );
		// Playlist 5 only gains item 2 (item 1 was already a member);
		// playlist 7 gains both. One meta POST per playlist.
		expect( metaPosts ).toEqual( [
			{ path: '/wp/v2/videopress-playlists/5', order: [ 9, 2 ] },
			{ path: '/wp/v2/videopress-playlists/7', order: [ 1, 2 ] },
		] );
		expect( outcome ).toEqual( { succeeded: [ '1', '2' ], failed: [] } );
	} );

	it( 'reports partial failures and only appends the surviving ids to the order', async () => {
		const { metaPosts } = recordRequests( [ '2' ] );

		const wrapper = createTestWrapper( createTestQueryClient() );
		const { result } = renderHook( () => useSetPlaylists(), { wrapper } );

		let outcome;
		await act( async () => {
			outcome = await result.current.mutateAsync( {
				items: [
					{ id: '1', playlistIds: [ 5 ] },
					{ id: '2', playlistIds: [] },
					{ id: '3', playlistIds: [] },
				],
				playlists: [
					{ id: 5, order: [ 9 ] },
					{ id: 7, order: [] },
				],
			} );
		} );

		expect( outcome ).toEqual( {
			succeeded: [ '1', '3' ],
			failed: [ { id: '2', message: 'nope' } ],
		} );
		// Playlist 5: item 1 was already a member and item 2 failed, so only
		// item 3 is appended. Playlist 7: the failed item 2 must not appear.
		expect( metaPosts ).toEqual( [
			{ path: '/wp/v2/videopress-playlists/5', order: [ 9, 3 ] },
			{ path: '/wp/v2/videopress-playlists/7', order: [ 1, 3 ] },
		] );
	} );

	it( 'skips the order meta POST when nothing was newly added to a playlist', async () => {
		const { mediaPosts, metaPosts } = recordRequests();

		const wrapper = createTestWrapper( createTestQueryClient() );
		const { result } = renderHook( () => useSetPlaylists(), { wrapper } );

		await act( async () => {
			await result.current.mutateAsync( {
				items: [ { id: '1', playlistIds: [ 5 ] } ],
				playlists: [ { id: 5, order: [ 1 ] } ],
			} );
		} );

		// The membership write still runs (idempotent), but there is nothing
		// to append.
		expect( mediaPosts ).toEqual( [ { path: '/wp/v2/media/1', terms: [ 5 ] } ] );
		expect( metaPosts ).toEqual( [] );
	} );
} );
