/**
 * Tests for the Reader repost editor extension.
 *
 * Every value this module consumes arrives from the query string of an editor URL that an
 * attacker can hand to a logged-in user, so each one is treated as untrusted input.
 */

const mockResetEditorBlocks = jest.fn();

jest.mock( '@wordpress/data', () => ( {
	dispatch: () => ( { resetEditorBlocks: mockResetEditorBlocks } ),
} ) );

jest.mock( '@wordpress/blocks', () => ( {
	createBlock: ( name, attributes ) => ( { name, attributes } ),
} ) );

jest.mock( '../wait-for-editor', () => ( {
	waitForEditor: () => Promise.resolve(),
} ) );

/**
 * Loads the module against a real editor URL and returns the blocks it produced.
 *
 * `@wordpress/url` is deliberately left unmocked so the query string is parsed exactly as it
 * would be in the browser — the attack arrives as a URL, so the URL parsing is part of what
 * needs testing. The module runs its work in an async IIFE at import time, so this re-imports
 * it in isolation per case and flushes the task queue before reading the result.
 *
 * @param {string} queryString - Raw query string, without the leading `?`.
 * @return {Promise<Array|null>} The blocks passed to resetEditorBlocks, or null if never called.
 */
async function loadWithQueryString( queryString ) {
	mockResetEditorBlocks.mockClear();
	window.history.replaceState( {}, '', `/wp-admin/post-new.php?${ queryString }` );

	await jest.isolateModulesAsync( async () => {
		require( '../reader-repost' );
		await new Promise( resolve => setTimeout( resolve, 0 ) );
	} );

	return mockResetEditorBlocks.mock.calls.length
		? mockResetEditorBlocks.mock.calls[ 0 ][ 0 ]
		: null;
}

/**
 * Loads the module with the given query args, encoding them into a real URL first.
 *
 * Use `loadWithQueryString` directly for shapes `URLSearchParams` cannot express, such as the
 * bracket syntax that produces array values.
 *
 * @param {object} queryArgs - Query args to encode into the editor URL.
 * @return {Promise<Array|null>} The blocks passed to resetEditorBlocks, or null if never called.
 */
function loadWithQueryArgs( queryArgs ) {
	return loadWithQueryString( new URLSearchParams( queryArgs ).toString() );
}

const getQuoteBlocks = blocks => blocks.filter( block => block.name === 'core/quote' );
const getEmbedBlock = blocks => blocks.find( block => block.name === 'core/embed' );

/**
 * Parses HTML and returns the tag names of every element it actually creates.
 *
 * Escaped markup yields an empty list, which is the property that matters here: the payload
 * is inert text rather than live DOM.
 *
 * @param {string} html - The HTML to parse.
 * @return {string[]} Tag names, uppercased.
 */
function getRenderedTagNames( html ) {
	const doc = document.implementation.createHTMLDocument( '' );
	doc.body.innerHTML = html;
	return Array.from( doc.body.querySelectorAll( '*' ) ).map( element => element.tagName );
}

