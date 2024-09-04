/*
 * External dependencies
 */
import { getBlockType } from '@wordpress/blocks';
import { select } from '@wordpress/data';
/*
 * Internal dependencies
 */
import { getFeatureAvailability } from '../../lib/utils/get-feature-availability';
import { EXTENDED_BLOCKS } from '../constants';

export const AI_ASSISTANT_SUPPORT_NAME = 'ai-assistant-support';

// Check if the AI Assistant support is enabled.
export const isAiAssistantSupportEnabled = getFeatureAvailability( AI_ASSISTANT_SUPPORT_NAME );

/**
 * Check if it is possible to extend the block as an inline extension.
 * @param {string} blockName - The block name.
 * @return {boolean}           Whether it is possible to extend the block.
 */
export function isPossibleToExtendBlock( blockName: string ): boolean {
	// Check if the AI Assistant block is registered. If not, we understand that Jetpack AI is not active.
	const isBlockRegistered = getBlockType( 'jetpack/ai-assistant' );

	if ( ! isBlockRegistered ) {
		return false;
	}

	// Check if AI Assistant support is enabled
	if ( ! isAiAssistantSupportEnabled ) {
		return false;
	}

	// Only extend the blocks in the inline blocks list
	if ( ! EXTENDED_BLOCKS.includes( blockName ) ) {
		return false;
	}

	/*
	 * Do not extend if the AI Assistant block is hidden
	 * ToDo: the `editPostStore` is undefined for P2 sites.
	 * Let's find a way to check if the block is hidden.
	 */
	const { getHiddenBlockTypes } = select( 'core/edit-post' ) || {};
	const hiddenBlocks = getHiddenBlockTypes?.() || []; // It will extend the block if the function is undefined

	if ( hiddenBlocks.includes( 'jetpack/ai-assistant' ) ) {
		return false;
	}

	return true;
}
