import { renderHook, waitFor } from '@testing-library/react';
import { getApiFetchMock, mockApiFetch } from '../../test-utils/mock-api-fetch';
import { createTestWrapper } from '../../test-utils/query-client-wrapper';
import { setSimpleSite, unsetSimpleSite } from '../../test-utils/simple-site';
import {
	useLibrary,
	viewToQueryArgs,
	privacyStringToInt,
	libraryRefetchInterval,
	nextProcessingPoll,
	toLibraryItem,
	LIBRARY_POLL_INTERVAL_MS,
	PROCESSING_POLL_MAX_MS,
} from '../use-library';
import type { View } from '@wordpress/dataviews';

const DEFAULT_VIEW: View = {
	type: 'grid',
	page: 1,
	perPage: 12,
	fields: [],
	sort: { field: 'uploadDate', direction: 'desc' },
	filters: [],
	search: '',
};

describe( 'privacyStringToInt', () => {
	it( 'maps UI privacy strings to WPCOM integer codes', () => {
		expect( privacyStringToInt( 'public' ) ).toBe( 0 );
		expect( privacyStringToInt( 'private' ) ).toBe( 1 );
		expect( privacyStringToInt( 'site-default' ) ).toBe( 2 );
	} );
} );

describe( 'viewToQueryArgs', () => {
	it( 'maps the default view to core media query args', () => {
		expect( viewToQueryArgs( DEFAULT_VIEW ) ).toEqual( {
			media_type: 'video',
			mime_type: 'video/*',
			page: 1,
			per_page: 12,
			orderby: 'date',
			order: 'desc',
			videopress_hide_already_uploaded: 1,
		} );
	} );

	it( 'maps title sort to orderby=title', () => {
		expect(
			viewToQueryArgs( { ...DEFAULT_VIEW, sort: { field: 'title', direction: 'asc' } } )
		).toMatchObject( { orderby: 'title', order: 'asc' } );
	} );

	it( 'drops unsupported sort fields (duration, fileSize) so WPCOM uses its default', () => {
		expect(
			viewToQueryArgs( { ...DEFAULT_VIEW, sort: { field: 'duration', direction: 'asc' } } )
		).not.toHaveProperty( 'orderby' );
		expect(
			viewToQueryArgs( { ...DEFAULT_VIEW, sort: { field: 'fileSize', direction: 'asc' } } )
		).not.toHaveProperty( 'orderby' );
	} );

	it( 'maps privacy filter to videopress_privacy_setting integer', () => {
		expect(
			viewToQueryArgs( {
				...DEFAULT_VIEW,
				filters: [ { field: 'privacy', operator: 'is', value: 'private' } ],
			} )
		).toMatchObject( { videopress_privacy_setting: '1' } );
	} );

	it( 'maps search to the search param', () => {
		expect( viewToQueryArgs( { ...DEFAULT_VIEW, search: 'foo' } ) ).toMatchObject( {
			search: 'foo',
		} );
	} );
} );

describe( 'libraryRefetchInterval', () => {
	it( 'does not poll when nothing is processing', () => {
		expect( libraryRefetchInterval( false, 0 ) ).toBe( false );
		// Elapsed time is irrelevant once processing has cleared.
		expect( libraryRefetchInterval( false, PROCESSING_POLL_MAX_MS * 2 ) ).toBe( false );
	} );

	it( 'polls while processing and under the cap', () => {
		expect( libraryRefetchInterval( true, 0 ) ).toBe( LIBRARY_POLL_INTERVAL_MS );
		expect( libraryRefetchInterval( true, PROCESSING_POLL_MAX_MS - 1 ) ).toBe(
			LIBRARY_POLL_INTERVAL_MS
		);
	} );

	it( 'stops polling once the cap is reached, even while still processing (VIDP-298)', () => {
		// An orphaned record stuck isProcessing forever must not poll unbounded.
		expect( libraryRefetchInterval( true, PROCESSING_POLL_MAX_MS ) ).toBe( false );
		expect( libraryRefetchInterval( true, PROCESSING_POLL_MAX_MS + 1 ) ).toBe( false );
	} );
} );

