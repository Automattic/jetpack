import { renderHook, waitFor } from '@testing-library/react';
import { mockApiFetch } from '../../test-utils/mock-api-fetch';
import { createTestWrapper } from '../../test-utils/query-client-wrapper';
import { artworkUrlFromMedia, usePlaylistArtwork } from '../use-playlist-artwork';
import type { Playlist } from '../../types/playlist';
import type { ArtworkMedia } from '../use-playlist-artwork';

const playlist = ( overrides: Partial< Playlist > = {} ): Playlist => ( {
	id: 1,
	name: 'My playlist',
	description: '',
	count: 0,
	artworkId: null,
	order: [],
	...overrides,
} );

const imageMedia = ( id: number, extra: Partial< ArtworkMedia > = {} ): ArtworkMedia => ( {
	id,
	media_type: 'image',
	mime_type: 'image/jpeg',
	source_url: `https://example.com/full-${ id }.jpg`,
	...extra,
} );

const videoMedia = ( id: number, poster: string | undefined ): ArtworkMedia => ( {
	id,
	media_type: 'file',
	mime_type: 'video/videopress',
	source_url: `https://example.com/video-${ id }.mp4`,
	media_details: poster === undefined ? {} : { videopress: { poster } },
} );

describe( 'artworkUrlFromMedia', () => {
	it( 'returns null for missing media', () => {
		expect( artworkUrlFromMedia( null ) ).toBeNull();
		expect( artworkUrlFromMedia( undefined ) ).toBeNull();
	} );

	it( 'prefers the medium size for images', () => {
		const media = imageMedia( 5, {
			media_details: {
				sizes: { medium: { source_url: 'https://example.com/medium-5.jpg' } },
			},
		} );
		expect( artworkUrlFromMedia( media ) ).toBe( 'https://example.com/medium-5.jpg' );
	} );

	it( 'falls back to the full source_url for images without a medium size', () => {
		expect( artworkUrlFromMedia( imageMedia( 5 ) ) ).toBe( 'https://example.com/full-5.jpg' );
	} );

	it( 'recognizes images by mime type when media_type is absent', () => {
		expect( artworkUrlFromMedia( imageMedia( 5, { media_type: undefined } ) ) ).toBe(
			'https://example.com/full-5.jpg'
		);
	} );

	it( 'resolves VideoPress videos to their poster', () => {
		expect( artworkUrlFromMedia( videoMedia( 9, 'https://example.com/poster-9.jpg' ) ) ).toBe(
			'https://example.com/poster-9.jpg'
		);
	} );

	it( 'returns null for non-image attachments without a poster', () => {
		expect( artworkUrlFromMedia( videoMedia( 9, undefined ) ) ).toBeNull();
	} );
} );

describe( 'usePlaylistArtwork', () => {
	it( 'resolves a set artworkId through a batched media lookup', async () => {
		const paths: string[] = [];
		mockApiFetch( async ( { path } ) => {
			paths.push( path ?? '' );
			return [
				imageMedia( 55, {
					media_details: {
						sizes: { medium: { source_url: 'https://example.com/medium-55.jpg' } },
					},
				} ),
			];
		} );

		const { result } = renderHook(
			() => usePlaylistArtwork( playlist( { artworkId: 55, order: [ 7 ] } ) ),
			{ wrapper: createTestWrapper() }
		);

		await waitFor( () => expect( result.current.url ).toBe( 'https://example.com/medium-55.jpg' ) );
		expect( paths ).toHaveLength( 1 );
		expect( paths[ 0 ] ).toContain( '/wp/v2/media' );
		expect( paths[ 0 ] ).toContain( 'include=55' );
		expect( paths[ 0 ] ).toContain( '_fields=' );
	} );

	it( 'uses the provided firstVideoPoster without fetching when artwork is unset', () => {
		const mocked = mockApiFetch( async () => [] );

		const { result } = renderHook(
			() =>
				usePlaylistArtwork( playlist( { order: [ 7 ] } ), {
					firstVideoPoster: 'https://example.com/first.jpg',
				} ),
			{ wrapper: createTestWrapper() }
		);

		expect( result.current ).toEqual( {
			url: 'https://example.com/first.jpg',
			isLoading: false,
		} );
		expect( mocked ).not.toHaveBeenCalled();
	} );

	it( 'accepts a null firstVideoPoster as "no poster" without fetching', () => {
		const mocked = mockApiFetch( async () => [] );

		const { result } = renderHook(
			() => usePlaylistArtwork( playlist( { order: [ 7 ] } ), { firstVideoPoster: null } ),
			{ wrapper: createTestWrapper() }
		);

		expect( result.current ).toEqual( { url: null, isLoading: false } );
		expect( mocked ).not.toHaveBeenCalled();
	} );

	it( 'falls back to fetching the first ordered video and using its poster', async () => {
		const paths: string[] = [];
		mockApiFetch( async ( { path } ) => {
			paths.push( path ?? '' );
			return [ videoMedia( 7, 'https://example.com/poster-7.jpg' ) ];
		} );

		const { result } = renderHook( () => usePlaylistArtwork( playlist( { order: [ 7, 8 ] } ) ), {
			wrapper: createTestWrapper(),
		} );

		await waitFor( () => expect( result.current.url ).toBe( 'https://example.com/poster-7.jpg' ) );
		expect( paths ).toHaveLength( 1 );
		expect( paths[ 0 ] ).toContain( 'include=7' );
	} );

	it( 'does not fetch when artwork is unset and there is no order to fall back to', () => {
		const mocked = mockApiFetch( async () => [] );

		const { result } = renderHook( () => usePlaylistArtwork( playlist() ), {
			wrapper: createTestWrapper(),
		} );

		expect( result.current ).toEqual( { url: null, isLoading: false } );
		expect( mocked ).not.toHaveBeenCalled();
	} );

	it( 'coalesces lookups mounted in the same render pass into one request', async () => {
		const paths: string[] = [];
		mockApiFetch( async ( { path } ) => {
			paths.push( path ?? '' );
			return [ imageMedia( 5 ), videoMedia( 6, 'https://example.com/poster-6.jpg' ) ];
		} );

		const { result } = renderHook(
			() => [
				usePlaylistArtwork( playlist( { id: 1, artworkId: 5 } ) ),
				usePlaylistArtwork( playlist( { id: 2, order: [ 6 ] } ) ),
			],
			{ wrapper: createTestWrapper() }
		);

		await waitFor( () => {
			expect( result.current[ 0 ].url ).toBe( 'https://example.com/full-5.jpg' );
			expect( result.current[ 1 ].url ).toBe( 'https://example.com/poster-6.jpg' );
		} );
		expect( paths ).toHaveLength( 1 );
		// Mount order decides the id sequence; accept either.
		expect( paths[ 0 ] ).toMatch( /include=(5%2C6|6%2C5)/ );
	} );

	it( 'resolves to null when the artwork attachment no longer exists', async () => {
		// include= queries omit deleted attachments rather than erroring.
		mockApiFetch( async () => [] );

		const { result } = renderHook( () => usePlaylistArtwork( playlist( { artworkId: 99 } ) ), {
			wrapper: createTestWrapper(),
		} );

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
		expect( result.current.url ).toBeNull();
	} );
} );
