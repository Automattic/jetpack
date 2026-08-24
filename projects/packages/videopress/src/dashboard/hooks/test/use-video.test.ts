import { renderHook, waitFor } from '@testing-library/react';
import { makeLibraryItem } from '../../test-utils/library-item';
import { getApiFetchMock, mockApiFetch } from '../../test-utils/mock-api-fetch';
import { createTestQueryClient, createTestWrapper } from '../../test-utils/query-client-wrapper';
import { PROCESSING_POLL_MAX_MS } from '../use-library';
import {
	isMissingVideoError,
	nextVideoPoll,
	shouldPollVideo,
	useInvalidateVideo,
	useVideo,
} from '../use-video';

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

	it( 'decodes HTML entities in the rendered title', async () => {
		mockApiFetch( async () => ( {
			id: 42,
			title: { rendered: 'Molly&#8217;s &#8220;Best&#8221; Day' },
			jetpack_videopress: { guid: 'g' },
			media_details: { videopress: { poster: 'https://example.com/p.jpg', finished: true } },
		} ) );

		const { result } = renderHook( () => useVideo( 42 ), { wrapper: createTestWrapper() } );

		await waitFor( () => expect( result.current.video ).toBeDefined() );
		expect( result.current.video?.title ).toBe( 'Molly’s “Best” Day' );
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

describe( 'shouldPollVideo', () => {
	it( 'polls while a VideoPress item is still processing', () => {
		expect( shouldPollVideo( makeLibraryItem( { isProcessing: true } ) ) ).toBe( true );
	} );

	// The upload flow's bind path: the attachment exists before WordPress.com
	// registers the VideoPress video, so the record arrives GUID-less with
	// `isProcessing` false. A poll gated on processing alone would leave the
	// edit surface stuck on a 'local' record forever.
	it( 'polls a GUID-less item so the screen notices the GUID arriving', () => {
		expect(
			shouldPollVideo( makeLibraryItem( { guid: '', type: 'local', isProcessing: false } ) )
		).toBe( true );
	} );

	it( 'stops polling once the item has a GUID and is done processing', () => {
		expect( shouldPollVideo( makeLibraryItem( { guid: 'g', isProcessing: false } ) ) ).toBe(
			false
		);
	} );

	it( 'does not poll before the first response', () => {
		expect( shouldPollVideo( undefined ) ).toBe( false );
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

describe( 'isMissingVideoError', () => {
	it( 'recognises the REST code and the raw 404', () => {
		expect( isMissingVideoError( { code: 'rest_post_invalid_id' } ) ).toBe( true );
		expect( isMissingVideoError( { data: { status: 404 } } ) ).toBe( true );
		expect( isMissingVideoError( { status: 404 } ) ).toBe( true );
	} );

	it( 'leaves every other failure alone', () => {
		expect( isMissingVideoError( undefined ) ).toBe( false );
		expect( isMissingVideoError( new Error( 'network' ) ) ).toBe( false );
		expect( isMissingVideoError( { data: { status: 500 } } ) ).toBe( false );
	} );
} );

describe( 'nextVideoPoll', () => {
	const now = 1_000_000;

	// Regression: an out-of-band delete left the stale row polling a 404 every
	// 2s until the VIDP-298 cap fired, minutes later.
	it( 'stops polling once the record 404s, even while it still looks unfinished', () => {
		const { anchor, interval } = nextVideoPoll(
			null,
			42,
			makeLibraryItem( { isProcessing: true } ),
			{ code: 'rest_post_invalid_id' },
			now
		);
		expect( interval ).toBe( false );
		expect( anchor ).toBeNull();
	} );

	it( 'polls a processing item and holds one budget across refetches', () => {
		const first = nextVideoPoll( null, 42, makeLibraryItem( { isProcessing: true } ), null, now );
		expect( first.interval ).toBe( 2000 );

		const capped = nextVideoPoll(
			first.anchor,
			42,
			makeLibraryItem( { isProcessing: true } ),
			null,
			now + PROCESSING_POLL_MAX_MS
		);
		expect( capped.anchor?.startedAt ).toBe( now );
		expect( capped.interval ).toBe( false );
	} );

	// Registration and transcoding are separate waits: a slow registration used
	// to burn the single per-id budget and leave the transcode tail unpolled.
	it( 're-arms the budget when the GUID arrives mid-poll', () => {
		const registering = nextVideoPoll(
			null,
			42,
			makeLibraryItem( { guid: '', type: 'local', isProcessing: false } ),
			null,
			now
		);
		expect( registering.interval ).toBe( 2000 );

		const transcoding = nextVideoPoll(
			registering.anchor,
			42,
			makeLibraryItem( { guid: 'g', isProcessing: true } ),
			null,
			now + PROCESSING_POLL_MAX_MS
		);
		expect( transcoding.anchor?.startedAt ).toBe( now + PROCESSING_POLL_MAX_MS );
		expect( transcoding.interval ).toBe( 2000 );
	} );

	it( 'stops polling once the item is registered and finished', () => {
		expect(
			nextVideoPoll( null, 42, makeLibraryItem( { guid: 'g', isProcessing: false } ), null, now )
				.interval
		).toBe( false );
	} );
} );