describe( 'nextProcessingPoll', () => {
	it( 'stamps a fresh anchor on first sighting and polls', () => {
		const { anchor, interval } = nextProcessingPoll( null, [ '7' ], 1_000 );
		expect( anchor ).toEqual( { idsKey: '7', startedAt: 1_000 } );
		expect( interval ).toBe( LIBRARY_POLL_INTERVAL_MS );
	} );

	it( 'keeps the anchor while the same set is processing and caps on its budget', () => {
		const stamped = nextProcessingPoll( null, [ '7' ], 1_000 ).anchor;
		const underCap = nextProcessingPoll( stamped, [ '7' ], 1_000 + PROCESSING_POLL_MAX_MS - 1 );
		expect( underCap.anchor ).toBe( stamped );
		expect( underCap.interval ).toBe( LIBRARY_POLL_INTERVAL_MS );
		const atCap = nextProcessingPoll( stamped, [ '7' ], 1_000 + PROCESSING_POLL_MAX_MS );
		expect( atCap.interval ).toBe( false );
	} );

	it( 'restamps when the processing set changes, so a new upload is polled after a stuck orphan hit the cap', () => {
		// Orphan "7" alone burned its budget…
		const orphanOnly = nextProcessingPoll( null, [ '7' ], 0 ).anchor;
		expect( nextProcessingPoll( orphanOnly, [ '7' ], PROCESSING_POLL_MAX_MS ).interval ).toBe(
			false
		);
		// …then a new upload "9" appears at t=16min: fresh budget, polling resumes.
		const later = PROCESSING_POLL_MAX_MS + 60_000;
		const { anchor, interval } = nextProcessingPoll( orphanOnly, [ '9', '7' ], later );
		expect( anchor ).toEqual( { idsKey: '7,9', startedAt: later } );
		expect( interval ).toBe( LIBRARY_POLL_INTERVAL_MS );
	} );

	it( 'treats the set as order-insensitive', () => {
		const stamped = nextProcessingPoll( null, [ '9', '7' ], 0 ).anchor;
		expect( nextProcessingPoll( stamped, [ '7', '9' ], 5_000 ).anchor ).toBe( stamped );
	} );

	it( 'keeps one budget for the same stuck set across view changes (set-keyed, not view-keyed)', () => {
		// The library ref survives filter/search/page changes; only the ids
		// identify the budget, so a capped orphan stays capped on a new view.
		const stamped = nextProcessingPoll( null, [ '7' ], 0 ).anchor;
		const afterViewChange = nextProcessingPoll( stamped, [ '7' ], PROCESSING_POLL_MAX_MS );
		expect( afterViewChange.anchor ).toBe( stamped );
		expect( afterViewChange.interval ).toBe( false );
	} );

	it( 'drops the anchor when processing clears, so the next processing item gets a fresh budget', () => {
		const stamped = nextProcessingPoll( null, [ '7' ], 0 ).anchor;
		const cleared = nextProcessingPoll( stamped, [], 5_000 );
		expect( cleared.anchor ).toBeNull();
		expect( cleared.interval ).toBe( false );
	} );
} );

