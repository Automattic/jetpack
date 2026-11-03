import { createBlock } from '@wordpress/blocks';
import { dispatch } from '@wordpress/data';
import { escapeAttribute, escapeHTML } from '@wordpress/escape-html';
import { getQueryArgs } from '@wordpress/url';
import { waitForEditor } from './wait-for-editor';

const queryArgs = getQueryArgs( window.location.href );

/**
 * Reads a query arg, treating anything that is not a string as absent.
 *
 * `getQueryArgs()` parses bracket syntax (`?title[]=a&title[]=b`) into arrays and objects, so
 * none of these values is guaranteed to be a string just because it came from a query string.
 *
 * @param {string} name - Query arg name.
 * @return {string} The value when it is a string, otherwise an empty string.
 */
function getStringArg( name ) {
	const value = queryArgs[ name ];
	return typeof value === 'string' ? value : '';
}

const url = getStringArg( 'url' );
const title = getStringArg( 'title' );
const text = getStringArg( 'text' );
const commentContent = getStringArg( 'comment_content' );
const commentAuthor = getStringArg( 'comment_author' );

/**
 * Protocols we are willing to emit into an `href` or hand to `core/embed`.
 *
 * Everything reaching this file comes from the query string, so a bare
 * `javascript:` or `data:` URL would otherwise become a click-to-execute link.
 */
const ALLOWED_PROTOCOLS = [ 'http:', 'https:' ];

/**
 * Normalizes an untrusted URL, rejecting anything that is not an absolute http(s) URL.
 *
 * @param {unknown} candidate - The URL to check.
 * @return {?string} The normalized URL, or null when it is not safe to use.
 */
function getSafeUrl( candidate ) {
	if ( typeof candidate !== 'string' || ! candidate ) {
		return null;
	}

	try {
		const parsed = new URL( candidate );
		return ALLOWED_PROTOCOLS.includes( parsed.protocol ) ? parsed.href : null;
	} catch {
		// Not a parseable absolute URL.
		return null;
	}
}

/**
 * Tags and attributes kept as-is in reposted comment content.
 *
 * Mirrors WordPress's own comment allowlist — the `$allowedtags` global that `wp_kses()`
 * applies to comments, in `wp-includes/kses.php` — so anything a commenter could legitimately
 * submit survives the round trip, and nothing they could not is permitted here. `p` and `br`
 * are the two additions: the Reader sends *rendered* comment HTML, which has already been
 * through `wpautop()`.
 *
 * Everything absent from this map — every `on*` handler, `srcdoc`, `style` — is dropped.
 * Attribute *values* are validated separately; an allowlisted `href` can still carry a
 * `javascript:` URL.
 */
const ALLOWED_ATTRIBUTES = {
	A: [ 'href', 'title' ],
	ABBR: [ 'title' ],
	ACRONYM: [ 'title' ],
	B: [],
	BLOCKQUOTE: [ 'cite' ],
	BR: [],
	CITE: [],
	CODE: [],
	DEL: [ 'datetime' ],
	EM: [],
	I: [],
	P: [],
	Q: [ 'cite' ],
	S: [],
	STRIKE: [],
	STRONG: [],
};

const ALLOWED_TAGS = Object.keys( ALLOWED_ATTRIBUTES );

/** Allowlisted attributes whose value is a URL, and so needs checking beyond its name. */
const URL_ATTRIBUTES = [ 'href', 'cite' ];

/**
 * Tags dropped along with their contents, rather than unwrapped.
 *
 * Their text is markup or code rather than prose, so surfacing it in the quote would be
 * noise. Unwrapping them would be safe, just ugly.
 */
const DISCARDED_TAGS = [ 'SCRIPT', 'STYLE', 'TEMPLATE', 'NOSCRIPT' ];

/**
 * Sanitizes rendered comment HTML down to a safe subset.
 *
 * Unknown tags are unwrapped, so their text survives while the element and its attributes
 * are dropped — `<iframe srcdoc="…">x</iframe>` becomes the bare text `x`. HTML comments are
 * removed outright: the allowlist above describes elements, and a comment is the one node type
 * whose danger here comes from the destination rather than from its content.
 *
 * @param {unknown} html - Untrusted comment HTML.
 * @return {string} Sanitized HTML.
 */
