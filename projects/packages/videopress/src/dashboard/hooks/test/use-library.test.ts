import { renderHook, waitFor } from '@testing-library/react';
import { makeLibraryItem } from '../../test-utils/library-item';
import { getApiFetchMock, mockApiFetch } from '../../test-utils/mock-api-fetch';
import { createTestWrapper } from '../../test-utils/query-client-wrapper';
import { setSimpleSite, unsetSimpleSite } from '../../test-utils/simple-site';
import {
	useLibrary,
	viewToQueryArgs,
	privacyStringToInt,
	getClientSideFilters,
	matchesClientSideFilters,
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

		it( 'omits videopress_privacy_setting for privacy filters (client-side there)', () => {
			const args = viewToQueryArgs( {
				...DEFAULT_VIEW,
				filters: [ { field: 'privacy', operator: 'is', value: 'private' } ],
			} );
			expect( args ).not.toHaveProperty( 'videopress_privacy_setting' );
		} );

		it( 'keeps the broad video query for type filters (client-side there)', () => {
			const args = viewToQueryArgs( {
				...DEFAULT_VIEW,
				filters: [ { field: 'type', operator: 'is', value: 'videopress' } ],
			} );
			expect( args ).toMatchObject( { mime_type: 'video/*' } );
			expect( args ).not.toHaveProperty( 'no_videopress' );
		} );
	} );

	describe( 'getClientSideFilters', () => {
		it( 'returns null when no privacy/type filter is active', () => {
			expect( getClientSideFilters( DEFAULT_VIEW ) ).toBeNull();
			expect(
				getClientSideFilters( {
					...DEFAULT_VIEW,
					filters: [ { field: 'privacy', operator: 'is', value: 'all' } ],
				} )
			).toBeNull();
		} );

		it( 'collects active privacy and type filters', () => {
			expect(
				getClientSideFilters( {
					...DEFAULT_VIEW,
					filters: [
						{ field: 'privacy', operator: 'is', value: 'private' },
						{ field: 'type', operator: 'is', value: 'local' },
					],
				} )
			).toEqual( { privacy: 'private', type: 'local' } );
		} );
	} );

	describe( 'matchesClientSideFilters', () => {
		const publicItem = makeLibraryItem( { privacy: 'public', isPrivate: false } );
		const privateItem = makeLibraryItem( { privacy: 'private', isPrivate: true } );
		// Site default resolves to private on a private-by-default site.
		const defaultPrivateItem = makeLibraryItem( { privacy: 'site-default', isPrivate: true } );
		const defaultPublicItem = makeLibraryItem( { privacy: 'site-default', isPrivate: false } );
		const localItem = makeLibraryItem( { type: 'local', guid: '' } );

		it( "privacy 'private' matches effective visibility (isPrivate)", () => {
			expect( matchesClientSideFilters( privateItem, { privacy: 'private' } ) ).toBe( true );
			expect( matchesClientSideFilters( defaultPrivateItem, { privacy: 'private' } ) ).toBe( true );
			expect( matchesClientSideFilters( publicItem, { privacy: 'private' } ) ).toBe( false );
			expect( matchesClientSideFilters( defaultPublicItem, { privacy: 'private' } ) ).toBe( false );
		} );

		it( "privacy 'public' matches effective visibility (not isPrivate)", () => {
			expect( matchesClientSideFilters( publicItem, { privacy: 'public' } ) ).toBe( true );
			expect( matchesClientSideFilters( defaultPublicItem, { privacy: 'public' } ) ).toBe( true );
			expect( matchesClientSideFilters( privateItem, { privacy: 'public' } ) ).toBe( false );
			expect( matchesClientSideFilters( defaultPrivateItem, { privacy: 'public' } ) ).toBe( false );
		} );

		it( "privacy 'site-default' matches the stored setting, not the effective one", () => {
			expect( matchesClientSideFilters( defaultPrivateItem, { privacy: 'site-default' } ) ).toBe(
				true
			);
			expect( matchesClientSideFilters( defaultPublicItem, { privacy: 'site-default' } ) ).toBe(
				true
			);
			expect( matchesClientSideFilters( publicItem, { privacy: 'site-default' } ) ).toBe( false );
			expect( matchesClientSideFilters( privateItem, { privacy: 'site-default' } ) ).toBe( false );
		} );

		it( 'type matches the guid-derived label', () => {
			expect( matchesClientSideFilters( localItem, { type: 'local' } ) ).toBe( true );
			expect( matchesClientSideFilters( publicItem, { type: 'local' } ) ).toBe( false );
			expect( matchesClientSideFilters( publicItem, { type: 'videopress' } ) ).toBe( true );
		} );

		it( 'combines filters conjunctively', () => {
			expect(
				matchesClientSideFilters( privateItem, { privacy: 'private', type: 'videopress' } )
			).toBe( true );
			expect( matchesClientSideFilters( privateItem, { privacy: 'private', type: 'local' } ) ).toBe(
				false
			);
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

		it( 'over-fetches bounded pages, filters client-side, and paginates locally', async () => {
			// Two server pages of 100; page 1 = 60 private + 40 public,
			// page 2 = 10 private + 90 public → 70 private total.
			const page1 = [
				...Array.from( { length: 60 }, ( _, i ) => rawVideo( i + 1, true ) ),
				...Array.from( { length: 40 }, ( _, i ) => rawVideo( i + 61, false ) ),
			];
			const page2 = [
				...Array.from( { length: 10 }, ( _, i ) => rawVideo( i + 101, true ) ),
				...Array.from( { length: 90 }, ( _, i ) => rawVideo( i + 111, false ) ),
			];
			const requestedPaths = mockPagedMedia( [ page1, page2 ], 200 );

			const view: View = {
				...DEFAULT_VIEW,
				page: 2,
				perPage: 50,
				filters: [ { field: 'privacy', operator: 'is', value: 'private' } ],
			};
			const { result } = renderHook( () => useLibrary( view ), {
				wrapper: createTestWrapper(),
			} );

			await waitFor( () => expect( result.current.items.length ).toBeGreaterThan( 0 ) );

			// Both server pages requested at the over-fetch page size.
			expect( requestedPaths.filter( p => p.includes( 'per_page=100' ) ) ).toHaveLength( 2 );
			// Totals reflect the filtered set, not the server headers.
			expect( result.current.paginationInfo.totalItems ).toBe( 70 );
			expect( result.current.paginationInfo.totalPages ).toBe( 2 );
			// Local page 2 of 50 → the remaining 20 private items, in server order.
			expect( result.current.items ).toHaveLength( 20 );
			expect( result.current.items[ 0 ].id ).toBe( '51' );
			expect( result.current.items[ 19 ].id ).toBe( '110' );
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
