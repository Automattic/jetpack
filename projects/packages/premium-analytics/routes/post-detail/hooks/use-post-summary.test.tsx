/**
 * External dependencies
 */
import { useSiteHomeUrl, useStatsPost } from '@jetpack-premium-analytics/data';
import { renderHook } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import { useSearch } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { usePostSummary } from './use-post-summary';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	useSiteHomeUrl: jest.fn(),
	useStatsPost: jest.fn(),
} ) );

// Load the URL guard directly so importing its public UI barrel does not pull
// unrelated components into this hook-level test.
jest.mock( '@jetpack-premium-analytics/ui', () =>
	jest.requireActual( '../../../packages/ui/src/utils/safe-http-url' )
);

jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	POST_URL_SEARCH_PARAM: 'post_url',
} ) );

// The core store is only ever passed straight back into the stubbed `select`,
// so a token stands in for the real store descriptor.
jest.mock( '@wordpress/core-data', () => ( { store: 'core' } ) );

// Run each `useSelect` mapper eagerly against a stub registry, so the entity
// lookups are exercised without mounting a real data store.
jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
} ) );

// The route is assembled at runtime; the hook only needs its parsed search
// object, so provide that boundary directly.
jest.mock( '@wordpress/route', () => ( {
	useSearch: jest.fn(),
} ) );

const mockUseSiteHomeUrl = useSiteHomeUrl as jest.MockedFunction< typeof useSiteHomeUrl >;
const mockUseStatsPost = useStatsPost as jest.MockedFunction< typeof useStatsPost >;
const mockUseSelect = useSelect as jest.MockedFunction< typeof useSelect >;
const mockUseSearch = useSearch as jest.MockedFunction< typeof useSearch >;

const POST_ID = 41;

type EntityKey = string;

/**
 * Drive `useSelect` with a fixed set of entity records.
 *
 * @param records - Entity records keyed as `<name>:<id>`.
 */
function mockEntities( records: Record< EntityKey, unknown > ) {
	const getEntityRecord = ( _kind: string, name: string, key: number ) =>
		records[ `${ name }:${ key }` ];

	mockUseSelect.mockImplementation( ( mapSelect: ( select: unknown ) => unknown ) =>
		mapSelect( () => ( { getEntityRecord } ) )
	);
}

/**
 * Mock the Stats `post` payload the header reads its text fields from.
 *
 * @param post      - The raw post row, or `undefined` for a query with no data.
 * @param isLoading - Whether the query is still resolving.
 */
function mockStatsPost( post?: Record< string, unknown >, isLoading = false ) {
	mockUseStatsPost.mockReturnValue( {
		data: post ? { post } : undefined,
		isLoading,
	} as unknown as ReturnType< typeof useStatsPost > );
}

