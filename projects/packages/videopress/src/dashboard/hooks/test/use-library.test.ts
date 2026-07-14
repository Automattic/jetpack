import { renderHook, waitFor } from '@testing-library/react';
import { getApiFetchMock, mockApiFetch } from '../../test-utils/mock-api-fetch';
import { createTestWrapper } from '../../test-utils/query-client-wrapper';
import { setSimpleSite, unsetSimpleSite } from '../../test-utils/simple-site';
import { useLibrary, viewToQueryArgs, privacyStringToInt } from '../use-library';
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
		it( 'sends videopress_only_videos and omits media_type', () => {
			const args = viewToQueryArgs( DEFAULT_VIEW );
			expect( args ).toMatchObject( { videopress_only_videos: 1 } );
			expect( args ).not.toHaveProperty( 'media_type' );
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
			// videopress_only_videos + video/* mime — never the video/videopress
			// mime, which returns nothing on Simple.
			expect( args ).toMatchObject( {
				mime_type: 'video/*',
				videopress_only_videos: 1,
				videopress_has_guid: 1,
			} );
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

		it( 'drops non-video rows (poster jpegs) before mapping', async () => {
			mockPagedMedia(
				[
					[
						rawVideo( 1, false ),
						{ id: 2, title: { rendered: 'Poster' }, mime_type: 'image/jpeg' },
					],
				],
				2
			);

			const { result } = renderHook( () => useLibrary( DEFAULT_VIEW ), {
				wrapper: createTestWrapper(),
			} );

			await waitFor( () => expect( result.current.items.length ).toBeGreaterThan( 0 ) );
			expect( result.current.items ).toHaveLength( 1 );
			expect( result.current.items[ 0 ].id ).toBe( '1' );
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
