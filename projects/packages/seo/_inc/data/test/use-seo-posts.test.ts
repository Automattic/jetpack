import { jest } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import type { ContentPostType } from '../content-types';

// True-ESM Jest: stand in for the core-data store so `useSelect` can hand the
// hook a fake set of selectors backed by an in-memory collection.
const PER_PAGE = 100;

interface FakeQuery {
	page: number;
}

// Pending core-data edits, keyed by record id — what the SEO inspector stages
// with `editEntityRecord` after persisting a row's meta.
type FakeEdits = Record< number, { meta?: Record< string, unknown > } >;

/**
 * Build a fake `select` over a site with the given number of published posts
 * and pages, mimicking how core-data serves one page of records per query and
 * only knows the total page count once page 1 has resolved.
 *
 * @param counts     - Published record count per post type.
 * @param unresolved - Keys ('post:2') whose page is still being fetched.
 * @param edits      - Pending core-data edits, keyed by record id.
 * @return The fake `select` plus the queries it was asked for.
 */
function createSelect(
	counts: Record< ContentPostType, number >,
	unresolved: string[] = [],
	edits: FakeEdits = {}
) {
	const pending = new Set( unresolved );
	const requested: string[] = [];
	const isResolved = ( type: ContentPostType, page: number ) =>
		! pending.has( `${ type }:${ page }` );
	const totalPages = ( type: ContentPostType ) => Math.ceil( counts[ type ] / PER_PAGE );

	const core = {
		getEntityRecords: ( _kind: string, type: ContentPostType, query: FakeQuery ) => {
			requested.push( `${ type }:${ query.page }` );
			if ( ! isResolved( type, query.page ) ) {
				return null;
			}
			const start = ( query.page - 1 ) * PER_PAGE;
			const size = Math.max( 0, Math.min( PER_PAGE, counts[ type ] - start ) );
			// Offset page ids so every record across both types is unique.
			const base = type === 'page' ? 100000 : 0;
			return Array.from( { length: size }, ( _, index ) => ( {
				id: base + start + index,
				type,
				title: { rendered: `${ type } ${ start + index }` },
				meta: { jetpack_seo_html_title: '' },
			} ) );
		},
		getEntityRecordsTotalPages: ( _kind: string, type: ContentPostType ) =>
			isResolved( type, 1 ) ? totalPages( type ) : null,
		getEntityRecordEdits: ( _kind: string, _type: ContentPostType, recordId: number ) =>
			edits[ recordId ],
		hasFinishedResolution: ( _selector: string, args: [ string, ContentPostType, FakeQuery ] ) =>
			isResolved( args[ 1 ], args[ 2 ].page ),
	};

	return { select: () => core, requested };
}

const useSelect = jest.fn();

jest.unstable_mockModule( '@wordpress/core-data', () => ( { store: 'core' } ) );
jest.unstable_mockModule( '@wordpress/data', () => ( { useSelect } ) );

const { default: useSeoPosts } = await import( '../use-seo-posts' );

/**
 * Render the hook against a fake core-data store.
 *
 * @param counts     - Published record count per post type.
 * @param unresolved - Keys ('post:2') whose page is still being fetched.
 * @param edits      - Pending core-data edits, keyed by record id.
 * @return The hook result and the queries the fake store was asked for.
 */
function render(
	counts: Record< ContentPostType, number >,
	unresolved: string[] = [],
	edits: FakeEdits = {}
) {
	const { select, requested } = createSelect( counts, unresolved, edits );
	useSelect.mockImplementation( ( mapSelect: ( s: unknown ) => unknown ) => mapSelect( select ) );
	const { result } = renderHook( () => useSeoPosts() );
	return { result, requested };
}

describe( 'useSeoPosts', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'requests a single page per type when the site fits in one', () => {
		const { result, requested } = render( { post: 30, page: 4 } );

		expect( requested ).toEqual( [ 'post:1', 'page:1' ] );
		expect( result.current.items ).toHaveLength( 34 );
		expect( result.current.isLoading ).toBe( false );
	} );

	it( 'pages past the per_page cap and merges every page of both types', () => {
		const { result, requested } = render( { post: 250, page: 120 } );

		expect( requested ).toEqual( [ 'post:1', 'post:2', 'post:3', 'page:1', 'page:2' ] );
		expect( result.current.items ).toHaveLength( 370 );
		// Every record is a distinct row — no page was fetched or merged twice.
		expect( new Set( result.current.items.map( item => item.id ) ).size ).toBe( 370 );
	} );

	it( 'keeps paging on a large site, with no cap on the number of pages', () => {
		const { result, requested } = render( { post: 2500, page: 5 } );

		expect( requested.filter( key => key.startsWith( 'post:' ) ) ).toHaveLength( 25 );
		expect( result.current.items ).toHaveLength( 2505 );
	} );

	it( 'stays loading, without dropping resolved pages, while a page is in flight', () => {
		const { result } = render( { post: 250, page: 4 }, [ 'post:2' ] );

		expect( result.current.isLoading ).toBe( true );
		expect( result.current.items ).toHaveLength( 154 );
	} );

	it( 'only asks for page 1 until the total page count is known', () => {
		const { result, requested } = render( { post: 250, page: 4 }, [ 'post:1' ] );

		expect( requested ).toEqual( [ 'post:1', 'page:1' ] );
		expect( result.current.isLoading ).toBe( true );
	} );

	// The SEO inspector persists a row's meta with `apiFetch` and stages it in the
	// store with `editEntityRecord`, precisely so that saving doesn't invalidate
	// every page of the collection. The fetched record therefore stays stale, and
	// the row is only correct if the hook overlays that edit.
	it( 'renders a saved row from its pending edits, leaving every other row alone', () => {
		const { result, requested } = render( { post: 150, page: 0 }, [], {
			7: { meta: { jetpack_seo_html_title: 'Edited title' } },
		} );

		const edited = result.current.items.find( item => item.id === 7 );
		expect( edited?.customTitle ).toBe( 'Edited title' );
		expect( edited?.hasCustomTitle ).toBe( true );

		// Untouched rows keep the fetched values...
		expect( result.current.items.filter( item => item.hasCustomTitle ) ).toHaveLength( 1 );
		// ...and applying the edit costs no extra requests.
		expect( requested ).toEqual( [ 'post:1', 'post:2', 'page:1' ] );
	} );
} );
