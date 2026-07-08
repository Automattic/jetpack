import { renderHook, waitFor } from '@testing-library/react';
import { mockApiFetch } from '../../test-utils/mock-api-fetch';
import { createTestWrapper } from '../../test-utils/query-client-wrapper';
import { usePlaylist } from '../use-playlist';

describe( 'usePlaylist', () => {
	it( 'fetches a single term and maps it to a Playlist', async () => {
		const paths: string[] = [];
		mockApiFetch( async ( { path } ) => {
			paths.push( path ?? '' );
			return {
				id: 7,
				name: 'Tutorials',
				description: 'How-to videos',
				count: 2,
				meta: {
					vps_playlist_artwork_id: 42,
					vps_playlist_order: [ 5, 9 ],
				},
			};
		} );

		const { result } = renderHook( () => usePlaylist( 7 ), { wrapper: createTestWrapper() } );
		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );

		expect( paths[ 0 ] ).toBe( '/wp/v2/videopress-playlists/7' );
		expect( result.current.playlist ).toEqual( {
			id: 7,
			name: 'Tutorials',
			description: 'How-to videos',
			count: 2,
			artworkId: 42,
			order: [ 5, 9 ],
		} );
	} );

	it( 'reports errors (e.g. a deleted term) instead of throwing', async () => {
		mockApiFetch( async () => {
			throw new Error( 'rest_term_invalid' );
		} );

		const { result } = renderHook( () => usePlaylist( 999 ), { wrapper: createTestWrapper() } );
		await waitFor( () => expect( result.current.isError ).toBe( true ) );
		expect( result.current.playlist ).toBeUndefined();
	} );
} );
