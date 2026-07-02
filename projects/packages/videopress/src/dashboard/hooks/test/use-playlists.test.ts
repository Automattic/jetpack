import { renderHook, waitFor } from '@testing-library/react';
import { mockApiFetch } from '../../test-utils/mock-api-fetch';
import { createTestWrapper } from '../../test-utils/query-client-wrapper';
import { usePlaylists } from '../use-playlists';

describe( 'usePlaylists', () => {
	it( 'fetches all playlists in one request and maps terms to Playlists', async () => {
		const paths: string[] = [];
		mockApiFetch( async ( { path } ) => {
			paths.push( path ?? '' );
			return [
				{
					id: 7,
					name: 'Tutorials',
					description: 'How-to videos',
					count: 3,
					meta: {
						vps_playlist_artwork_id: 42,
						vps_playlist_type: 'series',
						vps_playlist_order: [ 5, 9 ],
					},
				},
				{
					id: 8,
					name: 'Empty playlist',
					description: '',
					count: 0,
					// Unset single term meta comes back as the REST empty
					// value for its type: 0 / '' / [].
					meta: {
						vps_playlist_artwork_id: 0,
						vps_playlist_type: '',
						vps_playlist_order: [],
					},
				},
			];
		} );

		const { result } = renderHook( () => usePlaylists(), { wrapper: createTestWrapper() } );
		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );

		// The terms controller defaults to per_page=10 and can hide empty
		// terms; both must be overridden for a complete listing.
		expect( paths[ 0 ] ).toContain( '/wp/v2/videopress-playlists' );
		expect( paths[ 0 ] ).toContain( 'per_page=100' );
		expect( paths[ 0 ] ).toContain( 'hide_empty=false' );

		expect( result.current.playlists ).toEqual( [
			{
				id: 7,
				name: 'Tutorials',
				description: 'How-to videos',
				count: 3,
				artworkId: 42,
				type: 'series',
				order: [ 5, 9 ],
			},
			{
				id: 8,
				name: 'Empty playlist',
				description: '',
				count: 0,
				artworkId: null,
				type: 'collection',
				order: [],
			},
		] );
	} );

	it( 'coerces missing meta and unknown types to safe defaults', async () => {
		mockApiFetch( async () => [
			{ id: 3, name: 'Misc' },
			{ id: 4, name: 'Odd', meta: { vps_playlist_type: 'mixtape' } },
		] );

		const { result } = renderHook( () => usePlaylists(), { wrapper: createTestWrapper() } );
		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );

		expect( result.current.playlists[ 0 ] ).toEqual( {
			id: 3,
			name: 'Misc',
			description: '',
			count: 0,
			artworkId: null,
			type: 'collection',
			order: [],
		} );
		expect( result.current.playlists[ 1 ].type ).toBe( 'collection' );
	} );

	it( 'reports errors instead of throwing', async () => {
		mockApiFetch( async () => {
			throw new Error( 'nope' );
		} );

		const { result } = renderHook( () => usePlaylists(), { wrapper: createTestWrapper() } );
		await waitFor( () => expect( result.current.isError ).toBe( true ) );
		expect( result.current.playlists ).toEqual( [] );
	} );
} );
