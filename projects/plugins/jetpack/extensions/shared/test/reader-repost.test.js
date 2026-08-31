/**
 * Tests for the Reader repost editor extension.
 *
 * The quote blocks it builds have to carry their body in inner blocks: `core/quote` stopped
 * rendering its `value` attribute in WordPress 6.1, and what replaced it only picks up content
 * already inside a top-level `<p>`.
 */

const mockResetEditorBlocks = jest.fn();

jest.mock( '@wordpress/data', () => ( {
	dispatch: () => ( { resetEditorBlocks: mockResetEditorBlocks } ),
} ) );

jest.mock( '@wordpress/blocks', () => ( {
	createBlock: ( name, attributes = {}, innerBlocks = [] ) => ( {
		name,
		attributes,
		innerBlocks,
	} ),
} ) );

jest.mock( '../wait-for-editor', () => ( {
	waitForEditor: () => Promise.resolve(),
} ) );

/**
 * Loads the module against a real editor URL and returns the blocks it produced.
 *
 * The module runs its work in an async IIFE at import time, so this re-imports it in isolation
 * per case and flushes the task queue before reading the result.
 *
 * @param {object} queryArgs - Query args to encode into the editor URL.
 * @return {Promise<Array|null>} The blocks passed to resetEditorBlocks, or null if never called.
 */
async function loadWithQueryArgs( queryArgs ) {
	mockResetEditorBlocks.mockClear();
	window.history.replaceState(
		{},
		'',
		`/wp-admin/post-new.php?${ new URLSearchParams( queryArgs ).toString() }`
	);

	await jest.isolateModulesAsync( async () => {
		require( '../reader-repost' );
		await new Promise( resolve => setTimeout( resolve, 0 ) );
	} );

	return mockResetEditorBlocks.mock.calls.length
		? mockResetEditorBlocks.mock.calls[ 0 ][ 0 ]
		: null;
}

const getQuoteBlocks = blocks => blocks.filter( block => block.name === 'core/quote' );
const getParagraphContents = quote =>
	quote.innerBlocks.map( ( { name, attributes } ) => {
		expect( name ).toBe( 'core/paragraph' );
		return attributes.content;
	} );

describe( 'reader-repost', () => {
	it( 'never sets the deprecated value attribute on a quote', async () => {
		const blocks = await loadWithQueryArgs( {
			url: 'https://example.com/source',
			title: 'T1',
			text: 'BODY1',
			comment_content: 'PLAINTEXTONLY',
			comment_author: 'AUTH1',
		} );

		getQuoteBlocks( blocks ).forEach( quote => {
			expect( quote.attributes ).not.toHaveProperty( 'value' );
		} );
	} );

	describe( 'comment_content', () => {
		it( 'keeps a plain text body, which the value attribute dropped entirely', async () => {
			const blocks = await loadWithQueryArgs( {
				url: 'https://example.com/source',
				comment_content: 'PLAINTEXTONLY',
				comment_author: 'AUTH1',
			} );

			const [ quote ] = getQuoteBlocks( blocks );

			expect( getParagraphContents( quote ) ).toEqual( [ 'PLAINTEXTONLY' ] );
			expect( quote.attributes.citation ).toBe( 'AUTH1' );
		} );

		it( 'keeps a body that is inline markup with no paragraph of its own', async () => {
			const blocks = await loadWithQueryArgs( {
				url: 'https://example.com/source',
				comment_content: '<a href="https://example.com/x">LINKONLY</a>',
			} );

			expect( getParagraphContents( getQuoteBlocks( blocks )[ 0 ] ) ).toEqual( [
				'<a href="https://example.com/x">LINKONLY</a>',
			] );
		} );

		it( 'splits the rendered, wpautop-ed HTML the Reader sends into one block per paragraph', async () => {
			const blocks = await loadWithQueryArgs( {
				url: 'https://example.com/source',
				comment_content: '<p>First <strong>bold</strong>.</p><p>Second.</p>',
			} );

			expect( getParagraphContents( getQuoteBlocks( blocks )[ 0 ] ) ).toEqual( [
				'First <strong>bold</strong>.',
				'Second.',
			] );
		} );

		it( 'keeps line breaks inside a paragraph', async () => {
			const blocks = await loadWithQueryArgs( {
				url: 'https://example.com/source',
				comment_content: '<p>LINE1<br>LINE2</p>',
			} );

			expect( getParagraphContents( getQuoteBlocks( blocks )[ 0 ] ) ).toEqual( [
				'LINE1<br>LINE2',
			] );
		} );

		it( 'keeps both halves of a body that mixes loose content and paragraphs', async () => {
			const blocks = await loadWithQueryArgs( {
				url: 'https://example.com/source',
				comment_content: 'loose <em>text</em><p>PARA</p>',
			} );

			expect( getParagraphContents( getQuoteBlocks( blocks )[ 0 ] ) ).toEqual( [
				'loose <em>text</em>',
				'PARA',
			] );
		} );

		it( 'emits no quote at all when the body has nothing to show', async () => {
			const blocks = await loadWithQueryArgs( {
				url: 'https://example.com/source',
				comment_content: '   ',
				comment_author: 'AUTH1',
			} );

			// A quote of nothing, credited to someone, is worse than no quote at all.
			expect( getQuoteBlocks( blocks ) ).toHaveLength( 0 );
			expect( blocks.map( block => block.name ) ).toEqual( [ 'core/embed' ] );
		} );
	} );

	describe( 'text', () => {
		it( 'puts the reposted text in a paragraph and links the source in the citation', async () => {
			const blocks = await loadWithQueryArgs( {
				url: 'https://example.com/source',
				title: 'T1',
				text: 'BODY1',
			} );

			const [ quote ] = getQuoteBlocks( blocks );

			expect( getParagraphContents( quote ) ).toEqual( [ 'BODY1' ] );
			expect( quote.attributes.citation ).toBe( '<a href="https://example.com/source">T1</a>' );
		} );

		it( 'skips the text quote when it only repeats the title', async () => {
			const blocks = await loadWithQueryArgs( {
				url: 'https://example.com/source',
				title: 'SAME',
				text: 'SAME',
			} );

			expect( getQuoteBlocks( blocks ) ).toHaveLength( 0 );
		} );
	} );
} );
