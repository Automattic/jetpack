/*
 * Internal dependencies
 */
import { canAIAssistantBeEnabled } from '../../lib/can-ai-assistant-be-enabled';
import { EXTENDED_BLOCKS } from '../constants';

/**
 * Check if it is possible to extend a block with AI Assistant capabilities.
 * @param {string} blockName - The block name.
 * @return {boolean}           Whether it is possible to extend the block.
 */
export function isPossibleToExtendTextBlock( blockName: string ): boolean {
	const canEnableAIAssistant = canAIAssistantBeEnabled();

	// Do not extend the block if AI Assistant cannot be enabled.
	if ( ! canEnableAIAssistant ) {
		return false;
	}

	// Only extend the blocks in the inline blocks list
	if ( ! EXTENDED_BLOCKS.includes( blockName ) ) {
		return false;
	}

	return true;
}
