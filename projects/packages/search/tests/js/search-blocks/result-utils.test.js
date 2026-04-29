import {
	countActiveFilters,
	formatDate,
	formatPath,
	normalizeResult,
	stripTags,
	toSafeUrl,
	tokenizeHighlight,
} from '../../../src/search-blocks/store/result-utils';

describe( 'toSafeUrl', () => {
	it( 'passes through https URLs', () => {
		expect( toSafeUrl( 'https://example.com/a' ) ).toBe( 'https://example.com/a' );
	} );

	it( 'passes through http URLs', () => {
		expect( toSafeUrl( 'http://example.com/a' ) ).toBe( 'http://example.com/a' );
	} );

	it( 'promotes schemeless URLs to protocol-relative', () => {
		expect( toSafeUrl( 'example.com/a' ) ).toBe( '//example.com/a' );
	} );

	it( 'collapses leading slashes on schemeless URLs', () => {
		expect( toSafeUrl( '///example.com/a' ) ).toBe( '//example.com/a' );
	} );

	it( 'rejects javascript: URLs', () => {
		expect( toSafeUrl( 'javascript:alert(1)' ) ).toBe( '' );
	} );

	it( 'rejects data: URLs', () => {
		expect( toSafeUrl( 'data:text/html,<script>' ) ).toBe( '' );
	} );

	it( 'rejects vbscript: URLs', () => {
		expect( toSafeUrl( 'vbscript:msgbox(1)' ) ).toBe( '' );
	} );

	it( 'returns empty string for non-string input', () => {
		expect( toSafeUrl( null ) ).toBe( '' );
		expect( toSafeUrl( undefined ) ).toBe( '' );
		expect( toSafeUrl( 123 ) ).toBe( '' );
	} );

	it( 'returns empty string for empty input', () => {
		expect( toSafeUrl( '' ) ).toBe( '' );
	} );
} );

describe( 'formatDate', () => {
	it( 'formats an ISO date with default locale', () => {
		expect( formatDate( '2026-04-20T10:00:00Z' ) ).toBe( 'Apr 20, 2026' );
	} );

	it( 'handles space-separated dates (Jetpack Search API shape)', () => {
		expect( formatDate( '2026-04-20 10:00:00' ) ).toMatch( /Apr 20, 2026/ );
	} );

	it( 'strips sub-second precision', () => {
		expect( formatDate( '2026-04-20T10:00:00.123Z' ) ).toBe( 'Apr 20, 2026' );
	} );

	it( 'returns empty string for falsy input', () => {
		expect( formatDate( '' ) ).toBe( '' );
		expect( formatDate( null ) ).toBe( '' );
		expect( formatDate( undefined ) ).toBe( '' );
	} );

	it( 'returns empty string for unparseable input', () => {
		expect( formatDate( 'not-a-date' ) ).toBe( '' );
	} );

	it( 'honors the locale argument', () => {
		// fr-FR formats short month differently (in either "avr." or "avr" depending on ICU build).
		const out = formatDate( '2026-04-20T10:00:00Z', 'fr-FR' );
		expect( out ).toMatch( /20 avr\.?\s+2026/ );
	} );

	it( 'falls back to en-US when locale is empty string', () => {
		expect( formatDate( '2026-04-20T10:00:00Z', '' ) ).toBe( 'Apr 20, 2026' );
	} );
} );

describe( 'formatPath', () => {
	it( 'converts a permalink to a breadcrumb', () => {
		expect( formatPath( 'https://example.com/2026/04/20/hello-world/' ) ).toBe(
			'2026 › 04 › 20 › hello-world'
		);
	} );

	it( 'handles protocol-relative URLs', () => {
		expect( formatPath( '//example.com/posts/my-post/' ) ).toBe( 'posts › my-post' );
	} );

	it( 'url-decodes path segments', () => {
		expect( formatPath( 'https://example.com/caf%C3%A9/' ) ).toBe( 'café' );
	} );

	it( 'returns empty string for root path', () => {
		expect( formatPath( 'https://example.com/' ) ).toBe( '' );
	} );

	it( 'returns empty string for falsy input', () => {
		expect( formatPath( '' ) ).toBe( '' );
		expect( formatPath( null ) ).toBe( '' );
	} );

	it( 'returns empty string for invalid URL', () => {
		expect( formatPath( 'not a url' ) ).toBe( '' );
	} );
} );