describe( 'useLibrary', () => {
	it( 'returns items and paginationInfo derived from response headers', async () => {
		const body = JSON.stringify( [
			{
				id: 42,
				title: { rendered: 'Test video' },
				source_url: 'https://example.com/v.mp4',
				media_details: { length: 120, filesize: 12_345_678 },
				date: '2026-05-15T10:00:00',
				jetpack_videopress: {
					guid: 'abc',
					rating: 'G',
					display_embed: 1,
					allow_download: 0,
					privacy_setting: 0,
				},
			},
		] );
		const responseHeaders: Record< string, string > = {
			'X-WP-Total': '1',
			'X-WP-TotalPages': '1',
			'Content-Type': 'application/json',
		};
		mockApiFetch( async () => ( {
			headers: { get: ( name: string ) => responseHeaders[ name ] ?? null },
			json: async () => JSON.parse( body ),
		} ) );

		const { result } = renderHook( () => useLibrary( DEFAULT_VIEW ), {
			wrapper: createTestWrapper(),
		} );

		await waitFor( () => expect( result.current.items.length ).toBeGreaterThan( 0 ) );
		expect( result.current.items[ 0 ].title ).toBe( 'Test video' );
		// The media REST field doesn't return `tracks`; items default to [].
		expect( result.current.items[ 0 ].tracks ).toEqual( [] );
		expect( result.current.paginationInfo.totalItems ).toBe( 1 );
		expect( result.current.paginationInfo.totalPages ).toBe( 1 );
	} );

	it( 'decodes HTML entities in the rendered title', async () => {
		const body = JSON.stringify( [
			{ id: 7, title: { rendered: 'Molly&#8217;s &#8220;Best&#8221; Day' } },
		] );
		const responseHeaders: Record< string, string > = {
			'X-WP-Total': '1',
			'X-WP-TotalPages': '1',
			'Content-Type': 'application/json',
		};
		mockApiFetch( async () => ( {
			headers: { get: ( name: string ) => responseHeaders[ name ] ?? null },
			json: async () => JSON.parse( body ),
		} ) );

		const { result } = renderHook( () => useLibrary( DEFAULT_VIEW ), {
			wrapper: createTestWrapper(),
		} );

		await waitFor( () => expect( result.current.items.length ).toBeGreaterThan( 0 ) );
		expect( result.current.items[ 0 ].title ).toBe( 'Molly’s “Best” Day' );
	} );
} );

