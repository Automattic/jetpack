/*
 * External dependencies
 */
import * as Blocks from '@wordpress/blocks';
/*
 * Types
 */
import type { Block } from '@automattic/jetpack-ai-client';

const { getBlockContent } = Blocks as unknown as {
	getBlockContent: ( block: Block ) => string;
};

export function getHtmlText( html: string ): string {
	const doc = document.implementation.createHTMLDocument( '' );
	doc.body.innerHTML = html;

	// Prevent table cells from merging into one long word
	doc.body.querySelectorAll( 'td, th' ).forEach( node => {
		node.innerHTML = ` ${ node.innerHTML }`;
	} );

	// innerText returns rendered text, excluding hidden content
	return doc.body.innerText;
}

export function getPostText( blocks: Array< Block > ): string {
	const html = blocks.map( block => getBlockContent( block ) ).join( '' );

	return getHtmlText( html );
}