describe( 'stripTags', () => {
	it( 'removes simple tags', () => {
		expect( stripTags( '<p>hello</p>' ) ).toBe( 'hello' );
	} );

	it( 'keeps stripping until the output is free of tag-like markup', () => {
		// A single `.replace()` pass can leave tag-like sequences behind when
		// the regex matches across boundaries. The loop-until-stable guarantee
		// is that the final output contains no `<...>` substring at all.
		const input = '<<script>script>alert(1)</script>';
		const out = stripTags( input );
		expect( out ).not.toMatch( /<[^>]*>/ );
	} );

	it( 'removes self-closing tags', () => {
		expect( stripTags( 'a<br />b' ) ).toBe( 'ab' );
	} );

	it( 'leaves plain text untouched', () => {
		expect( stripTags( 'hello world' ) ).toBe( 'hello world' );
	} );

	it( 'handles empty string', () => {
		expect( stripTags( '' ) ).toBe( '' );
	} );
} );

describe( 'tokenizeHighlight', () => {
	it( 'returns empty array for missing input', () => {
		expect( tokenizeHighlight( undefined ) ).toEqual( [] );
		expect( tokenizeHighlight( null ) ).toEqual( [] );
		expect( tokenizeHighlight( '' ) ).toEqual( [] );
	} );

	it( 'splits a highlighted string into pieces', () => {
		const pieces = tokenizeHighlight( 'Hello <mark>world</mark>!' );
		expect( pieces ).toEqual( [
			{ index: 0, text: 'Hello ', isHighlight: false },
			{ index: 1, text: 'world', isHighlight: true },
			{ index: 2, text: '!', isHighlight: false },
		] );
	} );

	it( 'joins array snippets with spaces', () => {
		const pieces = tokenizeHighlight( [ 'one <mark>two</mark>', 'three' ] );
		expect( pieces.map( p => p.text ) ).toEqual( [ 'one ', 'two', ' three' ] );
	} );

	it( 'strips non-mark tags from surrounding text', () => {
		const pieces = tokenizeHighlight( '<p>a <mark>b</mark> c</p>' );
		expect( pieces.map( p => p.text ) ).toEqual( [ 'a ', 'b', ' c' ] );
	} );

	it( 'strips tags inside a mark (defense in depth)', () => {
		const pieces = tokenizeHighlight( '<mark><b>b</b></mark>' );
		expect( pieces ).toEqual( [ { index: 0, text: 'b', isHighlight: true } ] );
	} );

	it( 'handles multiple marks', () => {
		const pieces = tokenizeHighlight( '<mark>a</mark> and <mark>b</mark>' );
		expect( pieces.map( p => ( { t: p.text, h: p.isHighlight } ) ) ).toEqual( [
			{ t: 'a', h: true },
			{ t: ' and ', h: false },
			{ t: 'b', h: true },
		] );
	} );

	it( 'drops empty pieces caused by adjacent marks', () => {
		const pieces = tokenizeHighlight( '<mark>a</mark><mark>b</mark>' );
		expect( pieces ).toEqual( [
			{ index: 0, text: 'a', isHighlight: true },
			{ index: 1, text: 'b', isHighlight: true },
		] );
	} );

	it( 'produces sequential indices starting at 0', () => {
		const pieces = tokenizeHighlight( 'x<mark>y</mark>z<mark>w</mark>' );
		expect( pieces.map( p => p.index ) ).toEqual( [ 0, 1, 2, 3 ] );
	} );
} );

