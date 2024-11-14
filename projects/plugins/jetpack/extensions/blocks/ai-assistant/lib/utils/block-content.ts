/**
 * External dependencies
 */
import { renderMarkdownFromHTML } from '@automattic/jetpack-ai-client';
import { getBlockContent, serialize } from '@wordpress/blocks';
import { select } from '@wordpress/data';
/**
 * Internal dependencies
 */

/**
 * Returns partial content from the beginning of the post
 * to the current block, based on the given block clientId.
 *
 * @param {string} clientId - The current block clientId.
 * @return {string}          The partial content.
 */
export function getPartialContentToBlock( clientId: string ): string {
	if ( ! clientId ) {
		return '';
	}

	const editor = select( 'core/block-editor' );
	const index = editor.getBlockIndex( clientId );
	const blocks = editor.getBlocks().slice( 0, index ) ?? [];

	if ( ! blocks?.length ) {
		return '';
	}

	return renderMarkdownFromHTML( { content: serialize( blocks ) } );
}

/**
 * Returns content from all blocks,
 * by inspecting the blocks `content` attributes
 *
 * @return {string} The content.
 */
export function getContentFromBlocks(): string {
	const editor = select( 'core/block-editor' );
	const blocks = editor.getBlocks();

	if ( ! blocks?.length ) {
		return '';
	}

	return renderMarkdownFromHTML( { content: serialize( blocks ) } );
}

/**
 * Given a list of blocks, it returns their content as a string.
 * @param {Array} blocks - The list of blocks.
 * @return {string}       The content of the blocks as a string.
 */
export function getBlocksContent( blocks ) {
	return blocks
		.filter( block => block != null ) // Safeguard against null or undefined blocks
		.map( block => getBlockContent( block ) )
		.join( '\n\n' );
}

/**
 * Returns the text content of the inner blocks of a block.
 *
 * @param {string} clientId - The block clientId.
 * @return {string}          The text content.
 */
export function getTextContentFromInnerBlocks( clientId: string ) {
	const block = select( 'core/block-editor' ).getBlock( clientId );
	if ( ! block?.innerBlocks?.length ) {
		return '';
	}

	return getBlocksContent( block.innerBlocks );
}

/**
 * Extract raw text from HTML content
 *
 * @param {string} htmlString - The HTML content.
 * @return {string}            The raw text.
 */
export function getRawTextFromHTML( htmlString: string ): string {
	// Removes all continuous whitespace from the start to check if the string is empty
	if ( ! htmlString?.replace( /\s+/, '' ).length ) {
		return '';
	}

	const tempDomContainer = document.createElement( 'div' );
	tempDomContainer.innerHTML = htmlString;

	const { textContent, innerText } = tempDomContainer;

	if ( !! textContent && ! textContent.replace( /\s+/, '' ).length ) {
		return '';
	}

	if ( !! innerText && ! innerText.replace( /\s+/, '' ).length ) {
		return '';
	}

	return tempDomContainer.textContent || tempDomContainer.innerText || '';
}
