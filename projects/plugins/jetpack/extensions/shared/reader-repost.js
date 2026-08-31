import { createBlock } from '@wordpress/blocks';
import { dispatch } from '@wordpress/data';
import { getQueryArgs } from '@wordpress/url';
import { waitForEditor } from './wait-for-editor';

const { url, title, text, comment_content, comment_author } = getQueryArgs( window.location.href );

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
 * @param {string} html - Quote body, as HTML.
 * @return {Array} `core/paragraph` blocks, empty when there is nothing to show.
 */
function createQuoteBody( html ) {
	// An inert document: assigning innerHTML here never executes scripts or loads subresources.
	const doc = document.implementation.createHTMLDocument( '' );
	doc.body.innerHTML = html;

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

// This enables functionality to "repost" from the reader, adding context like an embed of the
// original post, and any extra comment or text data if applicable.
if ( url ) {
	( async () => {
		// Wait for the editor to be initialized and the core blocks registered.
		await waitForEditor();

		const blocks = [];

		if ( text && text !== title ) {
			const link = `<a href="${ url }">${ title }</a>`;
			blocks.push(
				createBlock( 'core/quote', { citation: link }, [
					createBlock( 'core/paragraph', { content: text } ),
				] )
			);
		}

		if ( comment_content ) {
			const commentBody = createQuoteBody( comment_content );

			// A quote of nothing, credited to someone, is worse than no quote at all.
			if ( commentBody.length ) {
				blocks.push( createBlock( 'core/quote', { citation: comment_author }, commentBody ) );
			}
		}
		blocks.push( createBlock( 'core/embed', { url, type: 'wp-embed' } ) );

		dispatch( 'core/editor' ).resetEditorBlocks( blocks );
	} )();
}
