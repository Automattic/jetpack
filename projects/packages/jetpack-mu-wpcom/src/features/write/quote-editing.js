/**
 * Write — quote editing helpers.
 *
 * Pure DOM module: no Interactivity API or editor state dependencies.
 * Backspace and title-Enter behaviour mirrors the block editor's core/quote.
 */

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const LINE_TAGS = /^(P|DIV|H[1-6])$/;

/**
 * Create a paragraph holding only a <br>, the shape contentEditable gives an empty line.
 *
 * @param {Document} doc - The document to create the paragraph in.
 * @return {HTMLElement} The empty paragraph.
 */
function createEmptyParagraph( doc ) {
	const p = doc.createElement( 'p' );
	p.appendChild( doc.createElement( 'br' ) );
	return p;
}

/**
 * Whether a node shows anything: text, or media such as an image.
 *
 * @param {Node} node - The node to check.
 * @return {boolean} Whether the node has visible content.
 */
function hasVisibleContent( node ) {
	if ( node.textContent.trim() ) {
		return true;
	}
	return (
		node.nodeType === ELEMENT_NODE &&
		( /^(IMG|VIDEO|IFRAME)$/.test( node.tagName ) || !! node.querySelector( 'img, video, iframe' ) )
	);
}

/**
 * Get the quote's children that make up its body, skipping the citation and blank text.
 *
 * @param {HTMLElement} blockquote - The quote.
 * @return {Node[]} The body nodes.
 */
function getBodyNodes( blockquote ) {
	return [ ...blockquote.childNodes ].filter( node => {
		if ( node.nodeType === TEXT_NODE ) {
			return node.textContent.trim() !== '';
		}
		return node.nodeType === ELEMENT_NODE && node.tagName !== 'CITE';
	} );
}

/**
 * Wrap runs of unwrapped inline content in a quote into paragraphs.
 *
 * The toolbar's formatBlock leaves bare text in a quote, while saved quotes hold
 * paragraphs. Existing nodes are moved, not copied, so a caret in them survives.
 *
 * @param {HTMLElement} blockquote - The quote to normalize.
 */
export function wrapLooseQuoteContent( blockquote ) {
	const doc = blockquote.ownerDocument;
	let run = null;
	for ( const node of [ ...blockquote.childNodes ] ) {
		const isInline =
			( node.nodeType === TEXT_NODE && ( run || node.textContent.trim() ) ) ||
			( node.nodeType === ELEMENT_NODE &&
				node.tagName !== 'CITE' &&
				! LINE_TAGS.test( node.tagName ) );
		if ( ! isInline ) {
			run = null;
			continue;
		}
		if ( ! run ) {
			run = doc.createElement( 'p' );
			node.before( run );
		}
		run.appendChild( node );
	}
}

/**
 * Whether a collapsed caret sits at the very start of a block's first line.
 *
 * Unlike a plain "no text before the caret" check, this is false after an
 * empty line or a <br>, where Backspace has a line to merge into.
 *
 * @param {HTMLElement} block - The block containing the caret.
 * @param {Range}       range - The current selection range.
 * @return {boolean} Whether the caret is at the start of the first line.
 */
export function isCaretAtStartOfFirstLine( block, range ) {
	if ( ! range.collapsed || ! block.contains( range.startContainer ) ) {
		return false;
	}
	const before = block.ownerDocument.createRange();
	before.setStart( block, 0 );
	before.setEnd( range.startContainer, range.startOffset );
	const fragment = before.cloneContents();

	const lines = [ ...fragment.childNodes ].filter(
		node => node.nodeType === ELEMENT_NODE && LINE_TAGS.test( node.tagName )
	);
	return ! hasVisibleContent( fragment ) && ! fragment.querySelector( 'br' ) && lines.length <= 1;
}

/**
 * Whether a collapsed caret sits at the very start of a quote's first line.
 *
 * @param {HTMLElement} blockquote - The quote containing the caret.
 * @param {Range}       range      - The current selection range.
 * @return {boolean} Whether Backspace should move the first line out of the quote.
 */
export function isCaretAtQuoteStart( blockquote, range ) {
	const start = range.startContainer;
	const startEl = start.nodeType === ELEMENT_NODE ? start : start.parentNode;
	return ! startEl.closest( 'cite' ) && isCaretAtStartOfFirstLine( blockquote, range );
}

/**
 * Move a quote's first line out of the quote, just above it.
 *
 * The quote is removed when nothing is left in it, except that a filled
 * citation survives when the line that moved out had text.
 *
 * @param {HTMLElement} blockquote - The quote.
 * @return {HTMLElement|null} The paragraph now above the quote, or null when there is no body.
 */
export function liftFirstQuoteLine( blockquote ) {
	wrapLooseQuoteContent( blockquote );
	const first = getBodyNodes( blockquote )[ 0 ];
	if ( ! first ) {
		return null;
	}

	const doc = blockquote.ownerDocument;
	let line = first;
	if ( line.tagName !== 'P' ) {
		line = doc.createElement( 'p' );
		line.append( ...first.childNodes );
		first.remove();
	}
	if ( ! hasVisibleContent( line ) ) {
		line.replaceChildren( doc.createElement( 'br' ) );
	}
	blockquote.before( line );

	if ( ! getBodyNodes( blockquote ).some( hasVisibleContent ) ) {
		const cite = blockquote.querySelector( 'cite' );
		if ( cite && cite.textContent.trim() && hasVisibleContent( line ) ) {
			blockquote.replaceChildren( createEmptyParagraph( doc ), cite );
		} else {
			blockquote.remove();
		}
	}
	return line;
}

/**
 * Replace a quote with its lines, turning a filled citation into a last paragraph.
 *
 * formatBlock cannot do this once the quote holds paragraphs, since each line already is one.
 *
 * @param {HTMLElement} blockquote - The quote.
 * @return {HTMLElement} The first element that replaced the quote.
 */
export function unwrapQuote( blockquote ) {
	const doc = blockquote.ownerDocument;
	wrapLooseQuoteContent( blockquote );
	const blocks = getBodyNodes( blockquote );
	const cite = blockquote.querySelector( 'cite' );
	if ( cite && cite.textContent.trim() ) {
		const p = doc.createElement( 'p' );
		p.append( ...cite.childNodes );
		blocks.push( p );
	}
	if ( ! blocks.length ) {
		blocks.push( createEmptyParagraph( doc ) );
	}
	blockquote.replaceWith( ...blocks );
	return blocks[ 0 ];
}

/**
 * Create an empty quote, with its line wrapped in a paragraph like saved quotes.
 *
 * Bare text in a quote makes the browser split it into two quotes on Enter.
 *
 * @param {Document} doc - The document to create the quote in.
 * @return {HTMLElement} The new quote.
 */
export function createEmptyQuote( doc ) {
	const blockquote = doc.createElement( 'blockquote' );
	blockquote.appendChild( createEmptyParagraph( doc ) );
	return blockquote;
}

/**
 * Add an empty paragraph at the top of the post when it starts with another kind of block.
 *
 * @param {HTMLElement} content - The editor content element.
 * @return {HTMLElement|null} The new paragraph, or null when none was needed.
 */
export function insertLeadingParagraph( content ) {
	const first = content.firstElementChild;
	if ( ! first || first.tagName === 'P' ) {
		return null;
	}
	const p = createEmptyParagraph( content.ownerDocument );
	content.prepend( p );
	return p;
}