function sanitizeCommentContent( html ) {
	if ( typeof html !== 'string' || ! html ) {
		return '';
	}

	// An inert document: assigning innerHTML here never executes scripts or loads subresources.
	const doc = document.implementation.createHTMLDocument( '' );
	doc.body.innerHTML = html;

	// `querySelectorAll` returns a static list in document order, so unwrapping a parent still
	// leaves its children queued for their own pass.
	doc.body.querySelectorAll( '*' ).forEach( element => {
		// HTML elements report an uppercase tagName, but foreign content (SVG, MathML) keeps its
		// original case — an SVG-namespaced `<script>` reports `script`, not `SCRIPT`.
		const tag = element.tagName.toUpperCase();

		if ( DISCARDED_TAGS.includes( tag ) ) {
			element.remove();
			return;
		}

		if ( ! ALLOWED_TAGS.includes( tag ) ) {
			element.replaceWith( ...element.childNodes );
			return;
		}

		const allowedAttributes = ALLOWED_ATTRIBUTES[ tag ] || [];
		Array.from( element.attributes ).forEach( ( { name, value } ) => {
			if ( ! allowedAttributes.includes( name ) ) {
				element.removeAttribute( name );
				return;
			}

			// An allowlisted `href` or `cite` is still an untrusted URL. Keep the *normalized*
			// form rather than the raw one: it percent-encodes the angle brackets that the raw
			// value would otherwise carry into the markup.
			if ( URL_ATTRIBUTES.includes( name ) ) {
				const safeValue = getSafeUrl( value );

				if ( safeValue ) {
					element.setAttribute( name, safeValue );
				} else {
					element.removeAttribute( name );
				}
				return;
			}

			// Serialization escapes `&` and `"` inside an attribute value, but not `<` or `>`, and
			// the block parser scans post content as text rather than as a DOM — so a `<!-- wp:… -->`
			// sequence left in an attribute is read as a real block delimiter, exactly as a loose
			// comment node would be. Neither character carries meaning in the values kept here.
			if ( /[<>]/.test( value ) ) {
				element.setAttribute( name, value.replace( /[<>]/g, '' ) );
			}
		} );
	} );

	// `querySelectorAll` matches elements only, so comment nodes reach `innerHTML` untouched. In
	// this destination that is not inert punctuation: a reposted quote is serialized into post
	// content, where `<!-- wp:html -->` is a block delimiter. Left in place, an injected delimiter
	// ends the quote early and opens a block of the attacker's choosing when the victim saves.
	const walker = doc.createTreeWalker( doc.body, NodeFilter.SHOW_COMMENT );
	const comments = [];
	while ( walker.nextNode() ) {
		comments.push( walker.currentNode );
	}
	comments.forEach( comment => comment.remove() );

	return doc.body.innerHTML;
}

/**
 * Builds the paragraph blocks that make up a quote's body.
 *
 * `core/quote` stopped rendering its `value` attribute in WordPress 6.1: the block now keeps its
 * body in inner blocks, and all that survives of `value` is a load-time migration that reads it
 * with a `p` selector. Anything not inside a top-level `<p>` is therefore dropped on sight, which
 * is why a reposted comment used to come out as an empty quote with the author still attached.
 * Building the inner blocks here skips that migration, and the deprecated attribute, entirely.
 *
 * Runs of content that are not already paragraphs are wrapped rather than discarded, so a body
 * that mixes the two keeps all of itself.
 *
 * @param {string} html - Quote body, as HTML. Already sanitized when it came from a comment.
 * @return {Array} `core/paragraph` blocks, empty when there is nothing to show.
 */
function createQuoteBody( html ) {
	// An inert document: assigning innerHTML here never executes scripts or loads subresources.
	const doc = document.implementation.createHTMLDocument( '' );
	doc.body.innerHTML = html;

	/*
	 * `blockquote` is the one thing the comment allowlist keeps that cannot live inside a
	 * paragraph: wrapping it in one below would serialize to `<p><blockquote>`, which the parser
	 * closes early on the way back in, stranding the text outside the block it belongs to. Unwrap
	 * it instead, so a quote inside a comment keeps its words and loses only its indentation.
	 * The list is static and in document order, so a nested blockquote is still visited.
	 */
	doc.body.querySelectorAll( 'blockquote' ).forEach( quote => {
		quote.replaceWith( ...quote.childNodes );
	} );

	let wrapper = null;
	Array.from( doc.body.childNodes ).forEach( node => {
		if ( node.nodeName === 'P' ) {
			wrapper = null;
			return;
		}

		if ( wrapper ) {
			wrapper.append( node );
			return;
		}

		wrapper = doc.createElement( 'p' );
		node.replaceWith( wrapper );
		wrapper.append( node );
	} );

	return Array.from( doc.body.children )
		.map( paragraph => paragraph.innerHTML )
		.filter( content => content.trim() !== '' )
		.map( content => createBlock( 'core/paragraph', { content } ) );
}

const safeUrl = getSafeUrl( url );

// This enables functionality to "repost" from the reader, adding context like an embed of the
// original post, and any extra comment or text data if applicable.
if ( safeUrl ) {
	( async () => {
		// Wait for the editor to be initialized and the core blocks registered.
		await waitForEditor();

		const blocks = [];

		if ( text && text !== title ) {
			const link = `<a href="${ escapeAttribute( safeUrl ) }">${ escapeHTML( title ) }</a>`;
			blocks.push(
				createBlock( 'core/quote', { citation: link }, [
					createBlock( 'core/paragraph', { content: escapeHTML( text ) } ),
				] )
			);
		}

		if ( commentContent ) {
			const commentBody = createQuoteBody( sanitizeCommentContent( commentContent ) );

			// A quote of nothing, credited to someone, is worse than no quote at all.
			if ( commentBody.length ) {
				blocks.push(
					createBlock( 'core/quote', { citation: escapeHTML( commentAuthor ) }, commentBody )
				);
			}
		}
		blocks.push( createBlock( 'core/embed', { url: safeUrl, type: 'wp-embed' } ) );

		dispatch( 'core/editor' ).resetEditorBlocks( blocks );
	} )();
}
