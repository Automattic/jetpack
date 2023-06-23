/**
 * External dependencies
 */
import { getBlockContent } from '@wordpress/blocks';
import { serialize } from '@wordpress/blocks';
import { select } from '@wordpress/data';
import TurndownService from 'turndown';

// Turndown instance
const turndownService = new TurndownService();

const HTML_JOIN_CHARACTERS = '<br />';

/**
 * Returns partial content from the beginning of the post
 * to the current block, based on the given block clientId.
 *
 * @param {string} clientId - The current block clientId.
 * @returns {string}          The partial content.
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

	return turndownService.turndown( serialize( blocks ) );
}

/**
 * Returns content from all blocks,
 * by inspecting the blocks `content` attributes
 *
 * @returns {string} The content.
 */
export function getContentFromBlocks(): string {
	const editor = select( 'core/block-editor' );
	const blocks = editor.getBlocks();

	if ( ! blocks?.length ) {
		return '';
	}

	return turndownService.turndown( serialize( blocks ) );
}

type GetTextContentFromBlocksProps = {
	count: number;
	clientIds: string[];
	content: string;
};

/**
 * Returns the text content from all selected blocks.
 *
 * @returns {GetTextContentFromBlocksProps} The text content.
 */

export function getTextContentFromSelectedBlocks(): GetTextContentFromBlocksProps {
	const clientIds = select( 'core/block-editor' ).getSelectedBlockClientIds();
	const defaultContent = {
		count: 0,
		clientIds: [],
		content: '',
	};

	if ( ! clientIds?.length ) {
		return defaultContent;
	}

	const blocks = select( 'core/block-editor' ).getBlocksByClientId( clientIds );
	if ( ! blocks?.length ) {
		return defaultContent;
	}

	return {
		count: blocks.length,
		clientIds,
		content: blocks
			? blocks.map( block => getBlockTextContent( block.clientId ) ).join( HTML_JOIN_CHARACTERS )
			: '',
	};
}

/**
 * Return the block content from the given block clientId.
 *
 * It will try to get the content from the block `content` attribute.
 * Otherwise, it will try to get the content
 * by using the `getBlockContent` function.
 *
 * @param {string} clientId   - The block clientId.
 * @returns {string}            The block content.
 */
export function getBlockTextContent( clientId: string ): string {
	if ( ! clientId ) {
		return '';
	}

	const editor = select( 'core/block-editor' );
	const block = editor.getBlock( clientId );

	/*
	 * In some context, the block can be undefined,
	 * for instance, when previewing the block.
	 */
	if ( ! block ) {
		return '';
	}

	// Attempt to pick the content from the block `content` attribute.
	if ( block?.attributes?.content ) {
		return block.attributes.content;
	}

	return getBlockContent( block );
}

/**
 * Extract raw text from HTML content
 *
 * @param {string} htmlString - The HTML content.
 * @returns {string}            The raw text.
 */
export function getRawTextFromHTML( htmlString: string ): string {
	if ( ! htmlString?.length ) {
		return '';
	}

	const tempDomContainer = document.createElement( 'div' );
	tempDomContainer.innerHTML = htmlString;
	return tempDomContainer.textContent || tempDomContainer.innerText || '';
}
