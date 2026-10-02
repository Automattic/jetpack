import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { JSDOM } from 'jsdom';
import {
	createEmptyQuote,
	insertLeadingParagraph,
	isCaretAtQuoteStart,
	isCaretAtStartOfFirstLine,
	liftFirstQuoteLine,
	unwrapQuote,
	wrapLooseQuoteContent,
} from '../quote-editing.js';

let document;

beforeEach( () => {
	document = new JSDOM( '<!doctype html><div id="content"></div>' ).window.document;
} );

/**
 * Render markup into the editor content element.
 *
 * @param {string} html - Editor markup.
 * @return {HTMLElement} The content element.
 */
function render( html ) {
	const content = document.getElementById( 'content' );
	content.innerHTML = html;
	return content;
}

/**
 * Build a collapsed range at a node and offset.
 *
 * @param {Node}   node   - Boundary node.
 * @param {number} offset - Boundary offset.
 * @return {Range} The collapsed range.
 */
function caretAt( node, offset ) {
	const range = document.createRange();
	range.setStart( node, offset );
	range.collapse( true );
	return range;
}

describe( 'isCaretAtStartOfFirstLine', () => {
	it( 'is true at the start of a paragraph', () => {
		const p = render( '<p>text</p>' ).firstChild;
		assert.equal( isCaretAtStartOfFirstLine( p, caretAt( p.firstChild, 0 ) ), true );
	} );

	it( 'is false after a line break at the start of a paragraph', () => {
		const p = render( '<p><br>text</p>' ).firstChild;
		assert.equal( isCaretAtStartOfFirstLine( p, caretAt( p.lastChild, 0 ) ), false );
	} );
} );

describe( 'isCaretAtQuoteStart', () => {
	it( 'is true at the start of the first line', () => {
		const bq = render( '<blockquote><p>quote</p></blockquote>' ).firstChild;
		assert.equal(
			isCaretAtQuoteStart( bq, caretAt( bq.querySelector( 'p' ).firstChild, 0 ) ),
			true
		);
	} );

	it( 'is true in an empty first line', () => {
		const bq = render( '<blockquote><p><br></p><p>quote</p></blockquote>' ).firstChild;
		assert.equal( isCaretAtQuoteStart( bq, caretAt( bq.firstChild, 0 ) ), true );
	} );

	it( 'is true at the start of a quote whose text is not wrapped in a paragraph', () => {
		const bq = render( '<blockquote>quote</blockquote>' ).firstChild;
		assert.equal( isCaretAtQuoteStart( bq, caretAt( bq.firstChild, 0 ) ), true );
	} );

	it( 'is false in the middle of the first line', () => {
		const bq = render( '<blockquote><p>quote</p></blockquote>' ).firstChild;
		assert.equal(
			isCaretAtQuoteStart( bq, caretAt( bq.querySelector( 'p' ).firstChild, 2 ) ),
			false
		);
	} );

	it( 'is false at the start of the second line after an empty first line', () => {
		const bq = render( '<blockquote><p><br></p><p>quote</p></blockquote>' ).firstChild;
		assert.equal( isCaretAtQuoteStart( bq, caretAt( bq.lastChild.firstChild, 0 ) ), false );
	} );

	it( 'is false at the start of the second line after a line with no <br>', () => {
		const bq = render( '<blockquote><p></p><p>quote</p></blockquote>' ).firstChild;
		assert.equal( isCaretAtQuoteStart( bq, caretAt( bq.lastChild.firstChild, 0 ) ), false );
	} );

	it( 'is false after a line break in unwrapped text', () => {
		const bq = render( '<blockquote><br>quote</blockquote>' ).firstChild;
		assert.equal( isCaretAtQuoteStart( bq, caretAt( bq.lastChild, 0 ) ), false );
	} );

	it( 'is false inside the citation', () => {
		const bq = render( '<blockquote><cite>Someone</cite></blockquote>' ).firstChild;
		assert.equal(
			isCaretAtQuoteStart( bq, caretAt( bq.querySelector( 'cite' ).firstChild, 0 ) ),
			false
		);
	} );

	it( 'is false for a non-collapsed selection', () => {
		const bq = render( '<blockquote><p>quote</p></blockquote>' ).firstChild;
		const range = caretAt( bq.querySelector( 'p' ).firstChild, 0 );
		range.setEnd( bq.querySelector( 'p' ).firstChild, 3 );
		assert.equal( isCaretAtQuoteStart( bq, range ), false );
	} );
} );

