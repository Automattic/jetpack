import { buildSuggestionRows, countOptions, rowAtOptionIndex } from '../suggestion-rows';

const LISTBOX_ID = 'lb-1';
const LABELS = { query: 'Suggestions', taxonomy: 'Popular Filters', post: 'Articles' };

describe( 'buildSuggestionRows', () => {
	it( 'returns an empty array for non-array or empty input', () => {
		expect( buildSuggestionRows( null, LISTBOX_ID, LABELS ) ).toEqual( [] );
		expect( buildSuggestionRows( undefined, LISTBOX_ID, LABELS ) ).toEqual( [] );
		expect( buildSuggestionRows( [], LISTBOX_ID, LABELS ) ).toEqual( [] );
	} );

	it( 'emits groups in the canonical query → taxonomy → post order', () => {
		const rows = buildSuggestionRows(
			[
				{ type: 'post', text: 'A post', url: '/a' },
				{ type: 'taxonomy', text: 'News', url: '/c/news', taxonomy: 'category', slug: 'news' },
				{ type: 'query', text: 'react hooks' },
			],
			LISTBOX_ID,
			LABELS
		);
		const types = rows.filter( r => r.isHeader ).map( r => r.type );
		expect( types ).toEqual( [ 'query', 'taxonomy', 'post' ] );
	} );

	it( 'uses the provided labels for header rows', () => {
		const rows = buildSuggestionRows(
			[
				{ type: 'query', text: 'q' },
				{ type: 'taxonomy', text: 't', url: '/c/t', taxonomy: 'category', slug: 't' },
				{ type: 'post', text: 'p', url: '/p' },
			],
			LISTBOX_ID,
			LABELS
		);
		const headers = rows.filter( r => r.isHeader );
		expect( headers.map( r => r.label ) ).toEqual( [
			'Suggestions',
			'Popular Filters',
			'Articles',
		] );
	} );

	it( 'falls back to the bare type string when a label is missing', () => {
		const rows = buildSuggestionRows( [ { type: 'query', text: 'q' } ], LISTBOX_ID, {} );
		expect( rows[ 0 ].label ).toBe( 'query' );
	} );

	it( 'skips empty groups instead of emitting an orphan header', () => {
		const rows = buildSuggestionRows(
			[
				{ type: 'query', text: 'a' },
				{ type: 'post', text: 'b', url: '/b' },
			],
			LISTBOX_ID,
			LABELS
		);
		const types = rows.filter( r => r.isHeader ).map( r => r.type );
		expect( types ).toEqual( [ 'query', 'post' ] );
		expect( types ).not.toContain( 'taxonomy' );
	} );

	it( 'assigns a contiguous optionIndex across groups, skipping headers', () => {
		const rows = buildSuggestionRows(
			[
				{ type: 'query', text: 'q1' },
				{ type: 'query', text: 'q2' },
				{ type: 'taxonomy', text: 't1', url: '/c/t1', taxonomy: 'category', slug: 't1' },
				{ type: 'post', text: 'p1', url: '/p/p1' },
			],
			LISTBOX_ID,
			LABELS
		);
		const options = rows.filter( r => ! r.isHeader );
		expect( options.map( r => r.optionIndex ) ).toEqual( [ 0, 1, 2, 3 ] );
	} );

	it( 'bakes optionId as `<listboxId>-option-<optionIndex>` for aria-activedescendant', () => {
		const rows = buildSuggestionRows(
			[
				{ type: 'query', text: 'q' },
				{ type: 'post', text: 'p', url: '/p' },
			],
			'my-listbox',
			LABELS
		);
		const options = rows.filter( r => ! r.isHeader );
		expect( options[ 0 ].optionId ).toBe( 'my-listbox-option-0' );
		expect( options[ 1 ].optionId ).toBe( 'my-listbox-option-1' );
	} );

	it( 'produces stable, collision-proof keys for headers and options', () => {
		const rows = buildSuggestionRows(
			[
				{ type: 'query', text: 'q1' },
				{ type: 'post', text: 'q1', url: '/q1' },
			],
			LISTBOX_ID,
			LABELS
		);
		const keys = rows.map( r => r.key );
		expect( new Set( keys ).size ).toBe( keys.length );
		expect( keys ).toEqual( [ 'hdr:query', 'opt:query:0', 'hdr:post', 'opt:post:1' ] );
	} );

	it( 'normalizes missing url, taxonomy, and slug to empty strings on option rows', () => {
		const rows = buildSuggestionRows( [ { type: 'query', text: 'q' } ], LISTBOX_ID, LABELS );
		const option = rows.find( r => ! r.isHeader );
		expect( option.url ).toBe( '' );
		expect( option.taxonomy ).toBe( '' );
		expect( option.slug ).toBe( '' );
	} );
} );

