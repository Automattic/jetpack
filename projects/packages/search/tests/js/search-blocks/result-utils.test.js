import {
	countActiveFilters,
	decodeEntities,
	deriveMatchHint,
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

describe( 'decodeEntities', () => {
	it( 'decodes numeric entities', () => {
		expect( decodeEntities( '&#036;' ) ).toBe( '$' );
		expect( decodeEntities( '&#8217;' ) ).toBe( '’' );
	} );

	it( 'decodes hex entities (case-insensitive)', () => {
		expect( decodeEntities( '&#x24;' ) ).toBe( '$' );
		expect( decodeEntities( '&#X2019;' ) ).toBe( '’' );
	} );

	it( 'decodes the supported named entities', () => {
		expect( decodeEntities( '&amp;' ) ).toBe( '&' );
		expect( decodeEntities( '&lt;' ) ).toBe( '<' );
		expect( decodeEntities( '&gt;' ) ).toBe( '>' );
		expect( decodeEntities( '&quot;' ) ).toBe( '"' );
		expect( decodeEntities( '&apos;' ) ).toBe( "'" );
		expect( decodeEntities( '&nbsp;' ) ).toBe( ' ' );
	} );

	it( 'leaves unknown named entities untouched', () => {
		// `&copy;` and friends aren't mapped — better to leave the raw entity
		// than to silently drop it.
		expect( decodeEntities( '&copy; 2026' ) ).toBe( '&copy; 2026' );
	} );

	it( 'drops invalid numeric code points instead of throwing', () => {
		expect( decodeEntities( '&#9999999999;' ) ).toBe( '' );
	} );

	it( 'leaves plain text untouched', () => {
		expect( decodeEntities( 'hello world' ) ).toBe( 'hello world' );
	} );

	it( 'returns non-string input unchanged', () => {
		expect( decodeEntities( '' ) ).toBe( '' );
		expect( decodeEntities( null ) ).toBeNull();
		expect( decodeEntities( undefined ) ).toBeUndefined();
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

	it( 'flattens an HTML-formatted WC price into plain text', () => {
		const wcPrice =
			'<span class="woocommerce-Price-amount amount">' +
			'<span class="woocommerce-Price-currencySymbol">&#036;</span>11.05</span>';
		expect( stripTags( wcPrice ) ).toBe( '$11.05' );
	} );

	it( 'decodes entities while stripping tags', () => {
		expect( stripTags( 'Joe&#039;s &amp; Co' ) ).toBe( "Joe's & Co" );
	} );

	it( 'strips entity-encoded tags via the decode → strip loop', () => {
		// `&lt;script&gt;…&lt;/script&gt;` would survive a single tag-strip pass;
		// the loop decodes the entities into real `<script>` tags first, then
		// strips them on the next iteration.
		expect( stripTags( '&lt;script&gt;alert(1)&lt;/script&gt;' ) ).toBe( 'alert(1)' );
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

describe( 'deriveMatchHint', () => {
	it( 'returns empty string when there are no highlights at all', () => {
		expect( deriveMatchHint( {}, [] ) ).toBe( '' );
	} );

	it( 'returns empty string when the title itself is highlighted', () => {
		const titlePieces = [ { index: 0, text: 'Hello', isHighlight: true } ];
		const highlight = { title: '<mark>Hello</mark>', content: [ 'match here' ] };
		expect( deriveMatchHint( highlight, titlePieces ) ).toBe( '' );
	} );

	it( 'returns "content" when a non-title field is highlighted and title is not', () => {
		const titlePieces = [ { index: 0, text: 'Hello', isHighlight: false } ];
		const highlight = { title: 'Hello', content: [ 'some <mark>match</mark>' ] };
		expect( deriveMatchHint( highlight, titlePieces ) ).toBe( 'content' );
	} );

	it( 'returns "comments" when the comment field is highlighted and title is not', () => {
		const titlePieces = [ { index: 0, text: 'Hello', isHighlight: false } ];
		const highlight = { comment: [ 'comment <mark>match</mark>' ] };
		expect( deriveMatchHint( highlight, titlePieces ) ).toBe( 'comments' );
	} );

	it( 'returns "comments" (not "content") when both comment and content are highlighted but title is not', () => {
		const titlePieces = [];
		const highlight = {
			content: [ 'body <mark>word</mark>' ],
			comment: [ 'comment <mark>word</mark>' ],
		};
		expect( deriveMatchHint( highlight, titlePieces ) ).toBe( 'comments' );
	} );

	it( 'returns empty string when highlight values are empty arrays', () => {
		expect( deriveMatchHint( { content: [] }, [] ) ).toBe( '' );
	} );

	it( 'returns empty string when highlight values are arrays with empty first entry', () => {
		expect( deriveMatchHint( { content: [ '' ] }, [] ) ).toBe( '' );
	} );

	it( 'returns empty string when highlight is null', () => {
		expect( deriveMatchHint( null, [] ) ).toBe( '' );
	} );

	it( 'returns empty string when titlePieces is empty and no non-title highlights exist', () => {
		expect( deriveMatchHint( { title: '<mark>Hello</mark>' }, [] ) ).toBe( '' );
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
			hasContentPieces: false,
		} );
		expect( r.titlePieces ).toEqual( [ { index: 0, text: 'Hello', isHighlight: true } ] );
		expect( r.contentPieces ).toEqual( [] );
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

	it( 'exposes contentPieces from highlight.content', () => {
		const r = normalizeResult( {
			...RAW,
			highlight: {
				title: '<mark>Hello</mark>',
				content: 'The quick <mark>brown fox</mark> jumped.',
			},
		} );
		expect( r.hasContentPieces ).toBe( true );
		expect( r.contentPieces ).toEqual( [
			{ index: 0, text: 'The quick ', isHighlight: false },
			{ index: 1, text: 'brown fox', isHighlight: true },
			{ index: 2, text: ' jumped.', isHighlight: false },
		] );
	} );

	it( 'joins array content snippets into a single tokenized sequence', () => {
		const r = normalizeResult( {
			fields: {},
			highlight: {
				content: [ 'First <mark>match</mark>', 'second snippet' ],
			},
		} );
		expect( r.hasContentPieces ).toBe( true );
		expect( r.contentPieces.map( p => p.text ) ).toEqual( [
			'First ',
			'match',
			' second snippet',
		] );
		// Verify the highlight flag is preserved across the joined snippets.
		expect( r.contentPieces[ 1 ].isHighlight ).toBe( true );
		expect( r.contentPieces[ 0 ].isHighlight ).toBe( false );
		expect( r.contentPieces[ 2 ].isHighlight ).toBe( false );
	} );

	it( 'hasContentPieces is false when highlight.content is missing', () => {
		const r = normalizeResult( { ...RAW, highlight: { title: '<mark>Hello</mark>' } } );
		expect( r.hasContentPieces ).toBe( false );
		expect( r.contentPieces ).toEqual( [] );
	} );

	it( 'defaults to empty title when both title.default and title are missing', () => {
		expect( normalizeResult( { fields: {} } ).title ).toBe( '' );
	} );

	it( 'flattens HTML/entities in the fallback title', () => {
		// `data-wp-text` would otherwise render the raw markup. Post titles
		// most commonly carry numeric entities for curly punctuation.
		const r = normalizeResult( {
			fields: { 'title.default': 'Joe&#8217;s &amp; <em>Co</em>' },
		} );
		expect( r.title ).toBe( 'Joe’s & Co' );
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
			contentPieces: [],
			hasContentPieces: false,
			permalink: '',
			path: '',
			dateLabel: '',
			imageUrl: '',
			imageBackgroundImage: '',
			matchHint: '',
			matchHintIsComments: false,
			formattedPrice: '',
			formattedRegularPrice: '',
			formattedSalePrice: '',
			hasSalePrice: false,
			hasPrice: false,
			rating: 0,
			ratingPercent: '0%',
			reviewCount: 0,
			reviewCountLabel: '',
			ratingAriaLabel: '',
			hasRating: false,
		} );
	} );

	it( 'exposes a CSS-ready url() for the product image', () => {
		const r = normalizeResult( {
			fields: { 'image.url.raw': 'cdn.example.com/p.jpg' },
		} );
		expect( r.imageBackgroundImage ).toBe( 'url(//cdn.example.com/p.jpg)' );
	} );

	describe( 'product fields', () => {
		it( 'exposes formatted prices for non-sale items', () => {
			const r = normalizeResult( {
				fields: {
					'wc.formatted_price': '$24.00',
					'wc.formatted_regular_price': '$24.00',
				},
			} );
			expect( r.formattedPrice ).toBe( '$24.00' );
			expect( r.hasPrice ).toBe( true );
			expect( r.hasSalePrice ).toBe( false );
		} );

		it( 'flattens HTML-formatted prices the WPCOM API returns for WC products', () => {
			// WPCOM's `wc.formatted_price` field is the HTML fragment WC renders
			// in the storefront — it leaks into the result card unless we strip
			// the tags and decode `&#036;` / `&nbsp;` before binding via
			// `data-wp-text`.
			const r = normalizeResult( {
				fields: {
					'wc.formatted_price':
						'<span class="woocommerce-Price-amount amount">' +
						'<span class="woocommerce-Price-currencySymbol">&#036;</span>11.05</span>',
					'wc.formatted_regular_price':
						'<span class="woocommerce-Price-amount amount">' +
						'<span class="woocommerce-Price-currencySymbol">&#036;</span>20.00</span>',
					'wc.formatted_sale_price':
						'<span class="woocommerce-Price-amount amount">' +
						'<span class="woocommerce-Price-currencySymbol">&#036;</span>11.05</span>',
				},
			} );
			expect( r.formattedPrice ).toBe( '$11.05' );
			expect( r.formattedRegularPrice ).toBe( '$20.00' );
			expect( r.formattedSalePrice ).toBe( '$11.05' );
			expect( r.hasSalePrice ).toBe( true );
		} );

		it( 'flags hasSalePrice when sale and regular prices differ', () => {
			const r = normalizeResult( {
				fields: {
					'wc.formatted_price': '$19.99',
					'wc.formatted_regular_price': '$30.00',
					'wc.formatted_sale_price': '$19.99',
				},
			} );
			expect( r.hasSalePrice ).toBe( true );
			expect( r.formattedRegularPrice ).toBe( '$30.00' );
			expect( r.formattedSalePrice ).toBe( '$19.99' );
		} );

		it( 'does not flag hasSalePrice when sale equals regular (display safety)', () => {
			const r = normalizeResult( {
				fields: {
					'wc.formatted_regular_price': '$10.00',
					'wc.formatted_sale_price': '$10.00',
				},
			} );
			expect( r.hasSalePrice ).toBe( false );
		} );

		it( 'clamps rating to [0, 5] and converts to a percentage', () => {
			expect(
				normalizeResult( { fields: { 'meta._wc_average_rating.double': 4.5 } } ).ratingPercent
			).toBe( '90%' );
			expect(
				normalizeResult( { fields: { 'meta._wc_average_rating.double': -1 } } ).ratingPercent
			).toBe( '0%' );
			expect(
				normalizeResult( { fields: { 'meta._wc_average_rating.double': 9 } } ).ratingPercent
			).toBe( '100%' );
		} );

		it( 'unwraps the first scalar from array-typed meta fields', () => {
			const r = normalizeResult( {
				fields: {
					'meta._wc_average_rating.double': [ 4.0 ],
					'meta._wc_review_count.long': [ 42 ],
				},
			} );
			expect( r.rating ).toBe( 4 );
			expect( r.reviewCount ).toBe( 42 );
			expect( r.hasRating ).toBe( true );
			expect( r.reviewCountLabel ).toBe( '(42)' );
		} );

		it( 'leaves rating fields zeroed when the field is missing', () => {
			const r = normalizeResult( { fields: {} } );
			expect( r.rating ).toBe( 0 );
			expect( r.hasRating ).toBe( false );
			expect( r.reviewCountLabel ).toBe( '' );
			expect( r.ratingAriaLabel ).toBe( '' );
		} );

		it( 'composes a screen-reader label that includes both rating and review count', () => {
			const r = normalizeResult( {
				fields: {
					'meta._wc_average_rating.double': 4.5,
					'meta._wc_review_count.long': 42,
				},
			} );
			expect( r.ratingAriaLabel ).toBe( '4.5 out of 5 stars based on 42 reviews' );
		} );

		it( 'uses the singular form when there is exactly one review', () => {
			const r = normalizeResult( {
				fields: {
					'meta._wc_average_rating.double': 5,
					'meta._wc_review_count.long': 1,
				},
			} );
			expect( r.ratingAriaLabel ).toBe( '5 out of 5 stars based on 1 review' );
		} );

		it( 'omits the review count clause when reviewCount is zero but a rating exists', () => {
			const r = normalizeResult( {
				fields: { 'meta._wc_average_rating.double': 4 },
			} );
			expect( r.ratingAriaLabel ).toBe( '4 out of 5 stars' );
		} );
	} );

	it( 'does not expose author data from the API response', () => {
		const raw = {
			result_id: '1',
			fields: {
				'permalink.url.raw': 'https://example.com/a',
				'title.default': 'Post',
				'author.name': 'Ada Lovelace',
			},
		};
		expect( normalizeResult( raw ) ).not.toHaveProperty( 'author' );
	} );

	it( 'exposes matchHint="content" when a non-title field is highlighted but the title is not', () => {
		const r = normalizeResult( {
			fields: { 'title.default': 'Hello' },
			highlight: {
				title: 'Hello',
				content: [ 'some <mark>match</mark>' ],
			},
		} );
		expect( r.matchHint ).toBe( 'content' );
		expect( r.matchHintIsComments ).toBe( false );
	} );

	it( 'exposes matchHint="comments" when the comment field is highlighted but the title is not', () => {
		const r = normalizeResult( {
			fields: { 'title.default': 'Hello' },
			highlight: {
				comment: [ 'a <mark>match</mark> in comments' ],
			},
		} );
		expect( r.matchHint ).toBe( 'comments' );
		expect( r.matchHintIsComments ).toBe( true );
	} );

	it( 'exposes matchHint="" when the title itself is highlighted', () => {
		const r = normalizeResult( {
			fields: { 'title.default': 'Hello' },
			highlight: {
				title: '<mark>Hello</mark>',
				content: [ 'also <mark>here</mark>' ],
			},
		} );
		expect( r.matchHint ).toBe( '' );
		expect( r.matchHintIsComments ).toBe( false );
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
