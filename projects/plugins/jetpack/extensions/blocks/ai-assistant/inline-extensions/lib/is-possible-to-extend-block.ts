/*
 * External dependencies
 */
import { getBlockType } from '@wordpress/blocks';
import { select } from '@wordpress/data';
/*
 * Internal dependencies
 */
import {
	EXTENDED_INLINE_BLOCKS,
	isAiAssistantExtensionsSupportEnabled,
} from '../../extensions/ai-assistant';

export type isPossibleToExtendBlockProps = {
	blockName?: string;
	clientId: string;
};

/**
 * Check if it is possible to extend the block as an inline extension.
 *
 * @param {isPossibleToExtendBlockProps} options - The options.
 * @param {string} options.blockName             - The block name.
 * @param {string} options.clientId              - The block client ID.
 * @returns {boolean} Whether it is possible to extend the block.
 */
export function isPossibleToExtendBlock( {
	blockName,
	clientId,
}: isPossibleToExtendBlockProps ): boolean {
	// Check if the AI Assistant block is registered. If not, we understand that Jetpack AI is not active.
	const isBlockRegistered = getBlockType( 'jetpack/ai-assistant' );

	if ( ! isBlockRegistered ) {
		return false;
	}

	// Check if there is a block name.
	if ( typeof blockName !== 'string' ) {
		return false;
	}

	// Check if Jetpack extensions support is enabled.
	if ( ! isAiAssistantExtensionsSupportEnabled ) {
		return false;
	}

	// clientId is required
	if ( ! clientId?.length ) {
		return false;
	}

	// Only extend the Heading block.
	if ( ! EXTENDED_INLINE_BLOCKS.includes( blockName ) ) {
		return false;
	}

	/*
	 * Do not extend if the AI Assistant block is hidden
	 * Todo: Do we want to make the extension depend on the block visibility?
	 * ToDo: the `editPostStore` is undefined for P2 sites.
	 * Let's find a way to check if the block is hidden.
	 */
	const { getHiddenBlockTypes } = select( 'core/edit-post' ) || {};
	const hiddenBlocks = getHiddenBlockTypes?.() || []; // It will extend the block if the function is undefined.
	if ( hiddenBlocks.includes( blockName ) ) {
		return false;
	}

	return true;
}