describe( 'normalizeResult', () => {
	const RAW = {
		result_id: 'r-42',
		fields: {
			post_id: 42,
			'permalink.url.raw': 'example.com/2026/04/20/hi/',
			'title.default': 'Hello',
			date: '2026-04-20 10:00:00',
			'image.url.raw': 'cdn.example.com/img.jpg',
		},
		highlight: {
			title: '<mark>Hello</mark>',
		},
	};

	it( 'normalizes to the flat shape expected by templates', () => {
		const r = normalizeResult( RAW );
		expect( r ).toMatchObject( {
			id: 'r-42',
			title: 'Hello',
			permalink: '//example.com/2026/04/20/hi/',
			path: '2026 › 04 › 20 › hi',
			imageUrl: '//cdn.example.com/img.jpg',
			hasTitlePieces: true,
		} );
		expect( r.titlePieces ).toEqual( [ { index: 0, text: 'Hello', isHighlight: true } ] );
		expect( r.dateLabel ).toMatch( /Apr 20, 2026/ );
	} );

	it( 'falls back to post_id then permalink for id', () => {
		expect( normalizeResult( { fields: { post_id: 7 } } ).id ).toBe( '7' );
		expect(
			normalizeResult( {
				fields: { 'permalink.url.raw': 'example.com/a/' },
			} ).id
		).toBe( '//example.com/a/' );
	} );

	it( 'hasTitlePieces is true when highlight title contains plain text only', () => {
		const r = normalizeResult( {
			...RAW,
			highlight: { title: 'no highlights here' },
		} );
		// The template should render titlePieces whenever the API returns
		// highlight title tokens, even when none of them contain <mark>.
		expect( r.hasTitlePieces ).toBe( true );
	} );

	it( 'defaults to empty title when both title.default and title are missing', () => {
		expect( normalizeResult( { fields: {} } ).title ).toBe( '' );
	} );

	it( 'takes the first image when image.url.raw is an array', () => {
		const r = normalizeResult( {
			fields: { 'image.url.raw': [ 'cdn.example.com/a.jpg', 'cdn.example.com/b.jpg' ] },
		} );
		expect( r.imageUrl ).toBe( '//cdn.example.com/a.jpg' );
	} );

	it( 'rejects javascript: permalinks', () => {
		const r = normalizeResult( {
			fields: { 'permalink.url.raw': 'javascript:alert(1)' },
		} );
		expect( r.permalink ).toBe( '' );
	} );

	it( 'passes locale through to dateLabel', () => {
		const r = normalizeResult( { fields: { date: '2026-04-20T10:00:00Z' } }, 'fr-FR' );
		expect( r.dateLabel ).toMatch( /20 avr/ );
	} );

	it( 'returns a usable object for a fully empty raw result', () => {
		const r = normalizeResult( {} );
		expect( r ).toEqual( {
			id: '',
			title: '',
			titlePieces: [],
			hasTitlePieces: false,
			permalink: '',
			path: '',
			dateLabel: '',
			author: '',
			imageUrl: '',
		} );
	} );
} );

describe( 'countActiveFilters', () => {
	it( 'returns 0 for empty object', () => {
		expect( countActiveFilters( {} ) ).toBe( 0 );
	} );

	it( 'returns 0 for null / undefined', () => {
		expect( countActiveFilters( null ) ).toBe( 0 );
		expect( countActiveFilters( undefined ) ).toBe( 0 );
	} );

	it( 'sums selected values across all filter keys', () => {
		const active = {
			category: [ 'news', 'opinion' ],
			post_tag: [ 'a' ],
			post_type: [],
		};
		expect( countActiveFilters( active ) ).toBe( 3 );
	} );

	it( 'ignores non-array values defensively', () => {
		expect( countActiveFilters( { category: 'news' } ) ).toBe( 0 );
	} );
} );

describe( 'normalizeResult author', () => {
	it( 'extracts author.name from fields', () => {
		const raw = {
			result_id: '1',
			fields: {
				'permalink.url.raw': 'https://example.com/a',
				'title.default': 'Post',
				'author.name': 'Ada Lovelace',
			},
		};
		expect( normalizeResult( raw ).author ).toBe( 'Ada Lovelace' );
	} );

	it( 'handles author.name as array (v1.3 field shape)', () => {
		const raw = {
			result_id: '1',
			fields: {
				'permalink.url.raw': 'https://example.com/a',
				'title.default': 'Post',
				'author.name': [ 'Ada Lovelace' ],
			},
		};
		expect( normalizeResult( raw ).author ).toBe( 'Ada Lovelace' );
	} );

	it( 'returns empty string when author field is missing', () => {
		const raw = {
			result_id: '1',
			fields: {
				'permalink.url.raw': 'https://example.com/a',
				'title.default': 'Post',
			},
		};
		expect( normalizeResult( raw ).author ).toBe( '' );
	} );
} );