describe( 'on WordPress.com Simple', () => {
	beforeEach( setSimpleSite );
	afterEach( unsetSimpleSite );

	describe( 'viewToQueryArgs', () => {
		it( 'sends videopress_only_videos and omits the params that are dead on Simple', () => {
			const args = viewToQueryArgs( DEFAULT_VIEW );
			expect( args ).toMatchObject( { videopress_only_videos: 1 } );
			// media_type is rejected (400) on Simple; mime_type doesn't narrow
			// there; hide_already_uploaded targets meta only the videopress/v1
			// promote flow writes, which can't run on Simple.
			expect( args ).not.toHaveProperty( 'media_type' );
			expect( args ).not.toHaveProperty( 'mime_type' );
			expect( args ).not.toHaveProperty( 'videopress_hide_already_uploaded' );
		} );

		it( 'sends videopress_privacy_setting for privacy filters (server-side now)', () => {
			const args = viewToQueryArgs( {
				...DEFAULT_VIEW,
				filters: [ { field: 'privacy', operator: 'is', value: 'private' } ],
			} );
			expect( args ).toMatchObject( { videopress_privacy_setting: '1' } );
		} );

		it( 'sends videopress_has_guid for the videopress type filter (server-side now)', () => {
			const args = viewToQueryArgs( {
				...DEFAULT_VIEW,
				filters: [ { field: 'type', operator: 'is', value: 'videopress' } ],
			} );
			// The videos-table constraint rides on top of the always-sent
			// videopress_only_videos — never the video/videopress mime, which
			// returns nothing on Simple.
			expect( args ).toMatchObject( {
				videopress_only_videos: 1,
				videopress_has_guid: 1,
			} );
			expect( args ).not.toHaveProperty( 'mime_type' );
			expect( args ).not.toHaveProperty( 'no_videopress' );
		} );

		it( 'sends no_videopress for the local type filter', () => {
			const args = viewToQueryArgs( {
				...DEFAULT_VIEW,
				filters: [ { field: 'type', operator: 'is', value: 'local' } ],
			} );
			expect( args ).toMatchObject( { no_videopress: 1 } );
			expect( args ).not.toHaveProperty( 'videopress_has_guid' );
		} );
	} );

	describe( 'useLibrary', () => {
		/**
		 * Build a mock apiFetch handler serving a fixed set of pages keyed by
		 * the `page` query arg, with pagination headers derived from the set.
		 *
		 * @param pages - Raw media arrays, index 0 = page 1.
		 * @param total - Value for the X-WP-Total header.
		 * @return The installed handler's call log (paths requested).
		 */
		function mockPagedMedia( pages: unknown[][], total: number ) {
			const requestedPaths: string[] = [];
			mockApiFetch( async ( { path } ) => {
				requestedPaths.push( path ?? '' );
				const page = Number( /[?&]page=(\d+)/.exec( path ?? '' )?.[ 1 ] ?? 1 );
				const headers: Record< string, string > = {
					'X-WP-Total': String( total ),
					'X-WP-TotalPages': String( pages.length ),
				};
				return {
					headers: { get: ( name: string ) => headers[ name ] ?? null },
					json: async () => pages[ page - 1 ] ?? [],
				};
			} );
			return requestedPaths;
		}

		/**
		 * Minimal raw Simple media row.
		 *
		 * @param id        - Attachment id.
		 * @param isPrivate - jetpack_videopress.is_private flag.
		 * @return A raw /wp/v2/media item.
		 */
		function rawVideo( id: number, isPrivate: boolean ) {
			return {
				id,
				title: { rendered: `Video ${ id }` },
				mime_type: 'video/mp4',
				jetpack_videopress: {
					guid: `guid${ id }`,
					privacy_setting: isPrivate ? 1 : 0,
					is_private: isPrivate,
				},
			};
		}

		it( 'maps the Simple media shape: CDN poster from guid + thumb, duration from milliseconds', () => {
			// On Simple there is no media_details.videopress sub-object; the
			// poster is a bare `thumb` filename resolved against the VideoPress
			// CDN, and the duration arrives as `duration_milliseconds`.
			const item = toLibraryItem(
				{
					id: 7,
					title: { rendered: 'Simple video' },
					mime_type: 'video/mp4',
					media_details: { thumb: 'video-7_std.original.jpg', duration_milliseconds: 12_345 },
					jetpack_videopress: { guid: 'abc123', privacy_setting: 0 },
				},
				true
			);

			expect( item.thumbnailUrl ).toBe(
				'https://videos.files.wordpress.com/abc123/video-7_std.original.jpg'
			);
			expect( item.durationSeconds ).toBe( 12 );
			expect( item.isProcessing ).toBe( false );
			expect( item.type ).toBe( 'videopress' );
		} );

		it( 'flags a Simple VideoPress record with no thumb as processing (no finished flag there)', () => {
			// An unprocessed/orphaned Simple record has a guid but an empty
			// media_details — no thumb, no duration, and no `finished` flag to
			// carry the signal, so the poster check does.
			const item = toLibraryItem(
				{
					id: 8,
					title: { rendered: 'Still cooking' },
					mime_type: 'video/mp4',
					media_details: {},
					jetpack_videopress: { guid: 'def456' },
				},
				true
			);

			expect( item.isProcessing ).toBe( true );
			expect( item.thumbnailUrl ).toBeNull();

			// A local video (no guid) is never "processing" — there's no
			// transcode to wait for.
			const local = toLibraryItem(
				{ id: 9, title: { rendered: 'Local' }, mime_type: 'video/mp4', media_details: {} },
				true
			);
			expect( local.isProcessing ).toBe( false );
			expect( local.type ).toBe( 'local' );
		} );

		it( 'derives the orientation from the source dimensions', () => {
			const withDimensions = ( width?: number, height?: number ) =>
				toLibraryItem(
					{
						id: 10,
						title: { rendered: 'Oriented' },
						mime_type: 'video/mp4',
						media_details: { width, height },
					},
					false
				);

			expect( withDimensions( 1920, 1080 ).orientation ).toBe( 'landscape' );
			expect( withDimensions( 1080, 1920 ).orientation ).toBe( 'portrait' );
			// Square and unknown dimensions carry no orientation.
			expect( withDimensions( 1080, 1080 ).orientation ).toBeNull();
			expect( withDimensions( undefined, undefined ).orientation ).toBeNull();
			expect( withDimensions( 1920, undefined ).orientation ).toBeNull();
		} );

		it( 'sends the privacy filter as a server param in a single request, totals from headers', async () => {
			// Server-side filtering: the privacy filter is a query param, the
			// server does the narrowing, and the hook reads X-WP-Total verbatim.
			// No over-fetch, no local pagination, no truncation past a page cap.
			const requestedPaths = mockPagedMedia( [ [ rawVideo( 1, true ), rawVideo( 2, true ) ] ], 70 );

			const view: View = {
				...DEFAULT_VIEW,
				page: 1,
				perPage: 50,
				filters: [ { field: 'privacy', operator: 'is', value: 'private' } ],
			};
			const { result } = renderHook( () => useLibrary( view ), {
				wrapper: createTestWrapper(),
			} );

			await waitFor( () => expect( result.current.items.length ).toBeGreaterThan( 0 ) );

			// One request, carrying the privacy param and the caller's pagination.
			expect( requestedPaths ).toHaveLength( 1 );
			expect( requestedPaths[ 0 ] ).toContain( 'videopress_privacy_setting=1' );
			expect( requestedPaths[ 0 ] ).toMatch( /[?&]per_page=50(?:&|$)/ );
			expect( requestedPaths[ 0 ] ).toMatch( /[?&]page=1(?:&|$)/ );
			// Totals come straight from the response headers, not a local recount.
			expect( result.current.paginationInfo.totalItems ).toBe( 70 );
			expect( result.current.paginationInfo.totalPages ).toBe( 1 );
		} );

		it( 'sends the videopress type filter as videopress_has_guid in a single request', async () => {
			// Regression guard: useFreeTier's COUNT_VIEW filters by type=videopress at
			// perPage:1. It must stay a single request at the caller's per_page and read
			// the exact X-WP-Total (the videos-table count), resolving the free-tier
			// overcount of local videos.
			const requestedPaths = mockPagedMedia( [ [ rawVideo( 1, false ) ] ], 42 );

			const view: View = {
				...DEFAULT_VIEW,
				perPage: 1,
				filters: [ { field: 'type', operator: 'is', value: 'videopress' } ],
			};
			const { result } = renderHook( () => useLibrary( view ), {
				wrapper: createTestWrapper(),
			} );

			await waitFor( () => expect( result.current.paginationInfo.totalItems ).toBe( 42 ) );
			expect( requestedPaths ).toHaveLength( 1 );
			expect( requestedPaths[ 0 ] ).toContain( 'videopress_has_guid=1' );
			expect( requestedPaths[ 0 ] ).toMatch( /[?&]per_page=1(?:&|$)/ );
			expect( result.current.paginationInfo.totalPages ).toBe( 1 );
		} );

		it( 'sends the local type filter as no_videopress in a single request', async () => {
			const requestedPaths = mockPagedMedia(
				[ [ { id: 9, title: { rendered: 'Local' }, mime_type: 'video/mp4' } ] ],
				5
			);

			const view: View = {
				...DEFAULT_VIEW,
				filters: [ { field: 'type', operator: 'is', value: 'local' } ],
			};
			const { result } = renderHook( () => useLibrary( view ), {
				wrapper: createTestWrapper(),
			} );

			await waitFor( () => expect( result.current.items.length ).toBeGreaterThan( 0 ) );
			expect( requestedPaths ).toHaveLength( 1 );
			expect( requestedPaths[ 0 ] ).toContain( 'no_videopress=1' );
			expect( result.current.items[ 0 ].type ).toBe( 'local' );
			expect( result.current.paginationInfo.totalItems ).toBe( 5 );
		} );

		it( 'keeps the unfiltered browse path a single request with server totals', async () => {
			mockPagedMedia( [ [ rawVideo( 1, false ) ] ], 37 );

			const { result } = renderHook( () => useLibrary( DEFAULT_VIEW ), {
				wrapper: createTestWrapper(),
			} );

			await waitFor( () => expect( result.current.items.length ).toBeGreaterThan( 0 ) );
			expect( getApiFetchMock() ).toHaveBeenCalledTimes( 1 );
			expect( result.current.paginationInfo.totalItems ).toBe( 37 );
		} );
	} );
} );