describe( 'usePostSummary', () => {
	beforeEach( () => {
		mockUseSiteHomeUrl.mockReset();
		mockUseStatsPost.mockReset();
		mockUseSelect.mockReset();
		mockUseSearch.mockReset();
		mockUseSiteHomeUrl.mockReturnValue( 'https://example.com/' );
		mockUseSearch.mockReturnValue( {} as never );
	} );

	it( 'resolves the title, type, publish date, image, and public URL', () => {
		mockStatsPost( {
			post_title: 'Hello world',
			post_type: 'post',
			post_date: '2026-06-22 10:00:00',
			post_date_gmt: '2026-06-22 18:00:00',
		} );
		mockEntities( {
			'post:41': { featured_media: 7, link: 'https://example.com/hello-world/' },
			'attachment:7': {
				media_details: { sizes: { thumbnail: { source_url: 'https://example.com/thumb.jpg' } } },
			},
		} );

		const { result } = renderHook( () => usePostSummary( POST_ID ) );

		expect( result.current ).toEqual( {
			title: 'Hello world',
			type: 'post',
			// The GMT date wins over the local one when both are present.
			publishedDate: '2026-06-22 18:00:00',
			imageUrl: 'https://example.com/thumb.jpg',
			url: 'https://example.com/hello-world/',
			isLoading: false,
		} );
	} );

	it( 'leaves the public URL undefined when the entity carries no link', () => {
		mockStatsPost( { post_title: 'Hello world', post_type: 'post' } );
		mockEntities( { 'post:41': { featured_media: 0 } } );

		const { result } = renderHook( () => usePostSummary( POST_ID ) );

		expect( result.current.url ).toBeUndefined();
		expect( result.current.imageUrl ).toBeUndefined();
	} );

	it( 'falls back to a same-origin public URL carried by the route', () => {
		mockStatsPost( { post_title: 'A hidden post type', post_type: 'hidden-type' } );
		mockEntities( {} );
		mockUseSearch.mockReturnValue( { post_url: 'https://example.com/hidden-post/' } as never );

		const { result } = renderHook( () => usePostSummary( POST_ID ) );

		expect( result.current.url ).toBe( 'https://example.com/hidden-post/' );
	} );

	it.each( [
		[ 'a URL on another origin', 'https://attacker.example/hidden-post/' ],
		[ 'an unsafe URL', 'javascript:alert(1)' ],
	] )( 'rejects %s carried by the route', ( _description, postUrl ) => {
		mockStatsPost( { post_title: 'A hidden post type', post_type: 'hidden-type' } );
		mockEntities( {} );
		mockUseSearch.mockReturnValue( { post_url: postUrl } as never );

		const { result } = renderHook( () => usePostSummary( POST_ID ) );

		expect( result.current.url ).toBeUndefined();
	} );

	it( 'prefers the entity permalink over a carried URL', () => {
		mockStatsPost( { post_title: 'Hello world', post_type: 'post' } );
		mockEntities( {
			'post:41': { link: 'https://example.com/canonical/' },
		} );
		mockUseSearch.mockReturnValue( { post_url: 'https://example.com/carried-fallback/' } as never );

		const { result } = renderHook( () => usePostSummary( POST_ID ) );

		expect( result.current.url ).toBe( 'https://example.com/canonical/' );
	} );

	it( 'skips the entity lookups while the post type is unknown', () => {
		mockStatsPost( undefined, true );
		mockEntities( { 'post:41': { link: 'https://example.com/hello-world/' } } );

		const { result } = renderHook( () => usePostSummary( POST_ID ) );

		expect( result.current.url ).toBeUndefined();
		expect( result.current.imageUrl ).toBeUndefined();
		expect( result.current.isLoading ).toBe( true );
	} );

	it( 'skips the entity lookups for an invalid post ID', () => {
		mockStatsPost( { post_title: 'Homepage', post_type: 'post' } );
		mockEntities( { 'post:0': { link: 'https://example.com/' } } );

		const { result } = renderHook( () => usePostSummary( 0 ) );

		expect( result.current.url ).toBeUndefined();
		expect( result.current.imageUrl ).toBeUndefined();
	} );

	it( 'falls back to the full-size media URL when there is no thumbnail size', () => {
		mockStatsPost( { post_title: 'A page', post_type: 'page', post_date: '2026-06-01 09:00:00' } );
		mockEntities( {
			'page:41': { featured_media: 9, link: 'https://example.com/a-page/' },
			'attachment:9': { source_url: 'https://example.com/full.jpg' },
		} );

		const { result } = renderHook( () => usePostSummary( POST_ID ) );

		expect( result.current.imageUrl ).toBe( 'https://example.com/full.jpg' );
		// Only the local date is present, so it stands in for the GMT one.
		expect( result.current.publishedDate ).toBe( '2026-06-01 09:00:00' );
		expect( result.current.url ).toBe( 'https://example.com/a-page/' );
	} );

	it( 'leaves the image undefined when the featured media record is missing', () => {
		mockStatsPost( { post_title: 'Hello world', post_type: 'post' } );
		mockEntities( { 'post:41': { featured_media: 12, link: 'https://example.com/hello-world/' } } );

		const { result } = renderHook( () => usePostSummary( POST_ID ) );

		expect( result.current.imageUrl ).toBeUndefined();
		expect( result.current.url ).toBe( 'https://example.com/hello-world/' );
	} );
} );