describe( 'liftFirstQuoteLine', () => {
	it( 'moves an empty first line above the quote', () => {
		const content = render(
			'<blockquote><p><br></p><p>quote</p><cite>Someone</cite></blockquote>'
		);
		const lifted = liftFirstQuoteLine( content.firstChild );
		assert.equal(
			content.innerHTML,
			'<p><br></p><blockquote><p>quote</p><cite>Someone</cite></blockquote>'
		);
		assert.equal( lifted, content.firstChild );
	} );

	it( 'moves a first line with text above the quote', () => {
		const content = render( '<p>before</p><blockquote><p>one</p><p>two</p></blockquote>' );
		liftFirstQuoteLine( content.querySelector( 'blockquote' ) );
		assert.equal( content.innerHTML, '<p>before</p><p>one</p><blockquote><p>two</p></blockquote>' );
	} );

	it( 'wraps unwrapped quote text in a paragraph when moving it out', () => {
		const content = render( '<blockquote>quote<br>more<p>next</p></blockquote>' );
		liftFirstQuoteLine( content.firstChild );
		assert.equal( content.innerHTML, '<p>quote<br>more</p><blockquote><p>next</p></blockquote>' );
	} );

	it( 'removes a quote left with only an empty citation placeholder', () => {
		const content = render(
			'<blockquote><p>quote</p><cite data-placeholder="x"></cite></blockquote>'
		);
		liftFirstQuoteLine( content.firstChild );
		assert.equal( content.innerHTML, '<p>quote</p>' );
	} );

	it( 'removes an empty quote even when it has a citation', () => {
		const content = render( '<blockquote><p><br></p><cite>Someone</cite></blockquote>' );
		const lifted = liftFirstQuoteLine( content.firstChild );
		assert.equal( content.innerHTML, '<p><br></p>' );
		assert.equal( lifted, content.firstChild );
	} );

	it( 'keeps a filled citation when the only line moves out', () => {
		const content = render( '<blockquote><p>quote</p><cite>Someone</cite></blockquote>' );
		liftFirstQuoteLine( content.firstChild );
		assert.equal(
			content.innerHTML,
			'<p>quote</p><blockquote><p><br></p><cite>Someone</cite></blockquote>'
		);
	} );

	it( 'returns null when the quote has no body to move', () => {
		const content = render( '<blockquote><cite>Someone</cite></blockquote>' );
		assert.equal( liftFirstQuoteLine( content.firstChild ), null );
		assert.equal( content.innerHTML, '<blockquote><cite>Someone</cite></blockquote>' );
	} );
} );

describe( 'wrapLooseQuoteContent', () => {
	it( 'wraps bare quote text in a paragraph, leaving the citation alone', () => {
		const content = render( '<blockquote>quote <b>bold</b><cite>Someone</cite></blockquote>' );
		wrapLooseQuoteContent( content.firstChild );
		assert.equal(
			content.innerHTML,
			'<blockquote><p>quote <b>bold</b></p><cite>Someone</cite></blockquote>'
		);
	} );

	it( 'moves the existing text node so a caret inside it can be restored', () => {
		const bq = render( '<blockquote>quote</blockquote>' ).firstChild;
		const text = bq.firstChild;
		wrapLooseQuoteContent( bq );
		assert.equal( bq.querySelector( 'p' ).firstChild, text );
	} );
} );

describe( 'unwrapQuote', () => {
	it( 'turns every line and a filled citation into paragraphs', () => {
		const content = render(
			'<p>before</p><blockquote><p>one</p><p>two</p><cite>Someone</cite></blockquote><p>after</p>'
		);
		unwrapQuote( content.querySelector( 'blockquote' ) );
		assert.equal(
			content.innerHTML,
			'<p>before</p><p>one</p><p>two</p><p>Someone</p><p>after</p>'
		);
	} );

	it( 'wraps bare text and drops an empty citation placeholder', () => {
		const content = render( '<blockquote>quote<cite data-placeholder="x"></cite></blockquote>' );
		unwrapQuote( content.firstChild );
		assert.equal( content.innerHTML, '<p>quote</p>' );
	} );

	it( 'returns the first paragraph', () => {
		const content = render( '<blockquote><p>one</p><p>two</p></blockquote>' );
		assert.equal( unwrapQuote( content.firstChild ), content.firstChild );
	} );
} );

describe( 'createEmptyQuote', () => {
	it( 'wraps the empty line in a paragraph', () => {
		assert.equal( createEmptyQuote( document ).outerHTML, '<blockquote><p><br></p></blockquote>' );
	} );
} );

describe( 'insertLeadingParagraph', () => {
	it( 'adds an empty paragraph above a leading quote', () => {
		const content = render( '<blockquote><p>prompt</p></blockquote>' );
		const p = insertLeadingParagraph( content );
		assert.equal( content.innerHTML, '<p><br></p><blockquote><p>prompt</p></blockquote>' );
		assert.equal( p, content.firstChild );
	} );

	it( 'adds an empty paragraph above a leading heading', () => {
		const content = render( '<h2>Title</h2><p>text</p>' );
		insertLeadingParagraph( content );
		assert.equal( content.innerHTML, '<p><br></p><h2>Title</h2><p>text</p>' );
	} );

	it( 'leaves a post that already starts with a paragraph alone', () => {
		const content = render( '<p>text</p><blockquote><p>quote</p></blockquote>' );
		assert.equal( insertLeadingParagraph( content ), null );
		assert.equal( content.innerHTML, '<p>text</p><blockquote><p>quote</p></blockquote>' );
	} );

	it( 'leaves an empty editor alone', () => {
		const content = render( '' );
		assert.equal( insertLeadingParagraph( content ), null );
		assert.equal( content.innerHTML, '' );
	} );
} );
