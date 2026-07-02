import { renderHook, waitFor } from '@testing-library/react';
import { mockApiFetch } from '../../test-utils/mock-api-fetch';
import { createTestWrapper } from '../../test-utils/query-client-wrapper';
import {
	moveItem,
	orderPlaylistVideos,
	resolveOrderedIds,
	usePlaylistVideos,
} from '../use-playlist-videos';
import type { Playlist } from '../../types/playlist';
import type { PlaylistVideo } from '../use-playlist-videos';

const video = ( id: number, extra: Partial< PlaylistVideo > = {} ): PlaylistVideo => ( {
	id,
	title: `Video ${ id }`,
	thumbnailUrl: null,
	durationSeconds: 0,
	uploadDate: '',
	playlistIds: [],
	...extra,
} );

const playlist = ( id: number, order: number[] ): Playlist => ( {
	id,
	name: `Playlist ${ id }`,
	description: '',
	count: 0,
	artworkId: null,
	type: 'collection',
	order,
} );

describe( 'resolveOrderedIds', () => {
	it( 'keeps the stored order for ids that are still members', () => {
		expect( resolveOrderedIds( [ 3, 1, 2 ], [ 1, 2, 3 ] ) ).toEqual( [ 3, 1, 2 ] );
	} );

	it( 'drops order entries that are no longer members', () => {
		expect( resolveOrderedIds( [ 9, 3, 8, 1 ], [ 1, 3 ] ) ).toEqual( [ 3, 1 ] );
	} );

	it( 'appends members missing from the order, in member (date) sequence', () => {
		expect( resolveOrderedIds( [ 2 ], [ 5, 4, 2, 6 ] ) ).toEqual( [ 2, 5, 4, 6 ] );
	} );

	it( 'drops stale entries and appends missing members in one pass', () => {
		expect( resolveOrderedIds( [ 9, 2, 7 ], [ 5, 2, 6 ] ) ).toEqual( [ 2, 5, 6 ] );
	} );

	it( 'dedupes repeated order entries keeping the first position', () => {
		expect( resolveOrderedIds( [ 2, 1, 2, 1 ], [ 1, 2 ] ) ).toEqual( [ 2, 1 ] );
	} );

	it( 'returns members as-is when there is no stored order', () => {
		expect( resolveOrderedIds( [], [ 4, 2, 3 ] ) ).toEqual( [ 4, 2, 3 ] );
	} );

	it( 'returns empty when there are no members', () => {
		expect( resolveOrderedIds( [ 1, 2, 3 ], [] ) ).toEqual( [] );
	} );
} );

describe( 'moveItem', () => {
	it( 'moves an item down', () => {
		expect( moveItem( [ 1, 2, 3, 4 ], 0, 2 ) ).toEqual( [ 2, 3, 1, 4 ] );
	} );

	it( 'moves an item up', () => {
		expect( moveItem( [ 1, 2, 3, 4 ], 3, 1 ) ).toEqual( [ 1, 4, 2, 3 ] );
	} );

	it( 'swaps adjacent items in both directions', () => {
		expect( moveItem( [ 1, 2, 3 ], 1, 0 ) ).toEqual( [ 2, 1, 3 ] );
		expect( moveItem( [ 1, 2, 3 ], 1, 2 ) ).toEqual( [ 1, 3, 2 ] );
	} );

	it( 'clamps the destination into the list bounds', () => {
		expect( moveItem( [ 1, 2, 3 ], 1, -5 ) ).toEqual( [ 2, 1, 3 ] );
		expect( moveItem( [ 1, 2, 3 ], 1, 99 ) ).toEqual( [ 1, 3, 2 ] );
	} );

	it( 'returns the input array unchanged for no-ops', () => {
		const list = [ 1, 2, 3 ];
		// Same position after clamping.
		expect( moveItem( list, 0, 0 ) ).toBe( list );
		expect( moveItem( list, 0, -1 ) ).toBe( list );
		expect( moveItem( list, 2, 5 ) ).toBe( list );
		// Out-of-range source.
		expect( moveItem( list, -1, 1 ) ).toBe( list );
		expect( moveItem( list, 3, 1 ) ).toBe( list );
	} );

	it( 'does not mutate the input on a real move', () => {
		const list = [ 1, 2, 3 ];
		moveItem( list, 0, 2 );
		expect( list ).toEqual( [ 1, 2, 3 ] );
	} );
} );

