import { renderHook, waitFor } from '@testing-library/react';
import { getApiFetchMock, mockApiFetch } from '../../test-utils/mock-api-fetch';
import { createTestQueryClient, createTestWrapper } from '../../test-utils/query-client-wrapper';
import { useInvalidateVideo, useVideo } from '../use-video';

describe( 'useVideo', () => {
	it( 'fetches /wp/v2/media/{id} and maps to LibraryItem', async () => {
		mockApiFetch( async ( { path } ) => {
			if ( path === '/wp/v2/media/42' ) {
				return {
					id: 42,
					title: { rendered: 'V' },
					source_url: 'https://example.com/v.mp4',
					media_details: {
						length: 60,
						filesize: 1000,
						videopress: { poster: 'https://example.com/p.jpg', duration: 90500, finished: true },
					},
					jetpack_videopress: {
						guid: 'g',
						rating: 'PG-13',
						display_embed: 1,
						allow_download: 0,
						privacy_setting: 1,
						is_private: true,
						description: 'A video',
					},
				};
			}
			throw new Error( `unexpected path: ${ path }` );
		} );

		const { result } = renderHook( () => useVideo( 42 ), { wrapper: createTestWrapper() } );

		await waitFor( () => expect( result.current.video ).toBeDefined() );
		expect( result.current.video ).toMatchObject( {
			id: '42',
			guid: 'g',
			type: 'videopress',
			title: 'V',
			filename: 'v.mp4',
			thumbnailUrl: 'https://example.com/p.jpg',
			durationSeconds: 90,
			privacy: 'private',
			isPrivate: true,
			fileSizeBytes: 1000,
			description: 'A video',
			rating: 'PG-13',
			displayEmbed: true,
			allowDownloads: false,
			isProcessing: false,
		} );
		// The media REST field doesn't return `tracks`; items default to [].
		expect( result.current.video?.tracks ).toEqual( [] );
	} );

	it( 'maps an item without VideoPress data to a local item with defaults', async () => {
		mockApiFetch( async () => ( {
			id: 7,
			source_url: 'https://example.com/local.mp4',
		} ) );

		const { result } = renderHook( () => useVideo( 7 ), { wrapper: createTestWrapper() } );

		await waitFor( () => expect( result.current.video ).toBeDefined() );
		expect( result.current.video ).toMatchObject( {
			id: '7',
			guid: '',
			type: 'local',
			title: '',
			filename: 'local.mp4',
			thumbnailUrl: null,
			durationSeconds: 0,
			uploadDate: '',
			privacy: 'site-default',
			isPrivate: false,
			fileSizeBytes: 0,
			rating: 'G',
			displayEmbed: false,
			allowDownloads: false,
			isProcessing: false,
			tracks: [],
		} );
	} );

	it( 'flags a VideoPress item without a poster as still processing', async () => {
		mockApiFetch( async () => ( {
			id: 42,
			jetpack_videopress: { guid: 'g' },
			media_details: { videopress: { finished: false } },
		} ) );

		const { result } = renderHook( () => useVideo( 42 ), { wrapper: createTestWrapper() } );

		await waitFor( () => expect( result.current.video ).toBeDefined() );
		expect( result.current.video?.isProcessing ).toBe( true );
	} );

	it( 'surfaces fetch failures via isError and error', async () => {
		mockApiFetch( async () => {
			throw new Error( 'not found' );
		} );

		const { result } = renderHook( () => useVideo( 42 ), { wrapper: createTestWrapper() } );

		await waitFor( () => expect( result.current.isError ).toBe( true ) );
		expect( result.current.video ).toBeUndefined();
		expect( ( result.current.error as Error ).message ).toBe( 'not found' );
	} );

	it( 'does not fetch when the id is empty', async () => {
		const fetchMock = mockApiFetch( async () => ( { id: 1 } ) );

		const { result } = renderHook( () => useVideo( '' ), { wrapper: createTestWrapper() } );

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
		expect( result.current.video ).toBeUndefined();
		expect( fetchMock ).not.toHaveBeenCalled();
	} );
} );

describe( 'useInvalidateVideo', () => {
	it( 'invalidates the cached video so the next read refetches it', async () => {
		let title = 'Before';
		mockApiFetch( async () => ( {
			id: 42,
			title: { rendered: title },
			jetpack_videopress: { guid: 'g' },
			media_details: { videopress: { poster: 'https://example.com/p.jpg', finished: true } },
		} ) );

		const wrapper = createTestWrapper( createTestQueryClient() );
		const { result } = renderHook(
			() => ( { query: useVideo( 42 ), invalidate: useInvalidateVideo() } ),
			{ wrapper }
		);

		await waitFor( () => expect( result.current.query.video?.title ).toBe( 'Before' ) );

		title = 'After';
		await result.current.invalidate( 42 );

		await waitFor( () => expect( result.current.query.video?.title ).toBe( 'After' ) );
		expect( getApiFetchMock() ).toHaveBeenCalledTimes( 2 );
	} );
} );