describe( 'reader-repost', () => {
	describe( 'end to end', () => {
		it( 'produces no executable markup anywhere in the resulting blocks', async () => {
			const blocks = await loadWithQueryArgs( {
				url: 'https://example.com/source',
				comment_content: 'safe',
				comment_author:
					'<iframe srcdoc="<script>top.alert(top.document.domain)</script>">x</iframe>',
			} );

			// No value from the URL may become a live element in any attribute of any block.
			const renderedTags = blocks
				.flatMap( block => Object.values( block.attributes ) )
				.filter( attribute => typeof attribute === 'string' )
				.flatMap( getRenderedTagNames );

			expect( renderedTags ).not.toContain( 'IFRAME' );
			expect( renderedTags ).not.toContain( 'SCRIPT' );
		} );
	} );

	describe( 'comment_author', () => {
		it( 'neutralizes an iframe srcdoc payload', async () => {
			const blocks = await loadWithQueryArgs( {
				url: 'https://example.com/source',
				comment_content: 'safe',
				comment_author:
					'<iframe srcdoc="<script>top.alert(top.document.domain)</script>">x</iframe>',
			} );

			const { citation } = getQuoteBlocks( blocks )[ 0 ].attributes;

			// The payload survives only as inert text: escaping it means no element is built,
			// so there is no frame to load and no script to run.
			expect( getRenderedTagNames( citation ) ).toEqual( [] );
			expect( citation ).toContain( '&lt;iframe' );
		} );

		it( 'escapes the display name rather than treating it as markup', async () => {
			const blocks = await loadWithQueryArgs( {
				url: 'https://example.com/source',
				comment_content: 'safe',
				comment_author: 'Ada & <b>Grace</b>',
			} );

			// escapeHTML() escapes `&` and `<`; `>` is harmless once `<` cannot start a tag.
			expect( getQuoteBlocks( blocks )[ 0 ].attributes.citation ).toBe(
				'Ada &amp; &lt;b>Grace&lt;/b>'
			);
		} );
	} );

	describe( 'comment_content', () => {
		it( 'preserves the formatting the Reader actually sends', async () => {
			const blocks = await loadWithQueryArgs( {
				url: 'https://example.com/source',
				comment_content:
					'<p>First <strong>bold</strong> and <em>italic</em>.</p><p>Second with a <a href="https://example.com/x">link</a>.</p>',
			} );

			const { value } = getQuoteBlocks( blocks )[ 0 ].attributes;

			expect( value ).toContain( '<strong>bold</strong>' );
			expect( value ).toContain( '<em>italic</em>' );
			expect( value ).toContain( '<a href="https://example.com/x">link</a>' );
			expect( value.match( /<p>/g ) ).toHaveLength( 2 );
		} );

		it( 'strips dangerous elements while keeping their text', async () => {
			const blocks = await loadWithQueryArgs( {
				url: 'https://example.com/source',
				comment_content:
					'<p>before</p><iframe srcdoc="<script>alert(1)</script>">x</iframe><p>after</p>',
			} );

			const { value } = getQuoteBlocks( blocks )[ 0 ].attributes;

			// Here the content IS parsed as markup, so assert the iframe is gone from the DOM
			// the value produces — not merely absent from the string.
			expect( getRenderedTagNames( value ) ).toEqual( [ 'P', 'P' ] );
			expect( value ).not.toContain( 'srcdoc' );
			expect( value ).toContain( '<p>before</p>' );
			expect( value ).toContain( '<p>after</p>' );
		} );

		it( 'strips script in foreign content, where tag names keep their case', async () => {
			const blocks = await loadWithQueryArgs( {
				url: 'https://example.com/source',
				comment_content: '<p>before</p><svg><script>alert(1)</script></svg><p>after</p>',
			} );

			const { value } = getQuoteBlocks( blocks )[ 0 ].attributes;

			expect( getRenderedTagNames( value ) ).toEqual( [ 'P', 'P' ] );
			expect( value ).not.toContain( 'alert(1)' );
		} );

		it( 'strips event handler attributes from allowed elements', async () => {
			const blocks = await loadWithQueryArgs( {
				url: 'https://example.com/source',
				comment_content: '<p onmouseover="alert(1)">hover me</p>',
			} );

			const { value } = getQuoteBlocks( blocks )[ 0 ].attributes;

			expect( value ).toBe( '<p>hover me</p>' );
		} );

		it( 'strips HTML comments, which are block delimiters in this destination', async () => {
			// A quote's value is serialized into post content, where `<!-- wp:html -->` is not
			// inert punctuation but a block delimiter: left in place it ends the quote early and
			// opens a block of the attacker's choosing once the victim saves.
			const blocks = await loadWithQueryArgs( {
				url: 'https://example.com/source',
				comment_content: '<p>before</p><!-- /wp:quote --><!-- wp:html --><p>after</p>',
			} );

			const { value } = getQuoteBlocks( blocks )[ 0 ].attributes;

			expect( value ).toBe( '<p>before</p><p>after</p>' );
			expect( value ).not.toContain( '<!--' );
		} );

		it( 'strips HTML comments nested inside an element that is itself unwrapped', async () => {
			const blocks = await loadWithQueryArgs( {
				url: 'https://example.com/source',
				comment_content: '<div><p>text<!-- wp:html --></p></div>',
			} );

			const { value } = getQuoteBlocks( blocks )[ 0 ].attributes;

			expect( value ).toBe( '<p>text</p>' );
			expect( value ).not.toContain( 'wp:html' );
		} );

		it( 'strips angle brackets from free-text attributes, which serialize unescaped', async () => {
			// The same delimiter problem one level down: attribute values are serialized without
			// escaping `<` or `>`, so a delimiter parked in `title` survives a comment-node sweep.
			const blocks = await loadWithQueryArgs( {
				url: 'https://example.com/source',
				comment_content: '<abbr title="<!-- /wp:quote --><!-- wp:html -->">x</abbr>',
			} );

			const { value } = getQuoteBlocks( blocks )[ 0 ].attributes;

			expect( value ).not.toContain( '<!--' );
			expect( value ).toBe( '<abbr title="!-- /wp:quote --!-- wp:html --">x</abbr>' );
		} );

		it( 'strips angle brackets from datetime as well as title', async () => {
			const blocks = await loadWithQueryArgs( {
				url: 'https://example.com/source',
				comment_content: '<del datetime="<!-- wp:html -->">x</del>',
			} );

			const { value } = getQuoteBlocks( blocks )[ 0 ].attributes;

			expect( value ).not.toContain( '<!--' );
		} );

		it( 'keeps the normalized URL, not the raw one, so href cannot smuggle a delimiter', async () => {
			const blocks = await loadWithQueryArgs( {
				url: 'https://example.com/source',
				comment_content: '<a href="https://example.com/?a=<!-- wp:html -->">x</a>',
			} );

			const { value } = getQuoteBlocks( blocks )[ 0 ].attributes;

			expect( value ).not.toContain( '<!--' );
			expect( value ).toContain( '%3C!--' );
		} );

		it( 'keeps the formatting WordPress itself allows in a comment', async () => {
			// The tags in WordPress's $allowedtags (wp-includes/kses.php), which is the set a
			// commenter can actually submit, so all of it must survive the repost round trip.
			const blocks = await loadWithQueryArgs( {
				url: 'https://example.com/source',
				comment_content:
					'<p><a href="https://example.com" title="t">a</a> <abbr title="t">ab</abbr> ' +
					'<acronym title="t">ac</acronym> <b>b</b> <cite>ci</cite> <code>co</code> ' +
					'<del datetime="2026-01-01">d</del> <em>e</em> <i>i</i> ' +
					'<q cite="https://example.com">q</q> <s>s</s> <strike>st</strike> ' +
					'<strong>sr</strong></p><blockquote cite="https://example.com">bq</blockquote>',
			} );

			const { value } = getQuoteBlocks( blocks )[ 0 ].attributes;

			expect( getRenderedTagNames( value ).sort() ).toEqual(
				[
					'A',
					'ABBR',
					'ACRONYM',
					'B',
					'BLOCKQUOTE',
					'CITE',
					'CODE',
					'DEL',
					'EM',
					'I',
					'P',
					'Q',
					'S',
					'STRIKE',
					'STRONG',
				].sort()
			);

			// Allowlisted attributes survive alongside their tags.
			expect( value ).toContain( 'title="t"' );
			expect( value ).toContain( 'datetime="2026-01-01"' );
			// Normalized rather than preserved verbatim: keeping the parsed form is what stops a
			// raw value from carrying angle brackets into the markup, at the cost of cosmetic
			// rewrites like this added trailing slash.
			expect( value ).toContain( 'cite="https://example.com/"' );
		} );

		it( 'drops javascript: URLs from cite as well as href', async () => {
			const blocks = await loadWithQueryArgs( {
				url: 'https://example.com/source',
				comment_content: '<blockquote cite="javascript:alert(1)">quoted</blockquote>',
			} );

			const { value } = getQuoteBlocks( blocks )[ 0 ].attributes;

			expect( value ).not.toContain( 'javascript:' );
			expect( value ).toContain( 'quoted' );
		} );

		it( 'drops javascript: hrefs that the tag allowlist alone would keep', async () => {
			const blocks = await loadWithQueryArgs( {
				url: 'https://example.com/source',
				comment_content: '<p><a href="javascript:alert(1)">click</a></p>',
			} );

			const { value } = getQuoteBlocks( blocks )[ 0 ].attributes;

			expect( value ).not.toContain( 'javascript:' );
			expect( value ).toContain( 'click' );
		} );
	} );

	describe( 'malformed query args', () => {
		it( 'still builds blocks when a value arrives as an array rather than a string', async () => {
			// `getQueryArgs()` parses `?text[]=a&text[]=b` into an array, so the values are not
			// guaranteed to be strings. Treating one as a string would throw and abandon the
			// repost entirely.
			const blocks = await loadWithQueryString(
				'url=https%3A%2F%2Fexample.com%2Fa&text[]=x&text[]=y&title[k]=v'
			);

			expect( blocks ).not.toBeNull();
			expect( getEmbedBlock( blocks ).attributes.url ).toBe( 'https://example.com/a' );
		} );

		it( 'ignores a non-string comment_content instead of throwing', async () => {
			const blocks = await loadWithQueryString(
				'url=https%3A%2F%2Fexample.com%2Fa&comment_content[]=x'
			);

			expect( blocks ).not.toBeNull();
			expect( getQuoteBlocks( blocks ) ).toHaveLength( 0 );
		} );
	} );

	describe( 'url', () => {
		it( 'round-trips a multi-parameter URL through the citation href', async () => {
			const blocks = await loadWithQueryArgs( {
				url: 'https://example.com/post?a=1&b=2',
				title: 'Title',
				text: 'Some text',
			} );

			const { citation } = getQuoteBlocks( blocks )[ 0 ].attributes;

			// The `&` must be escaped in the source so the attribute is well-formed, and must
			// decode back to a single `&` when parsed — not to `&amp;` or a dropped parameter.
			expect( citation ).toContain( '&amp;b=2' );

			// Parsed in this document rather than a detached one, so jest-dom's element check
			// passes; `innerHTML` still never executes scripts.
			const container = document.createElement( 'div' );
			container.innerHTML = citation;
			expect( container.querySelector( 'a' ) ).toHaveAttribute(
				'href',
				'https://example.com/post?a=1&b=2'
			);
		} );

		it( 'refuses to build any blocks for a javascript: URL', async () => {
			const blocks = await loadWithQueryArgs( { url: 'javascript:alert(1)' } );

			expect( blocks ).toBeNull();
		} );

		it( 'refuses to build any blocks for a data: URL', async () => {
			const blocks = await loadWithQueryArgs( {
				url: 'data:text/html,<script>alert(1)</script>',
			} );

			expect( blocks ).toBeNull();
		} );

		it( 'passes a normalized http(s) URL through to the embed', async () => {
			const blocks = await loadWithQueryArgs( { url: 'https://example.com/post' } );

			expect( getEmbedBlock( blocks ).attributes.url ).toBe( 'https://example.com/post' );
		} );

		it( 'prevents a quote from breaking out of the citation href attribute', async () => {
			const blocks = await loadWithQueryArgs( {
				url: 'https://example.com/?a="><img src=x onerror=alert(1)>',
				title: 'Title',
				text: 'Some text',
			} );

			const { citation } = getQuoteBlocks( blocks )[ 0 ].attributes;

			// URL normalization percent-encodes the quote before escapeAttribute() sees it,
			// so the attribute cannot be closed early either way.
			expect( citation ).not.toContain( '<img' );
			expect( citation ).not.toMatch( /href="[^"]*"[^>]/ );
			expect( citation ).toContain( '%22' );
		} );
	} );

	describe( 'title and text', () => {
		it( 'escapes both instead of interpolating them as markup', async () => {
			const blocks = await loadWithQueryArgs( {
				url: 'https://example.com/source',
				title: '<img src=x onerror=alert(1)>',
				text: '<script>alert(1)</script>',
			} );

			const { value, citation } = getQuoteBlocks( blocks )[ 0 ].attributes;

			expect( value ).toBe( '<p>&lt;script>alert(1)&lt;/script></p>' );
			expect( citation ).toContain( '&lt;img src=x onerror=alert(1)>' );
			expect( citation ).not.toContain( '<img' );
		} );
	} );
} );