describe( 'countOptions', () => {
	it( 'counts option rows and excludes headers', () => {
		const rows = buildSuggestionRows(
			[
				{ type: 'query', text: 'a' },
				{ type: 'query', text: 'b' },
				{ type: 'post', text: 'c', url: '/c' },
			],
			LISTBOX_ID,
			LABELS
		);
		expect( countOptions( rows ) ).toBe( 3 );
	} );

	it( 'returns 0 for an empty input', () => {
		expect( countOptions( [] ) ).toBe( 0 );
	} );
} );

describe( 'buildSuggestionRows enabledTypes filter', () => {
	const FIXTURE = [
		{ type: 'query', text: 'q1' },
		{ type: 'query', text: 'q2' },
		{ type: 'taxonomy', text: 't1', url: '/c/t1', taxonomy: 'category', slug: 't1' },
		{ type: 'post', text: 'p1', url: '/p/p1' },
	];

	it( 'renders only the requested type when enabledTypes is a single-element array', () => {
		const rows = buildSuggestionRows( FIXTURE, LISTBOX_ID, LABELS, [ 'query' ] );
		const headerTypes = rows.filter( r => r.isHeader ).map( r => r.type );
		const optionTexts = rows.filter( r => ! r.isHeader ).map( r => r.text );
		expect( headerTypes ).toEqual( [ 'query' ] );
		expect( optionTexts ).toEqual( [ 'q1', 'q2' ] );
	} );

	it( 'renders the requested subset in canonical order regardless of input order', () => {
		const rows = buildSuggestionRows( FIXTURE, LISTBOX_ID, LABELS, [ 'post', 'query' ] );
		const headerTypes = rows.filter( r => r.isHeader ).map( r => r.type );
		expect( headerTypes ).toEqual( [ 'query', 'post' ] );
	} );

	it( 'returns an empty array when enabledTypes is an empty array', () => {
		expect( buildSuggestionRows( FIXTURE, LISTBOX_ID, LABELS, [] ) ).toEqual( [] );
	} );

	it( 'silently drops unknown strings in enabledTypes', () => {
		const rows = buildSuggestionRows( FIXTURE, LISTBOX_ID, LABELS, [
			'query',
			'not-a-real-type',
			'post',
		] );
		const headerTypes = rows.filter( r => r.isHeader ).map( r => r.type );
		expect( headerTypes ).toEqual( [ 'query', 'post' ] );
	} );

	it( 'falls back to all-enabled when enabledTypes is omitted (backward-compat)', () => {
		const rows = buildSuggestionRows( FIXTURE, LISTBOX_ID, LABELS );
		const headerTypes = rows.filter( r => r.isHeader ).map( r => r.type );
		expect( headerTypes ).toEqual( [ 'query', 'taxonomy', 'post' ] );
	} );

	it( 'falls back to all-enabled when enabledTypes is non-array (null / object)', () => {
		const all = [ 'query', 'taxonomy', 'post' ];
		expect(
			buildSuggestionRows( FIXTURE, LISTBOX_ID, LABELS, null )
				.filter( r => r.isHeader )
				.map( r => r.type )
		).toEqual( all );
		expect(
			buildSuggestionRows( FIXTURE, LISTBOX_ID, LABELS, { query: true } )
				.filter( r => r.isHeader )
				.map( r => r.type )
		).toEqual( all );
	} );

	it( 'keeps a contiguous optionIndex sequence after filtering', () => {
		const rows = buildSuggestionRows( FIXTURE, LISTBOX_ID, LABELS, [ 'query', 'post' ] );
		const options = rows.filter( r => ! r.isHeader );
		expect( options.map( r => r.optionIndex ) ).toEqual( [ 0, 1, 2 ] );
		expect( options.map( r => r.optionId ) ).toEqual( [
			`${ LISTBOX_ID }-option-0`,
			`${ LISTBOX_ID }-option-1`,
			`${ LISTBOX_ID }-option-2`,
		] );
	} );
} );

describe( 'rowAtOptionIndex', () => {
	it( 'returns the option row matching the given optionIndex', () => {
		const rows = buildSuggestionRows(
			[
				{ type: 'query', text: 'a' },
				{ type: 'post', text: 'b', url: '/b' },
			],
			LISTBOX_ID,
			LABELS
		);
		expect( rowAtOptionIndex( rows, 0 )?.text ).toBe( 'a' );
		expect( rowAtOptionIndex( rows, 1 )?.text ).toBe( 'b' );
	} );

	it( 'returns null for negative or out-of-range indexes', () => {
		const rows = buildSuggestionRows( [ { type: 'query', text: 'a' } ], LISTBOX_ID, LABELS );
		expect( rowAtOptionIndex( rows, -1 ) ).toBeNull();
		expect( rowAtOptionIndex( rows, 99 ) ).toBeNull();
	} );
} );