describe( 'orderPlaylistVideos', () => {
	it( 'materializes videos in the reconciled order', () => {
		const videos = [ video( 1 ), video( 2 ), video( 3 ) ];
		expect( orderPlaylistVideos( videos, [ 3, 9, 1 ] ).map( v => v.id ) ).toEqual( [ 3, 1, 2 ] );
	} );

	it( 'passes empty inputs through', () => {
		expect( orderPlaylistVideos( [], [ 1, 2 ] ) ).toEqual( [] );
	} );
} );

describe( 'usePlaylistVideos', () => {
	it( 'fetches members filtered by the playlist term and orders them', async () => {
		const paths: string[] = [];
		mockApiFetch( async ( { path } ) => {
			paths.push( path ?? '' );
			// Newest first, matching the requested date ordering.
			return [
				{
					id: 8,
					title: { rendered: 'Newest' },
					date: '2026-06-02T00:00:00',
					'videopress-playlists': [ 7 ],
				},
				{
					id: 5,
					title: { rendered: 'Video five' },
					date: '2026-06-01T00:00:00',
					media_details: {
						videopress: { duration: 90500, poster: 'https://example.com/p.jpg' },
					},
					'videopress-playlists': [ 7, 11 ],
				},
				{
					id: 2,
					title: { rendered: 'Oldest' },
					date: '2026-05-01T00:00:00',
					media_details: { length: 30 },
					'videopress-playlists': [ 7 ],
				},
			];
		} );

		// Stored order references 5 first, a stale id 99, then 2; member 8
		// is missing from the order and must be appended.
		const { result } = renderHook( () => usePlaylistVideos( playlist( 7, [ 5, 99, 2 ] ) ), {
			wrapper: createTestWrapper(),
		} );
		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );

		expect( paths[ 0 ] ).toContain( '/wp/v2/media' );
		expect( paths[ 0 ] ).toContain( 'videopress-playlists=7' );
		expect( paths[ 0 ] ).toContain( 'per_page=100' );
		expect( paths[ 0 ] ).toContain( 'orderby=date' );
		expect( paths[ 0 ] ).toContain( 'order=desc' );

		expect( result.current.videos.map( v => v.id ) ).toEqual( [ 5, 2, 8 ] );
		expect( result.current.videos[ 0 ] ).toEqual( {
			id: 5,
			title: 'Video five',
			thumbnailUrl: 'https://example.com/p.jpg',
			// VideoPress duration arrives in milliseconds.
			durationSeconds: 90,
			uploadDate: '2026-06-01T00:00:00',
			playlistIds: [ 7, 11 ],
		} );
		// Local video: media_details.length is already seconds.
		expect( result.current.videos[ 1 ].durationSeconds ).toBe( 30 );
		expect( result.current.videos[ 1 ].thumbnailUrl ).toBeNull();
	} );

	it( 'does not fetch until a playlist is available', () => {
		const mocked = mockApiFetch( async () => [] );

		const { result } = renderHook( () => usePlaylistVideos( undefined ), {
			wrapper: createTestWrapper(),
		} );

		expect( mocked ).not.toHaveBeenCalled();
		expect( result.current.videos ).toEqual( [] );
	} );

	it( 'reports errors instead of throwing', async () => {
		mockApiFetch( async () => {
			throw new Error( 'nope' );
		} );

		const { result } = renderHook( () => usePlaylistVideos( playlist( 3, [] ) ), {
			wrapper: createTestWrapper(),
		} );
		await waitFor( () => expect( result.current.isError ).toBe( true ) );
		expect( result.current.videos ).toEqual( [] );
	} );
} );
