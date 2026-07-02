import { act, renderHook } from '@testing-library/react';
import { mockApiFetch } from '../../test-utils/mock-api-fetch';
import { createTestQueryClient, createTestWrapper } from '../../test-utils/query-client-wrapper';
import { useRemoveFromPlaylist } from '../use-remove-from-playlist';
import type { PlaylistVideo } from '../use-playlist-videos';

const VIDEO: PlaylistVideo = {
	id: 5,
	title: 'Video five',
	thumbnailUrl: null,
	durationSeconds: 0,
	uploadDate: '',
	playlistIds: [ 7, 11 ],
};

describe( 'useRemoveFromPlaylist', () => {
	it( 'rewrites the attachment terms without the playlist, then prunes the order', async () => {
		const calls: { path?: string; method?: string; data?: unknown }[] = [];
		mockApiFetch( async ( { path, method, data } ) => {
			calls.push( { path, method, data } );
			return {};
		} );

		const { result } = renderHook( () => useRemoveFromPlaylist(), {
			wrapper: createTestWrapper(),
		} );
		await act( async () => {
			await result.current.mutateAsync( { playlistId: 7, video: VIDEO, order: [ 2, 5, 9 ] } );
		} );

		expect( calls ).toEqual( [
			{
				path: '/wp/v2/media/5',
				method: 'POST',
				// Other playlist memberships survive the rewrite.
				data: { 'videopress-playlists': [ 11 ] },
			},
			{
				path: '/wp/v2/videopress-playlists/7',
				method: 'POST',
				data: { meta: { vps_playlist_order: [ 2, 9 ] } },
			},
		] );
	} );

	it( 'invalidates the playlists cache even when the order prune fails', async () => {
		mockApiFetch( async ( { path } ) => {
			if ( path?.startsWith( '/wp/v2/videopress-playlists/' ) ) {
				throw new Error( 'boom' );
			}
			return {};
		} );

		const client = createTestQueryClient();
		const invalidateSpy = jest.spyOn( client, 'invalidateQueries' );
		const { result } = renderHook( () => useRemoveFromPlaylist(), {
			wrapper: createTestWrapper( client ),
		} );

		await act( async () => {
			await result.current
				.mutateAsync( { playlistId: 7, video: VIDEO, order: [ 5 ] } )
				.catch( () => {
					// Rejection is expected; the term removal did happen, so the
					// listing must still refresh.
				} );
		} );

		expect( invalidateSpy ).toHaveBeenCalledWith( {
			queryKey: [ 'jetpack-videopress-playlists' ],
		} );
	} );
} );
