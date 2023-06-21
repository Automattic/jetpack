/**
 * External dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
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

/**
 * Returns the text content from all selected blocks.
 *
 * @returns {string} The text content.
 */
export function getTextContentFromBlocks(): string {
	const clientIds = select( blockEditorStore ).getSelectedBlockClientIds();

	if ( ! clientIds?.length ) {
		return '';
	}

	const blocks = select( blockEditorStore ).getBlocksByClientId( clientIds );
	if ( ! blocks?.length ) {
		return '';
	}

	return blocks.map( block => getBlockTextContent( block.clientId ) ).join( HTML_JOIN_CHARACTERS );
}

/**
 * Return the block content from the given block clientId.
 *
 * The first option is to get the content from the block `content` attribute.
 * In case it is not possible,
 * it will try to get the content from bny using the `getBlockContent` function.
 *
 * @param {string} clientId   - The block clientId.
 * @returns {string}            The block content.
 */
export function getBlockTextContent( clientId: string ): string {
	if ( ! clientId ) {
		return '';
	}

	const editor = select( blockEditorStore );
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

	const htmlContent = getBlockContent( block );

	return htmlContent;
}
